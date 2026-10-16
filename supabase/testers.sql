create table if not exists public.testers (
  id bigint generated always as identity primary key,
  email text not null check (char_length(email) <= 120 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  name text check (name is null or char_length(name) <= 80),
  created_at timestamptz not null default now()
);

create unique index if not exists testers_email_key on public.testers (lower(email));

alter table public.testers enable row level security;

drop policy if exists "Anyone can sign up as tester" on public.testers;
create policy "Anyone can sign up as tester"
  on public.testers
  for insert
  to anon
  with check (true);

revoke select, update, delete on public.testers from anon;
grant insert on public.testers to anon;
