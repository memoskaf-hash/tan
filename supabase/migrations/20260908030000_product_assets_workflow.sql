-- Product assets and review workflow.
insert into storage.buckets (id, name, public)
values ('product-assets', 'product-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "product assets public read" on storage.objects;
create policy "product assets public read" on storage.objects
  for select using (bucket_id = 'product-assets');

drop policy if exists "product assets seller upload" on storage.objects;
create policy "product assets seller upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-assets'
    and exists (select 1 from public.vendors where user_id = auth.uid())
  );

drop policy if exists "product assets seller update" on storage.objects;
create policy "product assets seller update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-assets' and owner = auth.uid())
  with check (bucket_id = 'product-assets' and owner = auth.uid());

drop policy if exists "product assets seller delete" on storage.objects;
create policy "product assets seller delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-assets' and owner = auth.uid());

alter table public.products add column if not exists updated_at timestamptz not null default now();
alter table public.products add column if not exists rejection_reason text;

drop policy if exists "seller manage own digital files" on public.digital_files;
create policy "seller manage own digital files" on public.digital_files for all to authenticated
  using (product_id in (select id from public.products where vendor_id in (select id from public.vendors where user_id = auth.uid())))
  with check (product_id in (select id from public.products where vendor_id in (select id from public.vendors where user_id = auth.uid())));
