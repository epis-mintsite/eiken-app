import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession, canViewAll } from "@/lib/access";

async function getStats(isSummary: boolean, onlyUserId: string | null) {
  let query = supabase
    .from("corrections")
    .select("student_name, score_content, score_org, score_vocab, score_grammar");

  if (onlyUserId) {
    query = query.eq("user_id", onlyUserId);
  }

  if (isSummary) {
    query = query.eq("type", "summary");
  } else {
    query = query.or("type.is.null,type.neq.summary");
  }

  const { data, error } = await query;
  if (error || !data) return { totalCorrections: 0, totalStudents: 0, avgScore: 0 };

  const students = new Set(data.map((r) => r.student_name));
  const total = data.reduce(
    (sum, r) =>
      sum + (r.score_content || 0) + (r.score_org || 0) + (r.score_vocab || 0) + (r.score_grammar || 0),
    0
  );
  const avgScore =
    data.length > 0 ? Math.round((total / data.length) * 10) / 10 : 0;

  return {
    totalCorrections: data.length,
    totalStudents: students.size,
    avgScore,
  };
}

export async function GET() {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { session } = auth;

  // 生徒には自分の集計のみ返す
  const onlyUserId = canViewAll(session) ? null : session.userId;

  try {
    const [summary, writing] = await Promise.all([
      getStats(true, onlyUserId),
      getStats(false, onlyUserId),
    ]);
    return NextResponse.json({ summary, writing });
  } catch {
    return NextResponse.json({
      summary: { totalCorrections: 0, totalStudents: 0, avgScore: 0 },
      writing: { totalCorrections: 0, totalStudents: 0, avgScore: 0 },
    });
  }
}
