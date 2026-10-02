import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/session";

// ユーザー情報更新（名前・権限・状態）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // 更新可能なフィールドのみ抽出
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.role !== undefined) {
    if (!["admin", "teacher", "user"].includes(body.role)) {
      return NextResponse.json({ error: "無効な権限です" }, { status: 400 });
    }
    updates.role = body.role;
  }
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "更新する項目がありません" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  // 自分自身の管理者権限を外したり、無効化したりすることを防ぐ
  if (id === admin.userId) {
    if (updates.role && updates.role !== "admin") {
      return NextResponse.json(
        { error: "自分自身の管理者権限は変更できません" },
        { status: 400 }
      );
    }
    if (updates.is_active === false) {
      return NextResponse.json(
        { error: "自分自身のアカウントは無効化できません" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select("id, login_id, name, role, is_active, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ user: data });
}
