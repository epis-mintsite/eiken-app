import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface SessionPayload {
  userId: string;
  loginId: string;
  name: string;
  role: string;
  expiresAt: Date;
  /** 同意済みの利用規約の版（現行版と違えば再同意が必要） */
  termsVersion?: string;
}

const secretKey = process.env.JWT_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload, expiresAt: payload.expiresAt.toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(encodedKey);
}

export async function decrypt(
  session: string | undefined = ""
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    // 同じ秘密鍵で署名した別用途のトークン（規約同意Cookie等）をセッションとして
    // 受け付けないよう、必須項目の形を検証する。
    if (
      typeof payload.userId !== "string" ||
      typeof payload.loginId !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      loginId: payload.loginId,
      name: String(payload.name ?? ""),
      role: payload.role,
      expiresAt: new Date(payload.expiresAt as string),
      termsVersion: typeof payload.termsVersion === "string" ? payload.termsVersion : undefined,
    };
  } catch {
    return null;
  }
}

export async function createSession(
  user: {
    id: string;
    login_id: string;
    name: string;
    role: string;
  },
  termsVersion: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const session = await encrypt({
    userId: user.id,
    loginId: user.login_id,
    name: user.name,
    role: user.role,
    expiresAt,
    termsVersion,
  });

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return decrypt(session);
}

export async function verifyAdmin(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}
