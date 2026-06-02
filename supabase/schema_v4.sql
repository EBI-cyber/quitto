-- ============================================================
--  Quitto — Migration v4: Push-Abos (Web Push)
--  In Supabase: SQL Editor -> New query -> einfügen -> Run
-- ============================================================

create table if not exists public.push_subscriptions (
  endpoint     text primary key,
  user_email   text not null,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Jeder verwaltet nur seine eigenen Abos (per E-Mail aus dem Token)
drop policy if exists "ps_insert_own" on public.push_subscriptions;
create policy "ps_insert_own" on public.push_subscriptions
  for insert with check (lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "ps_update_own" on public.push_subscriptions;
create policy "ps_update_own" on public.push_subscriptions
  for update using (lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "ps_select_own" on public.push_subscriptions;
create policy "ps_select_own" on public.push_subscriptions
  for select using (lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "ps_delete_own" on public.push_subscriptions;
create policy "ps_delete_own" on public.push_subscriptions
  for delete using (lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Die Edge Function liest mit dem service_role-Key (umgeht RLS) und sendet Push.
