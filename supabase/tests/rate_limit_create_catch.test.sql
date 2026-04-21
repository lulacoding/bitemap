-- Phase 11: create_catch rate limit — 60 inserts / 60s OK, 61st rejected.

begin;
select plan(2);

insert into auth.users (id, email, instance_id, aud, role)
  values (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ratelimit@example.test',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
  )
  on conflict (id) do nothing;

insert into public.profiles (id, username, home_state)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'rate_limit_user', 'VIC')
  on conflict (id) do nothing;

set local role authenticated;
set local "request.jwt.claims" to
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

do $$
declare
  sid uuid;
  i int;
begin
  select id into sid from public.species where common_name ilike 'Snapper%' limit 1;
  for i in 1..60 loop
    insert into public.catches (user_id, species_id, quantity, lat, lng, privacy_level)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', sid, 1, -38.1, 144.85, 'exact');
  end loop;
end $$;

select is(
  (
    select count(*)::int
    from public.catches
    where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  60,
  '60 catches in one burst succeed'
);

select throws_like(
  $q$
    insert into public.catches (user_id, species_id, quantity, lat, lng, privacy_level)
    select
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
      id,
      1,
      -38.1,
      144.85,
      'exact'
    from public.species
    where common_name ilike 'Snapper%'
    limit 1
  $q$,
  '%rate_limit%',
  '61st catch in same window is rejected'
);

select * from finish();
rollback;
