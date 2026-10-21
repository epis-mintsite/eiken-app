/**
 * 100本ノックグランプリの下書きチェック（生徒のセルフチェック）。
 * エッセイ添削（types/essay.ts）とは別の機能。AIは代筆せず、点数も出さない。
 */

import type { Rating } from "@/types/essay";

export type { Rating };

export const DIVISIONS = ["JC", "GC"] as const;
export type Division = (typeof DIVISIONS)[number];

export const FEEDBACK_LANGS = ["ja", "en"] as const;
export type FeedbackLang = (typeof FEEDBACK_LANGS)[number];

export const GP_CRITERIA_KEYS = ["writing", "understanding", "originality", "summary"] as const;
export type GPCriterionKey = (typeof GP_CRITERIA_KEYS)[number];

export interface GPRated {
  rating: Rating;
  comment: string;
}

/** Claude が返すチェック結果（結果画面の B〜G に1対1で対応） */
export interface GPDraftCheck {
  /** B. よいところ（2〜3個） */
  strengths: string[];
  /** C. 3つの要素のつながり */
  themeLink: {
    knock: GPRated;
    me: GPRated;
    country: GPRated;
  };
  /** D. 審査観点別（文章力・設問理解力・内容独創性・要旨構成） */
  criteria: {
    key: GPCriterionKey;
    rating: Rating;
    comment: string;
    /** 自分で直すための問い・ヒント（書き直し文は含めない） */
    hint: string;
  }[];
  /** E. エピスらしさ */
  episPolicies: {
    found: { policy: string; evidence: string }[];
    suggestion: { policy: string; idea: string };
  };
  /** F. 言葉の直し（最大5件） */
  languageFixes: { original: string; fix: string; reason: string }[];
  /** G. 次にやること（優先順に最大3つ） */
  nextSteps: string[];
  closing: string;
}

/** 入力（下書き）。保存・再チェックにも使う */
export interface GPDraft {
  division: Division;
  knock: string;
  country: string;
  title: string;
  summary: string;
  body: string;
  grade: string;
  feedbackLang: FeedbackLang;
}

/** 画面表示用（保存済みレコード） */
export interface GPRecord extends GPDraft {
  id: string | null;
  student_name: string;
  feedback: GPDraftCheck;
  created_at: string;
}

export interface GPHistoryItem {
  id: string;
  division: Division;
  student_name: string;
  title: string;
  knock: string;
  created_at: string;
}

/** /api/grandprix/status の応答 */
export interface GPStatus {
  open: boolean;
  staff: boolean;
  /** 期間外のときの案内 */
  message: string;
  used: number;
  /** 1日の上限（講師・管理者は null = 上限なし） */
  limit: number | null;
}
