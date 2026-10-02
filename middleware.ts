import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// /api/health は Vercel Cron 用（CRON_SECRET で保護）
const publicPaths = ["/login", "/api/auth/login", "/api/health"];

const encodedKey = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 公開パスはスキップ
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 静的ファイル・API以外のアセットはスキップ
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/fonts") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get("session")?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });

    // /admin/* は管理者のみ
    if (pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // /api/admin/* は管理者のみ
    if (pathname.startsWith("/api/admin") && payload.role !== "admin") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    return NextResponse.next();
  } catch {
    // トークンが無効 → ログインへ
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session");
    return response;
  }
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
