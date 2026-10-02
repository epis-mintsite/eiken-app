import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * DB休止対策のヘルスチェック。
 * Supabase無料プランは一定期間アクセスがないとDBが自動停止するため、
 * Vercel Cron（vercel.json）から毎日1回呼び出して軽いクエリを流す。
 * Vercel Cron は環境変数 CRON_SECRET が設定されていると
 * `Authorization: Bearer <CRON_SECRET>` を付けて呼び出す。
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("users").select("id").limit(1);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
