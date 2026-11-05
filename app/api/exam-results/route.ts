import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession, canViewAll } from "@/lib/access";
import { EXAMS, grade } from "@/lib/exam-results/catalog";

/**
 * 演習結果を記録する（ログイン中の本人の結果として保存）。
 * body: { examId: string, answers: Record<string,string>, takenAt?: string }
 * 得点はサーバーで計算し直す。
 */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { session } = auth;

  const body = await request.json().catch(() => null);
  const exam = body && typeof body.examId === "string" ? EXAMS[body.examId] : undefined;
  if (!exam) {
    return NextResponse.json({ error: "この演習は EPIQ に記録できません" }, { status: 400 });
  }
  const graded = grade(exam, body.answers);
  if (graded.answered === 0) {
    return NextResponse.json({ error: "解答が1問もありません" }, { status: 400 });
  }

  let takenAt: string | null = null;
  if (typeof body.takenAt === "string") {
    const t = new Date(body.takenAt);
    // 端末の時計を使うが、未来・1年以上前は捨てる
    if (!Number.isNaN(t.getTime()) && t.getTime() <= Date.now() + 5 * 60_000 && t.getTime() > Date.now() - 365 * 86_400_000) {
      takenAt = t.toISOString();
    }
  }

  const { data, error } = await supabase
    .from("exam_results")
    .insert({
      user_id: session.userId,
      student_name: session.name,
      exam_id: exam.id,
      exam_title: exam.title,
      score: graded.score,
      max_score: graded.maxScore,
      answered: graded.answered,
      total: graded.total,
      answers: graded.answers,
      marks: graded.marks,
      taken_at: takenAt,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("exam_results insert failed:", error?.code);
    return NextResponse.json({ error: "記録できませんでした。時間をおいてもう一度試してください" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id, score: graded.score, maxScore: graded.maxScore, answered: graded.answered, total: graded.total });
}

/** 演習結果の一覧（生徒は自分の分のみ、講師・管理者は全件）。?exam=<id> で絞り込み。 */
export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { session } = auth;

  const url = request.nextUrl;
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50") || 50, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0") || 0, 0);
  const examId = url.searchParams.get("exam") || "";

  let query = supabase
    .from("exam_results")
    .select("id, student_name, exam_id, exam_title, score, max_score, answered, total, marks, taken_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!canViewAll(session)) query = query.eq("user_id", session.userId);
  if (examId && EXAMS[examId]) query = query.eq("exam_id", examId);

  const { data, error, count } = await query;
  if (error) {
    console.error("exam_results list failed:", error.code);
    return NextResponse.json({ items: [], total: 0, error: "演習結果を取得できませんでした" }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [], total: count ?? 0, viewAll: canViewAll(session) });
}
