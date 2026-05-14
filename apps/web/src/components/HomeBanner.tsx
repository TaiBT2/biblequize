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

/**
 * Home banner — HRV-10 vintage palette (Yeseva One name + 6-tier rail).
 * Stats moved to HomeHud (HRV-16) per vintage Home.html structure: HUD
 * row above Hero greeting. Banner now focuses purely on greeting + name +
 * tier progress.
 *
 * Visual contract:
 * - Avatar 72px gold gradient + inset highlight + dashed gold ring
 * - Name Yeseva One 26→40px responsive ivory, tight tracking
 * - Tier row: current (gold) → next (ivory-dim) + 5px progress with
 *   terminal dot + tabular-nums XP/next + 6 milestone dots (one per C1 tier)
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

  const totalPoints = tierProgress?.totalPoints ?? meData?.totalPoints ?? 0
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
      className="relative overflow-hidden rounded-[22px] border border-line bg-bg-deep shadow-chunky-soft p-4 md:p-7 mb-5"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 600px 320px at 15% -20%, rgba(232,181,71,0.14), transparent 60%), linear-gradient(135deg, rgba(27,20,36,0.85), rgba(14,10,18,0.95))',
      }}
    >
      {/* Top-left gold glow — stronger vintage radial */}
      <div
        aria-hidden
        className="absolute -top-[40%] -left-[10%] w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,209,120,0.18), transparent 65%)' }}
      />
      {/* Bottom accent line — gold-bright */}
      <div
        aria-hidden
        className="absolute bottom-0 left-[30%] w-[120px] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(244,209,120,0.5), transparent)' }}
      />

      <div className="relative z-10 grid grid-cols-[auto_1fr] gap-4 md:gap-7 items-center">
        {/* HRV-20 avatar — vintage .avatar-pill style with double-ring
            decoration (inner bg-deep spacer + outer gold). Smaller than
            HR-2 (was 56→72px, now 48→60px) so the avatar feels like a
            personal seal rather than a HUD ornament — matching the
            illuminated-manuscript aesthetic where the figure is a
            decorative initial, not the dominant element. */}
        <div
          data-testid="home-greeting-avatar"
          className="relative w-[48px] h-[48px] md:w-[60px] md:h-[60px] rounded-full grid place-items-center font-display text-[18px] md:text-[22px] text-[#1a1208] shrink-0"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, #f4d178, #c98a1c 70%, #7a5818)',
            boxShadow:
              '0 0 0 2px #0e0a12, 0 0 0 4px rgba(244,209,120,0.85), 0 0 24px rgba(244,209,120,0.30)',
          }}
        >
          {initial}
        </div>

        {/* Info: eyebrow + poetic h1 + rank chip + tier row */}
        <div className="min-w-0">
          <div
            data-testid="home-greeting-meta"
            className="inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright mb-1.5 md:mb-2.5"
          >
            <span aria-hidden className="block w-5 h-px bg-gold-bright" />
            {greeting}
          </div>
          {/* HRV-17 poetic h1 greeting — vintage Home.html hero h1.
              Multi-line: "{Name},\ncuộc hành trình chờ con."
              <accent> wraps the poetic phrase in gold-bright. */}
          <h1
            data-testid="home-greeting-name"
            className="font-display text-[28px] md:text-[44px] lg:text-[52px] leading-[0.98] text-ivory tracking-[-0.02em] mb-2.5 md:mb-3.5"
          >
            <span className="block truncate">{userName},</span>
            <span className="block">
              <span
                className="text-gold-bright"
                style={{ textShadow: '0 0 24px rgba(244,209,120,0.28)' }}
              >
                {t('home.hero.greetingAccent')}
              </span>{' '}
              <span>{t('home.hero.greetingSuffix')}</span>
            </span>
          </h1>

          {!isMaxTier && tier.next && (
            <div
              data-testid="home-greeting-rank-chip"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-deep border border-line text-[11px] md:text-[12px] font-medium mb-2 md:mb-2.5"
            >
              <span
                aria-hidden
                className="w-2 h-2 rounded-full bg-gold-bright animate-pulse"
                style={{ boxShadow: '0 0 10px rgba(244,209,120,0.85)' }}
              />
              <span
                data-testid="home-greeting-tier-label"
                className="text-gold-bright tracking-[0.04em]"
              >
                {t(tier.current.nameKey)}
              </span>
              <span className="text-ivory-faint">→</span>
              <span className="text-ivory-dim">{t(tier.next.nameKey)}</span>
            </div>
          )}

          <p
            data-testid="home-greeting-tagline"
            className="text-[12px] md:text-[13px] text-ivory-dim mb-3 md:mb-4 max-w-[44ch]"
          >
            {t('home.hero.tagline')}
          </p>

          {isMaxTier ? (
            <div
              data-testid="home-greeting-max-tier"
              className="text-sm font-semibold text-secondary"
            >
              👑 {t('home.maxTierReached')}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3.5 text-[13px]">
              <div
                data-testid="home-greeting-progress-bar"
                className="relative flex-1 max-w-[280px] h-[5px] bg-white/[0.06] rounded-full overflow-visible"
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
                {/* HRV-10: 6 milestone dots (was 5) — aligns with C1
                    6-tier journey (Tân Tín Hữu / Người Tìm Kiếm / Môn Đồ /
                    Hiền Triết / Tiên Tri / Sứ Đồ). starIndex still 0..5
                    from BE = stars within current tier; the visual rail
                    uses the same dot count but conceptually represents
                    overall tier progression for the user. */}
                <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none">
                  {[0, 1, 2, 3, 4, 5].map(i => (
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

      </div>
    </section>
  )
}
