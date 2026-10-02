import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { verifyAdmin } from "@/lib/session";

// パスワードリセット
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { password } = await req.json();

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "パスワードは6文字以上にしてください" },
      { status: 400 }
    );
  }

  const { data: target } = await supabase
    .from("users")
    .select("auth_provider")
    .eq("id", id)
    .single();
  if (target && target.auth_provider !== "local") {
    return NextResponse.json(
      { error: "ミントサイトのアカウントのパスワードは、ミントサイトで変更してください" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  const { error } = await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
