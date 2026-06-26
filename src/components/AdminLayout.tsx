import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

export function AdminLayout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              JUSBA Admin
            </p>
            <h1 className="text-lg font-semibold text-slate-900">Donation Pledges</h1>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink to="/admin/pledges" className={navLinkClass}>
              Pledges
            </NavLink>
            <NavLink to="/admin/events" className={navLinkClass}>
              Events
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to pledge form
        </Link>
      </footer>
    </div>
  )
}
