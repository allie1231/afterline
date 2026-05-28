-- =====================================================================
-- Migration 004 — Delete a source, delete its quotes
--
-- The original schema kept orphan quotes alive (ON DELETE SET NULL) when
-- their source was deleted, which left them counting in /stats but not
-- showing under any room. Switch the FK to ON DELETE CASCADE and clean
-- up any existing orphans so totals match reality.
--
-- Run this once in the Supabase SQL Editor.
-- =====================================================================

-- 1) Remove existing orphans.
delete from public.quotes where source_id is null;

-- 2) Swap the FK constraint to cascade.
alter table public.quotes drop constraint if exists quotes_source_id_fkey;
alter table public.quotes
  add constraint quotes_source_id_fkey
  foreign key (source_id) references public.sources(id) on delete cascade;

-- 3) Going forward, every quote belongs to a source.
alter table public.quotes alter column source_id set not null;
