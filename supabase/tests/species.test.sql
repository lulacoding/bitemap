begin;
select plan(5);

select has_table('public', 'species', 'species table exists');
select has_column('public', 'species', 'common_name', 'common_name column exists');
select has_column('public', 'species', 'min_legal_size_mm', 'min_legal_size_mm column exists');
select has_column('public', 'species', 'bag_limit', 'bag_limit column exists');
select col_not_null('public', 'species', 'common_name', 'common_name is NOT NULL');

select * from finish();
rollback;
