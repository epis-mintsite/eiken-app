import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * ミントサイト（Firebase Authentication）のログインを検証する。
 *
 * ブラウザがFirebaseで本人確認して受け取った ID トークンを、サーバーで
 * Google の公開鍵（JWKS）を使って検証する。サービスアカウントの秘密鍵は不要。
 * ミントサイトのパスワードは、ブラウザとFirebaseの間でのみ扱われ、このサーバーには届かない。
 *
 * ミントサイトのIDでログインできる人は全員が利用できる。権限は初回登録時に「生徒」とし、
 * 講師にする場合は管理者が管理画面で変更する。
 */

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

/** ミントサイトのIDは `ID@example.com` の形でFirebaseに登録されている */
export const EPIS_EMAIL_DOMAIN = "@example.com";

export function episEmailFromUserId(userId: string): string {
  return `${userId}${EPIS_EMAIL_DOMAIN}`;
}

export function episUserIdFromEmail(email: string): string | null {
  if (!email.endsWith(EPIS_EMAIL_DOMAIN)) return null;
  const id = email.slice(0, -EPIS_EMAIL_DOMAIN.length);
  return /^[a-zA-Z0-9]+$/.test(id) ? id : null;
}

/** FirebaseのIDトークンを検証し、メールアドレスを返す。無効なら null。 */
export async function verifyFirebaseIdToken(idToken: string): Promise<{ email: string } | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID が未設定です");
    return null;
  }
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });
    if (typeof payload.email !== "string" || typeof payload.sub !== "string") return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}
