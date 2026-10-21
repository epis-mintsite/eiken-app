import type { GPRecord, Rating } from "@/types/grandprix";
import { DIVISION_RULES, GP_CRITERIA, GP_TITLE, THEME_ELEMENTS } from "@/lib/grandprix/rubric";
import { checkFormat } from "@/lib/grandprix/format";

/**
 * グランプリ下書きチェックの結果（本人向け）。配色は components/essay/EssayReport.tsx に揃える。
 * 原文=赤＋取り消し線 / 修正=緑 / アクセント=#1F4E79 / ヒント枠=薄い黄色
 */

const ACCENT = "#1F4E79";

const RATING_STYLE: Record<Rating, string> = {
  "◎": "bg-[#E6F4EA] text-[#1E7B34] border-[#B7DFC2]",
  "○": "bg-[#E8F0F8] text-[#1F4E79] border-[#BFD3E6]",
  "△": "bg-[#FDECEA] text-[#B3261E] border-[#F3C3BF]",
};

const LABELS = {
  ja: {
    report: "下書きチェックの結果",
    format: "形式チェック",
    formatNote: "字数・語数・言語はプログラムで判定しています。",
    strengths: "よいところ",
    link: "3つの要素のつながり",
    criteria: "審査の観点ごとの評価",
    hint: "ヒント",
    epis: "エピスらしさ",
    episFound: "本文から読み取れた教育方針",
    episNone: "本文からはまだはっきり読み取れませんでした。",
    episMore: "もう一つ出せそうな方針",
    fixes: "言葉の直し",
    fixesNone: "目立つ誤字・文法の誤りはありませんでした。",
    original: "原文",
    fix: "修正",
    next: "次にやること",
    legend: "◎ よくできている　○ おおむね良い、あと一歩　△ ここを直すと良くなる",
    disclaimer: "これはAIによるチェックです。最終的な審査は先生たちが行います。",
    draft: "チェックした下書きを見る",
  },
  en: {
    report: "Draft check",
    format: "Format check",
    formatNote: "Length and language are checked by the program.",
    strengths: "What works well",
    link: "The three elements",
    criteria: "Feedback by judging criteria",
    hint: "Hint",
    epis: "The epis spirit",
    episFound: "Policies found in your essay",
    episNone: "We could not clearly find one yet.",
    episMore: "One more you could show",
    fixes: "Language fixes",
    fixesNone: "No clear spelling or grammar mistakes were found.",
    original: "Original",
    fix: "Fix",
    next: "Next steps",
    legend: "◎ Well done　○ Almost there　△ Improve this",
    disclaimer: "This is a check by AI. The final judging is done by your teachers.",
    draft: "See the draft you checked",
  },
} as const;

function SectionTitle({ mark, children }: { mark: string; children: React.ReactNode }) {
  return (
    <h2
      className="flex items-center gap-3 text-lg font-semibold mb-4 pb-2 border-b-2"
      style={{ color: ACCENT, borderColor: ACCENT }}
    >
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm shrink-0"
        style={{ backgroundColor: ACCENT }}
      >
        {mark}
      </span>
      {children}
    </h2>
  );
}

