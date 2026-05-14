import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const studentName = url.searchParams.get("student") || "";
  const search = url.searchParams.get("search") || "";

  try {
    let query = supabase
      .from("corrections")
      .select("id, student_name, topic, score_content, score_org, score_vocab, score_grammar, word_count, corrected_at", { count: "exact" })
      .order("corrected_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (studentName) {
      query = query.eq("student_name", studentName);
    }
    if (search) {
      query = query.or(`topic.ilike.%${search}%,student_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ corrections: [], total: 0, error: error.message });
    }

    const corrections = (data || []).map((row) => ({
      ...row,
      score_total:
        (row.score_content || 0) +
        (row.score_org || 0) +
        (row.score_vocab || 0) +
        (row.score_grammar || 0),
    }));

    return NextResponse.json({ corrections, total: count || 0 });
  } catch {
    return NextResponse.json({ corrections: [], total: 0 });
  }
}
