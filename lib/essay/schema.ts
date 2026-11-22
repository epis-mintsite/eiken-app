import type { EssayFeedback } from "@/types/essay";

/**
 * Claude に返させる添削結果の JSON Schema（structured outputs: output_config.format）。
 * types/essay.ts の EssayFeedback と同じ形を保つこと。
 */
export const ESSAY_FEEDBACK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "overall", "evaluation", "strengths", "corrections",
    "vocabUpgrades", "modelAnswer", "usefulPatterns",
    "advice", "scoreEstimate", "closing",
  ],
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
    strengths: {
      type: "array",
      description: "この答案の強み。生徒が「次もこう書こう」と思える具体的な良い点を2〜4個。",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["point", "quote", "reason"],
        properties: {
          point: { type: "string", description: "何が良かったか（見出し）" },
          quote: { type: "string", description: "本文中の該当箇所をそのまま引用" },
          reason: { type: "string", description: "なぜこれが良いのか、どう効果的か" },
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
    vocabUpgrades: {
      type: "array",
      description: "語彙アップグレード。生徒が使った平凡な表現をより高度な表現に言い換える提案を3〜5個。英語エッセイなら英語の語彙、日本語なら日本語の語彙。",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["original", "upgrade", "example", "why"],
        properties: {
          original: { type: "string", description: "生徒が使った表現" },
          upgrade: { type: "string", description: "より高度・適切な言い換え" },
          example: { type: "string", description: "言い換えを使った例文（このテーマに合わせる）" },
          why: { type: "string", description: "なぜこの言い換えが良いか（一言）" },
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
    usefulPatterns: {
      type: "array",
      description: "使える表現パターン集。この書類タイプとテーマで使える定型表現・構文パターンを3〜5個。生徒がすぐ真似できるテンプレート形式で。",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "template", "example"],
        properties: {
          label: { type: "string", description: "パターン名（例: 譲歩→主張、具体例の導入）" },
          template: { type: "string", description: "テンプレート（穴埋め形式。例: Although ..., I believe that ...）" },
          example: { type: "string", description: "このテーマでの具体的な使用例" },
        },
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
    scoreEstimate: {
      type: "object",
      additionalProperties: false,
      required: ["score", "note"],
      description: "スコア予測。英語エッセイなら英検CSEスコアの目安（例: 12 / 16）。日本語なら到達度（例: B+ 相当）。答案の実力を客観的に伝える。",
      properties: {
        score: { type: "string", description: "点数・ランクの目安" },
        note: { type: "string", description: "補足（合格ラインとの比較や、あと何点伸ばせるかの見通し）" },
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
  const coreOk =
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
    isStr(f.closing);
  if (!coreOk) return false;
  if (f.strengths !== undefined && !(Array.isArray(f.strengths) &&
    f.strengths.every((s) => s && isStr(s.point) && isStr(s.quote) && isStr(s.reason))))
    return false;
  if (f.vocabUpgrades !== undefined && !(Array.isArray(f.vocabUpgrades) &&
    f.vocabUpgrades.every((u) => u && isStr(u.original) && isStr(u.upgrade) && isStr(u.example) && isStr(u.why))))
    return false;
  if (f.usefulPatterns !== undefined && !(Array.isArray(f.usefulPatterns) &&
    f.usefulPatterns.every((p) => p && isStr(p.label) && isStr(p.template) && isStr(p.example))))
    return false;
  if (f.scoreEstimate !== undefined && f.scoreEstimate !== null) {
    const se = f.scoreEstimate as Record<string, unknown>;
    if (!(isStr(se.score) && isStr(se.note))) return false;
  }
  return true;
}
