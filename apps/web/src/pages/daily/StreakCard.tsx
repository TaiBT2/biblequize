import { useTranslation } from 'react-i18next'

interface StreakCardProps {
  currentStreak: number
  last7Days: { label: string; date: string; isToday: boolean; completed: boolean }[]
  /** Per-tier streak-freeze allowance (1 = T1-T2, 2 = T3-T4, 3 = T5-T6).
   *  Decision 2026-05-19 (option B): we surface only the per-week benefit
   *  count and drop the "used/total" framing because the BE entity is a
   *  Boolean (`User.streakFreezeUsedThisWeek`) so it can't truthfully
   *  represent partial-use for tiers with allowance > 1. */
  freezesPerWeek?: number
}

const MILESTONES = [7, 14, 30, 60, 100, 365]

export function StreakCard({ currentStreak, last7Days, freezesPerWeek = 1 }: StreakCardProps) {
  const { t } = useTranslation()
  // Scale celebration graphic by streak length — a 1-day streak should not
  // own the biggest visual on the page (prompt DC-4: "Streak 1 ngày KHÔNG
  // được chiếm graphic to nhất màn"). Threshold of 7 matches the week strip.
  const isHighStreak = currentStreak >= 7
  const flameClass = isHighStreak ? 'text-[56px]' : 'text-[40px]'
  const numberClass = isHighStreak ? 'text-5xl' : 'text-4xl'

  // Next-milestone caption — gives the user a concrete target instead of
  // an isolated number. Falls back to a "fresh start" prompt at streak 0
  // and a legendary tag past the highest milestone.
  const nextMilestone = MILESTONES.find((m) => m > currentStreak)
  const caption =
    currentStreak === 0
      ? t('daily.streakFresh')
      : nextMilestone
        ? t('daily.streakNextMilestone', { count: nextMilestone - currentStreak, milestone: nextMilestone })
        : t('daily.streakLegendary', { count: currentStreak })

  return (
    <div
      data-testid="daily-streak-display"
      className="bg-gradient-to-b from-[rgba(239,68,68,0.05)] to-[rgba(50,52,64,0.4)] backdrop-blur-md border border-[rgba(239,68,68,0.15)] rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 text-[15px] font-bold mb-0">
        <span className="material-symbols-outlined text-lg text-[#f97316]">local_fire_department</span>
        {t('daily.streakTitle')}
      </div>
      <div className="flex items-center justify-center gap-4 pt-3 pb-2">
        <div
          className={`${flameClass} leading-none`}
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #f97316 60%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 4px 12px rgba(239,68,68,0.3))',
          }}
        >
          🔥
        </div>
        <div className="text-left">
          <div className={`${numberClass} font-extrabold leading-none text-on-surface`}>{currentStreak}</div>
          <div className="text-xs text-on-surface-variant mt-1">{t('daily.streakDaysLine')}</div>
        </div>
      </div>
      <div className="text-[11px] text-center text-on-surface-variant/80 mb-2">{caption}</div>

      {/* Week strip — fixed-size circles centered, so the row stays compact
          regardless of card width. Before DC-5, StreakCard lived in a narrow
          right column where `aspect-square` happened to render small; after
          the leaderboard gate the card is full-width on State A and the
          circles ballooned to ~100px each. Bound them to 44px. */}
      <div className="flex justify-around gap-1.5 mt-[18px]">
        {last7Days.map((d) => {
          const cls = d.completed && d.isToday
            ? 'bg-gradient-to-br from-secondary to-[#d97706] text-on-secondary border-2 border-[#fbbf24]'
            : d.isToday
              ? 'bg-[rgba(232,168,50,0.15)] border-2 border-dashed border-[rgba(232,168,50,0.5)] text-secondary'
              : d.completed
                ? 'bg-gradient-to-br from-[#ef4444] to-[#f97316] text-white border-transparent'
                : 'bg-white/5 text-on-surface-variant border border-white/5'
          // Always render the day label so no day reads as an unlabeled
          // circle (DC-4: 3 states must be distinguishable — done /
          // chưa làm / hôm nay — through bg+border, not by hiding text).
          return (
            <div
              key={d.date}
              className={`w-11 h-11 rounded-full grid place-items-center text-[11px] font-bold flex-shrink-0 ${cls}`}
            >
              {d.label}
            </div>
          )
        })}
      </div>

      <div className="mt-4 px-3 py-2.5 bg-[rgba(96,165,250,0.06)] border border-[rgba(96,165,250,0.15)] rounded-[10px] flex items-center justify-between text-xs">
        <span className="text-[#93c5fd] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">ac_unit</span>
          {t('daily.freezeIndicator')}
        </span>
        <span className="text-on-surface font-bold">
          {t('daily.freezePerWeek', { count: freezesPerWeek })}
        </span>
      </div>
    </div>
  )
}
