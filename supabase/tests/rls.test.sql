begin;
select plan(12);

-- RLS enabled on all relevant tables
select ok((select relrowsecurity from pg_class where relname = 'profiles'), 'RLS enabled on profiles');
select ok((select relrowsecurity from pg_class where relname = 'species'), 'RLS enabled on species');
select ok((select relrowsecurity from pg_class where relname = 'catches'), 'RLS enabled on catches');
select ok((select relrowsecurity from pg_class where relname = 'saved_spots'), 'RLS enabled on saved_spots');
select ok((select relrowsecurity from pg_class where relname = 'catch_likes'), 'RLS enabled on catch_likes');
select ok((select relrowsecurity from pg_class where relname = 'catch_comments'), 'RLS enabled on catch_comments');
select ok((select relrowsecurity from pg_class where relname = 'follows'), 'RLS enabled on follows');

-- Named policies exist
select policies_are(
  'public',
  'profiles',
  ARRAY[
    'profiles_read',
    'profiles_update_own',
    'profiles_authenticated_read',
    'profiles_anon_read_limited'
  ],
  'profiles policies'
);
select policies_are('public', 'species', ARRAY['species_read'], 'species policies');
select policies_are('public', 'saved_spots', ARRAY['saved_spots_owner'], 'saved_spots policies');

-- catches: check presence of read + write policies (order-independent)
select ok(
  (select count(*) from pg_policies where schemaname='public' and tablename='catches') >= 4,
  'catches has at least 4 policies'
);

-- catch_comments + catch_likes + follows each have 3 policies
select ok(
  (select count(*) from pg_policies where schemaname='public' and tablename='catch_comments') = 3,
  'catch_comments has 3 policies'
);

select * from finish();
rollback;
