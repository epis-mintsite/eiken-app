/**
 * 利用規約の版。規約本文（lib/terms-content.ts）を改定したら、この値を更新する。
 * 更新すると、ログイン中の利用者も次回アクセス時に再同意が必要になる。
 */
export const TERMS_VERSION = "2026-10-02-r3";

/** ログイン前に同意したことを示す署名付きCookie（ログイン成功時に同意履歴へ記録して破棄する） */
export const TERMS_COOKIE = "terms_consent";
