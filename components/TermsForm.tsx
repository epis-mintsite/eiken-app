"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  /** pre-login: ログイン前の初回同意 / reconsent: 規約改定による再同意 */
  mode: "pre-login" | "reconsent";
}

export default function TermsForm({ mode }: Props) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/terms/agree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreed: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "同意の処理に失敗しました");
      // ページ全体を読み込み直して、認証状態（Cookie）を確実に反映させる
      window.location.href = data.next || "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "同意の処理に失敗しました");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {mode === "reconsent" && (
        <p className="text-sm text-[#7B5800] bg-[#FFF8E1] border border-[#FFE082] rounded-lg px-4 py-3">
          利用規約が改定されました。続けてご利用いただくには、内容をご確認のうえ、改めて同意してください。
        </p>
      )}

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[#6C5CE7]"
        />
        <span className="text-sm text-[#37352F]">
          利用規約を読み、その内容に同意します
        </span>
      </label>

      {error && (
        <p className="text-sm text-[#EB5757] bg-[#EB5757]/5 rounded-lg p-2.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={!agreed || loading}
        className="w-full bg-[#6C5CE7] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#5A4BD1] disabled:bg-[#CFCDC9] disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? "処理中..."
          : mode === "reconsent"
            ? "同意して続ける"
            : "同意してログイン画面へ"}
      </button>
    </form>
  );
}
