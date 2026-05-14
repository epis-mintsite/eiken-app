import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("corrections")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "添削結果が見つかりません" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    student_name: data.student_name,
    topic: data.topic,
    original_text: data.original_text,
    image_url: data.image_url,
    scores: {
      content: data.score_content,
      organization: data.score_org,
      vocabulary: data.score_vocab,
      grammar: data.score_grammar,
    },
    score_total:
      data.score_content + data.score_org + data.score_vocab + data.score_grammar,
    errors: data.errors_json,
    feedback: data.feedback_json,
    model_essay: data.model_essay,
    advice: data.advice_json,
    word_count: data.word_count,
    corrected_at: data.corrected_at,
  });
}
