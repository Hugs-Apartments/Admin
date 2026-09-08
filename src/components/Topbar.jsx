import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Topbar({ onMenu }) {
  const { admin, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink/10 bg-white/95 px-5 py-3 backdrop-blur sm:px-8">
      <button className="text-ink/70 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-6 w-6" />
      </button>

      <div className="ml-auto flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-ink">{admin?.name}</p>
          <p className="text-xs capitalize text-ink/50">{admin?.role}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-plum font-serif text-sm font-bold text-gold">
          {admin?.name?.[0] || 'A'}
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
 