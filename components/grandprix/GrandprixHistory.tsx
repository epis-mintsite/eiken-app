"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { GPHistoryItem } from "@/types/grandprix";

const LIMIT = 15;

/** グランプリ下書きチェックの履歴（履歴ページのタブ） */
export default function GrandprixHistory() {
  const router = useRouter();
  const [items, setItems] = useState<GPHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
        if (search.trim()) params.set("search", search.trim());
        const res = await fetch(`/api/grandprix/history?${params}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "履歴を取得できませんでした");
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [page, search]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="生徒名・タイトル・100本ノックで検索"
          className="flex-1 min-w-[200px] border border-[#C3C2BF] rounded-lg px-3 py-2 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#1F4E79] outline-none"
        />
        <span className="text-sm text-[#9B9A97]">{total}件</span>
      </div>

      <div className="bg-white rounded-xl border border-[#E3E2DE] overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-[#9B9A97]">読み込み中...</p>
        ) : error ? (
          <p className="p-8 text-center text-sm text-[#B3261E]">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#9B9A97]">
            {search ? "条件に一致するデータがありません" : "まだチェックした下書きがありません"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F7F6F3] text-left text-[#6B6B6B]">
                  <th className="px-4 py-3 font-medium">生徒名</th>
                  <th className="px-4 py-3 font-medium">部門</th>
                  <th className="px-4 py-3 font-medium">タイトル</th>
                  <th className="px-4 py-3 font-medium">日時</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it.id}
                    onClick={() => router.push(`/grandprix/result/${it.id}`)}
                    className="border-b border-[#EEEEEC] last:border-0 hover:bg-[#F7F6F3] cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-[#37352F]">{it.student_name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8F0F8] text-[#1F4E79] whitespace-nowrap">
                        {it.division}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B6B6B] max-w-[260px] truncate" title={it.knock}>{it.title}</td>
                    <td className="px-4 py-3 text-[#9B9A97] text-xs whitespace-nowrap">
                      {new Date(it.created_at).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#EEEEEC]">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="border border-[#C3C2BF] rounded-lg px-4 py-2 text-sm disabled:opacity-30"
            >
              ← 前へ
            </button>
            <span className="text-sm text-[#6B6B6B]">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="border border-[#C3C2BF] rounded-lg px-4 py-2 text-sm disabled:opacity-30"
            >
              次へ →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
