"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Correction {
  id: string;
  student_name: string;
  topic: string;
  type?: string;
  score_content: number;
  score_org: number;
  score_vocab: number;
  score_grammar: number;
  score_total: number;
  word_count: number;
  corrected_at: string;
}

interface StudentSummary {
  name: string;
  count: number;
  avgScore: number;
  lastDate: string;
}

export default function AdminCorrectionsPage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [view, setView] = useState<"students" | "all">("students");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchCorrections = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      params.set("offset", "0");
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
  }, [search]);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  // 生徒ごとの集計
  const studentSummaries: StudentSummary[] = (() => {
    const map = new Map<string, { count: number; totalScore: number; lastDate: string }>();
    corrections.forEach((c) => {
      const existing = map.get(c.student_name);
      if (existing) {
        existing.count++;
        existing.totalScore += c.score_total;
        if (c.corrected_at > existing.lastDate) existing.lastDate = c.corrected_at;
      } else {
        map.set(c.student_name, {
          count: 1,
          totalScore: c.score_total,
          lastDate: c.corrected_at,
        });
      }
    });
    return Array.from(map.entries())
      .map(([name, s]) => ({
        name,
        count: s.count,
        avgScore: Math.round((s.totalScore / s.count) * 10) / 10,
        lastDate: s.lastDate,
      }))
      .sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  })();

  // 選択した生徒でフィルタ
  const filteredCorrections = selectedStudent
    ? corrections.filter((c) => c.student_name === selectedStudent)
    : corrections;

  // ページネーション
  const pagedCorrections = filteredCorrections.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredCorrections.length / pageSize);

  function scoreColor(score: number) {
    if (score >= 13) return "text-[#2E7D32]";
    if (score >= 9) return "text-[#6C5CE7]";
    if (score >= 5) return "text-[#E67E22]";
    return "text-[#D32F2F]";
  }

  function scoreBg(score: number) {
    if (score >= 13) return "bg-[#E8F5E9]";
    if (score >= 9) return "bg-[#F3E8FF]";
    if (score >= 5) return "bg-[#FFF3E8]";
    return "bg-[#FDEDED]";
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#37352F]">添削結果管理</h1>
          <p className="text-sm text-[#9B9A97] mt-1">
            生徒ごとの添削履歴と結果を一覧で確認
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          {/* View toggle */}
          <div className="flex bg-[#F1F1EF] rounded-lg p-0.5">
            <button
              onClick={() => { setView("students"); setSelectedStudent(""); setPage(0); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "students"
                  ? "bg-white text-[#37352F] shadow-sm"
                  : "text-[#6B6B6B] hover:text-[#37352F]"
              }`}
            >
              生徒別
            </button>
            <button
              onClick={() => { setView("all"); setSelectedStudent(""); setPage(0); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "all"
                  ? "bg-white text-[#37352F] shadow-sm"
                  : "text-[#6B6B6B] hover:text-[#37352F]"
              }`}
            >
              全件一覧
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder="生徒名・トピックで検索..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full border border-[#E3E2DE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-transparent"
            />
          </div>

          {/* Back button when viewing student detail */}
          {selectedStudent && (
            <button
              onClick={() => { setSelectedStudent(""); setView("students"); setPage(0); }}
              className="text-sm text-[#2383E2] hover:underline"
            >
              ← 生徒一覧に戻る
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#F7F6F3] rounded-lg px-4 py-3 text-center">
            <p className="text-xl font-bold text-[#6C5CE7]">{total}</p>
            <p className="text-xs text-[#6B6B6B]">総添削数</p>
          </div>
          <div className="bg-[#F7F6F3] rounded-lg px-4 py-3 text-center">
            <p className="text-xl font-bold text-[#0D9488]">{studentSummaries.length}</p>
            <p className="text-xs text-[#6B6B6B]">生徒数</p>
          </div>
          <div className="bg-[#F7F6F3] rounded-lg px-4 py-3 text-center">
            <p className="text-xl font-bold text-[#E67E22]">
              {corrections.length > 0
                ? (Math.round((corrections.reduce((s, c) => s + c.score_total, 0) / corrections.length) * 10) / 10)
                : 0}
            </p>
            <p className="text-xs text-[#6B6B6B]">全体平均 / 16</p>
          </div>
          <div className="bg-[#F7F6F3] rounded-lg px-4 py-3 text-center">
            <p className="text-xl font-bold text-[#37352F]">
              {corrections.length > 0
                ? Math.round(corrections.reduce((s, c) => s + c.word_count, 0) / corrections.length)
                : 0}
            </p>
            <p className="text-xs text-[#6B6B6B]">平均語数</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-[#6B6B6B] text-sm">読み込み中...</p>
          </div>
        ) : corrections.length === 0 ? (
          <div className="text-center py-20 bg-[#F7F6F3] rounded-xl">
            <p className="text-[#6B6B6B] text-sm">添削データがありません</p>
          </div>
        ) : view === "students" && !selectedStudent ? (
          /* ===== Student cards view ===== */
          <div className="grid gap-3">
            {studentSummaries.map((s) => (
              <button
                key={s.name}
                onClick={() => { setSelectedStudent(s.name); setView("all"); setPage(0); }}
                className="w-full text-left bg-white border border-[#E3E2DE] rounded-xl p-5 hover:border-[#6C5CE7] hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#6C5CE7]/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#6C5CE7]">
                        {s.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#37352F]">{s.name}</p>
                      <p className="text-xs text-[#9B9A97]">
                        最終添削: {new Date(s.lastDate).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-[#6C5CE7]">{s.count}</p>
                      <p className="text-xs text-[#9B9A97]">回</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-bold ${scoreColor(s.avgScore)}`}>{s.avgScore}</p>
                      <p className="text-xs text-[#9B9A97]">平均 /16</p>
                    </div>
                    <span className="text-[#9B9A97] text-lg">›</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* ===== Corrections table view ===== */
          <>
            {selectedStudent && (
              <div className="mb-4 px-4 py-3 bg-[#F3E8FF] rounded-lg">
                <p className="text-sm font-medium text-[#6C5CE7]">
                  {selectedStudent} の添削結果（{filteredCorrections.length}件）
                </p>
              </div>
            )}

            {/* Desktop table */}
            <div className="hidden md:block bg-white border border-[#E3E2DE] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7F6F3] text-left text-[#6B6B6B]">
                    <th className="px-4 py-3 font-medium">生徒名</th>
                    <th className="px-4 py-3 font-medium">トピック</th>
                    <th className="px-4 py-3 font-medium text-center">スコア</th>
                    <th className="px-4 py-3 font-medium text-center">内容</th>
                    <th className="px-4 py-3 font-medium text-center">構成</th>
                    <th className="px-4 py-3 font-medium text-center">語彙</th>
                    <th className="px-4 py-3 font-medium text-center">文法</th>
                    <th className="px-4 py-3 font-medium text-center">語数</th>
                    <th className="px-4 py-3 font-medium">日時</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCorrections.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-[#EEEEEC] hover:bg-[#F7F6F3] transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[#37352F]">
                        <button
                          onClick={() => { setSelectedStudent(c.student_name); setView("all"); setPage(0); }}
                          className="hover:text-[#6C5CE7] hover:underline"
                        >
                          {c.student_name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[#6B6B6B] max-w-[200px] truncate">
                        <Link href={`/result/${c.id}`} className="hover:text-[#2383E2] hover:underline">
                          {c.topic || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${scoreBg(c.score_total)} ${scoreColor(c.score_total)}`}>
                          {c.score_total}/16
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-[#6B6B6B]">{c.score_content}</td>
                      <td className="px-4 py-3 text-center text-[#6B6B6B]">{c.score_org}</td>
                      <td className="px-4 py-3 text-center text-[#6B6B6B]">{c.score_vocab}</td>
                      <td className="px-4 py-3 text-center text-[#6B6B6B]">{c.score_grammar}</td>
                      <td className="px-4 py-3 text-center text-[#6B6B6B]">{c.word_count}</td>
                      <td className="px-4 py-3 text-[#9B9A97] text-xs whitespace-nowrap">
                        {new Date(c.corrected_at).toLocaleDateString("ja-JP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {pagedCorrections.map((c) => (
                <Link
                  key={c.id}
                  href={`/result/${c.id}`}
                  className="block bg-white border border-[#E3E2DE] rounded-xl p-4 hover:border-[#6C5CE7] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-[#37352F]">{c.student_name}</p>
                      <p className="text-xs text-[#9B9A97] mt-0.5">
                        {new Date(c.corrected_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${scoreBg(c.score_total)} ${scoreColor(c.score_total)}`}>
                      {c.score_total}/16
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6B6B] truncate mb-2">{c.topic || "—"}</p>
                  <div className="flex gap-3 text-xs text-[#9B9A97]">
                    <span>内容 {c.score_content}</span>
                    <span>構成 {c.score_org}</span>
                    <span>語彙 {c.score_vocab}</span>
                    <span>文法 {c.score_grammar}</span>
                    <span>語数 {c.word_count}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm border border-[#E3E2DE] rounded-lg disabled:opacity-40 hover:bg-[#F7F6F3] transition-colors"
                >
                  ‹ 前
                </button>
                <span className="text-sm text-[#6B6B6B]">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm border border-[#E3E2DE] rounded-lg disabled:opacity-40 hover:bg-[#F7F6F3] transition-colors"
                >
                  次 ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
