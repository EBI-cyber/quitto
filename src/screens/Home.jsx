import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { allBelege } from '../lib/db'
import { euro } from '../lib/format'

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: d, type: 'spring', stiffness: 120, damping: 16 },
})

export default function Home() {
  const nav = useNavigate()
  const [today, setToday] = useState({ sum: 0, count: 0 })

  useEffect(() => {
    (async () => {
      const items = await allBelege()
      const t = new Date().toDateString()
      const todays = items.filter(
        (b) => b.direction === 'einnahme' && new Date(b.createdAt).toDateString() === t
      )
      setToday({ sum: todays.reduce((a, b) => a + (b.total || 0), 0), count: todays.length })
    })()
  }, [])

  return (
    <div>
      <header className="px-6 pt-10 pb-4">
        <motion.div {...fade(0)} className="flex items-center gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight grad-text">Quitto</h1>
          <span className="text-xs px-2 py-1 rounded-full glass text-white/60">beta</span>
        </motion.div>
        <motion.p {...fade(0.05)} className="text-white/45 text-sm mt-1">
          Bargeld quittieren · Rechnung · Unterschrift
        </motion.p>
      </header>

      <main className="px-6 space-y-4 mt-2">
        <motion.button {...fade(0.1)} onClick={() => nav('/einnahme')}
          className="glass w-full rounded-4xl p-6 text-left shadow-glow active:scale-[0.98] transition-transform">
          <div className="text-4xl">💶</div>
          <div className="text-xl font-bold mt-3">Einnahme · Bargeld annehmen</div>
          <div className="text-white/50 text-sm mt-1">Kunde zahlt bar → Quittung + Rechnung + Unterschrift</div>
        </motion.button>

        <motion.button {...fade(0.18)} onClick={() => nav('/ausgabe')}
          className="glass w-full rounded-4xl p-6 text-left active:scale-[0.98] transition-transform">
          <div className="text-4xl">🤝</div>
          <div className="text-xl font-bold mt-3">Ausgabe · Bargeld weitergeben</div>
          <div className="text-white/50 text-sm mt-1">An Putzkraft auszahlen → Bestätigung + Rechnung</div>
        </motion.button>

        <motion.div {...fade(0.26)} className="glass rounded-4xl p-5">
          <div className="text-white/45 text-xs uppercase tracking-widest">Heute eingenommen</div>
          <div className="flex items-end gap-2 mt-1">
            <div className="text-3xl font-extrabold grad-text">{euro(today.sum)}</div>
            <div className="text-white/40 text-sm mb-1">· {today.count} Belege</div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
