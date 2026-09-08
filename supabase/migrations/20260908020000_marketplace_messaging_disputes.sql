-- Buyer/seller messaging, product review workflow, and admin-mediated disputes.
alter table public.products add column if not exists approval_status text not null default 'pending'
  check (approval_status in ('pending','approved','rejected'));
alter table public.products add column if not exists review_note text;
alter table public.products add column if not exists image_urls jsonb not null default '[]';
update public.products set approval_status = 'approved' where approval_status is null;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open','closed','under_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id, product_id, buyer_id, seller_id)
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  opened_by uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 10 and 2000),
  status text not null default 'open' check (status in ('open','investigating','resolved','rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists conversation_messages_conversation_idx on public.conversation_messages(conversation_id, created_at);
create index if not exists disputes_status_idx on public.disputes(status, created_at);

alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.disputes enable row level security;

create policy "conversation participants read" on public.conversations for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
create policy "buyers start conversations" on public.conversations for insert to authenticated
  with check (buyer_id = auth.uid());
create policy "participants update conversations" on public.conversations for update to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin())
  with check (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

create policy "conversation messages participants read" on public.conversation_messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or public.is_admin())
  ));
create policy "conversation participants send" on public.conversation_messages for insert to authenticated
  with check (
    sender_id = auth.uid() and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or public.is_admin())
    )
  );

create policy "dispute parties read" on public.disputes for select to authenticated
  using (opened_by = auth.uid() or exists (
    select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ) or public.is_admin());
create policy "parties open disputes" on public.disputes for insert to authenticated
  with check (opened_by = auth.uid() and exists (
    select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ));
create policy "admin manage disputes" on public.disputes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products public read" on public.products;
create policy "approved products public read" on public.products for select using (
  approval_status = 'approved'
  or vendor_id in (select id from public.vendors where user_id = auth.uid())
  or public.is_admin()
);
