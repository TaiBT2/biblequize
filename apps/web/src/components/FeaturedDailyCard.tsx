import { useEffect, useState } from 'react'

interface FeaturedDailyCardProps {
  /** Default 5 questions per Daily Challenge spec. */
  questionCount?: number
  /** Default ~3 minutes per Daily Challenge spec. */
  estimatedMinutes?: number
  /** Optional explicit countdown override (used by tests). When omitted,
   *  the component computes time-to-UTC-midnight on its own. */
  countdownText?: string
  /** Optional fixed date override for tests; otherwise uses today. */
  todayOverride?: Date
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

function formatDayMonth(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export default function FeaturedDailyCard({
  questionCount = 5,
  estimatedMinutes = 3,
  countdownText,
  todayOverride,
  onStart,
}: FeaturedDailyCardProps) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (countdownText !== undefined) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [countdownText])
  void tick
  const computed = countdownText ?? formatCountdown(msUntilMidnightUtc())
  const today = todayOverride ?? new Date()
  const dayLabel = formatDayMonth(today)

  return (
    <div
      data-testid="featured-daily-card"
      className="relative overflow-hidden rounded-2xl border border-[rgba(232,168,50,0.18)] border-l-[3px] border-l-secondary p-5 md:p-6 mb-5 backdrop-blur-[14px] transition-all duration-200 hover:border-[rgba(232,168,50,0.35)] hover:-translate-y-px hover:shadow-[0_10px_30px_-8px_rgba(232,168,50,0.18)]"
      style={{
        background:
          'radial-gradient(ellipse 350px 200px at 90% 0%, rgba(124,45,58,0.15), transparent 60%), radial-gradient(ellipse 300px 150px at 20% 100%, rgba(232,168,50,0.08), transparent 60%), rgba(28,22,18,0.7)',
      }}
    >
      {/* Label row: dot + label + date */}
      <div
        data-testid="featured-daily-card-label"
        className="text-[10px] font-bold tracking-[0.22em] uppercase text-secondary mb-2 flex items-center gap-2"
      >
        <span
          aria-hidden
          className="inline-block w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"
          style={{ boxShadow: '0 0 8px rgba(232,168,50,0.7)' }}
        />
        <span>Thử thách hôm nay</span>
        <span className="opacity-50">·</span>
        <span data-testid="featured-daily-card-date" className="text-ivory-dim font-semibold tracking-[0.1em]">
          {dayLabel}
        </span>
      </div>

      {/* Heading with "Lời Chúa" gold serif emphasis */}
      <h2 className="text-[16px] sm:text-[18px] md:text-[22px] font-extrabold text-ivory leading-[1.25] tracking-[-0.02em] mb-3.5 whitespace-nowrap">
        Bắt đầu ngày mới với{' '}
        <span
          className="text-secondary italic"
          style={{ fontFamily: '"Lora", "Playfair Display", Georgia, serif', fontWeight: 700 }}
        >
          Lời Chúa
        </span>
      </h2>

      {/* Pill chips row */}
      <div
        data-testid="featured-daily-card-meta"
        className="flex flex-nowrap gap-1.5 mb-3.5 whitespace-nowrap"
      >
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[rgba(232,168,50,0.20)] bg-[rgba(232,168,50,0.06)] text-[11px] text-ivory-dim">
          <span aria-hidden>📖</span>
          {questionCount} câu
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[rgba(232,168,50,0.20)] bg-[rgba(232,168,50,0.06)] text-[11px] text-ivory-dim">
          <span aria-hidden>⏱</span>
          ~{estimatedMinutes} phút
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[rgba(232,168,50,0.20)] bg-[rgba(232,168,50,0.06)] text-[11px] text-ivory-dim">
          <span aria-hidden>🌐</span>
          Cùng cộng đồng
        </span>
      </div>

      {/* Reward block */}
      <div
        data-testid="featured-daily-card-reward"
        className="flex items-center gap-2.5 px-3.5 py-2.5 mb-4 rounded-xl border border-[rgba(232,168,50,0.25)] bg-[rgba(232,168,50,0.08)]"
      >
        <span aria-hidden className="text-[16px]">🏆</span>
        <span className="text-[13px] text-ivory">
          <span className="text-ivory-dim">Phần thưởng:</span>{' '}
          <span className="font-bold text-secondary">+50 XP</span>
        </span>
      </div>

      {/* Footer: countdown + CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div
            data-testid="featured-daily-card-countdown-label"
            className="text-[10px] font-semibold tracking-[0.12em] uppercase text-ivory-faint whitespace-nowrap"
          >
            Còn lại trong ngày
          </div>
          <div
            data-testid="featured-daily-card-countdown"
            className="text-[18px] font-extrabold text-tertiary tabular-nums tracking-[0.04em] mt-0.5"
          >
            {computed}
          </div>
        </div>
        <button
          data-testid="featured-daily-card-cta"
          type="button"
          onClick={onStart}
          className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 px-5 py-3 rounded-[12px] font-bold text-[14px] text-[#1a1208] tracking-[0.01em] whitespace-nowrap transition-transform duration-200 hover:translate-x-[3px]"
          style={{
            background: 'linear-gradient(135deg, #e8a832, #c98a1c)',
            boxShadow:
              '0 4px 14px rgba(232,168,50,0.30), inset 0 1px 0 rgba(255,220,140,0.4)',
          }}
        >
          Bắt đầu
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
