import React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { queryKeys } from '../../api/queryKeys'

interface Tournament { tournamentId: string; name: string; bracketSize: number; status: string; currentRound: number; totalRounds: number; creatorId: string; createdAt: string }

interface TournamentListResponse { items?: Tournament[] }

async function fetchTournaments(): Promise<Tournament[]> {
  // No admin-specific endpoint yet — reuse the user-visible list.
  const res = await api.get<Tournament[] | TournamentListResponse>('/api/tournaments')
  return Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
}

export default function EventsAdmin() {
  const { t } = useTranslation()
  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: queryKeys.tournaments.list(),
    queryFn: fetchTournaments,
  })

  const statusBadge = (status: string) => {
    const m: Record<string, string> = { LOBBY: 'bg-bq-amber/15 text-bq-amberd', IN_PROGRESS: 'bg-bq-emerald/15 text-bq-emerald', COMPLETED: 'bg-bq-inset text-bq-ink3', CANCELLED: 'bg-bq-ruby/15 text-bq-ruby' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m[status] || 'bg-bq-inset text-bq-ink3'}`}>{status}</span>
  }

  return (
    <div data-testid="admin-events-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-bq-ink">{t('admin.events.title')}</h2>
          <p className="text-bq-ink2 text-sm">{t('admin.events.subtitle', { count: tournaments.length })}</p>
        </div>
        <button data-testid="create-tournament-btn" onClick={() => alert(t('admin.events.createNotImplemented'))}
          className="px-4 py-2 bg-bq-action text-white shadow-bq-action rounded-lg text-sm font-bold hover:opacity-90">{t('admin.events.createButton')}</button>
      </div>

      {isLoading ? (
        <div className="text-center text-bq-ink2 py-8">{t('admin.events.loading')}</div>
      ) : tournaments.length === 0 ? (
        <div className="text-center text-bq-ink2 py-8">{t('admin.events.empty')}</div>
      ) : (
        <div className="space-y-3">
          {tournaments.map(tournament => (
            <div data-testid="admin-tournament-row" key={tournament.tournamentId} className="rounded-lg border border-bq-hair bg-bq-white shadow-bq-soft p-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-bq-ink">{tournament.name}</h4>
                <p className="text-bq-ink2 text-xs"><span data-testid="tournament-bracket-size">{t('admin.events.bracket', { size: tournament.bracketSize })}</span> • <span data-testid="tournament-round-info">{t('admin.events.round', { current: tournament.currentRound, total: tournament.totalRounds })}</span></p>
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
