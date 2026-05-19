import { apiClient } from './client'

export type TournamentStatus = 'LOBBY' | 'IN_PROGRESS' | 'COMPLETED'

export interface TournamentSummary {
  tournamentId: string
  name: string
  bracketSize: number
  status: TournamentStatus
  currentRound: number
  totalRounds: number
  creatorId: string
  createdAt: string
}

export async function getTournament(tournamentId: string): Promise<TournamentSummary> {
  const res = await apiClient.get(`/api/tournaments/${tournamentId}`)
  return res.data
}

export async function joinTournament(tournamentId: string): Promise<void> {
  await apiClient.post(`/api/tournaments/${tournamentId}/join`)
}

export async function startTournament(tournamentId: string): Promise<void> {
  await apiClient.post(`/api/tournaments/${tournamentId}/start`)
}

export async function forfeitMatch(tournamentId: string, matchId: string): Promise<void> {
  await apiClient.post(`/api/tournaments/${tournamentId}/matches/${matchId}/forfeit`)
}
