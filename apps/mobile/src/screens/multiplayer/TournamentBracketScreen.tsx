import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import { apiClient } from '../../api/client'
import { colors, typography, spacing } from '../../theme'

export default function TournamentBracketScreen() {
  const { t } = useTranslation()
  const route = useRoute<any>()
  const { data } = useQuery({
    queryKey: ['tournament', route.params?.tournamentId],
    queryFn: () => apiClient.get('/api/tournaments/' + route.params?.tournamentId).then(r => r.data),
    enabled: !!route.params?.tournamentId,
  })

  const tournament = data ?? {}

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{tournament.name ?? 'Giải đấu'}</Text>
        <Text style={s.subtitle}>{tournament.status ?? 'Đang diễn ra'}</Text>

        <Card style={s.bracketCard}>
          <Text style={s.bracketIcon}>🏆</Text>
          <Text style={s.bracketText}>Bracket view sẽ hiển thị các trận đấu theo dạng cây loại trực tiếp</Text>
        </Card>

        {(tournament.matches ?? []).map((match: any, i: number) => (
          <Card key={match.id ?? i} style={s.matchCard}>
            <View style={s.matchRow}>
              <Text style={s.matchPlayer}>{match.player1Name ?? 'TBD'}</Text>
              <Text style={s.matchVs}>vs</Text>
              <Text style={s.matchPlayer}>{match.player2Name ?? 'TBD'}</Text>
            </View>
            <Text style={s.matchScore}>{match.score1 ?? '-'} : {match.score2 ?? '-'}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted },
  bracketCard: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  bracketIcon: { fontSize: 48, marginBottom: spacing.md },
  bracketText: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center' },
  matchCard: { gap: spacing.sm },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchPlayer: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary, flex: 1 },
  matchVs: { fontSize: typography.size.xs, color: colors.textMuted, marginHorizontal: spacing.md },
  matchScore: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold, textAlign: 'center' },
})
