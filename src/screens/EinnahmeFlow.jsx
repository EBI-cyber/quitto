import { useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import SignaturePad from '../components/SignaturePad'
import { loadSettings } from '../lib/settings'
import { nextNumber, addBeleg, markSynced } from '../lib/db'
import { pushBeleg } from '../lib/cloud'
import { buildInvoicePdf } from '../lib/pdf'
import { sharePdf } from '../lib/share'
import { euro } from '../lib/format'

export default function EinnahmeFlow() {
  const nav = useNavigate()
  const s = useMemo(() => loadSettings(), [])
  const [step, setStep] = useState('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [items, setItems] = useState(() =>
    s.services?.length
      ? [{ label: s.services[0].label, qty: 1, price: Number(s.services[0].price) || 0 }]
      : [{ label: '', qty: 1, price: 0 }]
  )
  const [signerName, setSignerName] = useState('')
  const sigRef = useRef(null)
  const [saved, setSaved] = useState(null)
  const [busy, setBusy] = useState(false)

  const total = items.reduce((a, i) => a + (Number(i.price) || 0) * (Number(i.qty) || 1), 0)

  const addPreset = (svc) => setItems((p) => [...p, { label: svc.label, qty: 1, price: Number(svc.price) || 0 }])
  const addCustom = () => setItems((p) => [...p, { label: '', qty: 1, price: 0 }])
  const updItem = (idx, key, val) => setItems((p) => p.map((it, i) => (i === idx ? { ...it, [key]: val } : it)))
  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx))

  async function finalize() {
    if (!sigRef.current || sigRef.current.isEmpty()) { alert('Bitte unterschreiben lassen.'); return }
    const cleanItems = items
      .filter((it) => String(it.label).trim())
      .map((it) => ({ label: String(it.label).trim(), qty: Number(it.qty) || 1, price: Number(it.price) || 0 }))
    if (!cleanItems.length) { alert('Bitte mindestens eine Position mit Bezeichnung erfassen.'); return }
    setBusy(true)
    try {
      const number = await nextNumber(s.invoicePrefix, 'einnahme')
      const beleg = await addBeleg({
        direction: 'einnahme', number, date: new Date().toISOString(),
        items: cleanItems, total: cleanItems.reduce((a, i) => a + i.price * i.qty, 0),
        customer: { name, email },
        signatureDataUrl: sigRef.current.toDataURL(),
        signerName: signerName || name, paymentMethod: 'bar',
        taxMode: s.kleinunternehmer ? 'kleinunternehmer' : 'ust', vatRate: s.vatRate,
      })
      try { const r = await pushBeleg(beleg); if (r.ok) await markSynced(beleg.id) } catch { /* lokal, synct später */ }
      setSaved(beleg); setStep('done')
    } finally { setBusy(false) }
  }

  async function doShare() { await sharePdf(buildInvoicePdf(saved, s), saved) }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-neon'
  const canContinue = name.trim() && total > 0 && items.some((it) => String(it.label).trim())

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="px-5 pt-8 pb-3 flex items-center gap-3">
        <button onClick={() => (step === 'form' ? nav('/') : setStep('form'))}
          className="glass w-9 h-9 rounded-full text-lg leading-none">‹</button>
        <div className="font-bold text-lg">Einnahme</div>
        <div className="ml-auto text-white/40 text-sm">
          {step === 'form' ? '1 · Details' : step === 'sign' ? '2 · Unterschrift' : '3 · Fertig'}
        </div>
      </header>

      {step === 'form' && (
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 px-5 space-y-3">
          <div className="glass rounded-3xl p-4">
            <div className="text-white/50 text-xs mb-2">Kunde</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name des Kunden" className={inputCls + ' mb-2'} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail (für Rechnung, optional)" type="email" className={inputCls} />
          </div>

          <div className="glass rounded-3xl p-4">
            <div className="text-white/50 text-xs mb-2">Positionen</div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-2">
                  <div className="flex gap-2 items-center">
                    <input value={it.label} onChange={(e) => updItem(idx, 'label', e.target.value)} placeholder="Leistung"
                      className="flex-1 bg-transparent outline-none px-1 py-1" />
                    <button onClick={() => removeItem(idx)} className="text-white/40 px-2 text-lg leading-none">✕</button>
                  </div>
                  <div className="flex gap-2 items-center mt-1 text-sm">
                    <span className="text-white/40">Menge</span>
                    <input value={it.qty} onChange={(e) => updItem(idx, 'qty', e.target.value)} inputMode="decimal"
                      className="w-12 text-center bg-white/5 rounded-lg px-1 py-0.5" />
                    <span className="text-white/40 ml-auto">Preis</span>
                    <input value={it.price} onChange={(e) => updItem(idx, 'price', e.target.value)} inputMode="decimal"
                      className="w-20 text-right bg-white/5 rounded-lg px-1 py-0.5" />
                    <span className="text-white/50">€</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {s.services.map((svc, i) => (
                <button key={i} onClick={() => addPreset(svc)}
                  className="text-sm rounded-full px-3 py-1 border border-white/10 bg-white/5 active:scale-95 transition">
                  + {svc.label} <span className="text-white/40">{euro(svc.price)}</span>
                </button>
              ))}
              <button onClick={addCustom}
                className="text-sm rounded-full px-3 py-1 border border-neon/40 bg-neon/10 active:scale-95 transition">
                + Freie Position
              </button>
            </div>
          </div>

          <div className="glass rounded-3xl p-4 flex items-end justify-between">
            <div className="text-white/50 text-xs">Gesamt (bar)</div>
            <div className="text-3xl font-extrabold grad-text">{euro(total)}</div>
          </div>
        </motion.main>
      )}

      {step === 'sign' && (
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 px-5 flex flex-col">
          <div className="text-white/60 text-sm mb-2">
            Der Kunde bestätigt mit Unterschrift, <b>{euro(total)} in bar übergeben</b> zu haben.
          </div>
          <input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Name (Druckbuchstaben)" className={inputCls + ' mb-2'} />
          <div className="flex-1 min-h-[220px] mb-1"><SignaturePad ref={sigRef} /></div>
          <button onClick={() => sigRef.current?.clear()} className="text-white/50 text-sm mb-1 self-start">↺ Löschen</button>
        </motion.main>
      )}

      {step === 'done' && saved && (
        <motion.main initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="flex-1 px-6 flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-3">✅</div>
          <div className="text-2xl font-bold">Quittiert!</div>
          <div className="text-white/50 mt-1">Rechnung <b>{saved.number}</b> · {euro(saved.total)}</div>
          <div className="text-white/30 text-xs mt-1">Token {saved.token.slice(0, 12)} · manipulationssicher</div>
          <button onClick={doShare} className="w-full mt-6 rounded-2xl py-3 font-bold bg-gradient-to-r from-neon to-aqua text-ink active:scale-[0.98] transition">
            Rechnung teilen / senden
          </button>
          <button onClick={() => nav('/')} className="w-full mt-2 rounded-2xl py-3 glass">Fertig</button>
        </motion.main>
      )}

      {step !== 'done' && (
        <div className="p-4">
          {step === 'form' ? (
            <button disabled={!canContinue} onClick={() => setStep('sign')}
              className="w-full rounded-2xl py-4 font-bold bg-gradient-to-r from-neon to-aqua text-ink disabled:opacity-40 active:scale-[0.98] transition">
              Weiter zur Unterschrift
            </button>
          ) : (
            <button disabled={busy} onClick={finalize}
              className="w-full rounded-2xl py-4 font-bold bg-gradient-to-r from-neon to-aqua text-ink disabled:opacity-40 active:scale-[0.98] transition">
              {busy ? 'Speichere…' : 'Bargeld erhalten & quittieren'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
