import type { DocType } from "@/types/essay";

/**
 * 書類タイプごとの評価観点・着眼点・分量の上限。
 * 観点や着眼点を変えるときはこのファイルだけを編集する。
 */

export interface DocTypeConfig {
  label: string;
  shortLabel: string;
  description: string;
  /** プロンプト内での講師の担当科目 */
  subject: "英語" | "国語";
  /** 分量の数え方 */
  lengthUnit: "words" | "chars";
  /** 本文の上限（語数 or 文字数） */
  maxLength: number;
  /** 評価観点（この順でレポートに並ぶ） */
  criteria: string[];
  /** 添削の着眼点（プロンプトに差し込む） */
  focusNotes: string[];
}

export const DOC_TYPE_CONFIG: Record<DocType, DocTypeConfig> = {
  english_essay: {
    label: "英語エッセイ",
    shortLabel: "英語エッセイ",
    description: "英作文・意見文・入試エッセイ",
    subject: "英語",
    lengthUnit: "words",
    maxLength: 800,
    criteria: ["設問への対応", "構成・論理展開", "内容・具体性", "語彙・表現", "文法・正確さ"],
    focusNotes: [
      "時制の統一（過去の体験と現在の意見が混ざっていないか）",
      "三単現の -s、名詞の単数・複数、冠詞（a / the）の抜け",
      "スペルミス",
      "つなぎ語（However, For example, Therefore など）で論理がつながっているか",
      "結論で自分の立場をもう一度はっきり示しているか",
    ],
  },
  jp_personal_statement: {
    label: "志望理由書",
    shortLabel: "志望理由書",
    description: "出願書類の志望理由書・自己推薦書",
    subject: "国語",
    lengthUnit: "chars",
    maxLength: 2000,
    criteria: [
      "様式・設問への対応",
      "内容・具体性",
      "学校研究・志望の熱意",
      "構成・論理展開",
      "日本語表現（文法・語彙）",
    ],
    focusNotes: [
      "設問の条件（書くべき項目・字数）にすべて答えているか",
      "話し言葉（〜けど、〜みたいな、すごく 等）が混ざっていないか",
      "文末の統一（です・ます調／だ・である調、「〜したいです」の連続）",
      "その学校でなければならない理由（学校研究）が具体的に書けているか",
      "自分の体験 → 学び → 志望 → 入学後の目標 がつながっているか",
    ],
  },
  jp_essay: {
    label: "作文・小論文",
    shortLabel: "作文",
    description: "国語の作文・記述・小論文",
    subject: "国語",
    lengthUnit: "chars",
    maxLength: 2000,
    criteria: ["設問への対応", "構成・論理展開", "内容・説得力", "表現・文のねじれ", "字数・形式"],
    focusNotes: [
      "設問の条件（テーマ・立場・字数・段落指定）を守っているか",
      "一文が長すぎて主語と述語がねじれていないか",
      "抽象的な主張と具体例のバランス",
      "段落の役割（序論・本論・結論）がはっきりしているか",
      "原稿用紙の使い方・字数（指定がある場合）",
    ],
  },
};

export function isDocType(value: unknown): value is DocType {
  return typeof value === "string" && value in DOC_TYPE_CONFIG;
}

/** 本文の分量（英語は語数、日本語は空白を除いた文字数） */
export function measureLength(text: string, unit: "words" | "chars"): number {
  if (unit === "words") {
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  }
  return Array.from(text.replace(/\s/g, "")).length;
}

export function lengthLabel(unit: "words" | "chars"): string {
  return unit === "words" ? "語" : "字";
}
