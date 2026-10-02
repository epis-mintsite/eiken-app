import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { TERMS_VERSION, TERMS_COOKIE, TERMS_COOKIE_MAX_AGE } from "@/lib/terms-version";
import { signTermsCookie } from "@/lib/terms-cookie";
import { currentTermsHash, recordConsent } from "@/lib/consent";

/**
 * 利用規約への同意。
 *  - 未ログイン: 署名付きCookie（1年）を発行 → /login へ。同じ端末では次回から規約画面を出さない。
 *                同意の記録はログイン成功時にアカウントへ紐づけて保存する（版ごとに初回のみ）。
 *  - ログイン中（規約の改定による再同意）: 同意履歴を保存し、セッションを新しい版で再発行。
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (body?.agreed !== true) {
    return NextResponse.json({ error: "利用規約への同意が必要です" }, { status: 400 });
  }

  const termsHash = currentTermsHash();
  const session = await getSession();

  // ---- 再同意（ログイン中） ----
  if (session) {
    if (session.termsVersion === TERMS_VERSION) {
      return NextResponse.json({ ok: true, next: "/" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, login_id, name, role, is_active")
      .eq("id", session.userId)
      .single();
    if (!user || !user.is_active) {
      return NextResponse.json({ error: "アカウントが無効です" }, { status: 401 });
    }

    const result = await recordConsent({ user, source: "re-consent", termsHash, req });
    if (!result.ok) {
      return NextResponse.json(
        { error: "同意の記録に失敗しました。時間をおいて、もう一度お試しください。" },
        { status: 500 }
      );
    }
    await createSession(user, TERMS_VERSION);
    return NextResponse.json({ ok: true, next: "/" });
  }

  // ---- ログイン前の同意 ----
  const token = await signTermsCookie(termsHash);
  const res = NextResponse.json({ ok: true, next: "/login" });
  res.cookies.set(TERMS_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: TERMS_COOKIE_MAX_AGE,
  });
  return res;
}
