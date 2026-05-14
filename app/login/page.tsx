"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        await signIn(email, password);
        router.push("/");
      } else {
        await signUp(email, password);
        setMessage(
          "確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。"
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "認証に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#37352F] tracking-tight">
            英検ライティング
          </h1>
          <p className="text-sm text-[#9B9A97] mt-1">教師アカウントでログイン</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E3E2DE] p-8 space-y-5">
          {/* Tab */}
          <div className="flex border-b border-[#E3E2DE]">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "text-[#37352F] border-b-2 border-[#37352F]"
                  : "text-[#9B9A97] hover:text-[#6B6B6B]"
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "text-[#37352F] border-b-2 border-[#37352F]"
                  : "text-[#9B9A97] hover:text-[#6B6B6B]"
              }`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-[#EB5757] bg-[#EB5757]/5 rounded-lg p-2.5">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-[#4CAF50] bg-[#4CAF50]/5 rounded-lg p-2.5">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6C5CE7] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading
                ? "処理中..."
                : mode === "login"
                  ? "ログイン"
                  : "アカウント作成"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
