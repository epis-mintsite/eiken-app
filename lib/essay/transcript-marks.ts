/**
 * 写真の書き起こしで「読めなかった文字」に使う印。
 * サーバー（書き起こし）とブラウザ（確認画面）の両方から使う。
 */
export const ILLEGIBLE_MARK = "〓";

export function countIllegible(text: string): number {
  return text.split(ILLEGIBLE_MARK).length - 1;
}

/** 1回に送れる写真の枚数 */
export const MAX_ESSAY_PHOTOS = 2;
