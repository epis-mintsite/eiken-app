import type { EssayFeedback } from "@/types/essay";

/**
 * Claude に返させる添削結果の JSON Schema（structured outputs: output_config.format）。
 * types/essay.ts の EssayFeedback と同じ形を保つこと。
 */
export const ESSAY_FEEDBACK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["overall", "evaluation", "corrections", "modelAnswer", "advice", "closing"],
  properties: {
    overall: {
      type: "array",
      description: "総評。2〜3段落。まず良い点、次に伸ばすべき点。",
      items: { type: "string" },
    },
    evaluation: {
      type: "array",
      description: "観点別評価。指定された観点をすべて、指定の順に。",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterion", "rating", "comment"],
        properties: {
          criterion: { type: "string" },
          rating: { type: "string", enum: ["◎", "○", "△"] },
          comment: { type: "string" },
        },
      },
    },
    corrections: {
      type: "array",
      description: "添削ポイント。重要なものから3〜7個。",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "original", "fix", "point", "strike"],
        properties: {
          label: { type: "string", description: "見出し（例: 三単現の -s）" },
          original: { type: "string", description: "原文の該当箇所をそのまま抜き出す" },
          fix: { type: "string", description: "修正後" },
          point: { type: "string", description: "なぜそう直すか（本人向けの解説）" },
          strike: {
            type: "boolean",
            description: "原文に取り消し線を引くなら true（誤りの訂正）。より良い表現への言い換えなど、誤りではない場合は false",
          },
        },
      },
    },
    modelAnswer: {
      type: "object",
      additionalProperties: false,
      required: ["note", "paragraphs"],
      properties: {
        note: { type: "string", description: "書き直し例についての注記" },
        paragraphs: { type: "array", items: { type: "string" } },
      },
    },
    advice: {
      type: "array",
      description: "次に向けてのアドバイス。2〜4個。",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["head", "body", "drill"],
        properties: {
          head: { type: "string" },
          body: { type: "array", items: { type: "string" } },
          drill: { type: "string", description: "練習メニュー。なければ空文字" },
        },
      },
    },
    closing: { type: "string", description: "締めの一言" },
  },
} as const;

const RATINGS = new Set(["◎", "○", "△"]);

const isStr = (v: unknown): v is string => typeof v === "string";
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

/** 保存・表示の前に形を確かめる（structured outputs の保険） */
export function isEssayFeedback(v: unknown): v is EssayFeedback {
  if (!v || typeof v !== "object") return false;
  const f = v as Record<string, unknown>;
  const model = f.modelAnswer as Record<string, unknown> | undefined;
  return (
    isStrArr(f.overall) &&
    Array.isArray(f.evaluation) &&
    f.evaluation.every(
      (e) => e && isStr(e.criterion) && RATINGS.has(e.rating) && isStr(e.comment)
    ) &&
    Array.isArray(f.corrections) &&
    f.corrections.every(
      (c) =>
        c && isStr(c.label) && isStr(c.original) && isStr(c.fix) && isStr(c.point) &&
        typeof c.strike === "boolean"
    ) &&
    !!model && isStr(model.note) && isStrArr(model.paragraphs) &&
    Array.isArray(f.advice) &&
    f.advice.every((a) => a && isStr(a.head) && isStrArr(a.body) && isStr(a.drill)) &&
    isStr(f.closing)
  );
}
