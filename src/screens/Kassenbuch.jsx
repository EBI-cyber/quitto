import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Download } from 'lucide-react'
import { allBelege } from '../lib/db'
import { euro, dmyhm } from '../lib/format'
import { buildInvoicePdf } from '../lib/pdf'
import { sharePdf } from '../lib/share'
import { loadSettings } from '../lib/settings'
import IconChip from '../ui/IconChip'

export default function Kassenbuch() {
  const [items, setItems] = useState([])
  const s = loadSettings()

  useEffect(() => { allBelege().then(setItems) }, [])

  return (
    <div className="px-6 md:px-8 pt-10 md:pt-12">
      <h2 className="text-3xl md:text-4xl font-extrabold grad-text tracking-tight mb-5">Kassenbuch</h2>
      {items.length === 0 && <div className="glass rounded-3xl p-6 text-white/45 text-sm">Noch keine Belege erfasst.</div>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((b) => {
          const ein = b.direction === 'einnahme'
          return (
            <button key={b.id} onClick={() => sharePdf(buildInvoicePdf(b, s), b)}
              className="glass card-hover w-full rounded-2xl p-4 text-left active:scale-[0.99] flex items-center gap-3">
              <IconChip icon={ein ? ArrowDownLeft : ArrowUpRight} size="w-11 h-11" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{b.customer?.name || '—'}</div>
                <div className="text-white/40 text-xs truncate">{b.number} · {dmyhm(b.createdAt)}</div>
              </div>
              <div className="text-right">
                <div className={'font-bold ' + (ein ? 'text-acid' : 'text-white')}>{ein ? '+' : '−'}{euro(b.total)}</div>
                <div className="text-white/30 text-[11px] flex items-center justify-end gap-1"><Download className="w-3 h-3" /> PDF</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
