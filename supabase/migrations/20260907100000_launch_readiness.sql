-- Additive launch hardening. Apply with `supabase db push`; this migration is non-destructive.
alter table public.orders add column if not exists provider text;
alter table public.orders add column if not exists provider_reference text;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('pending','paid','confirmed','payment_failed','refunded','cancelled'));
create unique index if not exists orders_provider_reference_idx on public.orders(provider, provider_reference) where provider_reference is not null;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((auth.jwt()->'app_metadata'->>'role') in ('admin','super_admin'), false) $$;

drop policy if exists "admin manage products" on public.products;
create policy "admin manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "files admin only" on public.digital_files;
create policy "files admin only" on public.digital_files for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "coupons admin only" on public.coupons;
create policy "coupons admin only" on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin content" on public.content_pages;
create policy "admin content" on public.content_pages for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin operations" on public.admin_activity_log;
create policy "admin operations" on public.admin_activity_log for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin exports" on public.backup_exports;
create policy "admin exports" on public.backup_exports for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "own reviews" on public.product_reviews;
create policy "own reviews" on public.product_reviews for insert to authenticated with check (auth.uid() = user_id and approved = false);
create policy "admin review moderation" on public.product_reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.set_paid_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('paid','confirmed') and old.status not in ('paid','confirmed') then new.paid_at = coalesce(new.paid_at, now()); end if;
  return new;
end $$;
drop trigger if exists orders_paid_at on public.orders;
create trigger orders_paid_at before update on public.orders for each row execute function public.set_paid_at();
