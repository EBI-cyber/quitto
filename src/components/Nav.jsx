import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Start', icon: '🏠', end: true },
  { to: '/kassenbuch', label: 'Kassenbuch', icon: '📒' },
  { to: '/cockpit', label: 'Cockpit', icon: '📊' },
  { to: '/einstellungen', label: 'Einstellungen', icon: '⚙️' },
]

export default function Nav() {
  return (
    <nav className="glass m-4 rounded-3xl grid grid-cols-4 text-center text-[11px] py-3 sticky bottom-0">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end}
          className={({ isActive }) => (isActive ? 'text-white' : 'text-white/45')}>
          <div className="text-lg">{it.icon}</div>
          <div className="mt-0.5">{it.label}</div>
        </NavLink>
      ))}
    </nav>
  )
}
