import { NextResponse } from "next/server";
import { requireSession, canViewAll } from "@/lib/access";
import { gpDailyLimit, gpPeriodMessage, gpUsedToday } from "@/lib/grandprix/limits";
import type { GPStatus } from "@/types/grandprix";

/** 入力画面に出す「使えるか・今日あと何回か」 */
export async function GET() {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { session } = auth;

  const staff = canViewAll(session);
  const message = gpPeriodMessage(session) ?? "";
  const used = message ? 0 : ((await gpUsedToday(session)) ?? 0);

  const status: GPStatus = {
    open: !message,
    staff,
    message,
    used,
    limit: staff ? null : gpDailyLimit(),
  };
  return NextResponse.json(status);
}
