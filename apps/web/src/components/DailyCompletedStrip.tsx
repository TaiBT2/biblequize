interface DailyCompletedStripProps {
  correctCount: number
  totalCount: number
  /** Extra context for the sub-line, e.g. "Hành trình qua 5 sách". */
  trailingText?: string
  /** Countdown to next Daily reset, e.g. "20:35:43". */
  countdownText: string
  onReview: () => void
}

function scoreMessage(correct: number, total: number): string {
  if (total <= 0) return 'Đã hoàn thành'
  const pct = (correct / total) * 100
  if (pct >= 80) return 'Giỏi lắm!'
  if (pct >= 60) return 'Tốt lắm!'
  return 'Cố lên!'
}

/**
 * Sage-tint completed Daily strip — replaces the full FeaturedDailyCard
 * once the user finishes today's challenge. Per home_modern.html
 * `.daily-strip`.
 */
export default function DailyCompletedStrip({
  correctCount,
  totalCount,
  trailingText,
  countdownText,
  onReview,
}: DailyCompletedStripProps) {
  const message = scoreMessage(correctCount, totalCount)
  return (
    <div
      data-testid="daily-completed-strip"
      className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-3.5 rounded-[14px] mb-5"
      style={{
        background: 'rgba(74,107,82,0.10)',
        border: '1px solid rgba(74,107,82,0.25)',
      }}
    >
      <div
        aria-hidden
        className="w-8 h-8 rounded-full grid place-items-center shrink-0"
        style={{
          background: 'rgba(74,107,82,0.3)',
          border: '1px solid rgba(132,180,140,0.5)',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#84b48c"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div
          data-testid="daily-completed-strip-score"
          className="text-[13px] md:text-[14px] font-bold"
          style={{ color: '#b4d4ba' }}
        >
          {correctCount}/{totalCount} đúng — {message}
        </div>
        <div
          data-testid="daily-completed-strip-sub"
          className="text-[11px] text-ivory-faint mt-0.5"
        >
          Hôm nay
          {trailingText ? ` · ${trailingText}` : ''}
          {' · '}
          Thử thách mới sau{' '}
          <span data-testid="daily-completed-strip-countdown" className="tabular-nums">
            {countdownText}
          </span>
        </div>
      </div>

      <button
        data-testid="daily-completed-strip-review"
        type="button"
        onClick={onReview}
        className="inline-flex items-center gap-1.5 px-3 md:px-3.5 py-2 rounded-lg text-[11px] md:text-[12px] font-medium text-ivory transition-all duration-150 hover:border-[rgba(232,168,50,0.3)]"
        style={{
          background: 'rgba(245,240,230,0.06)',
          border: '1px solid rgba(245,240,230,0.10)',
        }}
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
        Xem lại bài làm
      </button>
    </div>
  )
}
