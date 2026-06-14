import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const studentFilter = url.searchParams.get("student") || "";
  const search = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sortBy") || "corrected_at";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const dateFrom = url.searchParams.get("dateFrom") || "";
  const dateTo = url.searchParams.get("dateTo") || "";

  try {
    const validSortBy = ["corrected_at", "student_name"].includes(sortBy)
      ? (sortBy as "corrected_at" | "student_name")
      : "corrected_at";
    const ascending = sortOrder === "asc";

    let query = supabase
      .from("corrections")
      .select(
        "id, type, student_name, topic, strictness, score_content, score_org, score_vocab, score_grammar, word_count, corrected_at",
        { count: "exact" }
      )
      .order(validSortBy, { ascending })
      .range(offset, offset + limit - 1);

    if (studentFilter) {
      query = query.ilike("student_name", `%${studentFilter}%`);
    }
    if (search) {
      query = query.or(`topic.ilike.%${search}%,student_name.ilike.%${search}%`);
    }
    if (dateFrom) {
      query = query.gte("corrected_at", `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query = query.lte("corrected_at", `${dateTo}T23:59:59`);
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
