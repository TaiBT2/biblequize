import { useTranslation } from 'react-i18next'

interface RankedStandardCardProps {
  energyRemaining: number
  rankedAnswered: number
  rankedCap: number
  onEnter: () => void
}

/**
 * State A standard — Ranked rendered as a regular mode card with gold
 * tint (NOT the full gold-gradient hero — that's HR-4 HeroRankedCard,
 * only shown after Daily is done). Per home_modern.html
 * `.mode-card.ranked-standard`.
 */
export default function RankedStandardCard({
  energyRemaining,
  rankedAnswered,
  rankedCap,
  onEnter,
}: RankedStandardCardProps) {
  const { t } = useTranslation()
  return (
    <div
      data-testid="ranked-standard-card"
      className="relative cursor-pointer rounded-2xl border border-[rgba(232,168,50,0.28)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(232,168,50,0.5)]"
      role="button"
      tabIndex={0}
      onClick={onEnter}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEnter()
        }
      }}
      style={{
        background:
          'linear-gradient(135deg, rgba(232,168,50,0.06), rgba(232,168,50,0.01) 60%), rgba(24,26,36,0.55)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-start justify-between mb-3.5">
        <div
          data-testid="ranked-standard-card-icon"
          className="w-11 h-11 rounded-xl grid place-items-center text-bq-amberd"
          style={{
            background:
              'linear-gradient(135deg, rgba(232,168,50,0.20), rgba(232,168,50,0.06))',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8M12 17v4" />
            <path d="M7 4h10v5a5 5 0 01-10 0V4z" />
            <path d="M7 7H3v2a3 3 0 003 3M17 7h4v2a3 3 0 01-3 3" />
          </svg>
        </div>
        {/* HO-3: removed the hardcoded "Đã mở khóa" pill (noisy + bypassed
            i18n). Lock affordance stays consistent — only the "Khóa" badge
            is meaningful as a goal cue. */}
      </div>

      <h3
        data-testid="ranked-standard-card-title"
        className="text-[13px] md:text-[14px] font-bold text-bq-ink leading-tight mb-1 tracking-[-0.01em]"
      >
        {t('gameModes.ranked')}
      </h3>
      <p
        data-testid="ranked-standard-card-desc"
        className="text-[12px] text-bq-ink2 mb-3.5"
      >
        Cạnh tranh ranking · {energyRemaining} năng lượng sẵn sàng
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <span
          data-testid="ranked-standard-card-cta"
          className="text-[13px] font-bold text-bq-amberd flex items-center gap-1.5 group"
        >
          Vào trận
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-1"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </span>
        <span data-testid="ranked-standard-card-hint" className="text-[11px] text-bq-ink3">
          {rankedAnswered} / {rankedCap} câu hôm nay
        </span>
      </div>
    </div>
  )
}
