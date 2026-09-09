alter table public.products add column if not exists submitted_by uuid references auth.users(id) on delete set null;
alter table public.products add column if not exists video_url text;
alter table public.products add column if not exists approval_status text not null default 'approved'
  check (approval_status in ('pending', 'approved', 'rejected'));

update public.products set approval_status = 'approved' where approval_status is null;

drop policy if exists "products public read" on public.products;
create policy "approved products public read" on public.products for select using (approval_status = 'approved' or auth.uid() = submitted_by or public.is_admin());

drop policy if exists "buyer submit products" on public.products;
create policy "buyer submit products" on public.products for insert to authenticated
with check (auth.uid() = submitted_by and approval_status = 'pending');

drop policy if exists "submitter view own products" on public.products;
create policy "submitter view own products" on public.products for select to authenticated
using (auth.uid() = submitted_by or public.is_admin());

drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects for select using (bucket_id = 'avatars');
