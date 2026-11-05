-- 過去問演習・そっくり問題の解答結果（デジタル解答解説ボードから EPIQ に記録する）
-- Supabase ダッシュボード > SQL Editor で実行する。
-- 方針: RLS は有効・ポリシーなし。アクセスはサーバーの service role キーのみ（他テーブルと同じ）。
-- 生徒は自分の分、講師・管理者は全員の分を見る。
-- 得点はボードから送られた数字を信用せず、サーバーが解答（answers）と lib/exam-results/catalog.ts の正解から計算し直す。

create table if not exists public.exam_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  student_name text not null,
  exam_id text not null,
  exam_title text not null,
  score integer not null,
  max_score integer not null,
  answered integer not null,
  total integer not null,
  answers jsonb not null,   -- { "q1-0": "c", ..., "q3-8": "puzzle" }
  marks jsonb not null,     -- { "q1-0": true, "q2-1": false, ... }（未解答のキーは含めない）
  taken_at timestamptz,     -- ボードで解き終えた時刻（端末の時計）
  created_at timestamptz not null default now()
);

create index if not exists exam_results_user_created_idx
  on public.exam_results (user_id, created_at desc);
create index if not exists exam_results_exam_created_idx
  on public.exam_results (exam_id, created_at desc);

alter table public.exam_results enable row level security;
revoke all on table public.exam_results from anon, authenticated;
