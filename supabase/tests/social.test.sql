begin;
select plan(7);

select has_table('public', 'catch_likes', 'catch_likes table exists');
select has_table('public', 'catch_comments', 'catch_comments table exists');
select has_table('public', 'follows', 'follows table exists');
select has_table('public', 'saved_spots', 'saved_spots table exists');
select has_function('public', 'inc_catch_likes', 'inc_catch_likes trigger function exists');
select has_function('public', 'dec_catch_likes', 'dec_catch_likes trigger function exists');
select has_function('public', 'inc_catch_comments', 'inc_catch_comments trigger function exists');

select * from finish();
rollback;
