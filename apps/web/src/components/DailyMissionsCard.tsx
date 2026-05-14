import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

interface Mission {
  slot: number
  type: string
  description: string
  progress: number
  target: number
  completed: boolean
}

interface DailyMissionsData {
  date: string
  missions: Mission[]
  allCompleted: boolean
  bonusClaimed: boolean
  bonusXp: number
}

/**
 * Daily missions section per Home redesign V2 (mockup line 159-200).
 * Compact card with three rows; each row has an outline circle (filled
 * gold when completed), the mission description, and an inline 3px
 * progress bar with X/Y count on the right. Sidebar shares the same
 * TanStack query key so the data is fetched once.
 */
export default function DailyMissionsCard() {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery<DailyMissionsData>({
    queryKey: ['daily-missions'],
    queryFn: () => api.get('/api/me/daily-missions').then(r => r.data),
    staleTime: 30_000,
  })

  if (isLoading || !data) return null

  const { missions, allCompleted, bonusClaimed, bonusXp } = data
  const completedCount = missions.filter(m => m.completed).length

  return (
    <div
      data-testid="daily-missions-card"
      className="relative overflow-hidden rounded-2xl border border-line shadow-chunky-soft px-4 py-5 md:px-7 md:py-6"
      style={{
        backgroundImage:
          'repeating-linear-gradient(180deg, transparent 0 36px, rgba(34,26,44,0.5) 36px 37px), linear-gradient(180deg, #1b1424, #241a2e)',
      }}
    >
      {/* HRV-13 scroll-paper top/bottom dashed decoration (vintage
          .missions::before/after equivalents) — pure decoration, hidden
          from screen readers. */}
      <span
        aria-hidden
        className="absolute left-2 right-2 top-2 h-[5px] pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(90deg, #2e2238 0 8px, transparent 8px 14px)',
        }}
      />
      <span
        aria-hidden
        className="absolute left-2 right-2 bottom-2 h-[5px] pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(90deg, #2e2238 0 8px, transparent 8px 14px)',
        }}
      />

      {/* Header — vintage SectionHeader-style: Yeseva One title + gold
          em-dash subtitle + right meta count */}
      <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-4">
        <h3 className="font-display text-[18px] md:text-[22px] text-ivory leading-none">
          {t('home.dailyMissionsHeader')}
        </h3>
        <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-secondary">
          — Daily Quests —
        </span>
        <span className="ml-auto font-numeric text-[11px] text-ivory-faint">
          {t('home.dailyMissionsCount', { completed: completedCount, total: missions.length })}
        </span>
      </div>

      {/* Mission rows */}
      <div className="flex flex-col gap-2">
        {missions.map((m) => {
          const pct = m.completed ? 100 : Math.min(100, (m.progress / m.target) * 100)
          return (
            <div
              key={m.slot}
              data-testid="mission-item"
              className="flex items-center gap-2 md:gap-2.5"
            >
              {/* Outline circle — filled gold when completed (HRV-13:
                  thicker border + line-soft default for vintage feel) */}
              <div
                className={`w-5 h-5 md:w-6 md:h-6 rounded-md flex-shrink-0 flex items-center justify-center ${
                  m.completed
                    ? 'bg-gold-bright text-[#1a1019] border-2 border-secondary'
                    : 'border-2 border-line bg-[rgba(17,12,24,0.6)]'
                }`}
              >
                {m.completed && (
                  <span
                    className="material-symbols-outlined text-[10px] md:text-[12px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                )}
              </div>

              {/* Description + inline 3px progress bar */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-[11px] md:text-[12px] truncate ${
                    m.completed ? 'text-on-surface/85 line-through opacity-70' : 'text-on-surface/85'
                  }`}
                >
                  {m.description}
                </div>
                <div className="bg-white/[0.06] rounded-[2px] h-[2px] md:h-[3px] mt-0.5 md:mt-1 overflow-hidden">
                  <div
                    data-testid={`mission-${m.slot}-progress`}
                    className="bg-secondary h-full rounded-[2px] transition-[width] duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Right-aligned count */}
              <span className="text-[9px] md:text-[10px] text-on-surface-variant/45 font-medium">
                {m.progress}/{m.target}
              </span>
            </div>
          )
        })}
      </div>

      {/* Bonus row — only when all 3 are done */}
      {allCompleted && (
        <div className="mt-3 pt-3 border-t border-secondary/15 flex items-center gap-2">
          <span className="text-base">🎁</span>
          <span className="text-[11px] font-medium text-secondary">
            +{bonusXp} XP{' '}
            {bonusClaimed && <span className="text-on-surface-variant/50">{t('home.received', 'nhận được!')}</span>}
          </span>
        </div>
      )}
    </div>
  )
}
