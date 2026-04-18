import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'

interface Tournament { tournamentId: string; name: string; bracketSize: number; status: string; currentRound: number; totalRounds: number; creatorId: string; createdAt: string }

export default function EventsAdmin() {
  const { t } = useTranslation()
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

  const statusBadge = (status: string) => {
    const m: Record<string, string> = { LOBBY: 'bg-blue-500/20 text-blue-400', IN_PROGRESS: 'bg-emerald-500/20 text-emerald-400', COMPLETED: 'bg-[#32343e]/30 text-[#d5c4af]/60', CANCELLED: 'bg-red-500/20 text-red-400' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m[status] || 'bg-[#32343e]/30 text-[#d5c4af]/60'}`}>{status}</span>
  }

  return (
    <div data-testid="admin-events-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#e1e1ef]">{t('admin.events.title')}</h2>
          <p className="text-[#d5c4af]/60 text-sm">{t('admin.events.subtitle', { count: tournaments.length })}</p>
        </div>
        <button data-testid="create-tournament-btn" onClick={() => alert(t('admin.events.createNotImplemented'))}
          className="px-4 py-2 gold-gradient text-[#281900] rounded-lg text-sm font-bold hover:opacity-90">{t('admin.events.createButton')}</button>
      </div>

      {isLoading ? (
        <div className="text-center text-[#d5c4af]/60 py-8">{t('admin.events.loading')}</div>
      ) : tournaments.length === 0 ? (
        <div className="text-center text-[#d5c4af]/60 py-8">{t('admin.events.empty')}</div>
      ) : (
        <div className="space-y-3">
          {tournaments.map(tournament => (
            <div data-testid="admin-tournament-row" key={tournament.tournamentId} className="rounded-lg border border-[#504535]/20 bg-[#1d1f29] p-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-[#e1e1ef]">{tournament.name}</h4>
                <p className="text-[#d5c4af]/60 text-xs"><span data-testid="tournament-bracket-size">{t('admin.events.bracket', { size: tournament.bracketSize })}</span> • <span data-testid="tournament-round-info">{t('admin.events.round', { current: tournament.currentRound, total: tournament.totalRounds })}</span></p>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(tournament.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
