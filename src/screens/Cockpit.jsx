import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { allBelege, verifyChain } from '../lib/db'
import { euro } from '../lib/format'
import IconChip from '../ui/IconChip'
import MoneyChip from '../ui/MoneyChip'

export default function Cockpit() {
  const [stats, setStats] = useState({ einSum: 0, ausSum: 0, saldo: 0, total: 0 })
  const [chain, setChain] = useState(null)

  useEffect(() => {
    (async () => {
      const items = await allBelege()
      const einSum = items.filter((b) => b.direction === 'einnahme').reduce((a, b) => a + (b.total || 0), 0)
      const ausSum = items.filter((b) => b.direction === 'ausgabe').reduce((a, b) => a + (b.total || 0), 0)
      setStats({ einSum, ausSum, saldo: einSum - ausSum, total: items.length })
      setChain(await verifyChain())
    })()
  }, [])

  return (
    <div className="px-6 md:px-8 pt-10 md:pt-12 max-w-3xl">
      <h2 className="text-3xl md:text-4xl font-extrabold grad-text tracking-tight mb-5">Cockpit</h2>

      {/* Saldo-Hero, zentriert */}
      <div className="glass rounded-4xl p-7 mb-3 text-center shadow-glow">
        <div className="text-white/45 text-xs uppercase tracking-widest mb-2">Kassen-Saldo</div>
        <div className={'text-4xl sm:text-5xl font-extrabold tabular-nums break-words ' + (stats.saldo >= 0 ? 'grad-text' : 'text-rose-400')}>
          {euro(stats.saldo)}
        </div>
        <div className="text-white/35 text-xs mt-2">Einnahmen minus Ausgaben</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass card-hover rounded-3xl p-5 flex flex-col items-center text-center gap-2">
          <MoneyChip income size="w-12 h-12" iconClass="w-6 h-6" />
          <div className="text-white/45 text-xs mt-1">Einnahmen</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums truncate max-w-full">+{euro(stats.einSum)}</div>
        </div>
        <div className="glass card-hover rounded-3xl p-5 flex flex-col items-center text-center gap-2">
          <MoneyChip income={false} size="w-12 h-12" iconClass="w-6 h-6" />
          <div className="text-white/45 text-xs mt-1">Ausgaben</div>
          <div className="text-xl sm:text-2xl font-bold text-rose-400 tabular-nums truncate max-w-full">−{euro(stats.ausSum)}</div>
        </div>
      </div>

      <div className="glass rounded-3xl p-4 mt-3 flex items-center gap-3">
        <IconChip icon={chain?.ok ? ShieldCheck : ShieldAlert} size="w-11 h-11" iconClass="w-[22px] h-[22px]" />
        <div className="min-w-0">
          <div className="font-semibold">{chain?.ok ? 'Beleg-Kette intakt' : 'Kette geprüft'}</div>
          <div className="text-white/45 text-xs">
            {chain?.ok ? `${chain.count} Belege manipulationssicher verkettet` : `Problem bei ${chain?.brokenAt || '?'}`}
          </div>
        </div>
      </div>

      <div className="text-white/30 text-xs mt-4">Email-Versand, Push & Online-Einsicht folgen in der nächsten Phase.</div>
    </div>
  )
}
