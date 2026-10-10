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

/** Claude が返す添削結果（レポートの各セクションに1対1で対応） */
export interface EssayFeedback {
  overall: string[];
  evaluation: EssayEvaluation[];
  corrections: EssayCorrectionPoint[];
  modelAnswer: {
    note: string;
    paragraphs: string[];
  };
  advice: EssayAdvice[];
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
