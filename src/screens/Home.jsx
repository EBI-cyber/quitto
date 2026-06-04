import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { TrendingUp, ChevronRight } from 'lucide-react'
import { allBelege } from '../lib/db'
import { euro } from '../lib/format'
import IconChip from '../ui/IconChip'
import MoneyChip from '../ui/MoneyChip'

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
      <header className="px-6 md:px-8 pt-10 md:pt-12 pb-5">
        <motion.div {...fade(0)} className="flex items-center gap-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight grad-text">Quitto</h1>
          <span className="text-xs px-2 py-1 rounded-full glass text-white/60">beta</span>
        </motion.div>
        <motion.p {...fade(0.05)} className="text-white/45 text-sm mt-1">
          Bargeld quittieren · Rechnung · Unterschrift
        </motion.p>
      </header>

      <main className="px-6 md:px-8 mt-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <motion.button {...fade(0.1)} onClick={() => nav('/einnahme')}
            className="glass card-hover w-full rounded-4xl p-6 text-left shadow-glow active:scale-[0.98]">
            <div className="flex items-start justify-between">
              <MoneyChip income size="w-12 h-12" iconClass="w-6 h-6" />
              <ChevronRight className="w-5 h-5 text-white/25 mt-1.5" />
            </div>
            <div className="text-lg sm:text-xl font-bold mt-4">Einnahme · Bargeld annehmen</div>
            <div className="text-white/50 text-sm mt-1">Kunde zahlt bar → Quittung + Rechnung + Unterschrift</div>
          </motion.button>

          <motion.button {...fade(0.18)} onClick={() => nav('/ausgabe')}
            className="glass card-hover w-full rounded-4xl p-6 text-left active:scale-[0.98]">
            <div className="flex items-start justify-between">
              <MoneyChip income={false} size="w-12 h-12" iconClass="w-6 h-6" />
              <ChevronRight className="w-5 h-5 text-white/25 mt-1.5" />
            </div>
            <div className="text-lg sm:text-xl font-bold mt-4">Ausgabe · Bargeld weitergeben</div>
            <div className="text-white/50 text-sm mt-1">An Putzkraft auszahlen → Bestätigung + Rechnung</div>
          </motion.button>
        </div>

        <motion.div {...fade(0.26)} className="glass rounded-4xl p-5 mt-4 flex items-center gap-4 sm:max-w-sm">
          <IconChip icon={TrendingUp} size="w-12 h-12" iconClass="w-6 h-6" />
          <div>
            <div className="text-white/45 text-xs uppercase tracking-widest">Heute eingenommen</div>
            <div className="flex items-end gap-2 mt-0.5">
              <div className="text-3xl font-extrabold grad-text">{euro(today.sum)}</div>
              <div className="text-white/40 text-sm mb-1">· {today.count} Belege</div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
