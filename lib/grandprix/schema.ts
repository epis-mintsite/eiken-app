import type { GPDraftCheck } from "@/types/grandprix";
import { GP_CRITERIA_KEYS } from "@/types/grandprix";
import { EPIS_POLICIES } from "@/lib/grandprix/rubric";

/**
 * Claude に返させるチェック結果の JSON Schema（structured outputs: output_config.format）。
 * types/grandprix.ts の GPDraftCheck と同じ形を保つこと。
 * 書き直し例・模範解答の欄は意図して持たせない（代筆しないため）。
 */

const RATED = {
  type: "object",
  additionalProperties: false,
  required: ["rating", "comment"],
  properties: {
    rating: { type: "string", enum: ["◎", "○", "△"] },
    comment: { type: "string" },
  },
} as const;

export const GP_CHECK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["strengths", "themeLink", "criteria", "episPolicies", "languageFixes", "nextSteps", "closing"],
  properties: {
    strengths: {
      type: "array",
      description: "よいところ。本文に即して具体的に2〜3個。",
      items: { type: "string" },
    },
    themeLink: {
      type: "object",
      additionalProperties: false,
      required: ["knock", "me", "country"],
      properties: {
        knock: { ...RATED, description: "100本ノックの内容・学びが書けているか" },
        me: { ...RATED, description: "自分の考え・感じたことが書けているか" },
        country: { ...RATED, description: "今いる国での見え方・体験が書けているか" },
      },
    },
    criteria: {
      type: "array",
      description: "審査観点別の評価。writing, understanding, originality, summary の4つをこの順に1つずつ。",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "rating", "comment", "hint"],
        properties: {
          key: { type: "string", enum: [...GP_CRITERIA_KEYS] },
          rating: { type: "string", enum: ["◎", "○", "△"] },
          comment: { type: "string", description: "できていること・足りないこと" },
          hint: {
            type: "string",
            description: "自分で直すための問いかけやヒント。書き直した文・段落・要旨は書かない。",
          },
        },
      },
    },
    episPolicies: {
      type: "object",
      additionalProperties: false,
      required: ["found", "suggestion"],
      properties: {
        found: {
          type: "array",
          description: "本文から読み取れる教育方針だけ。根拠は本文からの短い引用（そのまま抜き出す）。",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["policy", "evidence"],
            properties: {
              policy: { type: "string", enum: [...EPIS_POLICIES] },
              evidence: { type: "string" },
            },
          },
        },
        suggestion: {
          type: "object",
          additionalProperties: false,
          required: ["policy", "idea"],
          properties: {
            policy: { type: "string", enum: [...EPIS_POLICIES] },
            idea: { type: "string", description: "その方針をもう一つ出すための問いかけ・ヒント" },
          },
        },
      },
    },
    languageFixes: {
      type: "array",
      description: "誤字・文法・表記の明らかな誤りだけ。重要なものから最大5件。なければ空配列。",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["original", "fix", "reason"],
        properties: {
          original: { type: "string", description: "本文の該当箇所をそのまま抜き出す（短く）" },
          fix: { type: "string", description: "直した形（その箇所だけ）" },
          reason: { type: "string" },
        },
      },
    },
    nextSteps: {
      type: "array",
      description: "次にやること。優先順に最大3つ。問いかけの形で。",
      items: { type: "string" },
    },
    closing: { type: "string", description: "締めの一言" },
  },
} as const;

const RATINGS = new Set(["◎", "○", "△"]);
const isStr = (v: unknown): v is string => typeof v === "string";
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const isRated = (v: unknown): boolean =>
  !!v && typeof v === "object" && RATINGS.has((v as { rating: string }).rating) && isStr((v as { comment: unknown }).comment);

/** 保存・表示の前に形を確かめる（structured outputs の保険） */
export function isGPDraftCheck(v: unknown): v is GPDraftCheck {
  if (!v || typeof v !== "object") return false;
  const f = v as Record<string, unknown>;
  const link = f.themeLink as Record<string, unknown> | undefined;
  const epis = f.episPolicies as Record<string, unknown> | undefined;
  const sug = epis?.suggestion as Record<string, unknown> | undefined;
  return (
    isStrArr(f.strengths) &&
    !!link && isRated(link.knock) && isRated(link.me) && isRated(link.country) &&
    Array.isArray(f.criteria) &&
    f.criteria.every(
      (c) => c && (GP_CRITERIA_KEYS as readonly string[]).includes(c.key) && RATINGS.has(c.rating) && isStr(c.comment) && isStr(c.hint)
    ) &&
    !!epis && Array.isArray(epis.found) &&
    epis.found.every((p) => p && isStr(p.policy) && isStr(p.evidence)) &&
    !!sug && isStr(sug.policy) && isStr(sug.idea) &&
    Array.isArray(f.languageFixes) &&
    f.languageFixes.every((x) => x && isStr(x.original) && isStr(x.fix) && isStr(x.reason)) &&
    isStrArr(f.nextSteps) &&
    isStr(f.closing)
  );
}

/** 件数の上限をそろえ、観点を決まった順に並べる */
export function normalizeGPDraftCheck(f: GPDraftCheck): GPDraftCheck {
  const order = GP_CRITERIA_KEYS as readonly string[];
  const seen = new Set<string>();
  const criteria = [...f.criteria]
    .filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true)))
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return {
    ...f,
    strengths: f.strengths.slice(0, 3),
    criteria,
    languageFixes: f.languageFixes.slice(0, 5),
    nextSteps: f.nextSteps.slice(0, 3),
  };
}
