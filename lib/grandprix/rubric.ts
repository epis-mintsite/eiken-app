import type { Division, GPCriterionKey } from "@/types/grandprix";

/**
 * 100本ノックグランプリの大会ルール・審査観点・教育方針。
 * 基準の正本は生徒配布の「epis100本ノックグランプリ案内」。変えるときはこのファイルだけを編集する。
 * 画面（クライアント）とサーバーの両方から読むので、server-only にしない。
 */

export const GP_TITLE = "100本ノックグランプリ in 2026冬";
export const GP_THEME = "100本ノックのテーマと私と今いる国";

/**
 * 生徒が使える期間（Asia/Shanghai 基準。終わりは含まない）。
 * サーバーは GP_OPEN_FROM / GP_CLOSE_AT があればそちらを使う（lib/grandprix/limits.ts）。
 * ナビゲーションの表示はこの既定値で判断する。
 */
export const GP_DEFAULT_OPEN_FROM = "2026-11-01T00:00:00+08:00";
export const GP_DEFAULT_CLOSE_AT = "2026-11-15T00:00:00+08:00";

/** 生徒1人あたり1日に使える回数の既定値（GP_DAILY_LIMIT で変更） */
export const GP_DEFAULT_DAILY_LIMIT = 5;

/** 結果画面の「直してもう一度チェック」から入力画面へ下書きを渡す sessionStorage のキー */
export const GP_RESTORE_KEY = "gpRestore";

/** 期間中か（ナビゲーションの表示用。サーバーの判定は lib/grandprix/limits.ts） */
export function isGPPeriod(now = new Date()): boolean {
  return now >= new Date(GP_DEFAULT_OPEN_FROM) && now < new Date(GP_DEFAULT_CLOSE_AT);
}

export interface DivisionRule {
  label: string;
  shortLabel: string;
  titleLang: "ja" | "en";
  bodyUnit: "chars" | "words";
  bodyMin: number;
  bodyMax: number;
  /** これ未満はAIを呼ばず「まず書き進めよう」ガイドを出す */
  bodyTooShort: number;
  /** 受け付ける本文の上限（これを超えたら送れない） */
  bodyHardMax: number;
  structure: string;
  /** プロンプトに入れる部門の説明 */
  rulesText: string;
  /** 部門別の着眼点 */
  notes: string[];
}

export const SUMMARY_MAX_WORDS = 50;

export const DIVISION_RULES: Record<Division, DivisionRule> = {
  JC: {
    label: "ジャパンカップ（JC）",
    shortLabel: "JC",
    titleLang: "ja",
    bodyUnit: "chars",
    bodyMin: 600,
    bodyMax: 800,
    bodyTooShort: 200,
    bodyHardMax: 1600,
    structure: "序論・本論・結論",
    rulesText:
      "ジャパンカップ（JC）: タイトルは日本語、要旨は英語50語以下、本文は日本語600字以上800字以下。型の目安は序論・本論・結論。",
    notes: [
      "序論で背景と自分の主張を示しているか",
      "本論で100本ノックの内容（根拠）と、今いる国での体験・観察を組み合わせているか",
      "結論で主張を再確認し、提言できているか",
      "一文が長すぎて主語と述語がねじれていないか",
      "文末（だ・である調／です・ます調）が統一されているか",
    ],
  },
  GC: {
    label: "グローバルカップ（GC）",
    shortLabel: "GC",
    titleLang: "en",
    bodyUnit: "words",
    bodyMin: 200,
    bodyMax: 400,
    bodyTooShort: 60,
    bodyHardMax: 800,
    structure:
      "Introduction（General information / Background / Thesis statement）・Body（Topic sentence / Supporting evidence / Discussion）・Conclusion（Restatement / Brief Summary / Final Statement）",
    rulesText:
      "グローバルカップ（GC）: タイトルは英語、要旨は英語50語以下、本文は英語200語以上400語以下。型の目安は Introduction（General information / Background / Thesis statement）・Body（Topic sentence / Supporting evidence / Discussion）・Conclusion（Restatement / Brief Summary / Final Statement）。",
    notes: [
      "Thesis statement が明確か",
      "Topic sentence と Supporting evidence が対応しているか",
      "Discussion で体験から考察に進めているか",
      "Conclusion に Restatement と Final Statement があるか",
      "時制の統一、三単現の -s、冠詞、スペル、つなぎ語",
    ],
  },
};

/** 要旨（両部門共通）の着眼点 */
export const SUMMARY_NOTES = [
  "本文の「背景・根拠・主張」を英語で凝縮できているか",
  "本文と食い違っていないか",
  "In this essay, I will... などのメタ表現で語数を使っていないか",
];

/** 審査観点（エピスらしさは E 欄で別に扱う） */
export const GP_CRITERIA: Record<GPCriterionKey, { label: string; labelEn: string; points: number; description: string }> = {
  writing: {
    label: "文章力",
    labelEn: "Writing",
    points: 5,
    description: "論文構成のわかりやすさ、文法の正しさ、誤字・脱字の少なさ",
  },
  understanding: {
    label: "設問理解力",
    labelEn: "Understanding the task",
    points: 5,
    description:
      "独自の視点で選択課題に問題提起できているか、論点に対する切り口の鋭さ、考察、具体例や数値による論点のわかりやすさ、提案の独自性、視野の広さ（100本ノックのテーマに触れていればよい）",
  },
  originality: {
    label: "内容独創性",
    labelEn: "Originality",
    points: 5,
    description: "発想が斬新で大胆か、多くの人の共感や驚きが得られるか",
  },
  summary: {
    label: "要旨構成",
    labelEn: "Summary",
    points: 3,
    description: "本文とリンクした要旨を書けているか",
  },
};

/** エピスの7つの教育方針（審査の「エピスらしさ」7点） */
export const EPIS_POLICIES = [
  "Logical Thinking",
  "Multilingual",
  "Intellectual Curiosity",
  "Moving Forward with No Excuses",
  "Critical Thinking with Fairness",
  "Open mind",
  "Self-analysis & Challenger's Spirit",
] as const;

/** 3つの要素 */
export const THEME_ELEMENTS = {
  knock: { label: "100本ノックのテーマ", labelEn: "The 100-knock topic", description: "選んだ回の内容から何を学んだか" },
  me: { label: "私", labelEn: "Me", description: "そのテーマについて自分はどう考え、どう感じたか" },
  country: { label: "今いる国", labelEn: "My country", description: "今暮らしている国では、そのテーマがどう見えるか・どう関わっているか" },
} as const;
