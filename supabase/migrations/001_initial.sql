-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pledges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  amount numeric(12, 2) not null check (amount > 0),
  event_id uuid not null references public.events (id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.pledges enable row level security;

-- Public can read active events
create policy "Anyone can view active events"
  on public.events for select
  using (is_active = true);

-- Admins can manage all events
create policy "Admins can view all events"
  on public.events for select
  to authenticated
  using (true);

create policy "Admins can insert events"
  on public.events for insert
  to authenticated
  with check (true);

create policy "Admins can update events"
  on public.events for update
  to authenticated
  using (true);

create policy "Admins can delete events"
  on public.events for delete
  to authenticated
  using (true);

-- Public can submit pledges
create policy "Anyone can submit pledges"
  on public.pledges for insert
  with check (true);

-- Admins can view pledges
create policy "Admins can view pledges"
  on public.pledges for select
  to authenticated
  using (true);

-- Seed sample events
insert into public.events (name, sort_order) values
  ('General Fund', 1),
  ('Spring Gala 2026', 2);
