import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession, canViewAll } from "@/lib/access";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { session } = auth;

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "添削結果が見つかりません" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("essay_corrections")
    .select("id, user_id, doc_type, student_name, grade, theme, original_text, feedback_json, created_at")
    .eq("id", id)
    .maybeSingle();

  // 他人の結果は「存在しない」として扱う（IDの存在を推測させない）
  if (error || !data || (!canViewAll(session) && data.user_id !== session.userId)) {
    return NextResponse.json({ error: "添削結果が見つかりません" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    doc_type: data.doc_type,
    student_name: data.student_name,
    grade: data.grade ?? "",
    theme: data.theme,
    original_text: data.original_text,
    feedback: data.feedback_json,
    created_at: data.created_at,
  });
}
