create table public.catch_likes (
  catch_id uuid references public.catches(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (catch_id, user_id)
);

create index catch_likes_user_idx on public.catch_likes(user_id);

create table public.catch_comments (
  id uuid primary key default gen_random_uuid(),
  catch_id uuid not null references public.catches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index catch_comments_catch_idx on public.catch_comments(catch_id);
create index catch_comments_user_idx on public.catch_comments(user_id);

create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index follows_following_idx on public.follows(following_id);

create or replace function public.inc_catch_likes() returns trigger
language plpgsql as $$
begin
  update public.catches set like_count = like_count + 1 where id = new.catch_id;
  return new;
end;
$$;

create trigger trg_inc_catch_likes
  after insert on public.catch_likes
  for each row execute function public.inc_catch_likes();

create or replace function public.dec_catch_likes() returns trigger
language plpgsql as $$
begin
  update public.catches set like_count = greatest(like_count - 1, 0) where id = old.catch_id;
  return old;
end;
$$;

create trigger trg_dec_catch_likes
  after delete on public.catch_likes
  for each row execute function public.dec_catch_likes();

create or replace function public.inc_catch_comments() returns trigger
language plpgsql as $$
begin
  update public.catches set comment_count = comment_count + 1 where id = new.catch_id;
  return new;
end;
$$;

create trigger trg_inc_catch_comments
  after insert on public.catch_comments
  for each row execute function public.inc_catch_comments();

create or replace function public.dec_catch_comments() returns trigger
language plpgsql as $$
begin
  update public.catches set comment_count = greatest(comment_count - 1, 0) where id = old.catch_id;
  return old;
end;
$$;

create trigger trg_dec_catch_comments
  after delete on public.catch_comments
  for each row execute function public.dec_catch_comments();
