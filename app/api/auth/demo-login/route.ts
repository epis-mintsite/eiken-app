import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase";
import { createSession } from "@/lib/session";
import { TERMS_VERSION, TERMS_COOKIE } from "@/lib/terms-version";
import { verifyTermsCookie } from "@/lib/terms-cookie";
import { DEMO_STUDENT, isDemoLoginEnabled } from "@/lib/demo-login";

interface DbUser {
  id: string;
  login_id: string;
  name: string;
  role: string;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * 手元専用: 「デモ生徒」としてログインする（生徒画面の動作確認用）。
 * Vercel 上では使えない（DEMO_STUDENT_LOGIN=1、Vercel 以外、localhost からのアクセス、のすべてが必要）。
 * デモ生徒はパスワードでのログインができないアカウントとして作る。
 */
export async function POST(req: NextRequest) {
  if (!isDemoLoginEnabled() || !LOCAL_HOSTS.has(req.nextUrl.hostname)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const consent = await verifyTermsCookie(req.cookies.get(TERMS_COOKIE)?.value);
  if (!consent) {
    return NextResponse.json({ error: "先に利用規約に同意してください" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id, login_id, name, role")
    .eq("login_id", DEMO_STUDENT.loginId)
    .maybeSingle<DbUser>();

  let user = existing;
  if (!user) {
    const { data: created, error } = await supabase
      .from("users")
      .insert({
        login_id: DEMO_STUDENT.loginId,
        password_hash: `!${randomUUID()}`, // パスワードでのログインは不可
        name: DEMO_STUDENT.name,
        role: "user",
        is_active: true,
        auth_provider: "local",
      })
      .select("id, login_id, name, role")
      .single<DbUser>();
    if (error || !created) {
      console.error("demo user create failed:", error?.code);
      return NextResponse.json({ error: "デモ生徒を作成できませんでした" }, { status: 500 });
    }
    user = created;
  }

  // 同意の記録は残さない（実在の利用者ではないため）
  await createSession(user, TERMS_VERSION);
  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
}
