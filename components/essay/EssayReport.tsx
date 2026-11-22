import type { EssayRecord, Rating, Strength, VocabUpgrade, UsefulPattern } from "@/types/essay";
import { DOC_TYPE_CONFIG } from "@/lib/essay/rubrics";

/**
 * 添削レポート（本人向け）。
 * 配色: 原文=赤＋取り消し線 / 修正=緑 / 見出しアクセント=#1F4E79 / 練習メニュー=薄い黄色
 */

const ACCENT = "#1F4E79";

const RATING_STYLE: Record<Rating, { className: string; label: string }> = {
  "◎": { className: "bg-[#E6F4EA] text-[#1E7B34] border-[#B7DFC2]", label: "よくできている" },
  "○": { className: "bg-[#E8F0F8] text-[#1F4E79] border-[#BFD3E6]", label: "あと一歩" },
  "△": { className: "bg-[#FDECEA] text-[#B3261E] border-[#F3C3BF]", label: "要改善" },
};

function SectionTitle({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <h2
      className="flex items-center gap-3 text-lg font-semibold mb-4 pb-2 border-b-2"
      style={{ color: ACCENT, borderColor: ACCENT }}
    >
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm shrink-0"
        style={{ backgroundColor: ACCENT }}
      >
        {num}
      </span>
      {children}
    </h2>
  );
}

