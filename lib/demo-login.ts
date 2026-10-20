/**
 * 手元専用の「デモ生徒」ログイン（生徒画面の動作確認用）。
 * サーバーを DEMO_STUDENT_LOGIN=1 で起動したときだけ有効。Vercel 上（本番・プレビュー）では常に無効。
 * ログイン画面のボタンは、ビルド時に NEXT_PUBLIC_DEMO_STUDENT_LOGIN=1 を付けたときだけ表示される。
 */
export const DEMO_STUDENT = {
  loginId: "demo-student",
  name: "デモ生徒（動作確認用）",
} as const;

export function isDemoLoginEnabled(): boolean {
  return process.env.DEMO_STUDENT_LOGIN === "1" && !process.env.VERCEL;
}
