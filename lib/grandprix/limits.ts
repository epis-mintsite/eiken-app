import "server-only";
import { supabase } from "@/lib/supabase";
import type { SessionPayload } from "@/lib/session";
import { canViewAll } from "@/lib/access";
import { GP_DEFAULT_CLOSE_AT, GP_DEFAULT_DAILY_LIMIT, GP_DEFAULT_OPEN_FROM } from "@/lib/grandprix/rubric";

/**
 * 利用できる期間と回数。
 *  - 生徒: GP_OPEN_FROM 〜 GP_CLOSE_AT の間だけ、1日 GP_DAILY_LIMIT 回まで
 *  - 講師・管理者: いつでも、上限なし（公開前の試用のため）
 * 「1日」は中国の教室に合わせて Asia/Shanghai の0時で区切る（エッセイ添削は日本時間のまま）。
 */

const DAY_TZ_OFFSET_HOURS = 8;

function parseDate(value: string | undefined, fallback: string): Date {
  const d = new Date(value || fallback);
  return Number.isNaN(d.getTime()) ? new Date(fallback) : d;
}

export function gpPeriod(): { openFrom: Date; closeAt: Date } {
  return {
    openFrom: parseDate(process.env.GP_OPEN_FROM, GP_DEFAULT_OPEN_FROM),
    closeAt: parseDate(process.env.GP_CLOSE_AT, GP_DEFAULT_CLOSE_AT),
  };
}

export function gpDailyLimit(): number {
  const n = parseInt(process.env.GP_DAILY_LIMIT || "", 10);
  return Number.isFinite(n) && n > 0 ? n : GP_DEFAULT_DAILY_LIMIT;
}

function formatShanghaiDate(d: Date): string {
  const local = new Date(d.getTime() + DAY_TZ_OFFSET_HOURS * 60 * 60 * 1000);
  return `${local.getUTCMonth() + 1}月${local.getUTCDate()}日`;
}

/** 期間外なら生徒向けの案内を返す。使えるなら null。 */
export function gpPeriodMessage(session: SessionPayload, now = new Date()): string | null {
  if (canViewAll(session)) return null;
  const { openFrom, closeAt } = gpPeriod();
  if (now < openFrom) {
    return `グランプリの下書きチェックは${formatShanghaiDate(openFrom)}から使えます。`;
  }
  if (now >= closeAt) {
    return "グランプリの応募期間は終わりました。下書きチェックは使えません。";
  }
  return null;
}

function startOfTodayIso(): string {
  const offsetMs = DAY_TZ_OFFSET_HOURS * 60 * 60 * 1000;
  const local = new Date(Date.now() + offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - offsetMs).toISOString();
}

/** 今日使った回数（失敗したら null） */
export async function gpUsedToday(session: SessionPayload): Promise<number | null> {
  const { count, error } = await supabase
    .from("grandprix_checks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .gte("created_at", startOfTodayIso());
  // head リクエストでは表がないときなどに error が付かず count だけが null になるため、両方を見る
  if (error || count === null) {
    console.error("grandprix usage check failed:", error?.code ?? "no count");
    return null;
  }
  return count;
}

/** 使えなければメッセージを返す。問題なければ null。 */
export async function checkGPAvailability(session: SessionPayload): Promise<string | null> {
  const periodMessage = gpPeriodMessage(session);
  if (periodMessage) return periodMessage;
  if (canViewAll(session)) return null;

  const used = await gpUsedToday(session);
  if (used === null) return "利用状況を確認できませんでした。しばらくしてから再度お試しください。";
  const limit = gpDailyLimit();
  if (used >= limit) return `今日のチェックは${limit}回までです。また明日挑戦してください。`;
  return null;
}
