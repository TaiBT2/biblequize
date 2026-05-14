import { useEffect, useState } from 'react'

interface FeaturedDailyCardProps {
  /** Default 5 questions per Daily Challenge spec. */
  questionCount?: number
  /** Default ~3 minutes per Daily Challenge spec. */
  estimatedMinutes?: number
  /** Today's global participant count; row hidden when undefined or 0. */
  globalParticipants?: number
  /** Optional explicit countdown override (used by tests). When omitted,
   *  the component computes time-to-UTC-midnight on its own. */
  countdownText?: string
  onStart: () => void
}

function msUntilMidnightUtc(): number {
  const now = new Date()
  const utcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  )
  return utcMidnight.getTime() - now.getTime()
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * State A hero — Featured Daily Challenge card per home_modern.html
 * `.daily-featured`. Rendered only when the user hasn't completed today's
 * Daily Challenge. Maroon+gold radial atmosphere, gold left-border accent,
 * pulsing label dot, 5-dot question-count indicator, gold-gradient CTA.
 */
export default function FeaturedDailyCard({
  questionCount = 5,
  estimatedMinutes = 3,
  globalParticipants,
  countdownText,
  onStart,
}: FeaturedDailyCardProps) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (countdownText !== undefined) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [countdownText])
  // tick is read to refresh msUntilMidnightUtc each second.
  void tick
  const computed = countdownText ?? formatCountdown(msUntilMidnightUtc())

  const showParticipants =
    typeof globalParticipants === 'number' && globalParticipants > 0

  return (
    <div
      data-testid="featured-daily-card"
      className="relative overflow-hidden rounded-2xl border border-[rgba(232,168,50,0.18)] border-l-[3px] border-l-secondary p-5 md:p-6 mb-5 backdrop-blur-[14px] transition-all duration-200 hover:border-[rgba(232,168,50,0.35)] hover:-translate-y-px hover:shadow-[0_10px_30px_-8px_rgba(232,168,50,0.18)]"
      style={{
        background:
          'radial-gradient(ellipse 350px 200px at 90% 0%, rgba(124,45,58,0.15), transparent 60%), radial-gradient(ellipse 300px 150px at 20% 100%, rgba(232,168,50,0.08), transparent 60%), rgba(28,22,18,0.7)',
      }}
    >
      {/* Decorative ornament (top-right) */}
      <svg
        aria-hidden
        className="absolute top-3.5 right-6 opacity-50 pointer-events-none"
        width="70"
        height="50"
        viewBox="0 0 70 50"
        fill="none"
      >
        <path d="M5 25 Q20 8 35 25 Q50 42 65 25" stroke="#e8a832" strokeWidth="1" opacity="0.5" />
        <circle cx="35" cy="25" r="2.5" fill="#e8a832" opacity="0.6" />
        <circle cx="35" cy="12" r="1.2" fill="#e8a832" opacity="0.5" />
        <circle cx="35" cy="38" r="1.2" fill="#e8a832" opacity="0.5" />
        <path d="M2 25 L10 25 M60 25 L68 25" stroke="#e8a832" strokeWidth="0.8" opacity="0.4" />
      </svg>

      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:gap-7 items-center">
        <div>
          <div
            data-testid="featured-daily-card-label"
            className="text-[10px] font-bold tracking-[0.22em] uppercase text-secondary mb-1.5 flex items-center gap-2"
          >
            <span
              aria-hidden
              className="inline-block w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"
              style={{ boxShadow: '0 0 8px rgba(232,168,50,0.7)' }}
            />
            Thử thách hôm nay · Mới sẵn sàng
          </div>

          <h2 className="text-[20px] md:text-[24px] font-extrabold text-ivory leading-[1.2] tracking-[-0.025em] mb-1">
            Bắt đầu ngày mới với Lời Chúa
          </h2>

          <p className="text-[12px] md:text-[13px] text-ivory-dim mb-3.5">
            {questionCount} câu · {estimatedMinutes} phút · Reset mỗi 24 giờ · Cùng cộng đồng
          </p>

          <div
            data-testid="featured-daily-card-meta"
            className="flex flex-wrap gap-3 md:gap-4 items-center text-[11px] md:text-[12px] text-ivory-dim"
          >
            <span
              data-testid="featured-daily-card-dots"
              className="flex items-center gap-1.5"
            >
              <span className="inline-flex gap-1">
                {Array.from({ length: questionCount }).map((_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className="inline-block w-2 h-2 rounded-full border-[1.5px] border-[rgba(232,168,50,0.5)]"
                  />
                ))}
              </span>
              {questionCount} câu hỏi
            </span>
            <span className="flex items-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-tertiary"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 6v6l4 2" />
              </svg>
              ~ {estimatedMinutes} phút
            </span>
            {showParticipants && (
              <span
                data-testid="featured-daily-card-participants"
                className="flex items-center gap-1.5"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-tertiary"
                >
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3 21v-1a6 6 0 0112 0v1" />
                  <path d="M16 11a3 3 0 100-6" />
                  <path d="M21 21v-1a6 6 0 00-3-5.2" />
                </svg>
                {globalParticipants!.toLocaleString()} đã chơi hôm nay
              </span>
            )}
          </div>
        </div>

        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3">
          <div className="text-right">
            <div
              data-testid="featured-daily-card-countdown-label"
              className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ivory-faint"
            >
              Còn lại trong ngày
            </div>
            <div
              data-testid="featured-daily-card-countdown"
              className="text-[16px] font-extrabold text-tertiary tabular-nums tracking-[0.04em] mt-0.5"
            >
              {computed}
            </div>
          </div>
          <button
            data-testid="featured-daily-card-cta"
            type="button"
            onClick={onStart}
            className="inline-flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-[11px] font-bold text-[14px] text-[#1a1208] tracking-[0.01em] transition-transform duration-200 hover:translate-x-[3px]"
            style={{
              background: 'linear-gradient(135deg, #e8a832, #c98a1c)',
              boxShadow:
                '0 4px 14px rgba(232,168,50,0.30), inset 0 1px 0 rgba(255,220,140,0.4)',
            }}
          >
            Vào chơi ngay
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
