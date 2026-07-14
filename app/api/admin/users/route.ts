import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { verifyAdmin } from "@/lib/session";

// ユーザー一覧取得
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const search = req.nextUrl.searchParams.get("search") || "";

  let query = supabase
    .from("users")
    .select("id, login_id, name, role, is_active, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (search) {
    query = query.or(`login_id.ilike.%${search}%,name.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

// 新規ユーザー作成
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { loginId, password, name, role } = await req.json();

  if (!loginId?.trim() || !password || !name?.trim()) {
    return NextResponse.json(
      { error: "ログインID、パスワード、名前は必須です" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "パスワードは6文字以上にしてください" },
      { status: 400 }
    );
  }

  const validRoles = ["admin", "teacher", "user"];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json(
      { error: "無効な権限です" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from("users")
    .insert({
      login_id: loginId.trim(),
      password_hash: passwordHash,
      name: name.trim(),
      role: role || "teacher",
      is_active: true,
    })
    .select("id, login_id, name, role, is_active, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "このログインIDは既に使用されています" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data }, { status: 201 });
}
