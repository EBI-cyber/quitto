import { useEffect, useState } from 'react'
import { allBelege, verifyChain } from '../lib/db'
import { euro } from '../lib/format'

export default function Cockpit() {
  const [stats, setStats] = useState({ einSum: 0, total: 0 })
  const [chain, setChain] = useState(null)

  useEffect(() => {
    (async () => {
      const items = await allBelege()
      const ein = items.filter((b) => b.direction === 'einnahme')
      setStats({ einSum: ein.reduce((a, b) => a + (b.total || 0), 0), total: items.length })
      setChain(await verifyChain())
    })()
  }, [])

  return (
    <div className="px-6 pt-10">
      <h2 className="text-2xl font-bold mb-4">Cockpit</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-3xl p-4">
          <div className="text-white/45 text-xs">Einnahmen gesamt</div>
          <div className="text-2xl font-bold grad-text">{euro(stats.einSum)}</div>
        </div>
        <div className="glass rounded-3xl p-4">
          <div className="text-white/45 text-xs">Belege</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
      </div>
      <div className="glass rounded-3xl p-4 mt-3 flex items-center gap-3">
        <div className="text-2xl">{chain?.ok ? '🔒' : '⚠️'}</div>
        <div>
          <div className="font-semibold">{chain?.ok ? 'Beleg-Kette intakt' : 'Kette geprüft'}</div>
          <div className="text-white/45 text-xs">
            {chain?.ok ? `${chain.count} Belege manipulationssicher verkettet` : `Problem bei ${chain?.brokenAt || '?'}`}
          </div>
        </div>
      </div>
      <div className="text-white/30 text-xs mt-4">Email-Versand, Push & Cloud-Sync folgen, sobald Supabase verbunden ist.</div>
    </div>
  )
}
