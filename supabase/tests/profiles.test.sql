begin;
select plan(4);

select has_table('public', 'profiles', 'profiles table exists');
select col_is_pk('public', 'profiles', 'id', 'id is PK');
select col_is_unique('public', 'profiles', 'username', 'username is unique');
select has_function('public', 'handle_new_user', 'handle_new_user trigger function exists');

select * from finish();
rollback;
