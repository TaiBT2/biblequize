import { Link, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import OfflineBanner from '../components/OfflineBanner'
import NotificationBell from './components/NotificationBell'
import UserDropdown from './components/UserDropdown'
import MobileBottomTabs from './components/MobileBottomTabs'

const navItems = [
  { path: '/', labelKey: 'nav.home' },
  { path: '/leaderboard', labelKey: 'nav.leaderboard' },
  { path: '/groups', labelKey: 'nav.groups' },
  { path: '/multiplayer', labelKey: 'gameModes.rooms' },
  { path: '/profile', labelKey: 'nav.profile' },
]

/**
 * Top-level layout — "Khung Sáng" TopNav (KS W0-2 redo):
 *   - Sticky horizontal nav per the mockup: spectrum logo mark + nav links
 *     + 3 stats (streak / năng lượng / điểm mùa) + bell + avatar dropdown.
 *   - Single centered content column below (no sidebar).
 *   - Mobile (< md): nav links + stats collapse; MobileBottomTabs handles
 *     navigation; the bar keeps logo + bell + avatar.
 */
export default function AppLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user } = useAuthStore()

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000,
  })
  const { data: rankedStatus } = useQuery<{ livesRemaining?: number; seasonPoints?: number }>({
    queryKey: ['ranked-status'],
    queryFn: () => api.get('/api/me/ranked-status').then(r => r.data),
    staleTime: 60_000,
  })

  const streak = meData?.currentStreak ?? user?.currentStreak ?? 0
  const energy = rankedStatus?.livesRemaining ?? 100
  const seasonPoints = rankedStatus?.seasonPoints ?? 0

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`)

  const isAdmin =
    user?.role === 'ADMIN' || user?.role === 'admin' ||
    user?.role === 'CONTENT_MOD' || user?.role === 'content_mod'

  return (
    <div className="min-h-screen bg-bq-paper text-bq-ink bq-lightwell">
      <OfflineBanner />

      <header
        data-testid="app-topnav"
        className="sticky top-0 z-30 bg-bq-paper/85 backdrop-blur-md border-b border-bq-hair"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="BibleQuiz home">
            <span
              aria-hidden
              className="relative w-[30px] h-[34px] rounded-[15px_15px_7px_7px/18px_18px_7px_7px] overflow-hidden bg-bq-spectrum shadow-[0_4px_14px_-4px_rgba(245,158,11,0.5)]"
            >
              <span className="absolute inset-[3px] rounded-[13px_13px_5px_5px/16px_16px_5px_5px] bg-bq-paper" />
              <span className="absolute left-1/2 top-[9px] -translate-x-1/2 w-[7px] h-[13px] rounded-[50%_50%_50%_50%/62%_62%_38%_38%] bg-bq-flame" />
            </span>
            <span className="font-display text-[19px] font-extrabold tracking-[-0.01em] text-bq-ink leading-none">
              Bible<span className="text-bq-amberd">Quiz</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-0.5 ml-1.5">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-[13.5px] font-semibold px-3.5 py-2 rounded-full transition-colors ${
                  isActive(item.path) ? 'bg-bq-ink text-white' : 'text-bq-ink2 hover:text-bq-ink hover:bg-bq-inset'
                }`}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>

          {/* Right: stats + admin + bell + avatar */}
          <div className="ml-auto flex items-center gap-4">
            {user && (
              <div data-testid="topnav-stats" className="hidden lg:flex items-center gap-4">
                <Stat dot="bg-bq-ruby" value={streak} label={t('home.greeting.streak')} />
                <Stat dot="bg-bq-amber" value={energy} label={t('home.greeting.energy')} />
                <Stat dot="bg-bq-emerald" value={seasonPoints} label={t('home.greeting.seasonPoints')} />
              </div>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold text-bq-amberd hover:text-bq-amber transition-colors"
              >
                <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              </Link>
            )}
            <NotificationBell />
            <UserDropdown align="right" trigger="compact" />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <Outlet />
        <div className="h-20 md:hidden" />
      </main>

      <MobileBottomTabs />
    </div>
  )
}

function Stat({ dot, value, label }: { dot: string; value: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-bq-ink tabular-nums">
      <span className={`w-2 h-2 rounded-sm ${dot}`} />
      {value.toLocaleString()}
      <small className="font-bold text-bq-ink3 text-[10.5px] uppercase tracking-wide">{label}</small>
    </span>
  )
}
