import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

interface TierProgressData {
  tierLevel: number
  tierName: string
  totalPoints: number
  nextTierPoints: number
  tierProgressPercent: number
  starIndex: number
  starXp: number
  nextStarXp: number
  starProgressPercent: number
  milestone: string | null
}

// Star colors by tier level
const STAR_COLORS: Record<number, string> = {
  1: 'text-amber-400',
  2: 'text-blue-400',
  3: 'text-blue-600',
  4: 'text-purple-400',
  5: 'text-yellow-400',
  6: 'text-red-400',
}

const STAR_BG: Record<number, string> = {
  1: 'bg-amber-400',
  2: 'bg-blue-400',
  3: 'bg-blue-600',
  4: 'bg-purple-400',
  5: 'bg-yellow-400',
  6: 'bg-red-400',
}

export default function TierProgressBar() {
  const { t } = useTranslation()

  const { data } = useQuery<TierProgressData>({
    queryKey: ['tier-progress'],
    queryFn: () => api.get('/api/me/tier-progress').then(r => r.data),
    staleTime: 30_000,
  })

  if (!data) return null

  const { tierLevel, starIndex, starProgressPercent } = data
  const starColor = STAR_COLORS[tierLevel] ?? 'text-amber-400'
  const starBg = STAR_BG[tierLevel] ?? 'bg-amber-400'

  // Tier 6 has no stars
  if (tierLevel >= 6) return null

  return (
    <div className="flex items-center gap-2 mt-2">
      {/* 5 star dots */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="relative">
            {i < starIndex ? (
              // Filled star
              <span className={`material-symbols-outlined text-base ${starColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
            ) : i === starIndex ? (
              // Current star with progress ring
              <div className="relative">
                <span className={`material-symbols-outlined text-base ${starColor} opacity-30`}>
                  star
                </span>
                <div
                  className={`absolute inset-0 overflow-hidden`}
                  style={{ clipPath: `inset(${100 - starProgressPercent}% 0 0 0)` }}
                >
                  <span className={`material-symbols-outlined text-base ${starColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
              </div>
            ) : (
              // Empty star
              <span className="material-symbols-outlined text-base text-on-surface-variant/30">
                star
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Star progress text */}
      <span className="text-[10px] font-bold text-on-surface-variant ml-1">
        {starIndex + 1}/5
      </span>

      {/* Mini progress bar for current star */}
      <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden max-w-[80px]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${starBg}`}
          style={{ width: `${starProgressPercent}%` }}
        />
      </div>
    </div>
  )
}
