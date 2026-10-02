import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { TERMS_VERSION, TERMS_COOKIE } from "@/lib/terms-version";
import { verifyTermsCookie } from "@/lib/terms-cookie";

/**
 * アクセス制御（Next.js 16 の proxy。旧 middleware）。
 *
 * 流れ:
 *   未ログイン      → 利用規約に同意するまで /terms 以外へ進めない（/login も含む）
 *   同意済み・未ログイン → /login のみ
 *   ログイン済み    → 同意済みの規約が現行版でなければ /terms で再同意
 *   管理者専用      → /admin, /api/admin
 */

// 常に通すパス（規約ページ・同意API・Vercel Cronのヘルスチェック）
// （/api/auth/logout は、再同意が必要な状態でもログアウトできるように通す）
const alwaysPublic = ["/terms", "/api/terms", "/api/health", "/api/auth/logout"];
// 規約に同意済み（Cookie）なら未ログインでも開けるパス
const loginPaths = ["/login", "/api/auth/login"];

const encodedKey = new TextEncoder().encode(process.env.JWT_SECRET);

const startsWithAny = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(p + "/"));

function jsonError(status: number, error: string, code?: string) {
  return NextResponse.json({ error, ...(code ? { code } : {}) }, { status });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // 静的ファイル・Next内部パスは対象外
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/fonts") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (startsWithAny(pathname, alwaysPublic)) {
    return NextResponse.next();
  }

  // セッションの検証
  let payload: { role?: string; termsVersion?: string } | null = null;
  const session = req.cookies.get("session")?.value;
  if (session) {
    try {
      const verified = await jwtVerify(session, encodedKey, { algorithms: ["HS256"] });
      // 規約同意Cookie等、別用途のトークンをセッションとして扱わない
      if (
        typeof verified.payload.userId === "string" &&
        typeof verified.payload.role === "string"
      ) {
        payload = {
          role: verified.payload.role,
          termsVersion:
            typeof verified.payload.termsVersion === "string"
              ? verified.payload.termsVersion
              : undefined,
        };
      }
    } catch {
      payload = null;
    }
  }

  // ---- ログイン済み ----
  if (payload) {
    // 同意済みの規約が現行版でない（規約改定・導入前に発行されたセッション）→ 再同意
    if (payload.termsVersion !== TERMS_VERSION) {
      if (isApi) {
        return jsonError(403, "利用規約への同意が必要です", "TERMS_REQUIRED");
      }
      const url = new URL("/terms", req.url);
      url.searchParams.set("reconsent", "1");
      return NextResponse.redirect(url);
    }

    // /admin/* は管理者のみ
    if (pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // /api/admin/* は管理者のみ
    if (pathname.startsWith("/api/admin") && payload.role !== "admin") {
      return jsonError(403, "権限がありません");
    }
    return NextResponse.next();
  }

  // ---- 未ログイン ----
  const consent = await verifyTermsCookie(req.cookies.get(TERMS_COOKIE)?.value);

  // 規約に同意していなければ、ログイン画面も含めて /terms へ
  if (!consent) {
    if (isApi) return jsonError(403, "利用規約への同意が必要です", "TERMS_REQUIRED");
    const response = NextResponse.redirect(new URL("/terms", req.url));
    // 無効なセッションCookieが残っていれば消しておく
    if (session) response.cookies.delete("session");
    return response;
  }

  // 同意済み: ログイン関連のみ通す
  if (startsWithAny(pathname, loginPaths)) {
    return NextResponse.next();
  }
  if (isApi) return jsonError(401, "ログインが必要です");
  const response = NextResponse.redirect(new URL("/login", req.url));
  if (session) response.cookies.delete("session");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
