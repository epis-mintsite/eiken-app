import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/access";
import { friendlyAIErrorMessage } from "@/lib/anthropic";
import { validateImages, type MediaType } from "@/lib/upload-guard";
import type { Division } from "@/types/grandprix";
import { DIVISIONS } from "@/types/grandprix";
import { DIVISION_RULES } from "@/lib/grandprix/rubric";
import { bodyLength, unitLabel } from "@/lib/grandprix/format";
import { checkGPAvailability } from "@/lib/grandprix/limits";
import { transcribeGPDraft } from "@/lib/grandprix/transcribe";
import { MAX_ESSAY_PHOTOS } from "@/lib/essay/transcript-marks";

export const maxDuration = 120;

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/**
 * グランプリの下書きを手書きの写真（1〜2枚）から書き起こし、タイトル・要旨・本文に読み分ける。チェックはしない。
 * 写真は保存せず、ログにも本文を出さない。
 * 読み取り自体は回数に数えないが、期間外や今日のチェックを使い切ったときは読まない。
 */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { session } = auth;

  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, "入力が正しくありません");

  const division = form.get("division") as Division;
  if (!DIVISIONS.includes(division)) return fail(400, "部門を選んでください");
  const rule = DIVISION_RULES[division];

  const files = form.getAll("images").filter((v): v is File => v instanceof File);
  if (files.length === 0) return fail(400, "写真を選んでください");
  if (files.length > MAX_ESSAY_PHOTOS) return fail(400, `写真は${MAX_ESSAY_PHOTOS}枚までです`);
  const imageError = validateImages(files.map((file, i) => ({ file, label: `${i + 1}枚目の写真` })));
  if (imageError) return fail(400, imageError);

  const unavailable = await checkGPAvailability(session);
  if (unavailable) return fail(429, unavailable);

  try {
    const images = await Promise.all(
      files.map(async (file) => ({
        base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
        mediaType: file.type as MediaType,
      }))
    );
    const transcript = await transcribeGPDraft(division, images);

    if (!transcript.title && !transcript.summary && !transcript.body) {
      return fail(422, transcript.note || "写真から文章を読み取れませんでした。明るい場所で撮り直してください。");
    }
    const length = bodyLength(division, transcript.body);
    if (length > rule.bodyHardMax) {
      const unit = unitLabel(division);
      return fail(400, `読み取った本文が長すぎます（${length}${unit}）。${rule.bodyHardMax}${unit}までにしてください。`);
    }

    return NextResponse.json(transcript);
  } catch (error) {
    console.error("grandprix transcribe failed:", error instanceof Error ? error.name : "unknown");
    return fail(500, friendlyAIErrorMessage(error));
  }
}
