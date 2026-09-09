-- Production vendor/affiliate ledger. All monetary values are server calculated.
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null,
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  payout_currency text not null default 'USD',
  payout_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.commission_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_sales numeric(12,2) not null default 0 check (min_sales >= 0),
  max_sales numeric(12,2) check (max_sales is null or max_sales > min_sales),
  platform_cut_percent numeric(5,2) not null check (platform_cut_percent between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.referral_clicks (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  visitor_hash text not null,
  ip_hash text,
  user_agent_hash text,
  landing_path text,
  created_at timestamptz not null default now(),
  unique(referral_id, visitor_hash, created_at)
);
create table if not exists public.affiliate_sales (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id),
  vendor_id uuid not null references public.vendors(id),
  order_id uuid not null references public.orders(id),
  customer_id uuid references auth.users(id),
  status text not null default 'pending' check (status in ('pending','approved','reversed','rejected')),
  currency text not null default 'USD',
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  platform_fee_amount numeric(12,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  exchange_rate numeric(18,8) not null default 1,
  tier_id uuid references public.commission_tiers(id),
  idempotency_key text not null unique,
  attributed_at timestamptz not null default now(),
  approved_at timestamptz,
  reversed_at timestamptz
);
create table if not exists public.commission_ledger (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id),
  affiliate_sale_id uuid references public.affiliate_sales(id),
  entry_type text not null check (entry_type in ('credit','debit','payout','clawback','adjustment')),
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','available','paid','void')),
  description text not null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD',
  status text not null default 'requested' check (status in ('requested','processing','paid','failed','cancelled')),
  provider_reference text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);
create table if not exists public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id),
  referral_id uuid references public.referrals(id),
  affiliate_sale_id uuid references public.affiliate_sales(id),
  reason text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.referrals add column if not exists vendor_id uuid references public.vendors(id);
alter table public.referrals add column if not exists coupon_code text;
alter table public.referrals add column if not exists status text not null default 'active';
create unique index if not exists referrals_coupon_code_idx on public.referrals(coupon_code) where coupon_code is not null;
create index if not exists referral_clicks_referral_created_idx on public.referral_clicks(referral_id, created_at desc);
create index if not exists affiliate_sales_vendor_status_idx on public.affiliate_sales(vendor_id, status);

insert into public.commission_tiers(name,min_sales,max_sales,platform_cut_percent)
select 'Baseline',0,100,15 where not exists (select 1 from public.commission_tiers);
insert into public.commission_tiers(name,min_sales,max_sales,platform_cut_percent)
select 'Growth',101,500,12 where not exists (select 1 from public.commission_tiers where name = 'Growth');
insert into public.commission_tiers(name,min_sales,max_sales,platform_cut_percent)
select 'Scale',501,null,8 where not exists (select 1 from public.commission_tiers where name = 'Scale');

alter table public.vendors enable row level security;
alter table public.commission_tiers enable row level security;
alter table public.referral_clicks enable row level security;
alter table public.affiliate_sales enable row level security;
alter table public.commission_ledger enable row level security;
alter table public.payouts enable row level security;
alter table public.fraud_flags enable row level security;

create policy "vendors view own" on public.vendors for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "tiers are public" on public.commission_tiers for select using (active = true);
drop policy if exists "own referrals" on public.referrals;
create policy "referrals view own" on public.referrals for select to authenticated using (affiliate_id = auth.uid() or public.is_admin());
create policy "sales view own vendor" on public.affiliate_sales for select to authenticated
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()) or public.is_admin());
create policy "ledger view own vendor" on public.commission_ledger for select to authenticated
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()) or public.is_admin());
create policy "payouts view own vendor" on public.payouts for select to authenticated
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()) or public.is_admin());
create policy "payout requests own vendor" on public.payouts for insert to authenticated
  with check (vendor_id in (select id from public.vendors where user_id = auth.uid()));
create policy "fraud admin only" on public.fraud_flags for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Service-role only writes are intentional: never accept commission values from a browser.
revoke all on public.commission_tiers from anon, authenticated;
grant select on public.commission_tiers to anon, authenticated;
revoke insert, update, delete on public.referral_clicks, public.affiliate_sales, public.commission_ledger, public.fraud_flags from anon, authenticated;

create or replace function public.evaluate_affiliate_tier(p_gross numeric)
returns table(tier_id uuid, platform_cut_percent numeric)
language sql stable security definer set search_path = public as $$
  select id, platform_cut_percent from public.commission_tiers
  where active and min_sales <= p_gross and (max_sales is null or p_gross <= max_sales)
  order by min_sales desc limit 1
$$;
