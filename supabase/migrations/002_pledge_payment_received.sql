-- Run this in Supabase SQL Editor after 001_initial.sql

alter table public.pledges
  add column if not exists payment_received boolean not null default false;

create policy "Admins can update pledges"
  on public.pledges for update
  to authenticated
  using (true);

create policy "Admins can delete pledges"
  on public.pledges for delete
  to authenticated
  using (true);
