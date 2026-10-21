-- 100本ノックグランプリの下書きチェック（生徒のセルフチェック）の結果
-- Supabase ダッシュボード > SQL Editor で実行する。
-- 方針: RLS は有効・ポリシーなし。アクセスはサーバーの service role キーのみ（他テーブルと同じ）。
-- 生徒は自分の分、講師・管理者は全員の分を見る（講師が一次提出へのフィードバックで参考にする）。

create table if not exists public.grandprix_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  student_name text not null,
  grade text not null default '',
  division text not null check (division in ('JC', 'GC')),
  knock text not null,
  country text not null default '',
  title text not null,
  summary text not null,
  body text not null,
  feedback_lang text not null default 'ja' check (feedback_lang in ('ja', 'en')),
  feedback_json jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists grandprix_checks_user_created_idx
  on public.grandprix_checks (user_id, created_at desc);
create index if not exists grandprix_checks_created_idx
  on public.grandprix_checks (created_at desc);

alter table public.grandprix_checks enable row level security;
revoke all on table public.grandprix_checks from anon, authenticated;
