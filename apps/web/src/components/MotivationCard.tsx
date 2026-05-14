import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

/**
 * Onboarding nudge for brand-new users (mockup
 * docs/designs/home_redesign_mockup.html `.motivation-card`).
 *
 * Purely presentational — Home decides when to render this (HR-6 will
 * gate it on `totalPoints < 1000`). Friendly hint that doing today's
 * Daily Challenge unlocks the rest of the rail (missions/leaderboard
 * become visible once the user has some progress).
 */
export default function MotivationCard() {
  const { t } = useTranslation()

  return (
    <div
      data-testid="motivation-card"
      className="rounded-2xl border border-plum-deep/50 bg-bg-deep shadow-chunky-soft p-4 md:p-6"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 360px 200px at 12% 0%, rgba(140,91,181,0.16), transparent 60%)',
      }}
    >
      <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-3 md:gap-5 items-center">
        <div
          data-testid="motivation-card-icon"
          className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl grid place-items-center text-white shrink-0"
          style={{
            background: 'linear-gradient(180deg, #8c5bb5, #5b3681)',
            boxShadow: 'inset 0 -3px 0 0 rgba(0,0,0,0.22)',
          }}
        >
          <span className="material-symbols-outlined text-[22px] md:text-[28px]" style={FILL_1}>
            tips_and_updates
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[13px] md:text-[15px] font-bold text-ivory">
            <span
              data-testid="motivation-card-step"
              className="px-2 py-0.5 rounded-md bg-plum/20 border border-plum-deep/50 text-[#d6c4eb] text-[10px] md:text-[11px] font-numeric tracking-[0.16em] uppercase"
            >
              {t('home.motivation.step')}
            </span>
            <span data-testid="motivation-card-title" className="font-display text-[15px] md:text-[18px] text-ivory">
              {t('home.motivation.title')}
            </span>
          </div>
          <div
            data-testid="motivation-card-desc"
            className="text-[12px] md:text-[13px] text-ivory-dim mt-1 leading-snug max-w-[52ch]"
          >
            {t('home.motivation.description')}
          </div>
        </div>

        {/* Mobile: full-width CTA below; Desktop: third grid col (right side) */}
        <Link
          to="/daily"
          data-testid="motivation-card-cta"
          className="col-span-2 md:col-span-1 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 md:py-2.5 rounded-xl border border-plum-deep/60 bg-plum/15 text-[#d6c4eb] text-[13px] md:text-sm font-bold hover:bg-plum/25 transition-colors"
        >
          {t('home.motivation.cta')}
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  )
}
