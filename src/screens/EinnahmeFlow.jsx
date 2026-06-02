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
  const [price, setPrice] = useState(String(s.defaultPrice))
  const [surcharge, setSurcharge] = useState(false)
  const [signerName, setSignerName] = useState('')
  const sigRef = useRef(null)
  const [saved, setSaved] = useState(null)
  const [busy, setBusy] = useState(false)

  const items = useMemo(() => {
    const list = [{ label: s.defaultService, qty: 1, price: Number(price) || 0 }]
    if (surcharge) list.push({ label: s.surchargeLabel, qty: 1, price: Number(s.surchargePrice) || 0 })
    return list
  }, [price, surcharge, s])
  const total = items.reduce((a, i) => a + i.price * (i.qty || 1), 0)

  async function finalize() {
    if (!sigRef.current || sigRef.current.isEmpty()) { alert('Bitte unterschreiben lassen.'); return }
    setBusy(true)
    try {
      const number = await nextNumber(s.invoicePrefix, 'einnahme')
      const beleg = await addBeleg({
        direction: 'einnahme', number, date: new Date().toISOString(),
        items, total, customer: { name, email },
        signatureDataUrl: sigRef.current.toDataURL(),
        signerName: signerName || name, paymentMethod: 'bar',
        taxMode: s.kleinunternehmer ? 'kleinunternehmer' : 'ust', vatRate: s.vatRate,
      })
      try {
        const r = await pushBeleg(beleg)
        if (r.ok) await markSynced(beleg.id)
      } catch { /* bleibt lokal, synct später automatisch */ }
      setSaved(beleg); setStep('done')
    } finally { setBusy(false) }
  }

  async function doShare() { await sharePdf(buildInvoicePdf(saved, s), saved) }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-neon'

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
            <div className="text-white/50 text-xs mb-2">Leistung</div>
            <div className="flex items-center justify-between">
              <div className="font-semibold">{s.defaultService}</div>
              <div className="flex items-center gap-1">
                <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal"
                  className="w-20 text-right bg-white/5 border border-white/10 rounded-xl px-2 py-1 outline-none focus:border-neon" />
                <span className="text-white/50">€</span>
              </div>
            </div>
            <button onClick={() => setSurcharge((v) => !v)}
              className={'mt-3 w-full rounded-xl px-3 py-2 text-left border transition ' + (surcharge ? 'border-acid/60 bg-acid/10' : 'border-white/10 bg-white/5')}>
              <div className="flex items-center justify-between">
                <span>{surcharge ? '✓ ' : ''}{s.surchargeLabel}</span>
                <span className="text-white/60">+ {euro(s.surchargePrice)}</span>
              </div>
            </button>
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
            <button disabled={!name || total <= 0} onClick={() => setStep('sign')}
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
