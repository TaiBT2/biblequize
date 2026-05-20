import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

/**
 * Page header for /ranked — desktop v2 (mockup_ranked_desktop_v2.html
 * 2026-05-20). Title splits into leading word + italic Cormorant Garamond
 * accent (matches the editorial Cormorant treatment used across the app
 * for hero copy). Subtitle expanded with the "leo tier, vào BXH mùa"
 * clause so the page promises the journey, not just today's points.
 * "How to play" link becomes a bordered pill on md+ to give it
 * affordance as a real CTA (was a plain text link).
 */
export default function RankedHeader() {
  const { t } = useTranslation()

  return (
    <header className="flex items-end justify-between mb-6 gap-4 flex-wrap">
      <div className="min-w-0">
        <h1 className="text-on-surface font-extrabold leading-none tracking-tight text-[24px] md:text-[34px]">
          {t('ranked.titleLeading')}{' '}
          <span className="font-headline italic font-semibold text-secondary">
            {t('ranked.titleAccent')}
          </span>
        </h1>
        <p className="text-on-surface-variant/55 text-[12px] md:text-[13px] mt-2">
          {t('ranked.subtitle')}
        </p>
      </div>
      <Link
        to="/help#ranked"
        data-testid="ranked-how-to-play"
        className="text-secondary text-[12px] md:text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0
                   md:px-3.5 md:py-2 md:border md:border-secondary/25 md:rounded-[10px] md:hover:bg-secondary/[0.06]"
      >
        {t('ranked.howToPlay')}
        <span className="material-symbols-outlined text-[16px]" style={FILL_1}>arrow_forward</span>
      </Link>
    </header>
  )
}
