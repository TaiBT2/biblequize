import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

interface ComebackStatus {
  daysSinceLastPlay: number
  rewardTier: string
  claimed: boolean
  reward: {
    description?: string
    xpBonus?: number
    xpMultiplier?: number
    duration?: string
    freezeToken?: number
    energy?: number
  } | null
}

export default function ComebackModal() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(false)

  const { data } = useQuery<ComebackStatus>({
    queryKey: ['comeback-status'],
    queryFn: () => api.get('/api/me/comeback-status').then(r => r.data),
    staleTime: 5 * 60_000,
    enabled: !!user,
  })

  const claimMutation = useMutation({
    mutationFn: () => api.post('/api/me/comeback-claim').then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comeback-status'] })
    },
  })

  if (!data || data.rewardTier === 'NONE' || data.claimed || dismissed) {
    return null
  }

  const { rewardTier, daysSinceLastPlay, reward } = data

  return (
    <div data-testid="comeback-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container rounded-2xl p-8 max-w-md w-full mx-4 border border-outline-variant/20 shadow-2xl text-center space-y-6">
        {/* Celebration */}
        <div className="text-5xl mb-2">🎉</div>

        <div>
          <h2 className="text-2xl font-black text-on-surface mb-2">
            Chào mừng trở lại{user?.name ? `, ${user.name}` : ''}!
          </h2>
          <p className="text-sm text-on-surface-variant">
            Bạn đã vắng {daysSinceLastPlay} ngày. Nhận phần thưởng đặc biệt!
          </p>
        </div>

        {/* Reward details */}
        {reward && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 space-y-2">
            <p className="text-sm font-bold text-secondary">{reward.description}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {reward.xpBonus && (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold">
                  +{reward.xpBonus} XP
                </span>
              )}
              {reward.xpMultiplier && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-bold">
                  XP x{reward.xpMultiplier}
                </span>
              )}
              {reward.freezeToken && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold">
                  🧊 {reward.freezeToken} Freeze
                </span>
              )}
              {reward.energy && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-bold">
                  ⚡ +{reward.energy} Energy
                </span>
              )}
            </div>
          </div>
        )}

        {/* Positive streak message */}
        <p className="text-xs text-on-surface-variant">
          Bắt đầu chuỗi mới! 3 ngày liên tiếp = badge Phục Hồi 🔄
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setDismissed(true)}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-on-surface-variant bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-colors"
          >
            Để sau
          </button>
          <button
            onClick={() => claimMutation.mutate()}
            disabled={claimMutation.isPending}
            className="flex-1 px-4 py-2.5 text-sm font-black text-on-secondary gold-gradient rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {claimMutation.isPending ? '...' : 'Nhận ngay! 🎁'}
          </button>
        </div>
      </div>
    </div>
  )
}
