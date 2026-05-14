"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface CorrectionSummary {
  id: string;
  student_name: string;
  topic: string;
  score_content: number;
  score_org: number;
  score_vocab: number;
  score_grammar: number;
  score_total: number;
  word_count: number;
  corrected_at: string;
}

export default function HistoryPage() {
  const [corrections, setCorrections] = useState<CorrectionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/history?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCorrections(data.corrections || []);
        setTotal(data.total || 0);
      }
    } catch {
      // skip
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  function scoreColor(score: number): string {
    if (score >= 13) return "text-[#4CAF50]";
    if (score >= 9) return "text-[#6C5CE7]";
    if (score >= 5) return "text-[#FF9800]";
    return "text-[#EB5757]";
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#37352F] tracking-tight">添削履歴</h1>
            <p className="text-sm text-[#9B9A97] mt-1">{total}件の添削</p>
          </div>
          <Link
            href="/upload"
            className="bg-[#6C5CE7] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            新規添削
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="生徒名またはTOPICで検索..."
            className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none"
          />
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl border border-[#E3E2DE] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#9B9A97]">
              <div className="animate-spin h-6 w-6 border-2 border-[#6C5CE7] border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm">読み込み中...</p>
            </div>
          ) : corrections.length === 0 ? (
            <div className="p-8 text-center text-[#9B9A97]">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">
                {search ? "検索結果がありません" : "まだ添削データがありません"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F7F6F3] text-left text-[#6B6B6B]">
                      <th className="px-4 py-3 font-medium">生徒名</th>
                      <th className="px-4 py-3 font-medium">TOPIC</th>
                      <th className="px-4 py-3 text-center font-medium">スコア</th>
                      <th className="px-4 py-3 text-center font-medium">語数</th>
                      <th className="px-4 py-3 font-medium">日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corrections.map((c) => (
                      <tr key={c.id} className="border-b border-[#EEEEEC] last:border-0 hover:bg-[#F7F6F3] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#37352F]">
                          <Link href={`/result/${c.id}`} className="hover:text-[#2383E2]">
                            {c.student_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] max-w-[200px] truncate">
                          {c.topic}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${scoreColor(c.score_total)}`}>
                            {c.score_total}
                          </span>
                          <span className="text-[#9B9A97]">/16</span>
                        </td>
                        <td className="px-4 py-3 text-center text-[#6B6B6B]">{c.word_count}</td>
                        <td className="px-4 py-3 text-[#9B9A97] text-xs">
                          {new Date(c.corrected_at).toLocaleDateString("ja-JP")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#EEEEEC]">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="border border-[#C3C2BF] text-[#37352F] rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-30 hover:bg-[#F7F6F3] transition-colors"
                  >
                    ← 前へ
                  </button>
                  <span className="text-sm text-[#6B6B6B]">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="border border-[#C3C2BF] text-[#37352F] rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-30 hover:bg-[#F7F6F3] transition-colors"
                  >
                    次へ →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
