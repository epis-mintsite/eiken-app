/**
 * エッセイ・志望理由書・作文の添削（観点別 ◎○△ 評価のレポート）。
 * 既存の英作文添削（types/correction.ts、4観点×4点）とは別の機能。
 */

export const DOC_TYPES = ["english_essay", "jp_personal_statement", "jp_essay"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export type Rating = "◎" | "○" | "△";

export interface EssayEvaluation {
  criterion: string;
  rating: Rating;
  comment: string;
}

export interface EssayCorrectionPoint {
  /** 見出し（例: 三単現の -s） */
  label: string;
  /** 原文の該当箇所 */
  original: string;
  /** 修正後 */
  fix: string;
  /** なぜそう直すか（本人向け解説） */
  point: string;
  /** original に取り消し線を引くか */
  strike: boolean;
}

export interface EssayAdvice {
  head: string;
  body: string[];
  /** 練習メニュー（なければ空文字） */
  drill: string;
}

export interface VocabUpgrade {
  /** 生徒が使った表現 */
  original: string;
  /** より高度な言い換え */
  upgrade: string;
  /** 言い換えを使った例文 */
  example: string;
  /** なぜこの言い換えが良いか（一言） */
  why: string;
}

export interface UsefulPattern {
  /** パターン名（例: 譲歩→主張） */
  label: string;
  /** テンプレート（穴埋め形式） */
  template: string;
  /** このテーマでの使用例 */
  example: string;
}

export interface Strength {
  /** 何が良かったか */
  point: string;
  /** 本文中の該当箇所 */
  quote: string;
  /** なぜ良いのか */
  reason: string;
}

/** Claude が返す添削結果（レポートの各セクションに1対1で対応） */
export interface EssayFeedback {
  overall: string[];
  evaluation: EssayEvaluation[];
  strengths?: Strength[];
  corrections: EssayCorrectionPoint[];
  vocabUpgrades?: VocabUpgrade[];
  modelAnswer: {
    note: string;
    paragraphs: string[];
  };
  usefulPatterns?: UsefulPattern[];
  advice: EssayAdvice[];
  scoreEstimate?: {
    /** 点数の目安（例: "12 / 16"） */
    score: string;
    /** 補足（例: "準2級の合格ラインは約10点"） */
    note: string;
  };
  closing: string;
}

/** 画面表示用（保存済みレコード） */
export interface EssayRecord {
  id: string | null;
  doc_type: DocType;
  student_name: string;
  grade: string;
  theme: string;
  original_text: string;
  feedback: EssayFeedback;
  created_at: string;
}

export interface EssayHistoryItem {
  id: string;
  doc_type: DocType;
  student_name: string;
  theme: string;
  created_at: string;
}
