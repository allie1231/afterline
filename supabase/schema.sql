-- =====================================================================
-- AFTERLINE — Database schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE everywhere.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- sources
-- ---------------------------------------------------------------------
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('book','article','lyrics','movie','conversation','other')),
  title text not null,
  creator text,
  publisher text,
  published_date text,
  isbn text,
  cover_url text,
  url text,
  external_provider text,
  external_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists sources_user_idx on public.sources(user_id);
create index if not exists sources_user_type_idx on public.sources(user_id, type);

alter table public.sources enable row level security;

drop policy if exists "sources_all_self" on public.sources;
create policy "sources_all_self" on public.sources
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- quotes
-- ---------------------------------------------------------------------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  text text not null,
  page text,
  note text,
  mood_tags text[] default '{}',
  color_mood text,
  is_favorite boolean default false,
  visibility text default 'private' check (visibility in ('private','public')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists quotes_user_idx on public.quotes(user_id);
create index if not exists quotes_source_idx on public.quotes(source_id);

alter table public.quotes enable row level security;

drop policy if exists "quotes_all_self" on public.quotes;
create policy "quotes_all_self" on public.quotes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- collection_notes
-- ---------------------------------------------------------------------
create table if not exists public.collection_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  title text,
  summary text,
  personal_note text,
  keywords text[] default '{}',
  status text check (status in ('to_read','reading','finished','archived')),
  rating numeric,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists collection_notes_source_uniq on public.collection_notes(source_id);

alter table public.collection_notes enable row level security;

drop policy if exists "notes_all_self" on public.collection_notes;
create policy "notes_all_self" on public.collection_notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
