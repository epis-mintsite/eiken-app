"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const NAV_ITEMS_COMMON = [
  { href: "/", label: "ダッシュボード" },
  { href: "/history", label: "履歴" },
  { href: "/guide", label: "ガイド" },
];

const NAV_ITEMS_ADMIN = [
  { href: "/", label: "ダッシュボード" },
  { href: "/settings", label: "設定" },
];

const NAV_ITEMS_TEACHER = [
  { href: "/", label: "ダッシュボード" },
  { href: "/batch", label: "一括処理" },
  { href: "/history", label: "履歴" },
  { href: "/settings", label: "設定" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ログイン画面ではナビゲーションを非表示
  if (pathname === "/login" || (pathname === "/terms" && !user)) return null;

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const navItems = user?.role === "admin"
    ? NAV_ITEMS_ADMIN
    : user?.role === "teacher"
    ? NAV_ITEMS_TEACHER
    : NAV_ITEMS_COMMON;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E3E2DE]">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
          >
            <span className="text-[#37352F] font-semibold text-base tracking-tight">
              AIライティング添削
            </span>
          </Link>

          {/* Center: Nav links (desktop) */}
          <div className="hidden lg:flex items-center gap-1 ml-8">
            {navItems.map(({ href, label }) => (
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
            {/* 添削結果（admin + teacher） */}
            {(user?.role === "admin" || user?.role === "teacher") && (
              <Link
                href="/corrections"
                className={`relative px-3 py-4 text-sm font-medium transition-colors ${
                  isActive("/corrections")
                    ? "text-[#37352F]"
                    : "text-[#6B6B6B] hover:text-[#37352F]"
                }`}
              >
                添削結果
                {isActive("/corrections") && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#37352F]" />
                )}
              </Link>
            )}
            {/* ユーザー管理（adminのみ） */}
            {user?.role === "admin" && (
              <Link
                href="/admin/users"
                className={`relative px-3 py-4 text-sm font-medium transition-colors ${
                  isActive("/admin/users")
                    ? "text-[#37352F]"
                    : "text-[#6B6B6B] hover:text-[#37352F]"
                }`}
              >
                ユーザー管理
                {isActive("/admin/users") && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#37352F]" />
                )}
              </Link>
            )}
          </div>

          {/* Right: User info + CTA (desktop) */}
          <div className="hidden lg:flex items-center gap-3 ml-auto pl-4">
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6B6B6B]">
                  {user.name}
                </span>
                <Link
                  href="/change-password"
                  className="text-sm font-medium text-[#6B6B6B] hover:text-[#37352F] transition-colors"
                >
                  パスワード変更
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-[#6B6B6B] hover:text-[#37352F] transition-colors"
                >
                  ログアウト
                </button>
              </div>
            )}
            <Link
              href="/correct"
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
            {navItems.map(({ href, label }) => (
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
            {(user?.role === "admin" || user?.role === "teacher") && (
              <Link
                href="/corrections"
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/corrections")
                    ? "text-[#37352F] bg-[#F1F1EF]"
                    : "text-[#6B6B6B] hover:bg-[#F7F6F3]"
                }`}
              >
                添削結果
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin/users"
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/admin/users")
                    ? "text-[#37352F] bg-[#F1F1EF]"
                    : "text-[#6B6B6B] hover:bg-[#F7F6F3]"
                }`}
              >
                ユーザー管理
              </Link>
            )}
            <Link
              href="/correct"
              onClick={() => setMobileOpen(false)}
              className="mt-2 bg-[#6C5CE7] text-white rounded-lg px-4 py-2 text-sm font-medium text-center hover:opacity-90 transition-opacity"
            >
              新規添削
            </Link>
            {user && (
              <div className="mt-2 px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-[#6B6B6B]">{user.name}</span>
                <div className="flex items-center gap-3">
                  <Link
                    href="/change-password"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium text-[#6B6B6B] hover:text-[#37352F] transition-colors"
                  >
                    パスワード変更
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="text-sm font-medium text-[#6B6B6B] hover:text-[#37352F] transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
