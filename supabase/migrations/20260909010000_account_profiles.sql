alter table public.profiles add column if not exists account_type text not null default 'buyer' check (account_type in ('buyer', 'seller'));
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists country text;

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

drop policy if exists "avatar upload own folder" on storage.objects;
create policy "avatar upload own folder" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar update own folder" on storage.objects;
create policy "avatar update own folder" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects for select using (bucket_id = 'avatars');
