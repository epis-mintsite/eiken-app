import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession, canViewAll } from "@/lib/access";
import { friendlyAIErrorMessage } from "@/lib/anthropic";
import { DOC_TYPE_CONFIG, isDocType, measureLength, lengthLabel } from "@/lib/essay/rubrics";
import { generateEssayFeedback } from "@/lib/essay/claude";
import { checkEssayDailyLimit } from "@/lib/essay/limits";
import { countIllegible, ILLEGIBLE_MARK } from "@/lib/essay/transcript-marks";

export const maxDuration = 300;

const MAX_THEME_CHARS = 500;
const MAX_GRADE_CHARS = 20;
const MAX_NAME_CHARS = 50;

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/**
 * エッセイ・志望理由書・作文の添削（テキスト入力）。
 * 処理中は SSE で進捗とハートビートを送り、完了したら保存して結果を返す。
 * ログには答案本文・氏名を出さない。
 */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { session } = auth;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return fail(400, "入力が正しくありません");

  const docType = body.docType;
  if (!isDocType(docType)) return fail(400, "書類の種類を選んでください");
  const cfg = DOC_TYPE_CONFIG[docType];

  const theme = typeof body.theme === "string" ? body.theme.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const grade = typeof body.grade === "string" ? body.grade.trim().slice(0, MAX_GRADE_CHARS) : "";
  // 写真から読み取り、本人が確認した本文かどうか（記録用）
  const sourceType: "text" | "image" = body.sourceType === "image" ? "image" : "text";
  // 生徒の氏名はセッションから決める（講師・管理者は代理提出のため入力値を使う）
  const inputName = typeof body.studentName === "string" ? body.studentName.trim() : "";
  const studentName = canViewAll(session)
    ? (inputName || session.name).slice(0, MAX_NAME_CHARS)
    : session.name;

  if (!theme) return fail(400, "設問・テーマを入力してください");
  if (theme.length > MAX_THEME_CHARS) {
    return fail(400, `設問・テーマは${MAX_THEME_CHARS}字以内にしてください`);
  }
  if (!text) return fail(400, "本文を入力してください");
  if (countIllegible(text) > 0) {
    return fail(400, `読み取れなかった文字（${ILLEGIBLE_MARK}）が残っています。写真を見て直してください。`);
  }

  const length = measureLength(text, cfg.lengthUnit);
  if (length > cfg.maxLength) {
    const unit = lengthLabel(cfg.lengthUnit);
    return fail(
      400,
      `本文が長すぎます（${length}${unit}）。${cfg.label}は${cfg.maxLength}${unit}までです。`
    );
  }

  const limitError = await checkEssayDailyLimit(session);
  if (limitError) return fail(429, limitError);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 10000);

      try {
        send("status", { message: "添削しています（1〜2分かかります）..." });

        const { feedback, model } = await generateEssayFeedback({
          docType,
          theme,
          studentName,
          grade,
          text,
          fromPhoto: sourceType === "image",
        });

        send("status", { message: "結果を保存しています..." });

        const { data: inserted, error: dbError } = await supabase
          .from("essay_corrections")
          .insert({
            user_id: session.userId,
            student_name: studentName,
            grade,
            doc_type: docType,
            theme,
            source_type: sourceType,
            original_text: text,
            feedback_json: feedback,
            model,
          })
          .select("id, created_at")
          .single<{ id: string; created_at: string }>();

        if (dbError || !inserted) {
          console.error("essay_corrections insert failed:", dbError?.code);
        }

        send("result", {
          id: inserted?.id ?? null,
          doc_type: docType,
          student_name: studentName,
          grade,
          theme,
          original_text: text,
          feedback,
          created_at: inserted?.created_at ?? new Date().toISOString(),
        });
      } catch (error) {
        send("error", { message: friendlyAIErrorMessage(error) });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
