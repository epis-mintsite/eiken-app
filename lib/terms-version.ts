/**
 * 利用規約の版。規約本文（lib/terms-content.ts）を改定したら、この値を更新する。
 * 更新すると、ログイン中の利用者も次回アクセス時に再同意が必要になる。
 */
export const TERMS_VERSION = "2026-10-02-r3";

/**
 * この端末（ブラウザ）で現行の規約に同意済みであることを示す署名付きCookie。
 * 同じ端末では、ログインし直しても規約の画面を再表示しない（版が変わるまで有効）。
 */
export const TERMS_COOKIE = "terms_consent";
export const TERMS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年（秒）
