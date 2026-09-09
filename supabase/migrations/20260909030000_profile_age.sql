alter table public.profiles add column if not exists age integer check (age between 13 and 120);

create or replace function public.handle_new_account_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
	profile_type text := coalesce(new.raw_user_meta_data->>'account_type', 'buyer');
begin
	insert into public.profiles (id, full_name, age, account_type, bio, country, avatar_url)
	values (
		new.id,
		new.raw_user_meta_data->>'full_name',
		nullif(new.raw_user_meta_data->>'age', '')::integer,
		case when profile_type = 'seller' then 'seller' else 'buyer' end,
		new.raw_user_meta_data->>'bio',
		new.raw_user_meta_data->>'country',
		new.raw_user_meta_data->>'avatar_url'
	)
	on conflict (id) do update set
		full_name = excluded.full_name,
		age = excluded.age,
		account_type = excluded.account_type,
		bio = excluded.bio,
		country = excluded.country;
	if profile_type = 'seller' then
		insert into public.vendors (user_id, business_name)
		values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'متجر جديد'))
		on conflict (user_id) do nothing;
	end if;
	return new;
end;
$$;
