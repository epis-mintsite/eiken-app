"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/batch", label: "一括処理" },
  { href: "/settings", label: "設定" },
  { href: "/guide", label: "ガイド" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authEnabled } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  if (pathname === "/login") return null;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  function handleHistoryClick(e: React.MouseEvent) {
    if (typeof window !== "undefined" && sessionStorage.getItem("adminAccess") === "1") {
      return;
    }
    e.preventDefault();
    setAdminPassword("");
    setAdminError("");
    setShowAdminModal(true);
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError("");
    try {
      const res = await fetch("/api/admin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (res.ok) {
        sessionStorage.setItem("adminAccess", "1");
        setShowAdminModal(false);
        router.push("/history");
      } else {
        setAdminError("パスワードが違います");
      }
    } catch {
      setAdminError("通信エラーが発生しました");
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-[#E3E2DE]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-[#37352F] font-semibold text-base tracking-tight">
                準一級ライティング添削
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
              <Link
                href="/history"
                onClick={handleHistoryClick}
                className={`relative px-3 py-4 text-sm font-medium transition-colors ${
                  isActive("/history")
                    ? "text-[#37352F]"
                    : "text-[#6B6B6B] hover:text-[#37352F]"
                }`}
              >
                添削履歴
                {isActive("/history") && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#37352F]" />
                )}
              </Link>
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
              <span className={`block w-5 h-0.5 bg-[#37352F] transition-transform ${mobileOpen ? "rotate-45 translate-y-[4px]" : ""}`} />
              <span className={`block w-5 h-0.5 bg-[#37352F] transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-[#37352F] transition-transform ${mobileOpen ? "-rotate-45 -translate-y-[4px]" : ""}`} />
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
                href="/history"
                onClick={(e) => { setMobileOpen(false); handleHistoryClick(e); }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/history")
                    ? "text-[#37352F] bg-[#F1F1EF]"
                    : "text-[#6B6B6B] hover:bg-[#F7F6F3]"
                }`}
              >
                添削履歴
              </Link>
              <Link
                href="/correct"
                onClick={() => setMobileOpen(false)}
                className="mt-2 bg-[#6C5CE7] text-white rounded-lg px-4 py-2 text-sm font-medium text-center hover:opacity-90 transition-opacity"
              >
                新規添削
              </Link>
              {authEnabled && user && (
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
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

      {/* Admin password modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-[#37352F] mb-1">管理者認証</h2>
            <p className="text-sm text-[#9B9A97] mb-5">添削履歴を閲覧するにはパスワードを入力してください</p>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="パスワード"
                autoFocus
                className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors"
              />
              {adminError && (
                <p className="text-sm text-[#EB5757]">{adminError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 border border-[#E3E2DE] rounded-lg py-2.5 text-sm font-medium text-[#6B6B6B] hover:bg-[#F7F6F3] transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!adminPassword || adminLoading}
                  className="flex-1 bg-[#6C5CE7] text-white rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {adminLoading ? "確認中..." : "ログイン"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