/** 書き直し例の【…】（本人が埋める空欄）を目立たせる */
function WithBlanks({ text }: { text: string }) {
  return (
    <>
      {text.split(/(【[^】]*】)/).map((part, i) =>
        part.startsWith("【") ? (
          <span key={i} className="bg-[#FFF3B0] text-[#7A5B00] font-sans text-sm px-1 rounded">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function EssayReport({ record }: { record: EssayRecord }) {
  const { feedback } = record;
  const cfg = DOC_TYPE_CONFIG[record.doc_type];
  const isEnglish = record.doc_type === "english_essay";

  return (
    <article className="essay-report text-[#2B2B2B] leading-relaxed">
      {/* ヘッダー */}
      <header className="mb-8">
        <p className="text-sm font-medium" style={{ color: ACCENT }}>
          {cfg.label} 添削レポート
        </p>
        <h1 className="text-2xl font-bold mt-1 text-[#1A1A1A]">{record.theme}</h1>
        <p className="text-sm text-[#6B6B6B] mt-2">
          {record.student_name}
          {record.grade ? `（${record.grade}）` : ""}
          {record.created_at ? `　${formatDate(record.created_at)}` : ""}
        </p>
      </header>

      {/* 1. 総評 */}
      <section className="mb-10 break-inside-avoid">
        <SectionTitle num={1}>総評</SectionTitle>
        <div className="space-y-3">
          {feedback.overall.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* 2. 観点別評価 */}
      <section className="mb-10">
        <SectionTitle num={2}>観点別評価</SectionTitle>
        <p className="text-xs text-[#6B6B6B] mb-3">
          ◎ よくできている　○ おおむね良い、あと一歩　△ 要改善
        </p>
        <div className="border border-[#D9D9D9] rounded-lg overflow-hidden">
          {feedback.evaluation.map((e, i) => {
            const style = RATING_STYLE[e.rating];
            return (
              <div
                key={i}
                className={`flex gap-4 p-4 break-inside-avoid ${i > 0 ? "border-t border-[#E5E5E5]" : ""}`}
              >
                <div className="w-36 shrink-0">
                  <p className="font-semibold text-sm">{e.criterion}</p>
                  <span
                    className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded border text-sm font-bold ${style.className}`}
                    title={style.label}
                  >
                    {e.rating}
                  </span>
                </div>
                <p className="text-sm">{e.comment}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2.5 この答案の強み */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <section className="mb-10">
          <h2
            className="flex items-center gap-3 text-lg font-semibold mb-4 pb-2 border-b-2"
            style={{ color: "#2E7D32", borderColor: "#2E7D32" }}
          >
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm shrink-0"
              style={{ backgroundColor: "#2E7D32" }}
            >
              ★
            </span>
            この答案の強み
          </h2>
          <div className="space-y-3">
            {feedback.strengths.map((s, i) => (
              <div key={i} className="border border-[#B7DFC2] bg-[#F0F9F2] rounded-lg p-4 break-inside-avoid">
                <p className="font-semibold text-[#1E7B34] mb-2">{s.point}</p>
                <p className={`text-sm border-l-3 border-[#2E7D32] pl-3 mb-2 ${isEnglish ? "font-serif" : ""}`}>
                  「{s.quote}」
                </p>
                <p className="text-sm text-[#4A4A4A]">{s.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. 添削ポイント */}
      <section className="mb-10">
        <SectionTitle num={3}>添削ポイント</SectionTitle>
        <ol className="space-y-4">
          {feedback.corrections.map((c, i) => (
            <li key={i} className="border border-[#E5E5E5] rounded-lg p-4 break-inside-avoid">
              <p className="font-semibold mb-2" style={{ color: ACCENT }}>
                {i + 1}. {c.label}
              </p>
              <div className={`space-y-1 mb-3 ${isEnglish ? "font-serif" : ""}`}>
                <p>
                  <span className="text-xs text-[#6B6B6B] mr-2">原文</span>
                  <span className={`text-[#C62828] ${c.strike ? "line-through decoration-2" : ""}`}>
                    {c.original}
                  </span>
                </p>
                <p>
                  <span className="text-xs text-[#6B6B6B] mr-2">修正</span>
                  <span className="text-[#2E7D32] font-semibold">{c.fix}</span>
                </p>
              </div>
              <p className="text-sm bg-[#F7F7F7] rounded p-3">{c.point}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 3.5 語彙アップグレード */}
      {feedback.vocabUpgrades && feedback.vocabUpgrades.length > 0 && (
        <section className="mb-10">
          <h2
            className="flex items-center gap-3 text-lg font-semibold mb-4 pb-2 border-b-2"
            style={{ color: "#7B1FA2", borderColor: "#7B1FA2" }}
          >
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm shrink-0"
              style={{ backgroundColor: "#7B1FA2" }}
            >
              ↑
            </span>
            語彙アップグレード
          </h2>
          <div className="border border-[#D9D9D9] rounded-lg overflow-hidden">
            {feedback.vocabUpgrades.map((v, i) => (
              <div key={i} className={`p-4 break-inside-avoid ${i > 0 ? "border-t border-[#E5E5E5]" : ""}`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`bg-[#FFF3E8] text-[#E67E22] px-2 py-0.5 rounded text-sm font-medium ${isEnglish ? "font-serif" : ""}`}>
                    {v.original}
                  </span>
                  <span className="text-[#9B9A97]">→</span>
                  <span className={`bg-[#F3E5F5] text-[#7B1FA2] px-2 py-0.5 rounded text-sm font-bold ${isEnglish ? "font-serif" : ""}`}>
                    {v.upgrade}
                  </span>
                </div>
                <p className={`text-sm text-[#4A4A4A] mb-1 ${isEnglish ? "font-serif" : ""}`}>
                  <span className="text-xs text-[#6B6B6B] mr-1">例文:</span>{v.example}
                </p>
                <p className="text-xs text-[#6B6B6B]">{v.why}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. 模範解答 */}
      <section className="mb-10">
        <SectionTitle num={4}>模範解答（書き直し例）</SectionTitle>
        <p className="text-xs text-[#6B6B6B] mb-3">
          ※{feedback.modelAnswer.note}
          {feedback.modelAnswer.paragraphs.some((p) => p.includes("【")) &&
            " 黄色の【　】は、あなた自身の体験や考えで埋めてください。"}
        </p>
        <div
          className={`border-l-4 pl-4 space-y-3 ${isEnglish ? "font-serif" : ""}`}
          style={{ borderColor: ACCENT }}
        >
          {feedback.modelAnswer.paragraphs.map((p, i) => (
            <p key={i} className={isEnglish ? "" : "indent-[1em]"}>
              <WithBlanks text={p} />
            </p>
          ))}
        </div>
      </section>

      {/* 4.5 使える表現パターン集 */}
      {feedback.usefulPatterns && feedback.usefulPatterns.length > 0 && (
        <section className="mb-10">
          <h2
            className="flex items-center gap-3 text-lg font-semibold mb-4 pb-2 border-b-2"
            style={{ color: "#0277BD", borderColor: "#0277BD" }}
          >
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm shrink-0"
              style={{ backgroundColor: "#0277BD" }}
            >
              ✎
            </span>
            使える表現パターン集
          </h2>
          <div className="space-y-3">
            {feedback.usefulPatterns.map((p, i) => (
              <div key={i} className="border border-[#B3D9EA] bg-[#E8F4FD] rounded-lg p-4 break-inside-avoid">
                <p className="font-semibold text-[#0277BD] mb-2">{p.label}</p>
                <p className={`text-sm bg-white rounded px-3 py-2 mb-2 border border-[#D0E8F2] font-medium ${isEnglish ? "font-serif" : ""}`}>
                  {p.template}
                </p>
                <p className={`text-sm text-[#4A4A4A] ${isEnglish ? "font-serif" : ""}`}>
                  <span className="text-xs text-[#6B6B6B] mr-1">使用例:</span>{p.example}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. アドバイス */}
      <section className="mb-10">
        <SectionTitle num={5}>次に向けてのアドバイス</SectionTitle>
        <div className="space-y-5">
          {feedback.advice.map((a, i) => (
            <div key={i} className="break-inside-avoid">
              <h3 className="font-semibold mb-2">▶ {a.head}</h3>
              <div className="space-y-2 text-sm">
                {a.body.map((b, j) => (
                  <p key={j}>{b}</p>
                ))}
              </div>
              {a.drill && (
                <div className="mt-3 bg-[#FFF8DC] border border-[#F0E0A0] rounded-lg p-3 text-sm">
                  <span className="font-semibold">練習メニュー：</span>
                  {a.drill}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* スコア予測 */}
      {feedback.scoreEstimate && (
        <section className="mb-10 break-inside-avoid">
          <h2
            className="flex items-center gap-3 text-lg font-semibold mb-4 pb-2 border-b-2"
            style={{ color: "#E65100", borderColor: "#E65100" }}
          >
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm shrink-0"
              style={{ backgroundColor: "#E65100" }}
            >
              📊
            </span>
            スコア予測
          </h2>
          <div className="bg-gradient-to-r from-[#FFF3E0] to-[#FBE9E7] border border-[#FFCC80] rounded-lg p-5">
            <p className="text-2xl font-bold text-[#E65100] mb-2">{feedback.scoreEstimate.score}</p>
            <p className="text-sm text-[#5D4037]">{feedback.scoreEstimate.note}</p>
          </div>
        </section>
      )}

      {/* 締め */}
      <p
        className="text-center font-semibold py-4 border-t border-b break-inside-avoid"
        style={{ color: ACCENT, borderColor: "#D9D9D9" }}
      >
        {feedback.closing}
      </p>

      {/* 提出した本文 */}
      <details className="mt-10 print:hidden">
        <summary className="cursor-pointer text-sm text-[#6B6B6B]">提出した本文を見る</summary>
        <pre
          className={`mt-3 whitespace-pre-wrap text-sm bg-[#F7F7F7] rounded-lg p-4 ${isEnglish ? "font-serif" : "font-sans"}`}
        >
          {record.original_text}
        </pre>
      </details>
    </article>
  );
}
