import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { soundManager } from '../services/soundManager'

interface DailyBonusData {
  hasBonus: boolean
  bonusType?: string
  message?: string
  value?: number
}

const BONUS_ICONS: Record<string, string> = {
  DOUBLE_XP: '⭐',
  EXTRA_ENERGY: '⚡',
  FREE_FREEZE: '🧊',
  BONUS_STREAK: '🔥',
}

export default function DailyBonusModal() {
  const [dismissed, setDismissed] = useState(false)

  const { data } = useQuery<DailyBonusData>({
    queryKey: ['daily-bonus'],
    queryFn: () => api.get('/api/quiz/daily-bonus').then(r => r.data),
    staleTime: 24 * 60 * 60_000, // 24h — check once per day
  })

  if (!data?.hasBonus || dismissed) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container rounded-2xl p-8 max-w-sm w-full mx-4 border border-secondary/20 shadow-2xl text-center space-y-5">
        <div className="text-5xl">{BONUS_ICONS[data.bonusType ?? ''] ?? '🎁'}</div>
        <div>
          <h2 className="text-xl font-black text-on-surface">Quà tặng hôm nay!</h2>
          <p className="text-secondary font-bold mt-2">{data.message}</p>
        </div>
        <button
          onClick={() => {
            soundManager.play('badgeUnlock')
            setDismissed(true)
          }}
          className="w-full px-6 py-3 gold-gradient text-on-secondary font-black rounded-xl"
        >
          Tuyệt vời!
        </button>
      </div>
    </div>
  )
}
