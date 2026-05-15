// MPP-5 — Sidebar widget shown only on /multiplayer routes (AppLayout
// renders it conditionally). Replaces the meaningless "Vị trí #1" generic
// leaderboard rank with multiplayer-context stats from MPP-2 BE endpoint.

import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

interface WeeklyStats {
  period: string
  periodStart: string
  wins: number
  totalMatches: number
  winRate: number  // 0.0–1.0
  mvpCount: number
}

export default function WeeklyMultiplayerStatsWidget() {
  const { data, isLoading, isError } = useQuery<WeeklyStats>({
    queryKey: ['multiplayer-stats', 'weekly'],
    queryFn: () => api.get('/api/me/multiplayer-stats', { params: { period: 'weekly' } }).then(r => r.data),
    staleTime: 60_000,
    retry: 1,
  })

  // Gracefully hide on error — sidebar shouldn't show a scary error tile.
  if (isError) return null

  if (isLoading || !data) {
    return (
      <div
        className="p-4 rounded-xl animate-pulse"
        style={{ background: 'rgba(50,52,64,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="h-3 w-16 bg-white/10 rounded mb-3" />
        <div className="h-6 w-12 bg-white/10 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-2 w-full bg-white/5 rounded" />
          <div className="h-2 w-full bg-white/5 rounded" />
        </div>
      </div>
    )
  }

  const winRatePct = Math.round(data.winRate * 100)

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: 'rgba(50,52,64,0.4)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="text-[10px] tracking-widest uppercase font-bold mb-2" style={{ color: '#38bdf8' }}>
        Tuần này
      </div>
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-[26px] font-extrabold leading-none text-white">{data.wins}</div>
        <div className="text-[10px] text-white/50">trận thắng</div>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between text-white/70">
          <span>Tỷ lệ thắng</span>
          <span className="font-bold text-white">{winRatePct}%</span>
        </div>
        <div className="flex justify-between text-white/70">
          <span>MVP</span>
          <span className="font-bold" style={{ color: '#e8a832' }}>×{data.mvpCount}</span>
        </div>
      </div>
    </div>
  )
}
