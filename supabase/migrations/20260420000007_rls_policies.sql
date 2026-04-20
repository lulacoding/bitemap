-- profiles
alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

-- species (reads public; writes restricted to service_role via absence of policy)
alter table public.species enable row level security;
create policy species_read on public.species for select using (true);

-- catches
alter table public.catches enable row level security;
create policy catches_read on public.catches for select
  using (
    is_hidden = false
    and expires_at > now()
    and privacy_level <> 'hidden'
  );
create policy catches_read_own on public.catches for select
  using (auth.uid() = user_id);
create policy catches_insert_self on public.catches for insert
  with check (auth.uid() = user_id);
create policy catches_update_own on public.catches for update
  using (auth.uid() = user_id);
create policy catches_delete_own on public.catches for delete
  using (auth.uid() = user_id);

-- saved_spots (owner-only, full CRUD)
alter table public.saved_spots enable row level security;
create policy saved_spots_owner on public.saved_spots for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- catch_likes
alter table public.catch_likes enable row level security;
create policy likes_read on public.catch_likes for select using (true);
create policy likes_insert on public.catch_likes for insert with check (auth.uid() = user_id);
create policy likes_delete_own on public.catch_likes for delete using (auth.uid() = user_id);

-- catch_comments
alter table public.catch_comments enable row level security;
create policy comments_read on public.catch_comments for select using (true);
create policy comments_insert on public.catch_comments for insert with check (auth.uid() = user_id);
create policy comments_delete_own on public.catch_comments for delete using (auth.uid() = user_id);

-- follows
alter table public.follows enable row level security;
create policy follows_read on public.follows for select using (true);
create policy follows_insert on public.follows for insert with check (auth.uid() = follower_id);
create policy follows_delete_own on public.follows for delete using (auth.uid() = follower_id);
