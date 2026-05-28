-- Migration 006 — Notes table
--
-- A note is a long-form journal entry attached to a source.
-- One source has many notes (a book read twice may have two reviews,
-- daily summaries from re-reading, etc.). source_id is nullable so the
-- model can later support standalone notes; for now the UI always sets it.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.sources(id) on delete cascade,
  kind text,        -- 요약 / 리뷰 / 메모 / 생각 / 자유 텍스트
  title text,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists notes_user_idx on public.notes(user_id);
create index if not exists notes_user_source_idx on public.notes(user_id, source_id);
create index if not exists notes_user_kind_idx on public.notes(user_id, kind);

alter table public.notes enable row level security;

drop policy if exists "notes_all_self" on public.notes;
create policy "notes_all_self" on public.notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
