import { ArrowUp, ArrowDown } from 'lucide-react'

// Einnahme = grün, Pfeil hoch · Ausgabe = rot, Pfeil runter — mit Glow
export default function MoneyChip({ income, size = 'w-11 h-11', iconClass = 'w-5 h-5' }) {
  const cls = income
    ? 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30 shadow-[0_0_22px_-5px_rgba(16,185,129,.75)]'
    : 'text-rose-400 bg-rose-400/15 border-rose-400/30 shadow-[0_0_22px_-5px_rgba(251,113,133,.75)]'
  const I = income ? ArrowUp : ArrowDown
  return (
    <div className={'shrink-0 rounded-xl border flex items-center justify-center ' + size + ' ' + cls}>
      <I className={iconClass} strokeWidth={2.6} />
    </div>
  )
}
