import { TrendingUp, TrendingDown } from 'lucide-react'

// Profi-Finanz-Badge: vollflächiger runder Verlauf, weißes Trend-Icon, Glow + Lichtrand.
// Einnahme = grün, Trend hoch · Ausgabe = rot, Trend runter.
export default function MoneyChip({ income, size = 'w-11 h-11', iconClass = 'w-5 h-5' }) {
  const I = income ? TrendingUp : TrendingDown
  const look = income
    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_8px_24px_-8px_rgba(16,185,129,.95)]'
    : 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_8px_24px_-8px_rgba(244,63,94,.95)]'
  return (
    <div className={'shrink-0 rounded-full flex items-center justify-center text-white ring-1 ring-inset ring-white/25 ' + size + ' ' + look}>
      <I className={iconClass} strokeWidth={2.6} />
    </div>
  )
}
