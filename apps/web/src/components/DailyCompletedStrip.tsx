import { useTranslation } from 'react-i18next'

interface DailyCompletedStripProps {
  correctCount: number
  totalCount: number
  /** Extra context appended to the sub-line. */
  trailingText?: string
  /** Countdown to next Daily reset, e.g. "20:35:43". */
  countdownText: string
  onReview: () => void
}

/**
 * Sage-tint completed Daily strip — replaces the full FeaturedDailyCard
 * once the user finishes today's challenge. Per home_modern.html
 * `.daily-strip`. Strings come from `home.dailyCompleted.*` so EN/VI
 * locales render correctly.
 */
export default function DailyCompletedStrip({
  correctCount,
  totalCount,
  trailingText,
  countdownText,
  onReview,
}: DailyCompletedStripProps) {
  const { t } = useTranslation()
  const messageKey =
    totalCount <= 0
      ? 'home.dailyCompleted.scoreDone'
      : (correctCount / totalCount) * 100 >= 80
        ? 'home.dailyCompleted.scoreExcellent'
        : (correctCount / totalCount) * 100 >= 60
          ? 'home.dailyCompleted.scoreGood'
          : 'home.dailyCompleted.scoreEncouraging'
  const message = t(messageKey) as string
  return (
    <div
      data-testid="daily-completed-strip"
      className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-3.5 rounded-[14px] mb-5 bg-bq-white border border-bq-hair shadow-bq-soft"
    >
      <div
        aria-hidden
        className="w-8 h-8 rounded-full grid place-items-center shrink-0 bg-bq-emerald/10 border border-bq-emerald/30"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-bq-emerald"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div
          data-testid="daily-completed-strip-score"
          className="text-[13px] md:text-[14px] font-bold text-bq-emerald"
        >
          {t('home.dailyCompleted.score', {
            correct: correctCount,
            total: totalCount,
            message,
          })}
        </div>
        <div
          data-testid="daily-completed-strip-sub"
          className="text-[11px] text-bq-ink3 mt-0.5"
        >
          {t('home.dailyCompleted.subToday')}
          {trailingText ? ` · ${trailingText}` : ''}
          {' · '}
          <span data-testid="daily-completed-strip-countdown" className="tabular-nums">
            {t('home.dailyCompleted.subCountdown', { countdown: countdownText })}
          </span>
        </div>
      </div>

      <button
        data-testid="daily-completed-strip-review"
        type="button"
        onClick={onReview}
        className="inline-flex items-center gap-1.5 px-3 md:px-3.5 py-2 rounded-lg text-[11px] md:text-[12px] font-medium text-bq-ink2 bg-bq-paper border border-bq-hair transition-all duration-150 hover:border-bq-amber/30"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19V5a2 2 0 012-2h11l3 3v13a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
          <path d="M8 7h6M8 11h8M8 15h5" />
        </svg>
        {t('home.dailyCompleted.review')}
      </button>
    </div>
  )
}
