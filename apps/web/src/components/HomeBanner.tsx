import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { getTierInfo } from '../data/tiers'
import { getTimeOfDayGreeting } from '../utils/greeting'

interface TierProgressData {
  tierLevel: number
  starIndex: number
  starProgressPercent: number
  starXp: number
  nextStarXp: number
  /** Running total preferred over /api/me.totalPoints (which can lag a few
   *  seconds after a session is credited). */
  totalPoints?: number
}

interface RankedStatusData {
  /** BE field is `livesRemaining` — keep `energy` as legacy alias for any
   *  consumer that still reads it. Bug-fix 2026-05-14: HomeBanner had been
   *  reading `energy` exclusively, which never exists in the actual
   *  response, so the stat pill always rendered the 100 fallback instead
   *  of real lives. */
  livesRemaining?: number
  energy?: number
  seasonPoints?: number
  currentBook?: string | null
}

type StatIcon = 'flame' | 'bolt' | 'trophy'

/**
 * Home banner — sport-app typography per home_modern.html `.banner`
 * (HR-2 redesign, replaces GreetingCard). Keeps the home-greeting-*
 * testids so existing Home.test.tsx specs pass without churn.
 *
 * Visual contract:
 * - Avatar 72px gold gradient + inset highlight + dashed gold ring
 * - Name sans 800 30px ivory, tight tracking
 * - Tier row: current (gold) → next (ivory-dim) + 5px progress with
 *   terminal dot + tabular-nums XP/next
 * - 3 stats with line SVG icons, sans 800 22px tabular-nums numbers,
 *   uppercase tracked labels. Streak flame breathes via animate-breathe.
 */
