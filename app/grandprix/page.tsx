"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { Division, FeedbackLang, GPDraft, GPStatus } from "@/types/grandprix";
import { DIVISIONS } from "@/types/grandprix";
import { DIVISION_RULES, GP_RESTORE_KEY, GP_THEME, GP_TITLE, SUMMARY_MAX_WORDS, THEME_ELEMENTS } from "@/lib/grandprix/rubric";
import { bodyLength, checkFormat, COUNTING_NOTE, countWords, isTooShort, unitLabel } from "@/lib/grandprix/format";

const ACCENT = "#1F4E79";
const DRAFT_KEY = "gp-draft-v1";

const EMPTY: GPDraft = {
  division: "JC",
  knock: "",
  country: "",
  title: "",
  summary: "",
  body: "",
  grade: "",
  feedbackLang: "ja",
};

function draftKey(userId: string | undefined) {
  return `${DRAFT_KEY}:${userId ?? "anon"}`;
}

function parseDraft(raw: string | null): GPDraft | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object" || !DIVISIONS.includes(v.division)) return null;
    return { ...EMPTY, ...v };
  } catch {
    return null;
  }
}

export default function GrandprixPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [draft, setDraft] = useState<GPDraft>(EMPTY);
  const [restored, setRestored] = useState(false);
  const [status, setStatus] = useState<GPStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  // 下書きの復元（結果画面から戻ったとき → この端末に残っている下書き の順）
  useEffect(() => {
    if (!user) return;
    let next: GPDraft | null = null;
    try {
      next = parseDraft(sessionStorage.getItem(GP_RESTORE_KEY));
      sessionStorage.removeItem(GP_RESTORE_KEY);
    } catch {}
    if (!next) {
      try {
        next = parseDraft(localStorage.getItem(draftKey(user.id)));
      } catch {}
    }
    // ブラウザの保存領域はマウント後にしか読めないため、表示後に一度だけ反映する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (next) setDraft(next);
    setRestored(true);
  }, [user]);

  // 入力のたびに端末へ保存
  useEffect(() => {
    if (!restored || !user) return;
    try {
      localStorage.setItem(draftKey(user.id), JSON.stringify(draft));
    } catch {}
  }, [draft, restored, user]);

  useEffect(() => {
    fetch("/api/grandprix/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setStatus(s))
      .catch(() => {});
  }, []);

  const rule = DIVISION_RULES[draft.division];
  const unit = unitLabel(draft.division);
  const length = useMemo(() => bodyLength(draft.division, draft.body), [draft.division, draft.body]);
  const summaryWords = useMemo(() => countWords(draft.summary), [draft.summary]);
  const format = useMemo(() => checkFormat(draft), [draft]);
  const tooLong = length > rule.bodyHardMax;
  const closed = status !== null && !status.open;
  const usedUp = status?.limit != null && status.used >= status.limit;
  const required = !!(draft.knock.trim() && draft.title.trim() && draft.summary.trim() && draft.body.trim());
  const canSubmit = required && !tooLong && !loading && !closed && !usedUp;

  function set<K extends keyof GPDraft>(key: K, value: GPDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key === "body" || key === "division") setShowGuide(false);
  }

  async function readStream(res: Response) {
    const reader = res.body?.getReader();
    if (!reader) throw new Error("ストリーミングに対応していません");
    const decoder = new TextDecoder();
    let buffer = "";
    let eventType = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7);
        } else if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          if (eventType === "status") setProgress(data.message);
          if (eventType === "error") throw new Error(data.message);
          if (eventType === "result") {
            sessionStorage.setItem("gpResult", JSON.stringify(data));
            router.push(data.id ? `/grandprix/result/${data.id}` : "/grandprix/result/local");
            return;
          }
        }
      }
    }
    throw new TypeError("通信が中断されました");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    if (isTooShort(draft.division, draft.body)) {
      setShowGuide(true);
      return;
    }
    setLoading(true);
    setError("");
    setProgress("送信しています...");
    try {
      const res = await fetch("/api/grandprix/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "チェックに失敗しました");
      }
      await readStream(res);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "通信が中断されました。少し待ってから「履歴」を開くと、結果が保存されている場合があります。"
          : err instanceof Error
            ? err.message
            : "エラーが発生しました"
      );
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[#E3E2DE] px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79] disabled:bg-[#F7F7F5]";

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium" style={{ color: ACCENT }}>{GP_TITLE}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#37352F] mt-1">下書きチェック</h1>
          <p className="text-[#6B6B6B] mt-2 text-sm">
            提出する前に、下書きの形式と審査の観点をチェックします。AIは代わりに書かず、直すためのヒントを返します。
          </p>
        </div>

        {status && (
          <div
            className={`mb-6 rounded-lg p-3 text-sm ${
              closed || usedUp ? "border border-[#F3C3BF] bg-[#FDECEA] text-[#B3261E]" : "bg-[#EEF4FA] text-[#1F4E79]"
            }`}
          >
            {closed
              ? status.message
              : status.limit == null
                ? "講師・管理者は期間外でも使えます（回数の上限なし）。"
                : usedUp
                  ? `今日のチェックは${status.limit}回までです。また明日挑戦してください。`
                  : `今日はあと ${status.limit - status.used} 回チェックできます（1日${status.limit}回まで）。`}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 部門 */}
          <section>
            <h2 className="text-sm font-semibold text-[#37352F] mb-1">① 部門</h2>
            <p className="text-xs text-[#9B9A97] mb-3">どちらを選ぶかは自由です。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DIVISIONS.map((d: Division) => {
                const r = DIVISION_RULES[d];
                const selected = draft.division === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set("division", d)}
                    disabled={loading}
                    aria-pressed={selected}
                    className={`text-left rounded-xl border-2 p-4 transition-colors ${
                      selected ? "bg-[#EEF4FA]" : "border-[#E3E2DE] hover:border-[#BFD3E6]"
                    }`}
                    style={selected ? { borderColor: ACCENT } : undefined}
                  >
                    <p className="font-semibold text-[#37352F]">{r.label}</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      タイトル {r.titleLang === "ja" ? "日本語" : "英語"}／要旨 英語{SUMMARY_MAX_WORDS}語以内／本文{" "}
                      {r.titleLang === "ja" ? "日本語" : "英語"}
                      {r.bodyMin}〜{r.bodyMax}
                      {r.bodyUnit === "chars" ? "字" : "語"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ノックと国 */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[#37352F]">② 選んだ100本ノックと今いる国</h2>
            <input
              value={draft.knock}
              onChange={(e) => set("knock", e.target.value)}
              maxLength={200}
              disabled={loading}
              placeholder="選んだ100本ノック（番号とタイトル。例: 041. Marine Plastic Pollution）"
              aria-label="選んだ100本ノック"
              className={inputCls}
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={draft.country}
                onChange={(e) => set("country", e.target.value)}
                maxLength={100}
                disabled={loading}
                placeholder="今いる国・都市（例: 中国・深圳）"
                aria-label="今いる国・都市"
                className={`${inputCls} flex-1`}
              />
              <input
                value={draft.grade}
                onChange={(e) => set("grade", e.target.value)}
                maxLength={20}
                disabled={loading}
                placeholder="学年（任意。例: 中2）"
                aria-label="学年"
                className={`${inputCls} sm:w-44`}
              />
            </div>
            <p className="text-xs text-[#9B9A97]">テーマ: 「{GP_THEME}」</p>
          </section>

          {/* タイトル・要旨・本文 */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#37352F]">③ タイトル・要旨・本文</h2>

            <div className="space-y-1">
              <label htmlFor="gp-title" className="text-xs font-semibold text-[#37352F]">
                タイトル（{rule.titleLang === "ja" ? "日本語" : "英語"}）
              </label>
              <input
                id="gp-title"
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={200}
                disabled={loading}
                className={`${inputCls} ${draft.division === "GC" ? "font-serif" : ""}`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-baseline gap-2">
                <label htmlFor="gp-summary" className="text-xs font-semibold text-[#37352F]">
                  要旨（英語・{SUMMARY_MAX_WORDS}語以内）
                </label>
                <span className={`text-xs ${summaryWords > SUMMARY_MAX_WORDS ? "text-[#C62828] font-semibold" : "text-[#9B9A97]"}`}>
                  {summaryWords} / {SUMMARY_MAX_WORDS}語
                </span>
              </div>
              <textarea
                id="gp-summary"
                value={draft.summary}
                onChange={(e) => set("summary", e.target.value)}
                rows={3}
                maxLength={1500}
                disabled={loading}
                className={`${inputCls} font-serif leading-relaxed`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-baseline gap-2">
                <label htmlFor="gp-body" className="text-xs font-semibold text-[#37352F]">
                  本文（{rule.titleLang === "ja" ? "日本語" : "英語"}・{rule.bodyMin}〜{rule.bodyMax}
                  {unit}）
                </label>
                <span
                  className={`text-xs ${
                    length > 0 && (length < rule.bodyMin || length > rule.bodyMax)
                      ? "text-[#C62828] font-semibold"
                      : "text-[#9B9A97]"
                  }`}
                >
                  {length}
                  {unit}（{rule.bodyMin}〜{rule.bodyMax}）
                </span>
              </div>
              <textarea
                id="gp-body"
                value={draft.body}
                onChange={(e) => set("body", e.target.value)}
                rows={16}
                disabled={loading}
                lang={draft.division === "GC" ? "en" : "ja"}
                className={`${inputCls} leading-relaxed ${draft.division === "GC" ? "font-serif" : ""}`}
              />
              {tooLong && (
                <p className="text-xs text-[#C62828]">
                  本文が長すぎてチェックできません（{rule.bodyHardMax}
                  {unit}まで）。
                </p>
              )}
              <p className="text-xs text-[#9B9A97]">数え方: {COUNTING_NOTE}</p>
            </div>
          </section>

          {/* 形式チェック（その場で） */}
          <section className="rounded-xl border border-[#E3E2DE] p-4">
            <h2 className="text-sm font-semibold text-[#37352F] mb-2">形式チェック</h2>
            <ul className="space-y-1">
              {format.map((f) => (
                <li key={f.key} className="flex items-start gap-2 text-sm">
                  <span
                    className={`mt-0.5 inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      f.ok ? "bg-[#E6F4EA] text-[#1E7B34]" : "bg-[#F1F1EF] text-[#9B9A97]"
                    }`}
                    aria-label={f.ok ? "OK" : "まだ"}
                  >
                    {f.ok ? "✓" : "・"}
                  </span>
                  <span className={f.ok ? "text-[#37352F]" : "text-[#6B6B6B]"}>
                    {f.label}
                    {f.detail && <span className="text-[#9B9A97]">　{f.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-[#9B9A97] mt-2">形式が合っていなくてもチェックはできます。結果のいちばん上に出ます。</p>
          </section>

          {/* フィードバックの言語 */}
          <section className="flex items-center gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-[#37352F]">フィードバックの言語</h2>
            <div className="inline-flex rounded-lg border border-[#E3E2DE] overflow-hidden text-sm" role="group" aria-label="フィードバックの言語">
              {([
                ["ja", "日本語"],
                ["en", "English"],
              ] as [FeedbackLang, string][]).map(([l, label]) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => set("feedbackLang", l)}
                  disabled={loading}
                  aria-pressed={draft.feedbackLang === l}
                  className={`px-3 py-1.5 ${draft.feedbackLang === l ? "bg-[#EEF4FA] font-semibold" : "bg-white text-[#6B6B6B]"}`}
                  style={draft.feedbackLang === l ? { color: ACCENT } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {showGuide && (
            <div className="rounded-xl bg-[#FFF8DC] border border-[#F0E0A0] p-4 space-y-3 text-sm">
              <p className="font-semibold">まず書き進めよう</p>
              <p>
                本文がまだ{length}
                {unit}です（AIのチェックは{rule.bodyTooShort}
                {unit}から）。この3つの要素がそろうように書き足してみましょう。回数には数えていません。
              </p>
              <ul className="space-y-1">
                {Object.values(THEME_ELEMENTS).map((el) => (
                  <li key={el.label}>
                    <b>{el.label}</b>：{el.description}
                  </li>
                ))}
              </ul>
              <p>
                <b>型の目安</b>：{rule.structure}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-[#F3C3BF] bg-[#FDECEA] p-3 text-sm text-[#B3261E]">{error}</div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg py-3 text-white font-semibold transition-opacity disabled:opacity-40"
            style={{ backgroundColor: ACCENT }}
          >
            {loading ? progress || "チェックしています..." : "チェックする"}
          </button>
          {loading ? (
            <p className="text-xs text-center text-[#9B9A97]">画面を閉じずにお待ちください。</p>
          ) : (
            <p className="text-xs text-center text-[#9B9A97]">
              入力した下書きは、この端末のブラウザに自動で残ります。チェックした文章と結果は保存され、先生も読めます。
            </p>
          )}
        </form>

        <div className="mt-10 pt-6 border-t border-[#E3E2DE] text-sm flex flex-wrap gap-x-6 gap-y-2 justify-between">
          <Link href="/history?tab=grandprix" className="text-[#2383E2] hover:underline">
            これまでのチェックを見る
          </Link>
          <span className="text-xs text-[#9B9A97]">
            これはAIによるチェックです。最終的な審査は先生たちが行います。応募は応募フォームから。
          </span>
        </div>
      </div>
    </div>
  );
}
