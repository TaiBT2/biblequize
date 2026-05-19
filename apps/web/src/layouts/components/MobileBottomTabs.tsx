import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface TabConfig {
  path: string
  labelKey: string
  icon: string
}

/**
 * Stacked icon + always-visible label layout (2026-05-19): every tab
 * renders icon on top + label below; active tab uses the gold accent
 * color and a short underline indicator. Replaces the previous
 * active-only pill which hid 3 of 4 labels and made the bar feel
 * empty on mobile.
 *
 * Tabs match the existing AppLayout {@code navItems} list one-to-one
 * so the bottom-nav refactor is a pure style change — no item drift,
 * no route changes.
 */
const TABS: TabConfig[] = [
  { path: '/', labelKey: 'nav.home', icon: 'home' },
  { path: '/leaderboard', labelKey: 'nav.leaderboard', icon: 'leaderboard' },
  { path: '/groups', labelKey: 'nav.groups', icon: 'groups' },
  { path: '/profile', labelKey: 'nav.profile', icon: 'person' },
]

/**
 * Treat a tab as active when the current pathname matches the tab
 * path exactly OR sits beneath it (for sub-routes like
 * {@code /profile/settings} or {@code /groups/123}). Home (`/`) only
 * matches exactly so it doesn't swallow every other tab.
 */
function isActivePath(pathname: string, tabPath: string): boolean {
  if (tabPath === '/') return pathname === '/'
  return pathname === tabPath || pathname.startsWith(`${tabPath}/`)
}

export default function MobileBottomTabs() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <nav
      data-testid="mobile-bottom-tabs"
      className="md:hidden fixed bottom-0 left-0 w-full z-40 flex items-stretch justify-between px-1 pt-1 bg-[#11131e]/90 backdrop-blur-xl border-t border-[rgba(232,168,50,0.15)]"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      {TABS.map(tab => {
        const active = isActivePath(location.pathname, tab.path)
        return (
          <Link
            key={tab.path}
            to={tab.path}
            data-testid={`mobile-tab-${tab.path === '/' ? 'home' : tab.path.slice(1)}`}
            data-active={active ? 'true' : 'false'}
            aria-label={t(tab.labelKey) as string}
            aria-current={active ? 'page' : undefined}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] px-1 transition-colors duration-200 ease-out ${
              active
                ? 'text-secondary'
                : 'text-on-surface/50 hover:text-on-surface/80'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              aria-hidden="true"
            >
              {tab.icon}
            </span>
            <span
              className={`text-[11px] leading-tight whitespace-nowrap ${
                active ? 'font-semibold' : 'font-medium'
              }`}
            >
              {t(tab.labelKey)}
            </span>
            {active && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 h-[2px] w-6 rounded-full bg-secondary"
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