export default function HomeBanner() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  const { data: tierProgress } = useQuery<TierProgressData>({
    queryKey: ['tier-progress'],
    queryFn: () => api.get('/api/me/tier-progress').then(r => r.data),
    staleTime: 30_000,
  })

  const { data: rankedStatus } = useQuery<RankedStatusData>({
    queryKey: ['ranked-status'],
    queryFn: () => api.get('/api/me/ranked-status').then(r => r.data),
    staleTime: 60_000,
  })

  const totalPoints = tierProgress?.totalPoints ?? meData?.totalPoints ?? 0
  const currentStreak = meData?.currentStreak ?? 0
  const energy = rankedStatus?.livesRemaining ?? rankedStatus?.energy ?? 100
  const seasonPoints = rankedStatus?.seasonPoints ?? 0
  const tier = getTierInfo(totalPoints)
  const greeting = getTimeOfDayGreeting(t)
  const userName = user?.name || t('home.defaultName')
  const initial = (userName || '?').charAt(0).toUpperCase()
  const isMaxTier = tier.next === null

  const starIndex = Math.max(0, Math.min(5, tierProgress?.starIndex ?? 0))
  const progressPct = tier.progressPct

  return (
    <section
      data-testid="home-greeting-card"
      className="relative overflow-hidden rounded-[22px] border border-[rgba(232,168,50,0.14)] backdrop-blur-[14px] p-4 md:p-7 mb-5"
      style={{
        background:
          'linear-gradient(135deg, rgba(40,32,28,0.6), rgba(24,26,36,0.4)), rgba(24,26,36,0.55)',
      }}
    >
      {/* Top-left gold glow */}
      <div
        aria-hidden
        className="absolute -top-[40%] -left-[10%] w-[280px] h-[280px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(232,168,50,0.14), transparent 65%)' }}
      />
      {/* Bottom accent line */}
      <div
        aria-hidden
        className="absolute bottom-0 left-[30%] w-[100px] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(232,168,50,0.4), transparent)' }}
      />

      <div className="relative z-10 grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-4 md:gap-7 items-center">
        {/* Avatar */}
        <div
          data-testid="home-greeting-avatar"
          className="relative w-[56px] h-[56px] md:w-[72px] md:h-[72px] rounded-full grid place-items-center text-[22px] md:text-[28px] font-extrabold text-[#1a1208] shrink-0"
          style={{
            background: 'linear-gradient(135deg, #e8a832 0%, #c98a1c 70%, #7a5818 100%)',
            boxShadow:
              '0 0 30px rgba(232,168,50,0.30), inset 0 -8px 16px rgba(122,88,24,0.4), inset 0 4px 8px rgba(255,220,140,0.5)',
          }}
        >
          {initial}
          <span
            aria-hidden
            className="absolute -inset-[3px] rounded-full border border-[rgba(232,168,50,0.25)] pointer-events-none"
          />
        </div>

        {/* Info: greet + name + tier row */}
        <div className="min-w-0">
          <div
            data-testid="home-greeting-meta"
            className="hidden md:block text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary md:mb-1.5"
          >
            {greeting}
          </div>
          <div
            data-testid="home-greeting-name"
            className="hidden md:block text-[30px] font-extrabold leading-[1.1] text-ivory tracking-[-0.025em] md:mb-3.5 truncate"
          >
            {userName}
          </div>

          {isMaxTier ? (
            <div
              data-testid="home-greeting-max-tier"
              className="text-sm font-semibold text-secondary"
            >
              👑 {t('home.maxTierReached')}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3.5 text-[13px]">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span
                  data-testid="home-greeting-tier-label"
                  className="text-secondary font-bold tracking-[0.02em] text-[14px]"
                >
                  {t(tier.current.nameKey)}
                </span>
                <span className="text-ivory-faint">→</span>
                <span className="text-ivory-dim font-medium">
                  {tier.next && t(tier.next.nameKey)}
                </span>
              </div>

              <div
                data-testid="home-greeting-progress-bar"
                className="relative flex-1 max-w-[240px] h-[5px] bg-white/[0.06] rounded-full overflow-visible"
              >
                <div
                  data-testid="home-greeting-progress-fill"
                  className="h-full rounded-full relative transition-[width] duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: 'linear-gradient(90deg, #c98a1c, #e8a832 50%, #e7c268)',
                    boxShadow: '0 0 12px rgba(232,168,50,0.5)',
                  }}
                >
                  <span
                    aria-hidden
                    className="absolute right-0 -top-[3px] w-[11px] h-[11px] rounded-full"
                    style={{ background: '#f5e3a8', boxShadow: '0 0 14px rgba(232,168,50,0.8)' }}
                  />
                </div>
                {/* Milestone dots — pointer-events-none overlay, kept for
                    backward-compat with Home.test.tsx specs that assert
                    home-greeting-milestone-N rendering. */}
                <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none">
                  {[0, 1, 2, 3, 4].map(i => (
                    <span
                      key={i}
                      data-testid={`home-greeting-milestone-${i}`}
                      className={`w-1 h-1 rounded-full ${
                        i < starIndex
                          ? 'bg-white shadow-[0_0_4px_rgba(255,255,255,0.6)]'
                          : 'bg-white/25'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <span
                data-testid="home-greeting-progress-pct"
                className="whitespace-nowrap tabular-nums font-bold text-[14px]"
              >
                <span className="text-secondary">{totalPoints.toLocaleString()}</span>
                <span className="text-ivory-faint text-[12px] font-medium">
                  {' '}
                  / {tier.next?.minPoints.toLocaleString()} XP
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div
          data-testid="home-greeting-stats"
          className="col-span-2 md:col-span-1 flex justify-around md:justify-start md:gap-1 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.04]"
        >
          <Stat
            icon="flame"
            testId="home-greeting-stat-streak"
            value={currentStreak}
            label={t('home.greeting.streak')}
          />
          <Stat
            icon="bolt"
            testId="home-greeting-stat-energy"
            value={energy}
            label={t('home.greeting.energy')}
          />
          <Stat
            icon="trophy"
            testId="home-greeting-stat-season"
            value={seasonPoints}
            label={t('home.greeting.seasonPoints')}
          />
        </div>
      </div>
    </section>
  )
}

interface StatProps {
  icon: StatIcon
  testId: string
  value: number
  label: string
}

function Stat({ icon, testId, value, label }: StatProps) {
  // HR-13b (2026-05-14): revert SVG icons → emoji per Bui — native
  // OS color rendering gives the same vivid look the old GreetingCard
  // had (🔥 ember-orange, ⚡ saturated gold, 🏆 trophy gold) without
  // per-icon SVG art. animate-breathe still pulses the flame.
  const glyph = icon === 'flame' ? '🔥' : icon === 'bolt' ? '⚡' : '🏆'
  return (
    <div
      data-testid={testId}
      className="text-center px-2 md:px-3.5 py-1 md:py-2 min-w-[70px] border-r last:border-r-0 border-[rgba(232,168,50,0.10)]"
    >
      <div
        className={`text-[18px] md:text-[20px] leading-none mb-1 select-none ${
          icon === 'flame' ? 'animate-breathe' : ''
        }`}
        aria-hidden
      >
        {glyph}
      </div>
      <div className="text-[18px] md:text-[22px] font-extrabold text-ivory tabular-nums leading-none tracking-[-0.02em]">
        {value.toLocaleString()}
      </div>
      <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ivory-faint mt-1">
        {label}
      </div>
    </div>
  )
}
