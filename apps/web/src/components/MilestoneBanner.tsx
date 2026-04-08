import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

interface TierProgressData {
  tierLevel: number
  tierName: string
  tierProgressPercent: number
  surgeActive: boolean
  surgeUntil: string | null
  surgeMultiplier: number
  nextTierPoints: number
  totalPoints: number
}

export default function MilestoneBanner() {
  const { data } = useQuery<TierProgressData>({
    queryKey: ['tier-progress'],
    queryFn: () => api.get('/api/me/tier-progress').then(r => r.data),
    staleTime: 30_000,
  })

  if (!data) return null

  const { tierProgressPercent, surgeActive, surgeUntil } = data

  // 90% milestone with active surge
  if (surgeActive && surgeUntil) {
    return <SurgeCountdown surgeUntil={surgeUntil} />
  }

  // 50% milestone banner (static, non-blocking)
  if (tierProgressPercent >= 50 && tierProgressPercent < 90) {
    const nextTierName = getNextTierName(data.tierLevel)
    if (!nextTierName) return null
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/10 border border-secondary/20 mt-2">
        <span className="text-sm">🏃</span>
        <span className="text-xs font-bold text-secondary">
          Nửa đường đến {nextTierName}!
        </span>
      </div>
    )
  }

  return null
}

function SurgeCountdown({ surgeUntil }: { surgeUntil: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    const update = () => {
      const end = new Date(surgeUntil).getTime()
      const now = Date.now()
      const diff = Math.max(0, end - now)
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [surgeUntil])

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-secondary/20 border border-purple-500/30 mt-2">
      <span className="text-sm">🚀</span>
      <span className="text-xs font-black text-purple-300">
        XP x1.5 còn {remaining}
      </span>
    </div>
  )
}

const TIER_NAMES: Record<number, string> = {
  1: 'Người Tìm Kiếm',
  2: 'Môn Đồ',
  3: 'Hiền Triết',
  4: 'Tiên Tri',
  5: 'Sứ Đồ',
}

function getNextTierName(tierLevel: number): string | null {
  return TIER_NAMES[tierLevel] ?? null
}
