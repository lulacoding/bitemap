-- Phase 10: Leaderboards
--
-- Materialised views refreshed every 10 min by pg_cron. Ranks by catch_count
-- DESC with best_size_mm tiebreak. Current-month scope keeps the MV cheap.

-- By species (current month)
drop materialized view if exists public.leaderboard_by_species;
create materialized view public.leaderboard_by_species as
select
  c.species_id,
  c.user_id,
  count(*)::int as catch_count,
  max(c.size_mm) as best_size_mm,
  date_trunc('month', now()) as month
from public.catches c
where c.is_hidden = false
  and c.privacy_level <> 'hidden'
  and c.created_at >= date_trunc('month', now())
group by c.species_id, c.user_id;

create index if not exists lb_species_rank_idx
  on public.leaderboard_by_species (species_id, catch_count desc, best_size_mm desc nulls last);

-- Overall (current month, regardless of species)
drop materialized view if exists public.leaderboard_overall;
create materialized view public.leaderboard_overall as
select
  c.user_id,
  count(*)::int as catch_count,
  count(distinct c.species_id)::int as species_count,
  max(c.size_mm) as best_size_mm,
  date_trunc('month', now()) as month
from public.catches c
where c.is_hidden = false
  and c.privacy_level <> 'hidden'
  and c.created_at >= date_trunc('month', now())
group by c.user_id;

create index if not exists lb_overall_rank_idx
  on public.leaderboard_overall (catch_count desc, species_count desc, best_size_mm desc nulls last);

-- By Port Phillip Bay (lat -38.5..-37.7, lng 144.4..145.1)
drop materialized view if exists public.leaderboard_port_phillip;
create materialized view public.leaderboard_port_phillip as
select
  c.user_id,
  count(*)::int as catch_count,
  max(c.size_mm) as best_size_mm,
  date_trunc('month', now()) as month
from public.catches c
where c.is_hidden = false
  and c.privacy_level <> 'hidden'
  and c.created_at >= date_trunc('month', now())
  and c.lat between -38.5 and -37.7
  and c.lng between 144.4 and 145.1
group by c.user_id;

create index if not exists lb_pp_rank_idx
  on public.leaderboard_port_phillip (catch_count desc, best_size_mm desc nulls last);

-- Refresh function + pg_cron schedule (every 10 min)
create or replace function public.refresh_leaderboards() returns void language plpgsql as $$
begin
  refresh materialized view public.leaderboard_by_species;
  refresh materialized view public.leaderboard_overall;
  refresh materialized view public.leaderboard_port_phillip;
end;
$$;

-- Schedule only if pg_cron extension is present (local dev may not have it)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'refresh-leaderboards',
      '*/10 * * * *',
      $cron$select public.refresh_leaderboards();$cron$
    );
  end if;
end $$;
