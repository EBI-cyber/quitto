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
- **Wohnung / Objekt**: pro Rechnung (Einnahme UND Ausgabe) auswählbar — „welche Wohnung wurde gereinigt?" (Chips aus `s.objekte` + Freitext, neue werden automatisch gemerkt). Steht auf der Rechnung (PDF, „Objekt: …") und im Kassenbuch. Verwaltung in Einstellungen → „Wohnungen / Objekte".

## Wichtige Dateien
- `src/App.jsx` (Rolle owner/payee, Layout + Flows als Vollbild ohne Bottom-Bar), `src/components/Nav.jsx` (Sidebar+Bottom), `src/components/SignaturePad.jsx`
- `src/screens/`: `Home`, `EinnahmeFlow`, `AusgabeFlow`, `Kassenbuch`, `Cockpit`, `SettingsScreen`, `MeineZahlungen`, `Login`
- `src/lib/`: `db.js`, `cloud.js`, `push.js`, `hash.js`, `pdf.js`, `share.js`, `settings.js` (enthält `objekte`), `format.js`
- `src/ui/`: `IconChip.jsx`, `MoneyChip.jsx`

## Design (umgesetzt)
- Folgt dem Skill **`baulog-design`**: lucide-Icons, Glas-Karten mit Hover, responsive **Sidebar (Desktop) + Bottom-Bar (Mobile)**, Gradient-Buttons. **Farbidentität neon/aqua/acid bleibt.**
- **Finanz-Logik konsistent:** `MoneyChip` = **Einnahme grün ↑ / Ausgabe rot ↓** (gefüllter Gradient-Kreis, weißes Trend-Icon, Glow) in Home, Cockpit, Kassenbuch; Beträge grün/rot + `tabular-nums`.
- **Mobile sauber:** Safe-Areas (Notch/Home-Leiste), Flows als Vollbild ohne Bottom-Bar (keine Button-Überlappung), `min-w-0`/`shrink-0` gegen Abschneiden, `overflow-x: hidden`.

## Offene Punkte / Ideen
- Web-Push auf echten Handys testen (war nie final getestet).
- Ggf. weitere Icons auf den „Profi-Badge"-Stil von `MoneyChip` heben, wenn gewünscht.
