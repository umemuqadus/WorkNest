import {
  ArrowUp,
  Building2,
  CalendarCheck,
  CheckSquare,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Briefcase,
  FileText,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { useState, useEffect, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { initials } from '@/lib/utils'
import GlobalSearch from '@/features/GlobalSearch'
import Toaster from '@/components/ui/Toaster'
import Logo from '@/components/ui/Logo'
import clsx from 'clsx'

type NavItem = {
  to: string
  label: string
  group: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const NAV: NavItem[] = [
  { group: 'Overview', to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { group: 'Overview', to: '/jobs', label: 'Jobs', icon: Briefcase },
  { group: 'Overview', to: '/applications', label: 'Applications', icon: FileText },
  { group: 'Network', to: '/companies', label: 'Companies', icon: Building2 },
  { group: 'Network', to: '/contacts', label: 'Contacts', icon: Users },
  { group: 'Pipeline', to: '/resumes', label: 'Resumes', icon: FileText },
  { group: 'Pipeline', to: '/interviews', label: 'Interviews', icon: CalendarCheck },
  { group: 'Pipeline', to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { group: 'Insights', to: '/analytics', label: 'Analytics', icon: PieChart },
  { group: 'Insights', to: '/settings', label: 'Settings', icon: Settings },
]

const SIDEBAR_STORAGE_KEY = 'worknest_sidebar_collapsed'

function groupNav(items: NavItem[]) {
  const groups: { label: string; items: NavItem[] }[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.label === item.group) last.items.push(item)
    else groups.push({ label: item.group, items: [item] })
  }
  return groups
}

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-1 flex-col gap-3 px-3 py-2">
      {groupNav(NAV).map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {group.label}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean
  onToggle?: () => void
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        title={collapsed ? 'WorkNest' : undefined}
        className={clsx(
          'flex items-center gap-2.5 px-5 py-4',
          collapsed && 'justify-center px-0',
        )}
      >
        <Logo className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 text-lg shadow-[0_6px_16px_-8px_rgba(2,132,199,0.9)]" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-white">WorkNest</p>
            <p className="truncate text-[11px] text-slate-400">Offer to offer, organized.</p>
          </div>
        )}
      </div>

      <NavLinks collapsed={collapsed} onNavigate={onNavigate} />

      {onToggle && (
        <div className="border-t border-white/5 p-3">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={clsx(
              'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white',
              collapsed && 'justify-center px-0',
            )}
          >
            <ChevronLeft
              className={clsx('h-4 w-4 shrink-0 transition-transform duration-200', collapsed && 'rotate-180')}
            />
            {!collapsed && 'Collapse'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  // Reveal the back-to-top control only on long scrolls.
  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 480)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Escape dismisses the mobile drawer and the account menu.
  useEffect(() => {
    if (!mobileOpen && !menuOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, menuOpen])

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* storage unavailable — state still applies for this session */
      }
      return next
    })
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const userMenu: ReactNode = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm transition hover:bg-slate-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-sky-600 text-xs font-semibold text-white ring-2 ring-blue-100">
          {initials(user?.name ?? 'U')}
        </span>
        <span className="hidden max-w-[10rem] truncate font-medium text-slate-700 sm:block">
          {user?.name}
        </span>
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-2xl border border-slate-200 bg-white py-1 shadow-2xl ring-1 ring-slate-900/5">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                navigate('/settings')
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Settings className="h-4 w-4" /> Settings
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                handleLogout()
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-blue-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 transition-[width] duration-200 ease-out lg:flex',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={toggleSidebar} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div
        className={clsx(
          'transition-[padding] duration-200 ease-out',
          collapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden flex-1 sm:block">
              <GlobalSearch />
            </div>
            <div className="flex-1 sm:hidden" />
            {userMenu}
          </div>
          <div className="px-4 pb-3 sm:hidden">
            <GlobalSearch />
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          key={location.pathname}
          className="mx-auto w-full max-w-7xl animate-[riseIn_260ms_ease-out] px-4 py-6 outline-none sm:px-6 lg:px-8"
        >
          <Outlet />
        </main>
      </div>

      {showBackToTop && (
        <button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-900 shadow-lg transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-xl active:translate-y-0"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
      <Toaster />
    </div>
  )
}
