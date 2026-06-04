import { useEffect, useState } from 'react'
import { Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck, ShieldAlert } from 'lucide-react'
import { allBelege, verifyChain } from '../lib/db'
import { euro } from '../lib/format'
import IconChip from '../ui/IconChip'

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

      <div className="glass rounded-3xl p-5 mb-3 flex items-center gap-4">
        <IconChip icon={Wallet} size="w-12 h-12" iconClass="w-6 h-6" variant="grad" />
        <div>
          <div className="text-white/45 text-xs uppercase tracking-widest">Kassen-Saldo</div>
          <div className={'text-4xl font-extrabold mt-0.5 ' + (stats.saldo >= 0 ? 'grad-text' : 'text-red-400')}>
            {euro(stats.saldo)}
          </div>
          <div className="text-white/35 text-xs mt-0.5">Einnahmen minus Ausgaben</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-3xl p-4 flex items-center gap-3">
          <IconChip icon={ArrowDownLeft} size="w-10 h-10" />
          <div>
            <div className="text-white/45 text-xs">Einnahmen</div>
            <div className="text-2xl font-bold text-acid">+{euro(stats.einSum)}</div>
          </div>
        </div>
        <div className="glass rounded-3xl p-4 flex items-center gap-3">
          <IconChip icon={ArrowUpRight} size="w-10 h-10" />
          <div>
            <div className="text-white/45 text-xs">Ausgaben</div>
            <div className="text-2xl font-bold text-red-400">−{euro(stats.ausSum)}</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-4 mt-3 flex items-center gap-3">
        <IconChip icon={chain?.ok ? ShieldCheck : ShieldAlert} size="w-11 h-11" iconClass="w-[22px] h-[22px]" />
        <div>
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
