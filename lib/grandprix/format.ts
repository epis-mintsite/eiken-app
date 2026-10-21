import type { Division } from "@/types/grandprix";
import { DIVISION_RULES, SUMMARY_MAX_WORDS } from "@/lib/grandprix/rubric";

/**
 * 形式チェック（コードで判定。AIは使わない）。数え方はここに集約し、画面にも同じ説明を出す。
 * 予選採点（/grandprix/judge）の減点判定もこの関数を使う。
 */

export const COUNTING_NOTE =
  "JC の本文は改行と空白を除いた文字数（句読点・かっこも数える）。英語は空白で区切り、英数字を1文字以上含むものを1語と数える。";

/** ひらがな・カタカナ・漢字（半角カナを含む） */
const JAPANESE_CHAR = /[぀-ヿ㐀-鿿豈-﫿ｦ-ﾟ]/;

export function hasJapanese(text: string): boolean {
  return JAPANESE_CHAR.test(text);
}

/** 英語の語数 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

/** 日本語の文字数（改行・空白を除く） */
export function countChars(text: string): number {
  return Array.from(text.replace(/\s/g, "")).length;
}

export function bodyLength(division: Division, body: string): number {
  return DIVISION_RULES[division].bodyUnit === "chars" ? countChars(body) : countWords(body);
}

export function unitLabel(division: Division): string {
  return DIVISION_RULES[division].bodyUnit === "chars" ? "字" : "語";
}

export type FormatCheckKey = "required" | "body" | "summaryLength" | "summaryLang" | "titleLang";

export interface FormatCheckItem {
  key: FormatCheckKey;
  ok: boolean;
  label: string;
  detail: string;
}

export interface FormatInput {
  division: Division;
  knock: string;
  title: string;
  summary: string;
  body: string;
}

export function checkFormat(input: FormatInput): FormatCheckItem[] {
  const rule = DIVISION_RULES[input.division];
  const unit = unitLabel(input.division);
  const items: FormatCheckItem[] = [];

  const missing = [
    ["選んだ100本ノック", input.knock],
    ["タイトル", input.title],
    ["要旨", input.summary],
    ["本文", input.body],
  ]
    .filter(([, v]) => !v.trim())
    .map(([k]) => k);
  items.push({
    key: "required",
    ok: missing.length === 0,
    label: "必要な欄がそろっている",
    detail: missing.length ? `${missing.join("・")}が空です` : "",
  });

  const n = bodyLength(input.division, input.body);
  const bodyOk = n >= rule.bodyMin && n <= rule.bodyMax;
  items.push({
    key: "body",
    ok: bodyOk,
    label: `本文が${rule.bodyMin}〜${rule.bodyMax}${unit}`,
    detail: bodyOk
      ? `${n}${unit}`
      : n < rule.bodyMin
        ? `${n}${unit}（あと${rule.bodyMin - n}${unit}）`
        : `${n}${unit}（${n - rule.bodyMax}${unit}多い）`,
  });

  const sw = countWords(input.summary);
  items.push({
    key: "summaryLength",
    ok: sw > 0 && sw <= SUMMARY_MAX_WORDS,
    label: `要旨が${SUMMARY_MAX_WORDS}語以内`,
    detail: sw > SUMMARY_MAX_WORDS ? `${sw}語（${sw - SUMMARY_MAX_WORDS}語多い）` : `${sw}語`,
  });

  const summaryEnglish = !!input.summary.trim() && !hasJapanese(input.summary);
  items.push({
    key: "summaryLang",
    ok: summaryEnglish,
    label: "要旨が英語",
    detail: summaryEnglish || !input.summary.trim() ? "" : "日本語の文字が入っています",
  });

  const title = input.title.trim();
  const titleOk = !!title && (rule.titleLang === "ja" ? hasJapanese(title) : !hasJapanese(title));
  items.push({
    key: "titleLang",
    ok: titleOk,
    label: rule.titleLang === "ja" ? "タイトルが日本語" : "タイトルが英語",
    detail:
      titleOk || !title
        ? ""
        : rule.titleLang === "ja"
          ? "日本語のタイトルにします"
          : "日本語の文字が入っています",
  });

  return items;
}

/** 本文が短すぎて AI に回さない状態か */
export function isTooShort(division: Division, body: string): boolean {
  return bodyLength(division, body) < DIVISION_RULES[division].bodyTooShort;
}
