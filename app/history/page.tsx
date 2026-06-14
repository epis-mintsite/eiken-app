"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type SortBy = "corrected_at" | "student_name";
type SortOrder = "asc" | "desc";

interface CorrectionSummary {
  id: string;
  type?: string;
  student_name: string;
  topic: string;
  strictness?: string;
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
  const [studentFilter, setStudentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("corrected_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(0);
  const limit = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
        sortBy,
        sortOrder,
      });
      if (studentFilter) params.set("student", studentFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
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
  }, [studentFilter, dateFrom, dateTo, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  function handleSort(col: SortBy) {
    if (sortBy === col) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder(col === "corrected_at" ? "desc" : "asc");
    }
    setPage(0);
  }

  function SortIcon({ col }: { col: SortBy }) {
    if (sortBy !== col) return <span className="ml-1 text-[#C3C2BF]">↕</span>;
    return <span className="ml-1 text-[#6C5CE7]">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  }

  function clearFilters() {
    setStudentFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  }

  const hasFilter = studentFilter || dateFrom || dateTo;

  function StrictnessLabel({ strictness }: { strictness?: string }) {
    if (strictness === "lenient") return <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8F4FD] text-[#2383E2]">やさしめ</span>;
    if (strictness === "strict") return <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF3E8] text-[#E67E22]">厳しめ</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-[#F7F6F3] text-[#6B6B6B]">標準</span>;
  }

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
            href="/correct"
            className="bg-[#6C5CE7] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            新規添削
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#E3E2DE] p-5 space-y-3">
          <p className="text-xs font-medium text-[#9B9A97] uppercase tracking-wide">絞り込み</p>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={studentFilter}
              onChange={(e) => { setStudentFilter(e.target.value); setPage(0); }}
              placeholder="生徒名（ユーザーID）"
              className="flex-1 min-w-[160px] border border-[#C3C2BF] rounded-lg px-3 py-2 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              className="border border-[#C3C2BF] rounded-lg px-3 py-2 text-sm text-[#37352F] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none"
            />
            <span className="self-center text-[#9B9A97] text-sm">〜</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              className="border border-[#C3C2BF] rounded-lg px-3 py-2 text-sm text-[#37352F] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none"
            />
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="text-sm text-[#9B9A97] hover:text-[#EB5757] transition-colors px-2"
              >
                クリア
              </button>
            )}
          </div>
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
                {hasFilter ? "条件に一致するデータがありません" : "まだ添削データがありません"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F7F6F3] text-left text-[#6B6B6B]">
                      <th className="px-4 py-3 font-medium">
                        <button
                          onClick={() => handleSort("student_name")}
                          className="flex items-center hover:text-[#37352F] transition-colors"
                        >
                          生徒名<SortIcon col="student_name" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium">TOPIC</th>
                      <th className="px-4 py-3 text-center font-medium">採点の厳しさ</th>
                      <th className="px-4 py-3 text-center font-medium">スコア</th>
                      <th className="px-4 py-3 text-center font-medium">語数</th>
                      <th className="px-4 py-3 font-medium">
                        <button
                          onClick={() => handleSort("corrected_at")}
                          className="flex items-center hover:text-[#37352F] transition-colors"
                        >
                          日時<SortIcon col="corrected_at" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {corrections.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-[#EEEEEC] last:border-0 hover:bg-[#F7F6F3] transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-[#37352F]">
                          <Link
                            href={c.type === "summary" ? `/summary-result/${c.id}` : `/result/${c.id}`}
                            className="hover:text-[#2383E2]"
                          >
                            {c.student_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[#6B6B6B] max-w-[200px] truncate">
                          {c.topic}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StrictnessLabel strictness={c.strictness} />
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
