import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * ミントサイト（Firebase Authentication）のログインを検証する。
 *
 * ブラウザがFirebaseで本人確認して受け取った ID トークンを、サーバーで
 * Google の公開鍵（JWKS）を使って検証する。サービスアカウントの秘密鍵は不要。
 * ミントサイトのパスワードは、ブラウザとFirebaseの間でのみ扱われ、このサーバーには届かない。
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

export interface EpisUserInfo {
  /** ミントサイトの利用者種別（Teacher / Parent / Student 等）。取得できなければ null */
  userType: string | null;
  /** 表示名。取得できなければ null */
  name: string | null;
}

/** ミントサイトのAPIから利用者種別（先生・保護者・生徒）を取得する。 */
export async function getEpisUserInfo(episUserId: string, idToken: string): Promise<EpisUserInfo> {
  const apiUrl = process.env.EPIS_API_URL;
  if (!apiUrl) {
    console.error("EPIS_API_URL が未設定です");
    return { userType: null, name: null };
  }
  try {
    const res = await fetch(`${apiUrl}/users/${encodeURIComponent(episUserId)}`, {
      headers: { Authorization: `Bearer ${idToken}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("ミントサイトAPIがエラーを返しました:", res.status);
      return { userType: null, name: null };
    }
    const json = await res.json();
    const data = json?.data ?? {};
    // 応答の項目名だけを記録する（値＝個人情報は記録しない）。表示名の項目を特定するため。
    console.info("ミントサイトAPIの応答項目:", Object.keys(data).join(","));
    const userType = data?.userType?.enUsertypeName;
    const name = [data.name, data.userName, data.fullName].find(
      (v) => typeof v === "string" && v.trim()
    );
    return {
      userType: typeof userType === "string" ? userType : null,
      name: typeof name === "string" ? name.trim() : null,
    };
  } catch (err) {
    console.error("ミントサイトAPIの呼び出しに失敗しました:", err instanceof Error ? err.message : err);
    return { userType: null, name: null };
  }
}

/**
 * ミントサイトの利用者種別 → この添削アプリの権限。
 *  Teacher → teacher（講師）／ Parent → 利用不可 ／ それ以外 → user（生徒）
 *  種別が取得できない場合は null（既存の利用者は保存済みの権限を使い、新規は拒否する）。
 */
export function roleFromEpisType(userType: string | null): "teacher" | "user" | "denied" | null {
  if (!userType) return null;
  if (userType === "Teacher") return "teacher";
  if (userType === "Parent") return "denied";
  return "user";
}
