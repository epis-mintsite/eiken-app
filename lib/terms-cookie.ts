import { SignJWT, jwtVerify } from "jose";
import { TERMS_VERSION } from "@/lib/terms-version";

// proxy（ミドルウェア）からも使うため、jose のみに依存させる。
const getKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

// セッション用JWTと同じ秘密鍵を使うため、purpose で用途を分けて取り違えを防ぐ。
const PURPOSE = "terms-consent";

export async function signTermsCookie(termsHash: string): Promise<string> {
  return new SignJWT({ purpose: PURPOSE, v: TERMS_VERSION, h: termsHash })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getKey());
}

/** 現行の版への同意であれば { version, hash } を返す。無効・期限切れ・旧版は null。 */
export async function verifyTermsCookie(
  token: string | undefined
): Promise<{ version: string; hash: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    if (payload.purpose !== PURPOSE || payload.v !== TERMS_VERSION) return null;
    return { version: payload.v as string, hash: String(payload.h ?? "") };
  } catch {
    return null;
  }
}