function RatingBadge({ rating }: { rating: Rating }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-sm font-bold ${RATING_STYLE[rating]}`}>
      {rating}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function GrandprixReport({ record }: { record: GPRecord }) {
  const { feedback } = record;
  const t = LABELS[record.feedbackLang] ?? LABELS.ja;
  const en = record.feedbackLang === "en";
  const rule = DIVISION_RULES[record.division];
  const format = checkFormat(record);
  const formatNg = format.filter((f) => !f.ok);

  return (
    <article className="text-[#2B2B2B] leading-relaxed">
      <header className="mb-8">
        <p className="text-sm font-medium" style={{ color: ACCENT }}>
          {GP_TITLE}　{rule.label}　{t.report}
        </p>
        <h1 className={`text-2xl font-bold mt-1 text-[#1A1A1A] ${record.division === "GC" ? "font-serif" : ""}`}>
          {record.title}
        </h1>
        <p className="text-sm text-[#6B6B6B] mt-2">
          {record.knock}
          {record.country ? `　／　${record.country}` : ""}
        </p>
        <p className="text-sm text-[#6B6B6B]">
          {record.student_name}
          {record.grade ? `（${record.grade}）` : ""}
          {record.created_at ? `　${formatDate(record.created_at)}` : ""}
        </p>
      </header>

      {/* A. 形式チェック */}
      <section className="mb-10 break-inside-avoid">
        <SectionTitle mark="A">{t.format}</SectionTitle>
        {formatNg.length > 0 && (
          <p className="mb-3 rounded-lg border border-[#F3C3BF] bg-[#FDECEA] p-3 text-sm font-semibold text-[#B3261E]">
            決まりに合っていないところが{formatNg.length}つあります。提出の前に直しましょう。
          </p>
        )}
        <ul className="space-y-1.5">
          {format.map((f) => (
            <li key={f.key} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-0.5 inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  f.ok ? "bg-[#E6F4EA] text-[#1E7B34]" : "bg-[#FDECEA] text-[#B3261E]"
                }`}
                aria-label={f.ok ? "OK" : "直す"}
              >
                {f.ok ? "✓" : "!"}
              </span>
              <span>
                {f.label}
                {f.detail && <span className={f.ok ? "text-[#6B6B6B]" : "text-[#B3261E]"}>　{f.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#9B9A97] mt-2">{t.formatNote}</p>
      </section>

      {/* B. よいところ */}
      <section className="mb-10 break-inside-avoid">
        <SectionTitle mark="B">{t.strengths}</SectionTitle>
        <ul className="space-y-2 list-disc pl-5">
          {feedback.strengths.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      {/* C. 3つの要素 */}
      <section className="mb-10">
        <SectionTitle mark="C">{t.link}</SectionTitle>
        <p className="text-xs text-[#6B6B6B] mb-3">{t.legend}</p>
        <div className="border border-[#D9D9D9] rounded-lg overflow-hidden">
          {(Object.keys(THEME_ELEMENTS) as (keyof typeof THEME_ELEMENTS)[]).map((k, i) => (
            <div key={k} className={`flex flex-col sm:flex-row gap-2 sm:gap-4 p-4 break-inside-avoid ${i > 0 ? "border-t border-[#E5E5E5]" : ""}`}>
              <div className="sm:w-40 shrink-0 flex sm:block items-center gap-3">
                <p className="font-semibold text-sm">{en ? THEME_ELEMENTS[k].labelEn : THEME_ELEMENTS[k].label}</p>
                <div className="sm:mt-2"><RatingBadge rating={feedback.themeLink[k].rating} /></div>
              </div>
              <p className="text-sm">{feedback.themeLink[k].comment}</p>
            </div>
          ))}
        </div>
      </section>

      {/* D. 審査観点 */}
      <section className="mb-10">
        <SectionTitle mark="D">{t.criteria}</SectionTitle>
        <div className="border border-[#D9D9D9] rounded-lg overflow-hidden">
          {feedback.criteria.map((c, i) => (
            <div key={c.key} className={`flex flex-col sm:flex-row gap-2 sm:gap-4 p-4 break-inside-avoid ${i > 0 ? "border-t border-[#E5E5E5]" : ""}`}>
              <div className="sm:w-40 shrink-0 flex sm:block items-center gap-3">
                <p className="font-semibold text-sm">{en ? GP_CRITERIA[c.key].labelEn : GP_CRITERIA[c.key].label}</p>
                <div className="sm:mt-2"><RatingBadge rating={c.rating} /></div>
              </div>
              <div className="space-y-2 text-sm min-w-0">
                <p>{c.comment}</p>
                {c.hint && (
                  <p className="bg-[#FFF8DC] border border-[#F0E0A0] rounded-lg p-3">
                    <span className="font-semibold">{t.hint}：</span>
                    {c.hint}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* E. エピスらしさ */}
      <section className="mb-10 break-inside-avoid">
        <SectionTitle mark="E">{t.epis}</SectionTitle>
        <h3 className="font-semibold text-sm mb-2">{t.episFound}</h3>
        {feedback.episPolicies.found.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {feedback.episPolicies.found.map((p, i) => (
              <li key={i} className="text-sm">
                <span className="inline-block font-semibold px-2 py-0.5 rounded bg-[#EEF4FA]" style={{ color: ACCENT }}>
                  {p.policy}
                </span>
                <span className={`block mt-1 text-[#6B6B6B] ${record.division === "GC" ? "font-serif" : ""}`}>
                  「{p.evidence}」
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#6B6B6B] mb-4">{t.episNone}</p>
        )}
        <div className="bg-[#FFF8DC] border border-[#F0E0A0] rounded-lg p-3 text-sm">
          <span className="font-semibold">
            {t.episMore}：{feedback.episPolicies.suggestion.policy}
          </span>
          <span className="block mt-1">{feedback.episPolicies.suggestion.idea}</span>
        </div>
      </section>

      {/* F. 言葉の直し */}
      <section className="mb-10">
        <SectionTitle mark="F">{t.fixes}</SectionTitle>
        {feedback.languageFixes.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">{t.fixesNone}</p>
        ) : (
          <ol className="space-y-3">
            {feedback.languageFixes.map((x, i) => (
              <li key={i} className="border border-[#E5E5E5] rounded-lg p-4 break-inside-avoid">
                <div className={`space-y-1 mb-2 ${record.division === "GC" ? "font-serif" : ""}`}>
                  <p>
                    <span className="text-xs text-[#6B6B6B] mr-2 font-sans">{t.original}</span>
                    <span className="text-[#C62828] line-through decoration-2">{x.original}</span>
                  </p>
                  <p>
                    <span className="text-xs text-[#6B6B6B] mr-2 font-sans">{t.fix}</span>
                    <span className="text-[#2E7D32] font-semibold">{x.fix}</span>
                  </p>
                </div>
                <p className="text-sm bg-[#F7F7F7] rounded p-3">{x.reason}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* G. 次にやること */}
      <section className="mb-10 break-inside-avoid">
        <SectionTitle mark="G">{t.next}</SectionTitle>
        <ol className="space-y-2 list-decimal pl-5">
          {feedback.nextSteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      <p
        className="text-center font-semibold py-4 border-t border-b break-inside-avoid"
        style={{ color: ACCENT, borderColor: "#D9D9D9" }}
      >
        {feedback.closing}
      </p>

      <p className="mt-6 text-center text-xs text-[#6B6B6B]">{t.disclaimer}</p>

      <details className="mt-8 print:hidden">
        <summary className="cursor-pointer text-sm text-[#6B6B6B]">{t.draft}</summary>
        <div className={`mt-3 space-y-3 text-sm bg-[#F7F7F7] rounded-lg p-4 ${record.division === "GC" ? "font-serif" : ""}`}>
          <p className="font-semibold">{record.title}</p>
          <p className="whitespace-pre-wrap text-[#6B6B6B]">{record.summary}</p>
          <p className="whitespace-pre-wrap">{record.body}</p>
        </div>
      </details>
    </article>
  );
}
