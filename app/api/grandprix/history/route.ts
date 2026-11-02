import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession, canViewAll } from "@/lib/access";

/** グランプリ下書きチェックの履歴（生徒は自分の分のみ、講師・管理者は全件） */
export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { session } = auth;

  const url = request.nextUrl;
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20") || 20, 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0") || 0, 0);
  const search = (url.searchParams.get("search") || "").replace(/[%,()]/g, "").trim();

  let query = supabase
    .from("grandprix_checks")
    .select("id, division, student_name, title, knock, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!canViewAll(session)) {
    query = query.eq("user_id", session.userId);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,student_name.ilike.%${search}%,knock.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("grandprix history failed:", error.code);
    return NextResponse.json({ items: [], total: 0, totalStudents: 0, error: "履歴を取得できませんでした" }, { status: 500 });
  }

  // ユニーク生徒数（全件から集計）
  let totalStudents = 0;
  {
    let sQuery = supabase.from("grandprix_checks").select("student_name");
    if (!canViewAll(session)) sQuery = sQuery.eq("user_id", session.userId);
    const { data: all } = await sQuery;
    if (all) totalStudents = new Set(all.map((r) => r.student_name)).size;
  }

  return NextResponse.json({ items: data ?? [], total: count ?? 0, totalStudents });
}
