"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { DocType } from "@/types/essay";
import { DOC_TYPES } from "@/types/essay";
import { DOC_TYPE_CONFIG, measureLength, lengthLabel } from "@/lib/essay/rubrics";

const ACCENT = "#1F4E79";

export default function EssayNewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStaff = user?.role === "teacher" || user?.role === "admin";

  const [docType, setDocType] = useState<DocType | null>(null);
  const [theme, setTheme] = useState("");
  const [text, setText] = useState("");
  const [grade, setGrade] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const cfg = docType ? DOC_TYPE_CONFIG[docType] : null;
  const length = useMemo(
    () => (cfg ? measureLength(text, cfg.lengthUnit) : 0),
    [text, cfg]
  );
  const tooLong = !!cfg && length > cfg.maxLength;
  const canSubmit = !!docType && theme.trim() && text.trim() && !tooLong && !loading;

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
            sessionStorage.setItem("essayResult", JSON.stringify(data));
            router.push(data.id ? `/essay-result/${data.id}` : "/essay-result/local");
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
    setLoading(true);
    setError("");
    setProgress("送信しています...");
    try {
      const res = await fetch("/api/essay/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType, theme, text, grade, studentName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "添削に失敗しました");
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

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#37352F]">
            エッセイ・志望理由書・作文の添削
          </h1>
          <p className="text-[#6B6B6B] mt-2 text-sm">
            書いた文章を貼り付けると、観点別の評価・添削・書き直し例・アドバイスが届きます。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ① 書類タイプ */}
          <section>
            <h2 className="text-sm font-semibold text-[#37352F] mb-3">① 何を添削しますか？</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DOC_TYPES.map((t) => {
                const c = DOC_TYPE_CONFIG[t];
                const selected = docType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocType(t)}
                    disabled={loading}
                    className={`text-left rounded-xl border-2 p-4 transition-colors ${
                      selected ? "bg-[#EEF4FA]" : "border-[#E3E2DE] hover:border-[#BFD3E6]"
                    }`}
                    style={selected ? { borderColor: ACCENT } : undefined}
                    aria-pressed={selected}
                  >
                    <p className="font-semibold text-[#37352F]">{c.label}</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">{c.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {cfg && (
            <>
              {/* ② 設問 */}
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-[#37352F]">② 設問・テーマ</h2>
                <textarea
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  rows={2}
                  maxLength={500}
                  disabled={loading}
                  placeholder={
                    docType === "english_essay"
                      ? "例: Do you agree that students should have part-time jobs? (120-150 words)"
                      : docType === "jp_personal_statement"
                        ? "例: 本校を志望する理由と、入学後に取り組みたいことを600字以内で書きなさい。"
                        : "例: 「挑戦」をテーマに、自分の体験をふまえて800字以内で書きなさい。"
                  }
                  className="w-full rounded-lg border border-[#E3E2DE] px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
                />
                <p className="text-xs text-[#9B9A97]">
                  字数・語数の指定があれば、それも書いてください。
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  {isStaff && (
                    <input
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      maxLength={50}
                      disabled={loading}
                      placeholder={`生徒名（空欄なら ${user?.name ?? ""}）`}
                      className="flex-1 rounded-lg border border-[#E3E2DE] px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
                    />
                  )}
                  <input
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    maxLength={20}
                    disabled={loading}
                    placeholder="学年（任意。例: 中3）"
                    className="sm:w-48 rounded-lg border border-[#E3E2DE] px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
                  />
                </div>
              </section>

              {/* ③ 本文 */}
              <section>
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[#37352F]">③ 本文</h2>
                  <span className={`text-xs ${tooLong ? "text-[#C62828] font-semibold" : "text-[#9B9A97]"}`}>
                    {length} / {cfg.maxLength}
                    {lengthLabel(cfg.lengthUnit)}
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={14}
                  disabled={loading}
                  placeholder={
                    docType === "english_essay"
                      ? "Write or paste your essay here."
                      : "ここに文章を貼り付けてください。"
                  }
                  className={`w-full rounded-lg border border-[#E3E2DE] px-3 py-2 text-sm leading-relaxed focus:outline-none focus:border-[#1F4E79] ${
                    docType === "english_essay" ? "font-serif" : ""
                  }`}
                />
                {tooLong && (
                  <p className="text-xs text-[#C62828] mt-1">
                    {cfg.label}は{cfg.maxLength}
                    {lengthLabel(cfg.lengthUnit)}までです。
                  </p>
                )}
              </section>

              {error && (
                <div className="rounded-lg border border-[#F3C3BF] bg-[#FDECEA] p-3 text-sm text-[#B3261E]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-lg py-3 text-white font-semibold transition-opacity disabled:opacity-40"
                style={{ backgroundColor: ACCENT }}
              >
                {loading ? progress || "添削しています..." : "添削する"}
              </button>
              {loading && (
                <p className="text-xs text-center text-[#9B9A97]">
                  画面を閉じずにお待ちください。
                </p>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
