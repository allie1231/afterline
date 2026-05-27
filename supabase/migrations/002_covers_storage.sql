-- =====================================================================
-- Migration 002 — Storage policies for the `covers` bucket
--
-- Step 1 (Dashboard): Storage → New bucket → name `covers` → toggle
--                     "Public bucket" ON → Create.
-- Step 2 (this file): Run in SQL Editor. Adds RLS policies so users
--                     can only write to / overwrite / delete objects
--                     inside their own {auth.uid}/ folder. Public
--                     read still works because the bucket is public.
-- =====================================================================

-- Safety: drop the policies first so this script is re-runnable.
drop policy if exists "covers_insert_own_folder" on storage.objects;
drop policy if exists "covers_update_own_folder" on storage.objects;
drop policy if exists "covers_delete_own_folder" on storage.objects;

-- Authenticated users may upload objects under their {auth.uid}/ prefix.
create policy "covers_insert_own_folder" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "covers_update_own_folder" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "covers_delete_own_folder" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
