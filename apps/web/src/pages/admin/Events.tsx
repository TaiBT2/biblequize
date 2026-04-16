import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'

interface Tournament { tournamentId: string; name: string; bracketSize: number; status: string; currentRound: number; totalRounds: number; creatorId: string; createdAt: string }

export default function EventsAdmin() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchTournaments = async () => {
    setIsLoading(true)
    try {
      // Use existing tournament list — no admin-specific endpoint yet
      // This will list tournaments the admin can see
      const res = await api.get('/api/tournaments')
      setTournaments(Array.isArray(res.data) ? res.data : res.data?.items ?? [])
    } catch { /* graceful */ }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchTournaments() }, [])

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { LOBBY: 'bg-blue-500/20 text-blue-400', IN_PROGRESS: 'bg-emerald-500/20 text-emerald-400', COMPLETED: 'bg-[#32343e]/30 text-[#d5c4af]/60', CANCELLED: 'bg-red-500/20 text-red-400' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m[s] || 'bg-[#32343e]/30 text-[#d5c4af]/60'}`}>{s}</span>
  }

  return (
    <div data-testid="admin-events-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#e1e1ef]">Events & Tournaments</h2>
        <p className="text-[#d5c4af]/60 text-sm">{tournaments.length} tournaments</p>
      </div>

      {isLoading ? (
        <div className="text-center text-[#d5c4af]/60 py-8">Đang tải...</div>
      ) : tournaments.length === 0 ? (
        <div className="text-center text-[#d5c4af]/60 py-8">Chưa có tournament nào</div>
      ) : (
        <div className="space-y-3">
          {tournaments.map(t => (
            <div data-testid="admin-tournament-row" key={t.tournamentId} className="rounded-lg border border-[#504535]/20 bg-[#1d1f29] p-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-[#e1e1ef]">{t.name}</h4>
                <p className="text-[#d5c4af]/60 text-xs">Bracket: {t.bracketSize} • Round: {t.currentRound}/{t.totalRounds}</p>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(t.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
