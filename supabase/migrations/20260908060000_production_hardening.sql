alter table public.vendors add column if not exists verification_status text not null default 'unverified'
  check (verification_status in ('unverified','pending','verified','rejected'));
alter table public.vendors add column if not exists payout_minimum numeric(12,2) not null default 25;

create table if not exists public.product_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null check (char_length(reason) between 10 and 2000),
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  admin_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.product_reports enable row level security;
alter table public.audit_logs enable row level security;
create policy "users report products" on public.product_reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy "reporters and admins read reports" on public.product_reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
create policy "admins manage reports" on public.product_reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit logs" on public.audit_logs for select to authenticated
  using (public.is_admin());
create policy "admins insert audit logs" on public.audit_logs for insert to authenticated
  with check (public.is_admin());
