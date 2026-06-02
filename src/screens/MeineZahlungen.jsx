import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/auth'
import { allBelege } from '../lib/db'
import { euro, dmyhm } from '../lib/format'

// Read-only-Ansicht für die Putzkraft: was wurde bisher an sie ausgezahlt
export default function MeineZahlungen() {
  const { user, signOut } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    allBelege().then((list) => setItems(list.filter((b) => b.direction === 'ausgabe')))
  }, [])

  const total = items.reduce((a, b) => a + (b.total || 0), 0)

  return (
    <div className="min-h-[100dvh] max-w-md mx-auto px-6 pt-10 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold grad-text">Quitto</h1>
        <button onClick={signOut} className="text-aqua text-sm">Abmelden</button>
      </div>
      <div className="text-white/45 text-sm mb-5">{user?.email}</div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-4xl p-6 mb-5 shadow-glow">
        <div className="text-white/45 text-xs uppercase tracking-widest">Bisher an dich ausgezahlt</div>
        <div className="text-4xl font-extrabold grad-text mt-1">{euro(total)}</div>
        <div className="text-white/35 text-xs mt-1">{items.length} Auszahlung(en) · bar bestätigt</div>
      </motion.div>

      <div className="text-white/50 text-sm mb-2">Deine Quittungen</div>
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="text-white/40 text-sm">Noch keine Auszahlungen erfasst. Sobald dein Auftraggeber eine Barauszahlung an dich quittiert, erscheint sie hier.</div>
        )}
        {items.map((b) => (
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
