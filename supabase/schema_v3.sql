-- ============================================================
--  Quitto — Migration v3: Remote-Unterschrift (Putzkraft unterschreibt selbst)
--  In Supabase: SQL Editor -> New query -> einfügen -> Run
-- ============================================================

-- Status: 'signed' (fertig) oder 'pending_signature' (wartet auf Unterschrift der Putzkraft)
alter table public.belege add column if not exists status text not null default 'signed';

-- Putzkraft darf ihren noch offenen Ausgabe-Beleg AKTUALISIEREN (Unterschrift eintragen)
drop policy if exists "belege_update_payee_sign" on public.belege;
create policy "belege_update_payee_sign" on public.belege
  for update
  using (
    direction = 'ausgabe'
    and status = 'pending_signature'
    and lower(payee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    direction = 'ausgabe'
    and lower(payee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
