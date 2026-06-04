# Quitto — Projektkontext

> Mobile PWA als digitaler **Quittungsblock**: Bar-Einnahmen (Rechnung) & Bar-Ausgaben (Auszahlung)
> mit **Unterschrift**, **Kassenbuch** und **Putzkraft-Zugang** (read-only, Beleg unterschreiben aus der Ferne).

## Stack
- Vite + React 18 + TailwindCSS 3 + Framer-Motion
- Dexie (offline-first) + Token-basierter Cloud-Sync zu Supabase
- vite-plugin-pwa (**injectManifest**, eigener Service Worker `src/sw.js`) — wegen **Web Push**
- HashRouter, `base: '/quitto/'`
- Icons: wird auf **lucide-react** + Design-Skill `baulog-design` umgestellt

## Hosting & Deploy
- Repo: https://github.com/EBI-cyber/quitto
- Live: **https://ebi-cyber.github.io/quitto/** (GitHub Pages via Actions)
- Deploy = `git push` auf `main`. Build lokal: `npm --prefix C:/Users/eugen/Projekte/quitto run build`

## Supabase (geteiltes Projekt `nhlhrqxmxtacaygnydxf`)
- Auth: E-Mail/Passwort, **„Confirm email" AUS**.
- Belege-Tabelle (`owner`, `payeeEmail`, `status` u.a. `pending_signature`), Cloud-Sync in `src/lib/cloud.js`.
- **Web Push**: VAPID-Keys, Edge Function **`swift-endpoint`** (verschickt Push an die Putzkraft bei neuem Beleg — Funktion heißt aus historischen Gründen so, NICHT „notify-payee").

## Rollen
- In `App.jsx`: *owner* (Chef) vs *payee* (Putzkraft). **payee** = besitzt keine Belege, ist aber `payeeEmail` auf ≥1 Beleg → sieht **`MeineZahlungen`** (offene Belege unterschreiben + Auszahlungs-Verlauf).
- Wichtig: Putzkraft wird erst als *payee* erkannt, wenn **mind. 1 Ausgabe mit ihrer E-Mail** existiert (sonst landet sie in der Chef-Ansicht). → Erst Barzahlung erfassen, dann einladen.

## Kernfunktionen
- **Einnahme-Flow** (Rechnung/Quittung), **Ausgabe-Flow** (Bar-Auszahlung an Putzkraft).
- **Signatur** (SignaturePad), **Hash-Chain** zur Manipulationssicherheit (`src/lib/hash.js`).
- **Kassenbuch**, **Cockpit** (Auswertung), **PDF-Belege** (`src/lib/pdf.js`).
- **Putzkräfte** als Schnellauswahl in Einstellungen (Name, **E-Mail = Zugang**, Steuernr., Adresse, §19 Kleinunternehmer) → fließt als Rechnungsaussteller in den Beleg.
- **Einladung der Putzkraft**: in Einstellungen je Putzkraft Knopf **„✉ Zur App einladen"** → vorausgefüllte E-Mail (mailto) mit Link + Anleitung. Sie registriert sich mit derselben E-Mail.

## Wichtige Dateien
- `src/App.jsx` (Rolle owner/payee, Layout), `src/components/Nav.jsx`, `src/components/SignaturePad.jsx`
- `src/screens/`: `Home`, `EinnahmeFlow`, `AusgabeFlow`, `Kassenbuch`, `Cockpit`, `SettingsScreen`, `MeineZahlungen`, `Login`
- `src/lib/`: `db.js`, `cloud.js`, `push.js`, `hash.js`, `pdf.js`, `share.js`, `settings.js`, `format.js`

## Design
Aktuell eigene Farbwelt **neon `#7c5cff` / aqua `#22d3ee` / acid `#a3ff12`** (dunkel).
Wird auf den **`baulog-design`**-Skill umgestellt (lucide-Icons, IconChips, Glas-Karten, responsive Sidebar+Bottom-Nav, Gradient-Buttons) — **Farbidentität neon/aqua bleibt**, nur Struktur & Icons werden vereinheitlicht.

## Offene Punkte / Ideen
- Web-Push auf echten Handys testen (war nie final getestet).
- Reskin auf BauLog-Design (läuft).
