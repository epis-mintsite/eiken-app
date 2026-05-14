import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ students: [], error: error.message });
    }

    return NextResponse.json({ students: data || [] });
  } catch {
    return NextResponse.json({ students: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, grade } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "生徒名は必須です" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("students")
      .insert({ name: name.trim(), grade: grade?.trim() || null })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ student: data });
  } catch {
    return NextResponse.json({ error: "生徒の登録に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "IDは必須です" }, { status: 400 });
    }

    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
