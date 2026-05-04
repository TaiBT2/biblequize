import { useTranslation } from 'react-i18next'

export interface HeatmapDay {
  date: string
  completed: boolean
  correctCount: number
  totalQuestions: number
}

interface HeatmapCardProps {
  days: HeatmapDay[]
}

function levelClass(d: HeatmapDay): string {
  if (!d.completed) return 'bg-white/5'
  const ratio = d.totalQuestions > 0 ? d.correctCount / d.totalQuestions : 0
  if (ratio >= 1.0) return 'bg-gradient-to-br from-secondary to-[#d97706]'
  if (ratio >= 0.8) return 'bg-[rgba(232,168,50,0.65)]'
  if (ratio >= 0.6) return 'bg-[rgba(232,168,50,0.4)]'
  return 'bg-[rgba(232,168,50,0.2)]'
}

export function HeatmapCard({ days }: HeatmapCardProps) {
  const { t } = useTranslation()
  const completedCount = days.filter((d) => d.completed).length
  const total = days.length
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0
  const todayIso = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-[rgba(50,52,64,0.4)] backdrop-blur-md border border-[rgba(232,168,50,0.1)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[15px] font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-secondary">grid_view</span>
          {t('daily.heatmapTitle', { days: total })}
        </div>
        <span className="text-xs text-on-surface-variant">
          {t('daily.heatmapStats', { completed: completedCount, total, percent })}
        </span>
      </div>

      <div className="grid grid-cols-15 gap-1.5 mb-3.5" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
        {days.map((d) => {
          const isToday = d.date === todayIso
          return (
            <div
              key={d.date}
              title={`${d.date}: ${d.completed ? `${d.correctCount}/${d.totalQuestions}` : t('daily.heatmapMissed')}`}
              className={`aspect-square rounded cursor-pointer transition-transform hover:scale-[1.3] ${levelClass(d)} ${
                isToday ? 'ring-2 ring-[#fbbf24] ring-offset-1 ring-offset-[#11131e]' : ''
              }`}
            />
          )
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
        <span>{t('daily.heatmapLegendRange', { days: total })}</span>
        <div className="flex items-center gap-1">
          <span>{t('daily.heatmapLegendLow')}</span>
          <div className="w-3 h-3 rounded bg-white/5" />
          <div className="w-3 h-3 rounded bg-[rgba(232,168,50,0.2)]" />
          <div className="w-3 h-3 rounded bg-[rgba(232,168,50,0.4)]" />
          <div className="w-3 h-3 rounded bg-[rgba(232,168,50,0.65)]" />
          <div className="w-3 h-3 rounded bg-gradient-to-br from-secondary to-[#d97706]" />
          <span>{t('daily.heatmapLegendHigh')}</span>
        </div>
      </div>
    </div>
  )
}
