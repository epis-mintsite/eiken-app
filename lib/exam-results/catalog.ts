/**
 * EPIQ に記録できる演習（デジタル解答解説ボード）の一覧と正解。
 * ボード側は解答だけを送り、得点は必ずここで計算する（ボードの得点表示は目安）。
 * ブラウザ（取り込み画面のプレビュー）とサーバー（記録API）の両方から読む。
 */

export interface ExamQuestion {
  /** ボードと共通のキー（例 "q2-0"） */
  key: string;
  /** 表示名（例 "問2 [1]"） */
  label: string;
  points: number;
  /** 記号問題は "a"〜"e"、記述は小文字の語 */
  answer: string;
  written?: boolean;
}

export interface ExamDef {
  id: string;
  title: string;
  /** 一覧で出す短い説明 */
  source: string;
  questions: ExamQuestion[];
}

const q = (key: string, label: string, points: number, answer: string, written = false): ExamQuestion =>
  ({ key, label, points, answer, ...(written ? { written } : {}) });

export const EXAMS: Record<string, ExamDef> = {
  "honjo-094-ii": {
    id: "honjo-094-ii",
    title: "早大本庄そっくり 大問Ⅱ（物語文）",
    source: "素材：長文読解100本ノック 094 The Green Light",
    questions: [
      q("q1-0", "問1 (1)", 5, "c"),
      q("q1-1", "問1 (2)", 5, "b"),
      q("q1-2", "問1 (3)", 5, "c"),
      q("q2-0", "問2 [1]", 8, "d"),
      q("q2-1", "問2 [2]", 8, "b"),
      q("q2-2", "問2 [3]", 8, "c"),
      q("q2-3", "問2 [4]", 8, "e"),
      q("q2-4", "問2 [5]", 8, "a"),
      q("q3-0", "問3 [1]", 5, "c"),
      q("q3-1", "問3 [2]", 5, "a"),
      q("q3-2", "問3 [3]", 5, "b"),
      q("q3-3", "問3 [4]", 5, "d"),
      q("q3-4", "問3 [5]", 5, "c"),
      q("q3-5", "問3 [6]", 5, "e"),
      q("q3-6", "問3 [7]", 5, "b"),
      q("q3-7", "問3 [8]", 5, "d"),
      q("q3-8", "問3 [9]", 5, "puzzle", true),
    ],
  },
};

export function maxScore(exam: ExamDef): number {
  return exam.questions.reduce((s, x) => s + x.points, 0);
}

export interface Graded {
  score: number;
  maxScore: number;
  answered: number;
  total: number;
  /** 解答した設問だけ。true = 正解 */
  marks: Record<string, boolean>;
  /** 正規化した解答（知らないキー・空欄は捨てる） */
  answers: Record<string, string>;
}

/** 解答を正規化して採点する。記号は a〜e のみ、記述は前後の空白・大文字小文字を無視。 */
export function grade(exam: ExamDef, raw: unknown): Graded {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const answers: Record<string, string> = {};
  const marks: Record<string, boolean> = {};
  let score = 0;
  for (const question of exam.questions) {
    const v = src[question.key];
    if (typeof v !== "string") continue;
    const a = question.written ? v.trim().toLowerCase().slice(0, 40) : v.trim().toLowerCase();
    if (!a) continue;
    if (!question.written && !/^[a-e]$/.test(a)) continue;
    answers[question.key] = a;
    const ok = a === question.answer;
    marks[question.key] = ok;
    if (ok) score += question.points;
  }
  return { score, maxScore: maxScore(exam), answered: Object.keys(answers).length, total: exam.questions.length, marks, answers };
}

/** ログイン前に届いた結果を、ログイン後まで預かる localStorage のキー（取り込み画面・ログイン画面で使う） */
export const PENDING_KEY = "epiq:pendingExamResult";

/** ボードから届く取り込みデータ（URL の #d= に base64url で入る JSON） */
export interface ImportPayload {
  v: 1;
  exam: string;
  answers: Record<string, string>;
  /** ISO 8601。解き終えた時刻 */
  at?: string;
}

export function decodePayload(hash: string): ImportPayload | null {
  const m = hash.match(/(?:^#|&)d=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    const b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      Array.from(atob(b64), (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    const p = JSON.parse(json);
    if (p?.v !== 1 || typeof p.exam !== "string" || !EXAMS[p.exam] || typeof p.answers !== "object") return null;
    return p as ImportPayload;
  } catch {
    return null;
  }
}
