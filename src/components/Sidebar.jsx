import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  CalendarRange,
  CreditCard,
  Mail,
  Settings,
  X,
} from 'lucide-react'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/listings', label: 'Listings', icon: BedDouble },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/availability', label: 'Availability', icon: CalendarRange },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/subscribers', label: 'Subscribers', icon: Mail },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-plum text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/60">
              <svg viewBox="0 0 32 32" className="h-5 w-5 text-gold" fill="none">
                <path d="M4 28h24M7 28V13l5-4 5 4v15M20 28V16l4-3 4 3v12" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </span>
            <div className="leading-none">
              <p className="font-serif text-lg font-bold text-white">HUGS</p>
              <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.25em] text-gold">Admin</p>
            </div>
          </div>
          <button className="text-white/70 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-gold text-plum' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-6 py-4">
          <p className="text-xs text-white/50">Live Luxury. Feel at Home.</p>
        </div>
      </aside>
    </>
  )
}
