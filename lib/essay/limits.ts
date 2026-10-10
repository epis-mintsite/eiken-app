import "server-only";
import { supabase } from "@/lib/supabase";
import type { SessionPayload } from "@/lib/session";
import { canViewAll } from "@/lib/access";

/** 生徒1人あたり1日に添削できる回数（講師・管理者は上限なし） */
export const ESSAY_DAILY_LIMIT = 3;

/** 「1日」の区切り。日本時間の0時で切り替える。 */
const DAY_TZ_OFFSET_HOURS = 9;

function startOfTodayIso(): string {
  const offsetMs = DAY_TZ_OFFSET_HOURS * 60 * 60 * 1000;
  const local = new Date(Date.now() + offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - offsetMs).toISOString();
}

/** 上限に達していればメッセージを返す。問題なければ null。 */
export async function checkEssayDailyLimit(session: SessionPayload): Promise<string | null> {
  if (canViewAll(session)) return null;

  const { count, error } = await supabase
    .from("essay_corrections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .gte("created_at", startOfTodayIso());

  if (error) {
    console.error("essay daily limit check failed:", error.code);
    return "利用状況を確認できませんでした。しばらくしてから再度お試しください。";
  }
  if ((count ?? 0) >= ESSAY_DAILY_LIMIT) {
    return `今日の添削は${ESSAY_DAILY_LIMIT}回までです。また明日挑戦してください。`;
  }
  return null;
}
