-- Phase 8: profile extras for gap-inject features
--
-- - photo_backup_enabled: opt-in persistence for catch photos in Storage
--   (default false per free-forever + privacy-by-default principle)
-- - bio, location, is_guide, is_verified: public profile fields needed by
--   the mobile + web profile screens
-- - avatars storage bucket: public-read avatar assets

alter table public.profiles
  add column if not exists bio text check (char_length(bio) <= 280),
  add column if not exists location text check (char_length(location) <= 80),
  add column if not exists is_guide boolean not null default false,
  add column if not exists is_verified boolean not null default false,
  add column if not exists photo_backup_enabled boolean not null default false,
  add column if not exists email_verified_at timestamptz;

-- Public-read storage bucket for avatars (user keyed).
-- Safe because avatar URLs are already rendered publicly on profile pages.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- RLS on the bucket: each user can only write to paths starting with their uid
drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select to authenticated, anon using (bucket_id = 'avatars');

drop policy if exists avatars_own_write on storage.objects;
create policy avatars_own_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists avatars_own_update on storage.objects;
create policy avatars_own_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists avatars_own_delete on storage.objects;
create policy avatars_own_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = split_part(name, '/', 1)
  );
