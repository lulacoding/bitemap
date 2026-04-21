-- Phase 11: product analytics opt-out on profiles + enforce create_catch rate limit (60 / 60s).

alter table public.profiles
  add column if not exists analytics_opt_out boolean not null default false;

comment on column public.profiles.analytics_opt_out is
  'When true, client must not send PostHog (or similar) events for this user.';

-- Rate limit: max 60 new catches per user per rolling 60-second window.
create or replace function public.enforce_create_catch_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
begin
  v_total := public.rate_limit_hit(new.user_id, 'create_catch', 60);
  if v_total > 60 then
    raise exception 'rate_limit: you are posting catches too quickly. Please wait a minute and try again.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists catches_rate_limit_before_insert on public.catches;
create trigger catches_rate_limit_before_insert
  before insert on public.catches
  for each row
  execute function public.enforce_create_catch_rate_limit();
