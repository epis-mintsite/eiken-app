"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("新しいパスワードが一致しません");
      return;
    }

    if (newPassword.length < 6) {
      setError("新しいパスワードは6文字以上にしてください");
      return;
    }

    if (currentPassword === newPassword) {
      setError("現在のパスワードと同じパスワードは設定できません");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-[#37352F] mb-8">
          パスワード変更
        </h1>

        {success ? (
          <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg p-4">
            <p className="text-sm text-[#2E7D32] font-medium">
              パスワードを変更しました。ダッシュボードに戻ります...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-[#FDEDED] border border-[#F5C6CB] rounded-lg p-3">
                <p className="text-sm text-[#D32F2F]">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                現在のパスワード
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E3E2DE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                新しいパスワード
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-[#E3E2DE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-transparent"
              />
              <p className="text-xs text-[#9B9A97] mt-1">6文字以上</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                新しいパスワード（確認）
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-[#E3E2DE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#6C5CE7] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "変更中..." : "パスワードを変更"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2.5 border border-[#E3E2DE] rounded-lg text-sm font-medium text-[#37352F] hover:bg-[#F7F6F3] transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
