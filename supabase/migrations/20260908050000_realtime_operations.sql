alter table public.conversation_messages add column if not exists read_at timestamptz;
alter table public.conversations replica identity full;
alter table public.conversation_messages replica identity full;
alter table public.disputes replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.conversations, public.conversation_messages, public.disputes, public.notifications;
exception when duplicate_object then null;
end $$;
