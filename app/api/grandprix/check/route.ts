import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/access";
import { friendlyAIErrorMessage } from "@/lib/anthropic";
import type { Division, FeedbackLang } from "@/types/grandprix";
import { DIVISIONS, FEEDBACK_LANGS } from "@/types/grandprix";
import { DIVISION_RULES } from "@/lib/grandprix/rubric";
import { bodyLength, isTooShort, unitLabel } from "@/lib/grandprix/format";
import { generateGPDraftCheck } from "@/lib/grandprix/claude";
import { checkGPAvailability } from "@/lib/grandprix/limits";

export const maxDuration = 300;

const MAX = { knock: 200, country: 100, title: 200, summary: 1500, grade: 20 };

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function str(v: unknown, max?: number): string {
  const s = typeof v === "string" ? v.trim() : "";
  return max ? s.slice(0, max) : s;
}

/**
 * グランプリの下書きチェック。
 * 処理中は SSE で進捗とハートビートを送り、完了したら保存して結果を返す。
 * ログにはタイトル・要旨・本文・氏名を出さない。
 */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { session } = auth;

  const input = await request.json().catch(() => null);
  if (!input || typeof input !== "object") return fail(400, "入力が正しくありません");

  const division = input.division as Division;
  if (!DIVISIONS.includes(division)) return fail(400, "部門を選んでください");
  const feedbackLang: FeedbackLang = FEEDBACK_LANGS.includes(input.feedbackLang) ? input.feedbackLang : "ja";
  const rule = DIVISION_RULES[division];

  const knock = str(input.knock, MAX.knock);
  const country = str(input.country, MAX.country);
  const title = str(input.title, MAX.title);
  const grade = str(input.grade, MAX.grade);
  const summary = str(input.summary);
  const body = str(input.body);

  if (!knock) return fail(400, "選んだ100本ノックを入力してください");
  if (!title) return fail(400, "タイトルを入力してください");
  if (!summary) return fail(400, "要旨を入力してください");
  if (summary.length > MAX.summary) return fail(400, "要旨が長すぎます");
  if (!body) return fail(400, "本文を入力してください");
  if (isTooShort(division, body)) {
    return fail(400, "本文がまだ短いので、AIのチェックの前に書き進めましょう。");
  }
  const length = bodyLength(division, body);
  if (length > rule.bodyHardMax) {
    const unit = unitLabel(division);
    return fail(400, `本文が長すぎます（${length}${unit}）。${rule.bodyHardMax}${unit}までにしてください。`);
  }

  const unavailable = await checkGPAvailability(session);
  if (unavailable) return fail(429, unavailable);

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
        send("status", { message: "チェックしています（1〜2分かかります）..." });

        const { feedback, model } = await generateGPDraftCheck({
          division,
          feedbackLang,
          knock,
          country,
          grade,
          title,
          summary,
          body,
        });

        send("status", { message: "結果を保存しています..." });

        const { data: inserted, error: dbError } = await supabase
          .from("grandprix_checks")
          .insert({
            user_id: session.userId,
            student_name: session.name,
            grade,
            division,
            knock,
            country,
            title,
            summary,
            body,
            feedback_lang: feedbackLang,
            feedback_json: feedback,
            model,
          })
          .select("id, created_at")
          .single<{ id: string; created_at: string }>();

        if (dbError || !inserted) {
          console.error("grandprix_checks insert failed:", dbError?.code);
        }

        send("result", {
          id: inserted?.id ?? null,
          student_name: session.name,
          division,
          feedbackLang,
          knock,
          country,
          grade,
          title,
          summary,
          body,
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
