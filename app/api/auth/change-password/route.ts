import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "現在のパスワードと新しいパスワードは必須です" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "新しいパスワードは6文字以上にしてください" },
      { status: 400 }
    );
  }

  // 現在のパスワードを検証
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("password_hash, auth_provider")
    .eq("id", session.userId)
    .single();

  if (fetchError || !user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  if (user.auth_provider !== "local") {
    return NextResponse.json(
      { error: "ミントサイトのIDでログインしている場合、パスワードはミントサイトで変更してください" },
      { status: 400 }
    );
  }

  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "現在のパスワードが正しくありません" }, { status: 403 });
  }

  // 新しいパスワードをハッシュ化して更新
  const newHash = await hashPassword(newPassword);
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq("id", session.userId);

  if (updateError) {
    return NextResponse.json({ error: "パスワードの更新に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ message: "パスワードを変更しました" });
}
