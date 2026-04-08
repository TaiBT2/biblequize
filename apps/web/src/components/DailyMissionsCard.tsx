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
    <div className={`rounded-2xl p-5 border transition-colors ${
      allCompleted
        ? 'bg-emerald-500/10 border-emerald-500/20'
        : 'bg-surface-container border-outline-variant/10'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
            {allCompleted ? 'emoji_events' : 'assignment'}
          </span>
          <h3 className="text-sm font-black text-on-surface uppercase tracking-tight">
            {t('home.dailyMissions', 'Nhiệm vụ hôm nay')}
          </h3>
        </div>
        <span className="text-xs font-bold text-on-surface-variant">
          {completedCount}/3
        </span>
      </div>

      {/* Mission list */}
      <div className="space-y-3">
        {missions.map((m) => (
          <div key={m.slot} className="flex items-center gap-3">
            {/* Check icon */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              m.completed
                ? 'bg-emerald-500 text-white'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              {m.completed ? (
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              ) : (
                <span className="text-[10px] font-black">{m.slot}</span>
              )}
            </div>

            {/* Description + progress */}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${
                m.completed ? 'text-emerald-400 line-through opacity-70' : 'text-on-surface'
              }`}>
                {m.description}
              </p>
              {!m.completed && (
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-bold">
                    {m.progress}/{m.target}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bonus section */}
      {allCompleted && (
        <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center gap-2">
          <span className="text-lg">🎁</span>
          <span className="text-xs font-black text-emerald-400">
            +{bonusXp} XP {bonusClaimed ? t('home.received', 'nhận được!') : ''}
          </span>
        </div>
      )}
    </div>
  )
}
