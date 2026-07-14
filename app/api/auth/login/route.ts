import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { loginId, password } = await req.json();

    if (!loginId || !password) {
      return NextResponse.json(
        { error: "ログインIDとパスワードを入力してください" },
        { status: 400 }
      );
    }

    const user = await authenticateUser(loginId, password);

    await createSession(user);

    return NextResponse.json({
      user: {
        id: user.id,
        loginId: user.login_id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "認証に失敗しました" },
      { status: 401 }
    );
  }
}
