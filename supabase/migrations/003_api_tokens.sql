-- =====================================================================
-- Migration 003 — Personal API tokens
--
-- A small table that lets the user mint long-lived bearer tokens for
-- external clients (browser extension, scripts, bookmarklet). The
-- /api/quick-add route validates these tokens via the service role
-- key and inserts quotes on the owner's behalf.
--
-- Run this once in the Supabase SQL Editor.
-- =====================================================================

create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  name text default 'default',
  created_at timestamptz default now(),
  last_used_at timestamptz
);

create index if not exists api_tokens_user_idx on public.api_tokens(user_id);

alter table public.api_tokens enable row level security;

-- Owner-only access via RLS for normal Supabase clients. The /api/quick-add
-- route bypasses this with the service-role key so it can look the token up
-- before the user is "signed in".
drop policy if exists "api_tokens_all_self" on public.api_tokens;
create policy "api_tokens_all_self" on public.api_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
