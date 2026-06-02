-- ============================================================
--  Quitto — Datenbank-Schema & Sicherheit
--  Ausführen in Supabase: Dashboard -> SQL Editor -> New query
--  -> diesen Inhalt einfügen -> "Run"
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.belege (
  id                 uuid primary key default gen_random_uuid(),
  owner              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  number             text not null,
  token              text not null unique,
  direction          text not null check (direction in ('einnahme','ausgabe')),
  beleg_date         date,
  items              jsonb not null default '[]'::jsonb,
  total              numeric(12,2) not null default 0,
  customer           jsonb,
  signature_data_url text,
  signer_name        text,
  payment_method     text default 'bar',
  tax_mode           text,
  vat_rate           numeric,
  prev_hash          text,
  hash               text not null,
  device             text,
  created_at         timestamptz not null default now()
);

-- Zeilen-Sicherheit: jeder sieht/ändert nur seine eigenen Belege
alter table public.belege enable row level security;

create policy "belege_select_own" on public.belege
  for select using (auth.uid() = owner);

create policy "belege_insert_own" on public.belege
  for insert with check (auth.uid() = owner);

create policy "belege_update_own" on public.belege
  for update using (auth.uid() = owner);

-- BEWUSST keine DELETE-Policy: Belege sind unveränderbar (GoBD / Nachvollziehbarkeit)

create index if not exists belege_owner_created_idx
  on public.belege (owner, created_at desc);

-- ============================================================
--  Hinweis: Die App meldet sich künftig per Login (Supabase Auth)
--  an, damit auth.uid() gesetzt ist. Email/Push/Online-Einsicht
--  kommen als Edge Functions in der nächsten Phase.
-- ============================================================
