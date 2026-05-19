import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import { apiClient } from '../../api/client'
import { colors, typography, spacing } from '../../theme'

interface BracketParticipant {
  userId: string
  userName: string
  lives: number
  score: number
  isWinner: boolean
}

interface BracketMatch {
  matchId: string
  roundNumber: number
  matchIndex: number
  status: string
  winnerId: string | null
  isBye: boolean
  participants: BracketParticipant[]
}

interface BracketResponse {
  tournamentId: string
  name: string
  status: string
  currentRound: number
  totalRounds: number
  /** Backend serializes Map<Integer, List<...>> → JSON object with string keys. */
  rounds: Record<string, BracketMatch[]>
}

export default function TournamentBracketScreen() {
  const { t } = useTranslation()
  const route = useRoute<any>()
  const tournamentId: string | undefined = route.params?.tournamentId

  const { data, isLoading, error } = useQuery<BracketResponse>({
    queryKey: ['tournament-bracket', tournamentId],
    queryFn: () => apiClient.get(`/api/tournaments/${tournamentId}/bracket`).then(r => r.data),
    enabled: !!tournamentId,
  })

  const roundEntries = data?.rounds
    ? Object.entries(data.rounds)
        .map(([round, matches]) => ({ round: Number(round), matches }))
        .sort((a, b) => a.round - b.round)
    : []

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{data?.name ?? 'Giải đấu'}</Text>
        <Text style={s.subtitle}>
          {data ? `${data.status} · Vòng ${data.currentRound}/${data.totalRounds}` : 'Đang tải...'}
        </Text>

        {isLoading && <Text style={s.muted}>Đang tải bracket...</Text>}
        {error && <Text style={s.error}>Không thể tải bracket. Thử lại sau.</Text>}

        {roundEntries.map(({ round, matches }) => (
          <View key={round} style={s.roundGroup}>
            <Text style={s.roundLabel}>Vòng {round}</Text>
            {matches.map(match => {
              const [p1, p2] = match.participants
              return (
                <Card key={match.matchId} style={s.matchCard}>
                  <View style={s.matchRow}>
                    <Text style={[s.matchPlayer, p1?.isWinner && s.matchWinner]}>
                      {p1?.userName ?? 'TBD'}
                    </Text>
                    <Text style={s.matchVs}>vs</Text>
                    <Text style={[s.matchPlayer, p2?.isWinner && s.matchWinner]}>
                      {match.isBye ? 'Bye' : (p2?.userName ?? 'TBD')}
                    </Text>
                  </View>
                  <View style={s.matchScoreRow}>
                    <Text style={s.matchScore}>{p1?.score ?? '-'}</Text>
                    <Text style={s.matchStatus}>{match.status}</Text>
                    <Text style={s.matchScore}>{p2?.score ?? '-'}</Text>
                  </View>
                </Card>
              )
            })}
          </View>
        ))}

        {!isLoading && roundEntries.length === 0 && !error && (
          <Text style={s.muted}>Bracket chưa được tạo</Text>
        )}
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted },
  muted: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
  error: { fontSize: typography.size.sm, color: colors.error, textAlign: 'center', paddingVertical: spacing.lg },
  roundGroup: { gap: spacing.sm },
  roundLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold, textTransform: 'uppercase', letterSpacing: 1 },
  matchCard: { gap: spacing.sm },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchPlayer: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.textPrimary, flex: 1 },
  matchWinner: { color: colors.gold, fontWeight: typography.weight.bold },
  matchVs: { fontSize: typography.size.xs, color: colors.textMuted, marginHorizontal: spacing.md },
  matchScoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchScore: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold, flex: 1, textAlign: 'center' },
  matchStatus: { fontSize: typography.size.xs, color: colors.textMuted, marginHorizontal: spacing.md },
})
