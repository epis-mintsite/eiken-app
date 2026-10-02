import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/session";

// CSVの数式インジェクション対策: 先頭が = + - @ の値は ' を付けて文字列として扱わせる
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** 利用規約の同意履歴（全件）をCSVで出力する。管理者のみ。 */
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("terms_consents")
    .select("agreed_at, login_id, user_name, terms_version, terms_hash, source, ip, user_agent")
    .order("agreed_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = ["同意日時(UTC)", "ログインID", "氏名", "規約の版", "規約本文ハッシュ", "種別", "IPアドレス", "User-Agent"];
  const rows = (data || []).map((r) =>
    [r.agreed_at, r.login_id, r.user_name, r.terms_version, r.terms_hash, r.source, r.ip, r.user_agent]
      .map(csvCell)
      .join(",")
  );
  // Excelで文字化けしないよう BOM を付ける
  const csv = "﻿" + [header.map(csvCell).join(","), ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="terms_consents.csv"',
    },
  });
}
