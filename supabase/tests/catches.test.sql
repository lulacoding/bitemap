begin;
select plan(6);

select has_table('public', 'catches', 'catches table exists');
select has_column('public', 'catches', 'lat', 'lat column exists');
select has_column('public', 'catches', 'privacy_level', 'privacy_level column exists');
select has_column('public', 'catches', 'expires_at', 'expires_at column exists');
select col_type_is('public', 'catches', 'privacy_level', 'text', 'privacy_level is text');
select col_not_null('public', 'catches', 'user_id', 'user_id is NOT NULL');

select * from finish();
rollback;
