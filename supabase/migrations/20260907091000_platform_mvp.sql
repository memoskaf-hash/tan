-- MVP platform modules: subscriptions, referrals, learning, content and operations.
create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(), name text not null, interval text not null check (interval in ('monthly','yearly')),
  price numeric not null check (price >= 0), entitlements jsonb not null default '[]', active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.membership_plans(id), status text not null default 'active',
  started_at timestamptz not null default now(), renews_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(), affiliate_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique, commission_percent numeric not null default 10, clicks integer not null default 0, conversions integer not null default 0, earnings numeric not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(), referral_id uuid not null references public.referrals(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null, event_type text not null, created_at timestamptz not null default now()
);
create table if not exists public.cart_events (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  cart jsonb not null default '[]', status text not null default 'abandoned', last_seen_at timestamptz not null default now()
);
create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, reason text not null, status text not null default 'requested', created_at timestamptz not null default now()
);
create table if not exists public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade,
  lesson_id text not null, progress integer not null default 0 check (progress between 0 and 100), completed_at timestamptz,
  primary key (user_id, product_id, lesson_id)
);
create table if not exists public.course_quizzes (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  lesson_id text not null, questions jsonb not null default '[]'
);
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade, issued_at timestamptz not null default now(), certificate_code text unique not null
);
create table if not exists public.lesson_discussions (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  lesson_id text not null, user_id uuid not null references auth.users(id) on delete cascade, body text not null, created_at timestamptz not null default now()
);
create table if not exists public.content_pages (
  id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, body text not null default '', published boolean not null default false, updated_at timestamptz not null default now()
);
create table if not exists public.email_automation_events (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
  event_type text not null, payload jsonb not null default '{}', processed_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.loyalty_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade, points integer not null default 0, updated_at timestamptz not null default now()
);
create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(), admin_id uuid references auth.users(id) on delete set null,
  action text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.backup_exports (
  id uuid primary key default gen_random_uuid(), requested_by uuid references auth.users(id) on delete set null,
  format text not null default 'json', status text not null default 'requested', created_at timestamptz not null default now()
);
alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_events enable row level security;
alter table public.cart_events enable row level security;
alter table public.refund_requests enable row level security;
alter table public.course_progress enable row level security;
alter table public.course_quizzes enable row level security;
alter table public.certificates enable row level security;
alter table public.lesson_discussions enable row level security;
alter table public.content_pages enable row level security;
alter table public.email_automation_events enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.admin_activity_log enable row level security;
alter table public.backup_exports enable row level security;
create policy "plans are public" on public.membership_plans for select using (active = true);
create policy "own membership" on public.memberships for select to authenticated using (auth.uid() = user_id);
create policy "own referrals" on public.referrals for all to authenticated using (auth.uid() = affiliate_id) with check (auth.uid() = affiliate_id);
create policy "own cart events" on public.cart_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own refunds" on public.refund_requests for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own progress" on public.course_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own certificates" on public.certificates for select to authenticated using (auth.uid() = user_id);
create policy "discussion read" on public.lesson_discussions for select using (true);
create policy "discussion write" on public.lesson_discussions for insert to authenticated with check (auth.uid() = user_id);
create policy "published content public" on public.content_pages for select using (published = true);
create policy "own loyalty" on public.loyalty_accounts for select to authenticated using (auth.uid() = user_id);
create policy "admin content" on public.content_pages for all to authenticated using ((auth.jwt()->>'email') = 'memoskaf@gmail.com') with check ((auth.jwt()->>'email') = 'memoskaf@gmail.com');
create policy "admin operations" on public.admin_activity_log for all to authenticated using ((auth.jwt()->>'email') = 'memoskaf@gmail.com') with check ((auth.jwt()->>'email') = 'memoskaf@gmail.com');
create policy "admin exports" on public.backup_exports for all to authenticated using ((auth.jwt()->>'email') = 'memoskaf@gmail.com') with check ((auth.jwt()->>'email') = 'memoskaf@gmail.com');
