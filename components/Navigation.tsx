"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/batch", label: "一括処理" },
  { href: "/history", label: "履歴" },
  { href: "/students", label: "生徒管理" },
  { href: "/settings", label: "設定" },
  { href: "/guide", label: "ガイド" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authEnabled } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ログイン画面ではナビゲーションを非表示
  if (pathname === "/login") return null;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E3E2DE]">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded bg-[#6C5CE7] text-white text-xs font-bold">
              N
            </span>
            <span className="text-[#37352F] font-bold text-base">
              英検ライティング
            </span>
          </Link>

          {/* Center: Nav links (desktop) */}
          <div className="hidden lg:flex items-center gap-1 ml-8">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-4 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "text-[#37352F]"
                    : "text-[#6B6B6B] hover:text-[#37352F]"
                }`}
              >
                {label}
                {isActive(href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#37352F]" />
                )}
              </Link>
            ))}
          </div>

          {/* Right: CTA + Auth (desktop) */}
          <div className="hidden lg:flex items-center gap-3 ml-auto pl-4">
            {authEnabled && user && (
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-[#6B6B6B] hover:text-[#37352F] transition-colors"
                title={user.email || ""}
              >
                ログアウト
              </button>
            )}
            <Link
              href="/upload"
              className="bg-[#6C5CE7] text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              新規添削
            </Link>
          </div>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            aria-label="メニュー"
          >
            <span
              className={`block w-5 h-0.5 bg-[#37352F] transition-transform ${
                mobileOpen ? "rotate-45 translate-y-[4px]" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-[#37352F] transition-opacity ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-[#37352F] transition-transform ${
                mobileOpen ? "-rotate-45 -translate-y-[4px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E3E2DE] bg-white">
          <div className="max-w-[1280px] mx-auto px-8 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "text-[#37352F] bg-[#F1F1EF]"
                    : "text-[#6B6B6B] hover:bg-[#F7F6F3]"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/upload"
              onClick={() => setMobileOpen(false)}
              className="mt-2 bg-[#6C5CE7] text-white rounded-lg px-4 py-2 text-sm font-medium text-center hover:opacity-90 transition-opacity"
            >
              新規添削
            </Link>
            {authEnabled && user && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleSignOut();
                }}
                className="mt-1 px-3 py-2 text-sm font-medium text-[#6B6B6B] hover:text-[#37352F] text-left transition-colors"
                title={user.email || ""}
              >
                ログアウト
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
