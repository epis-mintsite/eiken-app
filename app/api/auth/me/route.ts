import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { gpPeriodMessage } from "@/lib/grandprix/limits";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      loginId: session.loginId,
      name: session.name,
      role: session.role,
      // グランプリの入口（ホームのカード・メニュー）を出すか。期間は GP_OPEN_FROM / GP_CLOSE_AT で決まる
      grandprixOpen: gpPeriodMessage(session) === null,
    },
  });
}
