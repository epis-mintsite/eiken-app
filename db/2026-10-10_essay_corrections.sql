-- エッセイ・志望理由書・作文の添削結果
-- Supabase ダッシュボード > SQL Editor で実行する。
-- 方針: RLS は有効・ポリシーなし。アクセスはサーバーの service role キーのみ（他テーブルと同じ）。

create table if not exists public.essay_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  student_name text not null,
  grade text not null default '',
  doc_type text not null check (doc_type in ('english_essay', 'jp_personal_statement', 'jp_essay')),
  theme text not null,
  source_type text not null default 'text' check (source_type in ('text', 'image')),
  original_text text not null,
  feedback_json jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists essay_corrections_user_created_idx
  on public.essay_corrections (user_id, created_at desc);
create index if not exists essay_corrections_created_idx
  on public.essay_corrections (created_at desc);

alter table public.essay_corrections enable row level security;
revoke all on table public.essay_corrections from anon, authenticated;
