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
    if (score >= 13) return "text-green-600";
    if (score >= 9) return "text-blue-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-600";
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">添削履歴</h1>
            <p className="text-gray-500 text-sm mt-1">{total}件の添削</p>
          </div>
          <Link
            href="/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            新規添削
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="生徒名またはTOPICで検索..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
              読み込み中...
            </div>
          ) : corrections.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
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
                    <tr className="bg-gray-50 border-b text-left text-gray-500">
                      <th className="px-4 py-3">生徒名</th>
                      <th className="px-4 py-3">TOPIC</th>
                      <th className="px-4 py-3 text-center">スコア</th>
                      <th className="px-4 py-3 text-center">語数</th>
                      <th className="px-4 py-3">日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corrections.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <Link href={`/result/${c.id}`} className="hover:text-blue-600">
                            {c.student_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                          {c.topic}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${scoreColor(c.score_total)}`}>
                            {c.score_total}
                          </span>
                          <span className="text-gray-400">/16</span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">{c.word_count}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(c.corrected_at).toLocaleDateString("ja-JP")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30 hover:bg-white"
                  >
                    ← 前へ
                  </button>
                  <span className="text-sm text-gray-500">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30 hover:bg-white"
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
