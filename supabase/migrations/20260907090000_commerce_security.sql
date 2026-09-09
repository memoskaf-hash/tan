-- Commerce extensions. All privileged operations remain server-side.
create table if not exists public.digital_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  label text not null default 'Download',
  created_at timestamptz not null default now()
);
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 3 and 2000),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  percent_off numeric not null check (percent_off > 0 and percent_off <= 100),
  active boolean not null default true,
  expires_at timestamptz,
  max_uses integer,
  used_count integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) <= 100),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.digital_files enable row level security;
alter table public.favorites enable row level security;
alter table public.product_reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.analytics_events enable row level security;
create policy "files admin only" on public.digital_files for all to authenticated using ((auth.jwt()->>'email') = 'memoskaf@gmail.com') with check ((auth.jwt()->>'email') = 'memoskaf@gmail.com');
create policy "own favorites" on public.favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "approved reviews public" on public.product_reviews for select using (approved = true or auth.uid() = user_id);
create policy "own reviews" on public.product_reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "own analytics" on public.analytics_events for insert to authenticated with check (auth.uid() = user_id);
create policy "coupons admin only" on public.coupons for all to authenticated using ((auth.jwt()->>'email') = 'memoskaf@gmail.com') with check ((auth.jwt()->>'email') = 'memoskaf@gmail.com');
insert into storage.buckets (id, name, public) values ('digital-files', 'digital-files', false) on conflict (id) do nothing;
