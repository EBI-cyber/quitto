import { useEffect, useState } from 'react'
import { allBelege } from '../lib/db'
import { euro, dmyhm } from '../lib/format'
import { buildInvoicePdf } from '../lib/pdf'
import { sharePdf } from '../lib/share'
import { loadSettings } from '../lib/settings'

export default function Kassenbuch() {
  const [items, setItems] = useState([])
  const s = loadSettings()

  useEffect(() => { allBelege().then(setItems) }, [])

  return (
    <div className="px-6 pt-10">
      <h2 className="text-2xl font-bold mb-4">Kassenbuch</h2>
      {items.length === 0 && <div className="text-white/40 text-sm">Noch keine Belege erfasst.</div>}
      <div className="space-y-2">
        {items.map((b) => (
          <button key={b.id} onClick={() => sharePdf(buildInvoicePdf(b, s), b)}
            className="glass w-full rounded-2xl p-4 text-left active:scale-[0.99] transition flex items-center justify-between">
            <div>
              <div className="font-semibold">{b.customer?.name || '—'}</div>
              <div className="text-white/40 text-xs">{b.number} · {dmyhm(b.createdAt)}</div>
            </div>
            <div className={'font-bold ' + (b.direction === 'einnahme' ? 'text-acid' : 'text-white')}>
              {b.direction === 'einnahme' ? '+' : '−'}{euro(b.total)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
