-- Migration 005 — Add genre column to sources
--
-- A short free-text "subgenre" used to slice book/movie/lyrics rooms further.
-- Examples: 한국소설, 에세이, 한국영화, 애니메이션, K-Pop, Hip-Hop/Rap.
-- Auto-filled from the external search providers when available; users can
-- also edit it manually via the EDIT INFO dialog.

alter table public.sources
  add column if not exists genre text;

create index if not exists sources_user_type_genre_idx
  on public.sources(user_id, type, genre);
