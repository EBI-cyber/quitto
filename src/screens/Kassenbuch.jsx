import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { allBelege } from '../lib/db'
import { euro, dmyhm } from '../lib/format'
import { buildInvoicePdf } from '../lib/pdf'
import { sharePdf } from '../lib/share'
import { loadSettings } from '../lib/settings'
import MoneyChip from '../ui/MoneyChip'

export default function Kassenbuch() {
  const [items, setItems] = useState([])
  const s = loadSettings()

  useEffect(() => { allBelege().then(setItems) }, [])

  return (
    <div className="px-6 md:px-8 pt-10 md:pt-12">
      <h2 className="text-3xl md:text-4xl font-extrabold grad-text tracking-tight mb-5">Kassenbuch</h2>
      {items.length === 0 && <div className="glass rounded-3xl p-6 text-white/45 text-sm">Noch keine Belege erfasst.</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map((b) => {
          const ein = b.direction === 'einnahme'
          return (
            <button key={b.id} onClick={() => sharePdf(buildInvoicePdf(b, s), b)}
              className="glass card-hover w-full min-w-0 rounded-2xl p-4 text-left active:scale-[0.99] flex items-center gap-3">
              <MoneyChip income={ein} size="w-11 h-11" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{b.customer?.name || '—'}</div>
                <div className="text-white/40 text-xs truncate">{[b.objekt, b.number, dmyhm(b.createdAt)].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className={'font-bold whitespace-nowrap tabular-nums ' + (ein ? 'text-emerald-400' : 'text-rose-400')}>{ein ? '+' : '−'}{euro(b.total)}</div>
                <div className="text-white/30 text-[11px] flex items-center justify-end gap-1"><Download className="w-3 h-3" /> PDF</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
