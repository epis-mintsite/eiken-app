import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { TERMS_VERSION, TERMS_COOKIE } from "@/lib/terms-version";
import { verifyTermsCookie } from "@/lib/terms-cookie";
import { recordConsent } from "@/lib/consent";

export async function POST(req: NextRequest) {
  // 利用規約に同意していなければログインさせない（画面を経由しないAPI直接呼び出しも拒否）
  const consent = await verifyTermsCookie(req.cookies.get(TERMS_COOKIE)?.value);
  if (!consent) {
    return NextResponse.json(
      { error: "ログインの前に利用規約への同意が必要です", code: "TERMS_REQUIRED" },
      { status: 403 }
    );
  }

  try {
    const { loginId, password } = await req.json();

    if (!loginId || !password) {
      return NextResponse.json(
        { error: "ログインIDとパスワードを入力してください" },
        { status: 400 }
      );
    }

    const user = await authenticateUser(loginId, password);

    // このログイン方法は管理者（非常用）のみ。生徒・講師はミントサイトのIDでログインする。
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "生徒・講師の方は、ミントサイトのIDとパスワードでログインしてください" },
        { status: 403 }
      );
    }

    // 認証できたアカウントに、同意（同意時点の規約ハッシュ）を紐づけて記録する。
    // 記録できなければログインさせない（同意履歴を残せない状態で利用させない）。
    const recorded = await recordConsent({
      user,
      source: "pre-login",
      termsHash: consent.hash,
      req,
    });
    if (!recorded.ok) {
      return NextResponse.json(
        { error: "同意の記録に失敗しました。時間をおいて、もう一度お試しください。" },
        { status: 500 }
      );
    }

    await createSession(user, TERMS_VERSION);

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
