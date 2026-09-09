-- Seller onboarding and self-service product management.
alter table public.products add column if not exists vendor_id uuid references public.vendors(id) on delete set null;

create index if not exists products_vendor_id_idx on public.products(vendor_id);

drop policy if exists "vendors create own" on public.vendors;
create policy "vendors create own" on public.vendors for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "vendors update own" on public.vendors;
create policy "vendors update own" on public.vendors for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "vendors delete own" on public.vendors;
create policy "vendors delete own" on public.vendors for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "seller manage own products" on public.products for all to authenticated
  using (
    vendor_id in (select id from public.vendors where user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    vendor_id in (select id from public.vendors where user_id = auth.uid())
    or public.is_admin()
  );
