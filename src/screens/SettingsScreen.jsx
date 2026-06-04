import { useState } from 'react'
import { X, LogOut, Send } from 'lucide-react'
import { loadSettings, saveSettings } from '../lib/settings'
import { useAuth } from '../lib/auth'

// Putzkraft per E-Mail zur App einladen (öffnet Mail mit fertigem Empfänger + Text)
async function sendCleanerInvite(name, email) {
  const url = location.origin + import.meta.env.BASE_URL
  const subject = 'Einladung zu Quitto'
  const text =
    'Hallo' + (name ? ' ' + name : '') + '! Ab jetzt bekommst du deine Bar-Quittungen digital über Quitto.\n\n' +
    '1) Öffne ' + url + '\n' +
    '2) Registriere dich mit genau dieser E-Mail: ' + email + '\n' +
    '3) Du siehst dann offene Belege zum Unterschreiben und alle bisherigen Auszahlungen.\n\n' +
    'Viele Grüße'
  try { await navigator.clipboard.writeText(text) } catch {}
  window.location.href = 'mailto:' + encodeURIComponent(email) +
    '?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(text)
}

function Field({ label, value, onChange, type = 'text', ph }) {
  return (
    <label className="block mb-3">
      <span className="text-white/50 text-xs">{label}</span>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-neon"
      />
    </label>
  )
}

