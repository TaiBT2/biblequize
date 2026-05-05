import { useTranslation } from 'react-i18next'

interface StreakCardProps {
  currentStreak: number
  last7Days: { label: string; date: string; isToday: boolean; completed: boolean }[]
  freezeUsed?: number
  freezeMax?: number
}

export function StreakCard({ currentStreak, last7Days, freezeUsed = 0, freezeMax = 1 }: StreakCardProps) {
  const { t } = useTranslation()
  return (
    <div
      data-testid="daily-streak-display"
      className="bg-gradient-to-b from-[rgba(239,68,68,0.05)] to-[rgba(50,52,64,0.4)] backdrop-blur-md border border-[rgba(239,68,68,0.15)] rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 text-[15px] font-bold mb-0">
        <span className="material-symbols-outlined text-lg text-[#f97316]">local_fire_department</span>
        {t('daily.streakTitle')}
      </div>
      <div className="text-center pt-2 pb-3.5">
        <div
          className="text-[56px] leading-none"
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
        <div className="text-5xl font-extrabold leading-none text-on-surface -mt-1.5">{currentStreak}</div>
        <div className="text-xs text-on-surface-variant mt-1">{t('daily.streakDaysLine')}</div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mt-[18px]">
        {last7Days.map((d) => {
          const cls = d.completed && d.isToday
            ? 'bg-gradient-to-br from-secondary to-[#d97706] text-on-secondary border-2 border-[#fbbf24]'
            : d.isToday
              ? 'bg-[rgba(232,168,50,0.15)] border-2 border-dashed border-[rgba(232,168,50,0.5)] text-secondary'
              : d.completed
                ? 'bg-gradient-to-br from-[#ef4444] to-[#f97316] text-white border-transparent'
                : 'bg-white/5 text-on-surface-variant border border-white/5'
          return (
            <div
              key={d.date}
              className={`aspect-square rounded-full grid place-items-center text-[10px] font-bold ${cls}`}
            >
              {d.completed && !d.isToday ? '' : (d.completed && d.isToday ? '✓' : d.label)}
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
          {t('daily.freezeCount', { used: freezeUsed, total: freezeMax })}
        </span>
      </div>
    </div>
  )
}
