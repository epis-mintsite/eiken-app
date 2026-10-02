/**
 * アップロードの検証。
 *
 * 目的: 問題集・教材の大量取り込み（PDFや複数ページの一括投入）を防ぎ、
 *       添削に必要な「1ページ分の答案・課題文」だけを扱う。
 *
 *  - 画像のみ（PDF不可）、1回の送信につき答案1枚（要約は課題文1枚＋解答1枚）
 *  - 画像サイズはクライアント側で圧縮後の値で判定
 *  - OCR後の語数にも上限を設ける（1ページ分を超える内容は処理しない）
 */

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** 1枚あたり。クライアントで1600px・JPEGに圧縮されるため、通常は1MB未満。 */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
/** リクエスト全体（Vercelの本文上限 約4.5MB の手前）。 */
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

/** OCR後の語数上限（初期値）。 */
export const MAX_ANSWER_WORDS = 400;
export const MAX_PASSAGE_WORDS = 600;

export type MediaType = (typeof ALLOWED_IMAGE_TYPES)[number];

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

/** 問題があればエラーメッセージ（日本語）を返す。問題なければ null。 */
export function validateImages(images: { file: File; label: string }[]): string | null {
  let total = 0;
  for (const { file, label } of images) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as MediaType)) {
      return `${label}は JPG / PNG / WebP の画像のみ受け付けています（PDFや他の形式は使えません）。`;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `${label}のサイズが大きすぎます。1ページ分の写真を撮り直してください。`;
    }
    total += file.size;
  }
  if (total > MAX_TOTAL_BYTES) {
    return "送信するデータが大きすぎます。写真は1ページ分のみにしてください。";
  }
  return null;
}

export function answerTooLongMessage(words: number): string {
  return `答案の語数が多すぎます（${words}語）。添削できるのは1ページ分（${MAX_ANSWER_WORDS}語まで）です。`;
}

export function passageTooLongMessage(words: number): string {
  return `課題文の語数が多すぎます（${words}語）。添削に使えるのは1ページ分（${MAX_PASSAGE_WORDS}語まで）です。`;
}
