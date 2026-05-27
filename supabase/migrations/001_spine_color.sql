-- =====================================================================
-- Migration 001 — Add spine_color column to sources
-- Run this once in Supabase SQL Editor.
-- =====================================================================

alter table public.sources
  add column if not exists spine_color text;
