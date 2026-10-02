import "server-only";
import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/session";

/**
 * 閲覧範囲のルール:
 *  - 生徒（role: user）… 自分が提出した添削のみ
 *  - 講師（teacher）・管理者（admin）… すべて
 */
export function canViewAll(session: SessionPayload): boolean {
  return session.role === "admin" || session.role === "teacher";
}

export function isStaff(session: SessionPayload): boolean {
  return canViewAll(session);
}

/** ログイン済みセッションを返す。未ログインなら 401 のレスポンスを返す。 */
export async function requireSession(): Promise<
  { session: SessionPayload; error?: undefined } | { session?: undefined; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: "ログインが必要です" }, { status: 401 }),
    };
  }
  return { session };
}

/** 講師・管理者のみ許可。 */
export async function requireStaff(): Promise<
  { session: SessionPayload; error?: undefined } | { session?: undefined; error: NextResponse }
> {
  const result = await requireSession();
  if (result.error) return result;
  if (!isStaff(result.session)) {
    return {
      error: NextResponse.json({ error: "権限がありません" }, { status: 403 }),
    };
  }
  return result;
}
