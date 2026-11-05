"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { EXAMS } from "@/lib/exam-results/catalog";

interface ResultRow {
  id: string;
  student_name: string;
  exam_id: string;
  exam_title: string;
  score: number;
  max_score: number;
  answered: number;
  total: number;
  marks: Record<string, boolean>;
  taken_at: string | null;
  created_at: string;
}

const fmt = (s: string) =>
  new Date(s).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

/** 演習結果（生徒は自分の分、講師・管理者は全員の分） */
export default function ExamResultsPage() {
  const [items, setItems] = useState<ResultRow[]>([]);
  const [viewAll, setViewAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exam, setExam] = useState("");
  const [student, setStudent] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (exam) params.set("exam", exam);
      const res = await fetch(`/api/exam-results?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "演習結果を取得できませんでした");
      setItems(data.items || []);
      setViewAll(!!data.viewAll);
    } catch (err) {
      setError(err instanceof Error ? err.message : "演習結果を取得できませんでした");
    } finally {
      setLoading(false);
    }
  }, [exam]);

  useEffect(() => {
    // 絞り込みが変わるたびに読み直す（読み込み中の表示を出すため setState を含む）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const shown = useMemo(
    () => (student ? items.filter((r) => r.student_name.includes(student.trim())) : items),
    [items, student]
  );
  const avg = shown.length ? Math.round(shown.reduce((s, r) => s + (r.score / r.max_score) * 100, 0) / shown.length) : null;

  return (
    <main className="max-w-[1080px] mx-auto px-6 sm:px-8 py-10">
      <h1 className="text-2xl font-bold text-[#37352F]">演習結果</h1>
      <p className="text-sm text-[#6B6B6B] mt-1">
        {viewAll ? "全員の演習結果です。" : "あなたの演習結果です。"}解答解説ボードの「EPIQに送る」で記録されます。得点は EPIQ が解答から計算し直したものです。
      </p>

      <div className="flex flex-wrap items-end gap-3 mt-6">
        <label className="text-xs text-[#6B6B6B] flex flex-col gap-1">
          演習
          <select
            id="exam-filter"
            value={exam}
            onChange={(e) => setExam(e.target.value)}
            className="border border-[#E3E2DE] rounded-lg px-3 py-2 text-sm text-[#37352F] bg-white"
          >
            <option value="">すべて</option>
            {Object.values(EXAMS).map((x) => (
              <option key={x.id} value={x.id}>{x.title}</option>
            ))}
          </select>
        </label>
        {viewAll && (
          <label className="text-xs text-[#6B6B6B] flex flex-col gap-1">
            生徒名
            <input
              id="student-filter"
              value={student}
              onChange={(e) => setStudent(e.target.value)}
              placeholder="名前の一部"
              className="border border-[#E3E2DE] rounded-lg px-3 py-2 text-sm text-[#37352F] bg-white w-44"
            />
          </label>
        )}
        {avg !== null && (
          <p className="text-sm text-[#6B6B6B] ml-auto tabular-nums">
            {shown.length} 件　平均 {avg} 点（100点換算）
          </p>
        )}
      </div>

      {error && <p className="text-sm text-[#a8321b] mt-6">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#6B6B6B] mt-6">読み込み中…</p>
      ) : shown.length === 0 && !error ? (
        <p className="text-sm text-[#6B6B6B] mt-6">
          まだ記録がありません。解答解説ボードの最後のスライドで「EPIQに送る」を押すと、ここに記録されます。
        </p>
      ) : (
        <div className="overflow-x-auto mt-6 border border-[#E3E2DE] rounded-xl bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#6B6B6B] border-b border-[#E3E2DE]">
                <th className="px-4 py-3 font-medium">日時</th>
                {viewAll && <th className="px-4 py-3 font-medium">生徒</th>}
                <th className="px-4 py-3 font-medium">演習</th>
                <th className="px-4 py-3 font-medium text-right">得点</th>
                <th className="px-4 py-3 font-medium text-right">解答</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const def = EXAMS[r.exam_id];
                const isOpen = open === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr className="border-b border-[#F1F1EF] last:border-0">
                      <td className="px-4 py-3 text-[#6B6B6B] tabular-nums whitespace-nowrap">{fmt(r.taken_at || r.created_at)}</td>
                      {viewAll && <td className="px-4 py-3 text-[#37352F] whitespace-nowrap">{r.student_name}</td>}
                      <td className="px-4 py-3 text-[#37352F]">{r.exam_title}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#37352F] tabular-nums whitespace-nowrap">
                        {r.score}<span className="text-xs font-normal text-[#9B9A97]"> / {r.max_score}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#6B6B6B] tabular-nums whitespace-nowrap">{r.answered} / {r.total}</td>
                      <td className="px-4 py-3 text-right">
                        {def && (
                          <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : r.id)}
                            className="text-xs font-medium text-[#6C5CE7] whitespace-nowrap"
                            aria-expanded={isOpen}
                          >
                            {isOpen ? "閉じる" : "設問別"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isOpen && def && (
                      <tr className="border-b border-[#F1F1EF] bg-[#F7F6F3]">
                        <td colSpan={viewAll ? 6 : 5} className="px-4 py-3">
                          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-1.5">
                            {def.questions.map((q) => {
                              const m = r.marks?.[q.key];
                              return (
                                <span
                                  key={q.key}
                                  className={`text-xs rounded-md px-2 py-1.5 border tabular-nums bg-white ${
                                    m === undefined ? "border-[#E3E2DE] text-[#9B9A97]" : m ? "border-[#22825a] text-[#1d6b4a]" : "border-[#cf3f22] text-[#a8321b]"
                                  }`}
                                >
                                  {q.label} {m === undefined ? "—" : m ? "○" : "×"}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
