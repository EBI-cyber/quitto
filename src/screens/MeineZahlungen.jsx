import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/auth'
import { allBelege, signBelegLocal } from '../lib/db'
import { signBelegRemote, syncAll } from '../lib/cloud'
import { euro, dmyhm } from '../lib/format'
import SignaturePad from '../components/SignaturePad'
import { enablePush, pushStatus, pushSupported } from '../lib/push'
import { ChevronLeft, Bell, PenLine, RotateCcw, ChevronRight } from 'lucide-react'

export default function MeineZahlungen() {
  const { user, signOut } = useAuth()
  const [items, setItems] = useState([])
  const [signing, setSigning] = useState(null)
  const [signerName, setSignerName] = useState('')
  const [busy, setBusy] = useState(false)
  const sigRef = useRef(null)

  const [pushState, setPushState] = useState('off')

  const load = async () => {
    const list = (await allBelege()).filter((b) => b.direction === 'ausgabe')
    setItems(list)
    return list
  }
  const openFromHash = (list) => {
    const m = (window.location.hash || '').match(/sign=([a-f0-9]+)/i)
    if (m) {
      const b = list.find((x) => x.token === m[1] && x.status === 'pending_signature')
      if (b) setSigning(b)
    }
  }
  useEffect(() => { (async () => { try { await syncAll() } catch {} ; const l = await load(); openFromHash(l) })() }, [])
  useEffect(() => {
    const onHash = async () => { const l = await load(); openFromHash(l) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => { pushStatus().then(setPushState) }, [])

  async function turnOnPush() {
    try { await enablePush(user?.email); setPushState('on') }
    catch (e) { alert((e && e.message) || 'Konnte Benachrichtigungen nicht aktivieren.') }
  }

  const pending = items.filter((b) => b.status === 'pending_signature')
  const signed = items.filter((b) => b.status !== 'pending_signature')
  const total = signed.reduce((a, b) => a + (b.total || 0), 0)

  async function confirmSign() {
    if (!sigRef.current || sigRef.current.isEmpty()) { alert('Bitte unterschreiben.'); return }
    setBusy(true)
    try {
      const sig = sigRef.current.toDataURL()
      const nm = signerName || (user?.email || '')
      const r = await signBelegRemote(signing.token, sig, nm)
      if (!r.ok) { alert('Konnte nicht speichern (online?). Bitte erneut versuchen.'); return }
      await signBelegLocal(signing.token, sig, nm)
      setSigning(null); setSignerName('')
      if (window.location.hash) window.location.hash = ''
      await load()
    } finally { setBusy(false) }
  }

  // --- Unterschrift-Screen ---
  if (signing) {
    return (
      <div className="min-h-[100dvh] max-w-md mx-auto flex flex-col px-5 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setSigning(null)} className="glass card-hover w-10 h-10 rounded-2xl flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
          <div className="font-bold text-lg">Unterschreiben</div>
        </div>
        <div className="text-white/60 text-sm mb-2">
          Du bestätigst, <b>{euro(signing.total)} in bar erhalten</b> zu haben (Beleg {signing.number}).
        </div>
        <input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Name (Druckbuchstaben)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-2 outline-none focus:border-neon" />
        <div className="flex-1 min-h-[240px] mb-1"><SignaturePad ref={sigRef} /></div>
        <button onClick={() => sigRef.current?.clear()} className="text-white/50 text-sm mb-2 self-start inline-flex items-center gap-1"><RotateCcw className="w-4 h-4" /> Löschen</button>
        <button disabled={busy} onClick={confirmSign}
          className="w-full rounded-2xl py-4 font-bold btn-grad disabled:opacity-40 active:scale-[0.98] transition">
          {busy ? 'Speichere…' : 'Erhalt bestätigen & unterschreiben'}
        </button>
      </div>
    )
  }

  // --- Übersicht ---
  return (
    <div className="min-h-[100dvh] max-w-md mx-auto px-6 pt-10 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold grad-text">Quitto</h1>
        <button onClick={signOut} className="text-aqua text-sm">Abmelden</button>
      </div>
      <div className="text-white/45 text-sm mb-5">{user?.email}</div>

      {pushSupported() && pushState !== 'on' && (
        <button onClick={turnOnPush}
          className="w-full glass rounded-2xl py-3 mb-4 text-aqua font-semibold active:scale-[0.99] transition inline-flex items-center justify-center gap-2">
          <Bell className="w-5 h-5" /> Benachrichtigungen aktivieren
        </button>
      )}

      {pending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-4xl p-5 mb-4 border border-neon/40 bg-neon/10">
          <div className="text-white font-semibold mb-1 flex items-center gap-2"><PenLine className="w-[18px] h-[18px]" /> Zu unterschreiben ({pending.length})</div>
          <div className="text-white/55 text-sm mb-3">Bitte den Bargeld-Erhalt bestätigen.</div>
          <div className="space-y-2">
            {pending.map((b) => (
              <button key={b.id} onClick={() => setSigning(b)}
                className="glass w-full rounded-2xl p-4 text-left flex items-center justify-between active:scale-[0.99] transition">
                <div>
                  <div className="font-semibold">{euro(b.total)}</div>
                  <div className="text-white/40 text-xs">{b.number} · {dmyhm(b.createdAt)}</div>
                </div>
                <div className="text-neon font-semibold text-sm flex items-center gap-1">Unterschreiben <ChevronRight className="w-4 h-4" /></div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-4xl p-6 mb-5 shadow-glow">
        <div className="text-white/45 text-xs uppercase tracking-widest">Bisher an dich ausgezahlt</div>
        <div className="text-4xl font-extrabold grad-text mt-1">{euro(total)}</div>
        <div className="text-white/35 text-xs mt-1">{signed.length} bestätigte Auszahlung(en)</div>
      </motion.div>

      <div className="text-white/50 text-sm mb-2">Deine Quittungen</div>
      <div className="space-y-2">
        {signed.length === 0 && (
          <div className="text-white/40 text-sm">Noch keine bestätigten Auszahlungen.</div>
        )}
        {signed.map((b) => (
          <div key={b.id} className="glass w-full rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{b.number}</div>
              <div className="text-white/40 text-xs">{dmyhm(b.createdAt)} · Token {String(b.token).slice(0, 8)}</div>
            </div>
            <div className="font-bold text-acid">{euro(b.total)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
