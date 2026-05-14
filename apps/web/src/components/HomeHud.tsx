import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

interface MeData {
  totalPoints?: number
  currentStreak?: number
}

interface RankedStatusData {
  energy?: number
  seasonPoints?: number
}

type StatIcon = 'flame' | 'bolt' | 'coin'

/**
 * HRV-16 HUD bar — vintage Home.html `.hud` row split out of HomeBanner.
 * Page title "Trang chủ" (Yeseva One uppercase tracked) on the left,
 * 3 stat pills (Streak / Năng lượng / Mùa giải) on the right. Lives
 * above HomeBanner so the page reads HUD → Hero → CTA top-to-bottom
 * like the source design.
 *
 * Shares TanStack Query keys with HomeBanner (`['me']`, `['ranked-status']`)
 * so the data is fetched once and cached. Testids preserved:
 * `home-greeting-stat-{streak,energy,season}` — these were on the stats
 * inside HomeBanner before extraction; consumers (Home.test) keep working.
 */
export default function HomeHud() {
  const { t } = useTranslation()

  const { data: meData } = useQuery<MeData>({
    queryKey: ['me'],
    queryFn: () => api.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  const { data: rankedStatus } = useQuery<RankedStatusData>({
    queryKey: ['ranked-status'],
    queryFn: () => api.get('/api/me/ranked-status').then(r => r.data),
    staleTime: 60_000,
  })

  const currentStreak = meData?.currentStreak ?? 0
  const energy = rankedStatus?.energy ?? 100
  const seasonPoints = rankedStatus?.seasonPoints ?? 0

  return (
    <div
      data-testid="home-hud"
      className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-5"
    >
      <div
        data-testid="home-hud-title"
        className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.22em] text-ivory-faint"
      >
        {t('navigation.home', 'Trang chủ')}
      </div>
      <div
        data-testid="home-hud-stats"
        className="ml-auto flex flex-wrap items-center gap-2 md:gap-2.5"
      >
        <StatPill
          icon="flame"
          testId="home-greeting-stat-streak"
          value={currentStreak}
          label={t('home.greeting.streak')}
        />
        <StatPill
          icon="bolt"
          testId="home-greeting-stat-energy"
          value={energy}
          label={t('home.greeting.energy')}
        />
        <StatPill
          icon="coin"
          testId="home-greeting-stat-season"
          value={seasonPoints}
          label={t('home.greeting.seasonPoints')}
        />
      </div>
    </div>
  )
}

interface StatPillProps {
  icon: StatIcon
  testId: string
  value: number
  label: string
}

function StatPill({ icon, testId, value, label }: StatPillProps) {
  // Same emoji glyph set HomeBanner used (Bui revert HR-13b 2026-05-14).
  // animate-breathe pulses the flame for streak.
  const glyph = icon === 'flame' ? '🔥' : icon === 'bolt' ? '⚡' : '📊'
  return (
    <div
      data-testid={testId}
      className="flex items-center gap-2 md:gap-2.5 px-3 md:px-3.5 py-1.5 md:py-2 rounded-[14px] bg-bg-deep border border-line-soft shadow-chunky-soft"
    >
      <span
        aria-hidden
        className={`text-[16px] md:text-[18px] leading-none select-none ${
          icon === 'flame' ? 'animate-breathe' : ''
        }`}
      >
        {glyph}
      </span>
      <div className="flex flex-col leading-none">
        <span className="font-numeric text-[16px] md:text-[20px] font-bold text-ivory tabular-nums tracking-[-0.01em]">
          {value.toLocaleString()}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ivory-faint mt-0.5">
          {label}
        </span>
      </div>
    </div>
  )
}
