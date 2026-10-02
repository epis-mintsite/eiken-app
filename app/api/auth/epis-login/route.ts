import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase";
import { createSession } from "@/lib/session";
import { TERMS_VERSION, TERMS_COOKIE } from "@/lib/terms-version";
import { verifyTermsCookie } from "@/lib/terms-cookie";
import { recordConsent } from "@/lib/consent";
import { verifyFirebaseIdToken, episUserIdFromEmail } from "@/lib/epis-auth";

interface DbUser {
  id: string;
  login_id: string;
  name: string;
  role: string;
  is_active: boolean | null;
}

const USER_COLUMNS = "id, login_id, name, role, is_active";

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/**
 * ミントサイトのIDでのログイン。
 * ブラウザがFirebaseで本人確認して受け取ったIDトークンを検証し、
 * このアプリの利用者を探して（初回は「生徒」として作成して）セッションを発行する。
 * ミントサイトのIDでログインできる人は全員利用できる。講師への変更は管理者が管理画面で行う。
 */
export async function POST(req: NextRequest) {
  // 規約に同意していなければログインさせない
  const consent = await verifyTermsCookie(req.cookies.get(TERMS_COOKIE)?.value);
  if (!consent) {
    return NextResponse.json(
      { error: "ログインの前に利用規約への同意が必要です", code: "TERMS_REQUIRED" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const idToken = typeof body?.idToken === "string" ? body.idToken : "";
  if (!idToken) return fail(400, "認証情報がありません");

  // 1. IDトークンの検証（Googleの公開鍵）
  const verified = await verifyFirebaseIdToken(idToken);
  if (!verified) return fail(401, "ミントサイトの認証に失敗しました。IDとパスワードをご確認ください。");

  const episUserId = episUserIdFromEmail(verified.email);
  if (!episUserId) return fail(401, "ミントサイトのアカウントではありません。");

  // 2. このアプリの利用者を探す（ミントサイトのIDで照合。ログインIDでは照合しない）
  const { data: existing } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("auth_provider", "epis")
    .eq("external_id", episUserId)
    .maybeSingle<DbUser>();

  let user: DbUser;

  if (existing) {
    if (existing.is_active === false) {
      return fail(403, "このアカウントは無効化されています。");
    }
    // 権限・氏名は管理画面での設定を優先する（ログインのたびに上書きしない）
    user = existing;
  } else {
    // 初回ログイン: 「生徒」として作成する
    const { data: created, error } = await supabase
      .from("users")
      .insert({
        login_id: `epis:${episUserId}`, // 自前のログインIDと衝突しないよう接頭辞を付ける
        password_hash: `!${randomUUID()}`, // パスワードでのログインは不可（ミントサイトで認証する）
        name: episUserId, // 氏名は管理画面で設定できる
        role: "user",
        is_active: true,
        auth_provider: "epis",
        external_id: episUserId,
      })
      .select(USER_COLUMNS)
      .single<DbUser>();

    if (error || !created) {
      // 同時ログインで先に作成されていた場合は、それを使う
      const { data: again } = await supabase
        .from("users")
        .select(USER_COLUMNS)
        .eq("auth_provider", "epis")
        .eq("external_id", episUserId)
        .maybeSingle<DbUser>();
      if (!again) {
        console.error("epis user create failed:", error?.message);
        return fail(500, "アカウントの作成に失敗しました。時間をおいて、もう一度お試しください。");
      }
      user = again;
    } else {
      user = created;
    }
  }

  // 3. 同意の記録（記録できなければログインさせない）
  const recorded = await recordConsent({ user, source: "pre-login", termsHash: consent.hash, req });
  if (!recorded.ok) {
    return fail(500, "同意の記録に失敗しました。時間をおいて、もう一度お試しください。");
  }

  // 4. セッション発行
  await createSession(user as { id: string; login_id: string; name: string; role: string }, TERMS_VERSION);

  return NextResponse.json({
    user: { id: user.id, loginId: user.login_id, name: user.name, role: user.role },
  });
}
