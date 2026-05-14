"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", icon: "📊" },
  { href: "/upload", label: "添削", icon: "📷" },
  { href: "/batch", label: "一括処理", icon: "📦" },
  { href: "/history", label: "履歴", icon: "📋" },
  { href: "/students", label: "生徒管理", icon: "👤" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authEnabled } = useAuth();

  // ログイン画面ではナビゲーションを非表示
  if (pathname === "/login") return null;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-bold text-gray-900 text-sm whitespace-nowrap">
            英検準一級 添削
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map(({ href, label, icon }) => {
              const isActive =
                href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
            {authEnabled && user && (
              <button
                onClick={handleSignOut}
                className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 whitespace-nowrap"
                title={user.email || ""}
              >
                ログアウト
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
