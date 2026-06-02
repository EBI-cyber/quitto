-- ============================================================
--  Quitto — Migration v2: Putzkraft-Zugang
--  In Supabase: SQL Editor -> New query -> einfügen -> Run
-- ============================================================

-- E-Mail der Putzkraft am Ausgabe-Beleg (für ihren Lese-Zugang)
alter table public.belege add column if not exists payee_email text;
create index if not exists belege_payee_idx on public.belege (lower(payee_email));

-- Zusätzliche RLS-Regel: eine eingeloggte Putzkraft darf die Ausgabe-Belege
-- LESEN, die an ihre E-Mail adressiert sind (zusätzlich zur Owner-Regel).
drop policy if exists "belege_select_payee" on public.belege;
create policy "belege_select_payee" on public.belege
  for select using (
    direction = 'ausgabe'
    and payee_email is not null
    and lower(payee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
-- (Kein insert/update/delete für Putzkräfte -> reiner Lesezugriff.)
