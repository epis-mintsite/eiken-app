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

  const { data, error } = await supabase
    .from("corrections")
    .select("*")
    .eq("id", id)
    .single();

  // 他人の結果は「存在しない」として扱う（IDの存在を推測させない）
  if (error || !data || (!canViewAll(session) && data.user_id !== session.userId)) {
    return NextResponse.json({ error: "添削結果が見つかりません" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    type: data.type,
    student_name: data.student_name,
    topic: data.topic,
    original_text: data.original_text,
    passage_text: data.passage_text,
    image_url: data.image_url,
    scores: {
      content: data.score_content,
      organization: data.score_org,
      vocabulary: data.score_vocab,
      grammar: data.score_grammar,
    },
    score_total:
      data.score_content + data.score_org + data.score_vocab + data.score_grammar,
    good_points: data.good_points_json,
    errors: data.errors_json,
    content_analysis: data.content_analysis_json,
    vocabulary_suggestions: data.vocab_suggestions_json,
    feedback: data.feedback_json,
    model_essay: data.model_essay,
    summary_writing_points: data.summary_points_json,
    advice: data.advice_json,
    word_count: data.word_count,
    corrected_at: data.corrected_at,
  });
}
