alter table public.profiles add column if not exists account_type text not null default 'buyer' check (account_type in ('buyer', 'seller'));
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists country text;

create or replace function public.handle_new_account_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  profile_type text := coalesce(new.raw_user_meta_data->>'account_type', 'buyer');
begin
  insert into public.profiles (id, full_name, account_type, bio, country, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    case when profile_type = 'seller' then 'seller' else 'buyer' end,
    new.raw_user_meta_data->>'bio',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
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

drop trigger if exists on_auth_user_created_account_profile on auth.users;
create trigger on_auth_user_created_account_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_account_profile();

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

drop policy if exists "avatar upload own folder" on storage.objects;
create policy "avatar upload own folder" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar update own folder" on storage.objects;
create policy "avatar update own folder" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects for select using (bucket_id = 'avatars');
