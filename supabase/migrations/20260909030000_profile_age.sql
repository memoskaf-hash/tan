alter table public.profiles add column if not exists age integer check (age between 13 and 120);
