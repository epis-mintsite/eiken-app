import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/access";
import { friendlyAIErrorMessage } from "@/lib/anthropic";
import { validateImages, type MediaType } from "@/lib/upload-guard";
import { DOC_TYPE_CONFIG, isDocType, measureLength, lengthLabel } from "@/lib/essay/rubrics";
import { checkEssayDailyLimit } from "@/lib/essay/limits";
import { transcribeEssayImages } from "@/lib/essay/transcribe";
import { MAX_ESSAY_PHOTOS } from "@/lib/essay/transcript-marks";

export const maxDuration = 120;

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/**
 * 手書きの写真（1〜2枚）から本文を書き起こす。添削はしない。
 * 書き起こした文章は生徒が確認・修正してから /api/essay/correct に送る。
 * 写真は保存せず、ログにも本文を出さない。
 */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { session } = auth;

  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, "入力が正しくありません");

  const docType = form.get("docType");
  if (!isDocType(docType)) return fail(400, "書類の種類を選んでください");
  const cfg = DOC_TYPE_CONFIG[docType];

  const files = form.getAll("images").filter((v): v is File => v instanceof File);
  if (files.length === 0) return fail(400, "写真を選んでください");
  if (files.length > MAX_ESSAY_PHOTOS) {
    return fail(400, `写真は${MAX_ESSAY_PHOTOS}枚までです`);
  }
  const imageError = validateImages(files.map((file, i) => ({ file, label: `${i + 1}枚目の写真` })));
  if (imageError) return fail(400, imageError);

  // 今日の添削回数を使い切っている場合は、読み取りもしない
  const limitError = await checkEssayDailyLimit(session);
  if (limitError) return fail(429, limitError);

  try {
    const images = await Promise.all(
      files.map(async (file) => ({
        base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
        mediaType: file.type as MediaType,
      }))
    );
    const transcript = await transcribeEssayImages(docType, images);

    if (!transcript.text) {
      return fail(422, transcript.note || "写真から本文を読み取れませんでした。明るい場所で撮り直してください。");
    }
    const length = measureLength(transcript.text, cfg.lengthUnit);
    if (length > cfg.maxLength) {
      const unit = lengthLabel(cfg.lengthUnit);
      return fail(
        400,
        `読み取った本文が長すぎます（${length}${unit}）。${cfg.label}は${cfg.maxLength}${unit}までです。`
      );
    }

    return NextResponse.json({ text: transcript.text, note: transcript.note });
  } catch (error) {
    console.error("essay transcribe failed:", error instanceof Error ? error.name : "unknown");
    return fail(500, friendlyAIErrorMessage(error));
  }
}