export default function SettingsScreen() {
  const { user, isCloudReady, signOut } = useAuth()
  const [s, setS] = useState(loadSettings())
  const [savedMsg, setSavedMsg] = useState(false)
  const upd = (k, v) => setS((p) => ({ ...p, [k]: v }))
  const updService = (i, k, v) => setS((p) => ({ ...p, services: p.services.map((sv, idx) => (idx === i ? { ...sv, [k]: v } : sv)) }))
  const addService = () => setS((p) => ({ ...p, services: [...(p.services || []), { label: '', price: 0 }] }))
  const removeService = (i) => setS((p) => ({ ...p, services: p.services.filter((_, idx) => idx !== i) }))
  const onLogo = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => upd('logoDataUrl', reader.result)
    reader.readAsDataURL(f)
  }
  const updPayee = (i, k, v) => setS((p) => ({ ...p, payees: (p.payees || []).map((pv, idx) => (idx === i ? { ...pv, [k]: v } : pv)) }))
  const addPayee = () => setS((p) => ({ ...p, payees: [...(p.payees || []), { name: '' }] }))
  const removePayee = (i) => setS((p) => ({ ...p, payees: (p.payees || []).filter((_, idx) => idx !== i) }))
  const save = () => {
    saveSettings(s)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 1500)
  }

  return (
    <div className="px-6 md:px-8 pt-10 md:pt-12 pb-6 max-w-2xl">
      <h2 className="text-3xl md:text-4xl font-extrabold grad-text tracking-tight mb-5">Einstellungen</h2>

      {isCloudReady && (
        <div className="glass rounded-3xl p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-white/60 font-semibold">Konto (Cloud-Sync aktiv)</div>
            <div className="text-white/40 text-xs">{user?.email || 'nicht angemeldet'}</div>
          </div>
          <button onClick={signOut} className="text-aqua text-sm px-3 py-1.5 rounded-xl border border-white/10 inline-flex items-center gap-1.5"><LogOut className="w-4 h-4" /> Abmelden</button>
        </div>
      )}

      <div className="glass rounded-3xl p-4">
        <div className="text-white/60 font-semibold mb-2">Geschäftsdaten (für die Rechnung)</div>
        <Field label="Firmenname" value={s.businessName} onChange={(v) => upd('businessName', v)} />
        <Field label="Inhaber" value={s.owner} onChange={(v) => upd('owner', v)} />
        <Field label="Straße & Nr." value={s.street} onChange={(v) => upd('street', v)} />
        <div className="grid grid-cols-3 gap-2">
          <Field label="PLZ" value={s.zip} onChange={(v) => upd('zip', v)} />
          <div className="col-span-2"><Field label="Ort" value={s.city} onChange={(v) => upd('city', v)} /></div>
        </div>
        <Field label="Steuernummer" value={s.taxId} onChange={(v) => upd('taxId', v)} />
        <Field label="E-Mail" value={s.email} onChange={(v) => upd('email', v)} />
        <Field label="Telefon" value={s.phone} onChange={(v) => upd('phone', v)} />
        <Field label="IBAN" value={s.iban} onChange={(v) => upd('iban', v)} />
      </div>

      <div className="glass rounded-3xl p-4 mt-3">
        <div className="text-white/60 font-semibold mb-2">Logo (für die Rechnung)</div>
        {s.logoDataUrl ? (
          <div className="flex items-center gap-3">
            <img src={s.logoDataUrl} alt="Logo" className="h-14 rounded-lg bg-white/10 p-1 object-contain" />
            <button onClick={() => upd('logoDataUrl', '')} className="text-aqua text-sm">entfernen</button>
          </div>
        ) : (
          <label className="inline-block text-sm rounded-xl px-3 py-2 border border-white/10 bg-white/5 cursor-pointer">
            Logo hochladen
            <input type="file" accept="image/*" onChange={onLogo} className="hidden" />
          </label>
        )}
      </div>

      <div className="glass rounded-3xl p-4 mt-3">
        <div className="text-white/60 font-semibold mb-2">Steuer</div>
        <label className="flex items-center justify-between py-2">
          <span>Kleinunternehmer §19 (keine MwSt)</span>
          <input type="checkbox" checked={s.kleinunternehmer}
            onChange={(e) => upd('kleinunternehmer', e.target.checked)} className="w-5 h-5 accent-[#7c5cff]" />
        </label>
        {!s.kleinunternehmer && <Field label="USt-Satz %" value={s.vatRate} onChange={(v) => upd('vatRate', v)} type="number" />}
      </div>

      <div className="glass rounded-3xl p-4 mt-3">
        <div className="text-white/60 font-semibold mb-2">Leistungen (Schnellauswahl)</div>
        <div className="text-white/35 text-xs mb-3">Diese erscheinen im Einnahme-Flow als Chips zum schnellen Hinzufügen.</div>
        {(s.services || []).map((sv, i) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <input value={sv.label ?? ''} onChange={(e) => updService(i, 'label', e.target.value)} placeholder="Bezeichnung"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-neon" />
            <input value={sv.price ?? ''} onChange={(e) => updService(i, 'price', e.target.value)} inputMode="decimal" placeholder="€"
              className="w-20 text-right bg-white/5 border border-white/10 rounded-xl px-2 py-2 outline-none focus:border-neon" />
            <button onClick={() => removeService(i)} className="text-white/35 hover:text-red-400 transition px-1"><X className="w-[18px] h-[18px]" /></button>
          </div>
        ))}
        <button onClick={addService} className="text-sm text-aqua mt-1">+ Leistung hinzufügen</button>
      </div>

      <div className="glass rounded-3xl p-4 mt-3">
        <div className="text-white/60 font-semibold mb-2">Putzkräfte (Schnellauswahl)</div>
        <div className="text-white/35 text-xs mb-3">Erscheinen im Ausgabe-Flow als Chips.</div>
        {(s.payees || []).map((p, i) => (
          <div key={i} className="mb-3 bg-white/5 border border-white/10 rounded-xl p-2">
            <div className="flex gap-2 items-center">
              <input value={p.name ?? ''} onChange={(e) => updPayee(i, 'name', e.target.value)} placeholder="Name"
                className="flex-1 bg-transparent outline-none px-1 py-1" />
              <button onClick={() => removePayee(i)} className="text-white/35 hover:text-red-400 transition px-1"><X className="w-[18px] h-[18px]" /></button>
            </div>
            <input value={p.email ?? ''} onChange={(e) => updPayee(i, 'email', e.target.value)} type="email" placeholder="E-Mail (für ihren Zugang)"
              className="w-full mt-1 bg-white/5 rounded-lg px-2 py-1 text-sm outline-none" />
            {p.email && p.email.includes('@') && (
              <button type="button" onClick={() => sendCleanerInvite(p.name, p.email.trim())}
                className="mt-1.5 w-full rounded-lg py-1.5 text-sm font-semibold bg-aqua/15 border border-aqua/30 text-aqua active:scale-[0.98] transition inline-flex items-center justify-center gap-1.5">
                <Send className="w-4 h-4" /> Zur App einladen
              </button>
            )}
            <input value={p.taxId ?? ''} onChange={(e) => updPayee(i, 'taxId', e.target.value)} placeholder="Steuernummer"
              className="w-full mt-1 bg-white/5 rounded-lg px-2 py-1 text-sm outline-none" />
            <input value={p.street ?? ''} onChange={(e) => updPayee(i, 'street', e.target.value)} placeholder="Straße & Nr."
              className="w-full mt-1 bg-white/5 rounded-lg px-2 py-1 text-sm outline-none" />
            <div className="grid grid-cols-3 gap-1 mt-1">
              <input value={p.zip ?? ''} onChange={(e) => updPayee(i, 'zip', e.target.value)} placeholder="PLZ"
                className="bg-white/5 rounded-lg px-2 py-1 text-sm outline-none" />
              <input value={p.city ?? ''} onChange={(e) => updPayee(i, 'city', e.target.value)} placeholder="Ort"
                className="col-span-2 bg-white/5 rounded-lg px-2 py-1 text-sm outline-none" />
            </div>
            <label className="flex items-center justify-between mt-1 text-xs text-white/50">
              <span>Kleinunternehmer §19</span>
              <input type="checkbox" checked={p.kleinunternehmer !== false} onChange={(e) => updPayee(i, 'kleinunternehmer', e.target.checked)} className="w-4 h-4 accent-[#7c5cff]" />
            </label>
          </div>
        ))}
        <button onClick={addPayee} className="text-sm text-aqua mt-1">+ Putzkraft hinzufügen</button>
      </div>

      <div className="glass rounded-3xl p-4 mt-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Präfix Einnahme-Nr." value={s.invoicePrefix} onChange={(v) => upd('invoicePrefix', v)} />
          <Field label="Präfix Ausgabe-Nr." value={s.expensePrefix} onChange={(v) => upd('expensePrefix', v)} />
        </div>
      </div>

      <button onClick={save}
        className="w-full mt-4 rounded-2xl py-3 font-bold btn-grad active:scale-[0.98] transition">
        {savedMsg ? 'Gespeichert ✓' : 'Speichern'}
      </button>
    </div>
  )
}
