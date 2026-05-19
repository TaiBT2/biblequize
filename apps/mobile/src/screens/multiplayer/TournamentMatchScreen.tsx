import React from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { apiClient } from '../../api/client'
import { forfeitMatch } from '../../api/tournaments'
import { useAuthStore } from '../../stores/authStore'
import { colors, typography, spacing, borderRadius } from '../../theme'

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
  rounds: Record<string, BracketMatch[]>
}

const MAX_LIVES = 3

function renderHearts(lives: number): string {
  return '❤️'.repeat(Math.max(0, lives)) + '🤍'.repeat(Math.max(0, MAX_LIVES - lives))
}

export default function TournamentMatchScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const queryClient = useQueryClient()
  const tournamentId: string = route.params?.tournamentId ?? ''
  const matchId: string = route.params?.matchId ?? ''
  const myUserId = useAuthStore(s => s.user?.id)

  // Match data từ bracket — không có dedicated endpoint
  const { data: bracket } = useQuery<BracketResponse>({
    queryKey: ['tournament-bracket', tournamentId],
    queryFn: () => apiClient.get(`/api/tournaments/${tournamentId}/bracket`).then(r => r.data),
    enabled: !!tournamentId,
  })

  const match = React.useMemo(() => {
    if (!bracket?.rounds) return null
    for (const matches of Object.values(bracket.rounds)) {
      const found = matches.find(m => m.matchId === matchId)
      if (found) return found
    }
    return null
  }, [bracket, matchId])

  const forfeitMut = useMutation({
    mutationFn: () => forfeitMatch(tournamentId, matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-bracket', tournamentId] })
      navigation.goBack()
    },
    onError: (e: any) => Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không bỏ trận được'),
  })

  const confirmForfeit = () => {
    Alert.alert('Bỏ trận?', 'Bạn sẽ thua ngay lập tức.', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Bỏ trận', style: 'destructive', onPress: () => forfeitMut.mutate() },
    ])
  }

  if (!match) {
    return <SafeScreen><View style={s.center}><Text style={s.muted}>Đang tải trận đấu...</Text></View></SafeScreen>
  }

  const [p1, p2] = match.participants
  const amInMatch = !!myUserId && match.participants.some(p => p.userId === myUserId)
  const matchActive = match.status === 'IN_PROGRESS' || match.status === 'PENDING'

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Text style={s.roundLabel}>Vòng {match.roundNumber}</Text>
          <Text style={s.statusBadge}>{match.status}</Text>
        </View>

        <View style={s.vsLayout}>
          <Card style={[s.playerCard, p1?.isWinner && s.playerCardWin]}>
            <Avatar name={p1?.userName ?? 'TBD'} size={64} borderColor={p1?.isWinner ? colors.gold : undefined} />
            <Text style={[s.playerName, p1?.isWinner && s.playerNameWin]}>{p1?.userName ?? 'TBD'}</Text>
            <Text style={s.playerHearts}>{renderHearts(p1?.lives ?? 0)}</Text>
            <Text style={s.playerScore}>{p1?.score ?? 0}</Text>
          </Card>

          <Text style={s.vsLabel}>VS</Text>

          <Card style={[s.playerCard, p2?.isWinner && s.playerCardWin]}>
            <Avatar name={match.isBye ? 'Bye' : (p2?.userName ?? 'TBD')} size={64} borderColor={p2?.isWinner ? colors.gold : undefined} />
            <Text style={[s.playerName, p2?.isWinner && s.playerNameWin]}>{match.isBye ? 'Bye' : (p2?.userName ?? 'TBD')}</Text>
            {!match.isBye && <Text style={s.playerHearts}>{renderHearts(p2?.lives ?? 0)}</Text>}
            {!match.isBye && <Text style={s.playerScore}>{p2?.score ?? 0}</Text>}
          </Card>
        </View>

        {match.winnerId && (
          <Card style={s.winnerCard}>
            <Text style={s.winnerLabel}>🏆 Người thắng</Text>
            <Text style={s.winnerName}>
              {match.participants.find(p => p.userId === match.winnerId)?.userName ?? 'TBD'}
            </Text>
          </Card>
        )}

        <View style={s.actions}>
          {amInMatch && matchActive && (
            <Button
              title="Bỏ trận"
              onPress={confirmForfeit}
              variant="outline"
              fullWidth
            />
          )}
          <Button
            title="Xem bracket"
            onPress={() => navigation.navigate('TournamentBracket', { tournamentId })}
            variant={match.winnerId ? 'primary' : 'outline'}
            fullWidth
          />
        </View>

        <Text style={s.deferHint}>Tính năng chơi trận realtime đang được phát triển.</Text>
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { fontSize: typography.size.sm, color: colors.textMuted },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roundLabel: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.gold },
  statusBadge: { fontSize: typography.size.xs, color: colors.textMuted, fontWeight: typography.weight.bold, letterSpacing: 1 },
  vsLayout: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  playerCard: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  playerCardWin: { borderWidth: 2, borderColor: colors.gold },
  playerName: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center' },
  playerNameWin: { color: colors.gold },
  playerHearts: { fontSize: typography.size.sm, letterSpacing: 2 },
  playerScore: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.gold },
  vsLabel: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textMuted },
  winnerCard: { alignItems: 'center', gap: spacing.xs, borderColor: colors.gold, borderWidth: 2 },
  winnerLabel: { fontSize: typography.size.xs, color: colors.gold, fontWeight: typography.weight.bold, textTransform: 'uppercase' },
  winnerName: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  actions: { gap: spacing.md, marginTop: spacing.lg },
  deferHint: { fontSize: typography.size.xs, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', marginTop: spacing.xl },
})
