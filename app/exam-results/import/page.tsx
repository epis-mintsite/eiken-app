"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { EXAMS, PENDING_KEY, decodePayload, grade, type ImportPayload } from "@/lib/exam-results/catalog";

type State =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "ready"; payload: ImportPayload }
  | { kind: "saving"; payload: ImportPayload }
  | { kind: "saved"; payload: ImportPayload; score: number; maxScore: number }
  | { kind: "error"; payload: ImportPayload; message: string };

function readPending(): ImportPayload | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && p.v === 1 && EXAMS[p.exam] ? (p as ImportPayload) : null;
  } catch {
    return null;
  }
}
function writePending(p: ImportPayload | null) {
  try {
    if (p) localStorage.setItem(PENDING_KEY, JSON.stringify(p));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // 保存できない端末では、ログイン後にボードからもう一度送ってもらう
  }
}

export default function ExamResultImportPage() {
  const { user, loading } = useAuth();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    // URL の #d=… はブラウザでしか読めないため、表示後に一度だけ取り込む
    const fromHash = decodePayload(window.location.hash);
    if (fromHash) {
      writePending(fromHash);
      // 解答が URL に残らないよう、取り込んだら消す
      history.replaceState(null, "", window.location.pathname);
    }
    const p = fromHash ?? readPending();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(p ? { kind: "ready", payload: p } : { kind: "none" });
  }, []);

  async function save(payload: ImportPayload) {
    setState({ kind: "saving", payload });
    try {
      const res = await fetch("/api/exam-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: payload.exam, answers: payload.answers, takenAt: payload.at }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "記録できませんでした");
      writePending(null);
      setState({ kind: "saved", payload, score: body.score, maxScore: body.maxScore });
    } catch (err) {
      setState({ kind: "error", payload, message: err instanceof Error ? err.message : "記録できませんでした" });
    }
  }

  if (state.kind === "loading" || loading) {
    return <main className="max-w-[720px] mx-auto px-6 py-16 text-sm text-[#6B6B6B]">読み込み中…</main>;
  }

  if (state.kind === "none") {
    return (
      <main className="max-w-[720px] mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-[#37352F] mb-3">演習結果の取り込み</h1>
        <p className="text-sm text-[#6B6B6B] leading-relaxed">
          取り込む結果が見つかりませんでした。解答解説ボードの最後のスライドで「EPIQに送る」を押すと、ここに結果が届きます。
        </p>
        <Link href="/exam-results" className="inline-block mt-6 text-sm font-medium text-[#6C5CE7]">演習結果の一覧へ</Link>
      </main>
    );
  }

  const { payload } = state;
  const exam = EXAMS[payload.exam];
  const g = grade(exam, payload.answers);

  return (
    <main className="max-w-[720px] mx-auto px-6 py-12">
      <p className="text-xs text-[#9B9A97] mb-1">演習結果の取り込み</p>
      <h1 className="text-2xl font-bold text-[#37352F]">{exam.title}</h1>
      <p className="text-sm text-[#6B6B6B] mt-1">{exam.source}</p>

      <div className="mt-6 border border-[#E3E2DE] rounded-xl p-5 bg-white">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-[#37352F] tabular-nums">{g.score}</span>
          <span className="text-sm text-[#6B6B6B]">/ {g.maxScore} 点　（解答 {g.answered} / {g.total} 問）</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-4">
          {exam.questions.map((question) => {
            const m = g.marks[question.key];
            return (
              <span
                key={question.key}
                className={`text-xs rounded-md px-2 py-1.5 border tabular-nums ${
                  m === undefined ? "border-[#E3E2DE] text-[#9B9A97]" : m ? "border-[#22825a] bg-[#dcf1e6] text-[#1d6b4a]" : "border-[#cf3f22] bg-[#fbe5df] text-[#a8321b]"
                }`}
              >
                {question.label} {m === undefined ? "—" : m ? "○" : "×"}
              </span>
            );
          })}
        </div>
        {payload.at && (
          <p className="text-xs text-[#9B9A97] mt-3">解いた日時：{new Date(payload.at).toLocaleString("ja-JP")}</p>
        )}
      </div>

      {!user ? (
        <div className="mt-6">
          <p className="text-sm text-[#37352F] leading-relaxed">
            記録するには EPIQ にログインしてください。ログインすると、この画面に戻って記録できます。
          </p>
          <a href="/login" className="inline-block mt-4 bg-[#6C5CE7] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90">
            ログインして記録する
          </a>
        </div>
      ) : state.kind === "saved" ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-[#1d6b4a]">
            {user.name} さんの結果として記録しました（{state.score} / {state.maxScore} 点）。
          </p>
          <Link href="/exam-results" className="inline-block mt-4 bg-[#37352F] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90">
            演習結果の一覧を見る
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-sm text-[#37352F]">
            <span className="font-medium">{user.name}</span> さんの結果として記録します。
          </p>
          {state.kind === "error" && <p className="text-sm text-[#a8321b] mt-2">{state.message}</p>}
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              onClick={() => save(payload)}
              disabled={state.kind === "saving"}
              className="bg-[#6C5CE7] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {state.kind === "saving" ? "記録しています…" : "EPIQに記録する"}
            </button>
            <button
              type="button"
              onClick={() => { writePending(null); setState({ kind: "none" }); }}
              className="text-sm font-medium text-[#6B6B6B] hover:text-[#37352F] px-2"
            >
              記録しない
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
