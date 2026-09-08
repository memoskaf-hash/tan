create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "own notifications read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.notify_conversation_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare recipient uuid;
begin
  select case when c.buyer_id = new.sender_id then c.seller_id else c.buyer_id end into recipient
  from public.conversations c where c.id = new.conversation_id;
  if recipient is not null then
    insert into public.notifications(user_id, kind, title, body, href)
    values (recipient, 'message', 'رسالة جديدة', left(new.body, 120), '/messages');
  end if;
  return new;
end $$;
drop trigger if exists conversation_message_notification on public.conversation_messages;
create trigger conversation_message_notification after insert on public.conversation_messages for each row execute function public.notify_conversation_message();
