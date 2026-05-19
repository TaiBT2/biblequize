import React from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { getTournament, joinTournament, startTournament, TournamentSummary } from '../../api/tournaments'
import { useAuthStore } from '../../stores/authStore'
import { colors, typography, spacing, borderRadius } from '../../theme'

const STATUS_LABEL = {
  LOBBY: 'Đang mở đăng ký',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã kết thúc',
} as const

const STATUS_COLOR = {
  LOBBY: '#4a9eff',
  IN_PROGRESS: '#22c55e',
  COMPLETED: '#9ca3af',
} as const

export default function TournamentDetailScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const queryClient = useQueryClient()
  const tournamentId: string = route.params?.tournamentId ?? ''
  const myUserId = useAuthStore(s => s.user?.id)

  const { data: tournament, isLoading } = useQuery<TournamentSummary>({
    queryKey: ['tournament', tournamentId],
    queryFn: () => getTournament(tournamentId),
    enabled: !!tournamentId,
  })

  const joinMut = useMutation({
    mutationFn: () => joinTournament(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      Alert.alert('Đã tham gia', 'Bạn đã đăng ký giải đấu thành công.')
    },
    onError: (e: any) => Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không tham gia được'),
  })

  const startMut = useMutation({
    mutationFn: () => startTournament(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      queryClient.invalidateQueries({ queryKey: ['tournament-bracket', tournamentId] })
    },
    onError: (e: any) => Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không bắt đầu được'),
  })

  if (isLoading) return <SafeScreen><View style={s.center}><Text style={s.muted}>Đang tải...</Text></View></SafeScreen>
  if (!tournament) return <SafeScreen><View style={s.center}><Text style={s.error}>Không tải được giải đấu</Text></View></SafeScreen>

  const isLobby = tournament.status === 'LOBBY'
  const isCreator = !!myUserId && tournament.creatorId === myUserId

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.hero}>
          <Text style={s.icon}>🏆</Text>
          <Text style={s.title}>{tournament.name}</Text>
          <Text style={[s.statusBadge, { color: STATUS_COLOR[tournament.status], borderColor: STATUS_COLOR[tournament.status] }]}>
            {STATUS_LABEL[tournament.status]}
          </Text>
        </View>

        <View style={s.metaGrid}>
          <Card style={s.metaCard}>
            <Text style={s.metaLabel}>Số người</Text>
            <Text style={s.metaValue}>{tournament.bracketSize}</Text>
          </Card>
          <Card style={s.metaCard}>
            <Text style={s.metaLabel}>Vòng</Text>
            <Text style={s.metaValue}>{tournament.currentRound} / {tournament.totalRounds}</Text>
          </Card>
        </View>

        <View style={s.actions}>
          {isLobby && !isCreator && (
            <Button
              title={joinMut.isPending ? 'Đang đăng ký...' : 'Tham gia giải'}
              onPress={() => joinMut.mutate()}
              disabled={joinMut.isPending}
              fullWidth
            />
          )}
          {isLobby && isCreator && (
            <Button
              title={startMut.isPending ? 'Đang bắt đầu...' : 'Bắt đầu giải'}
              onPress={() => startMut.mutate()}
              disabled={startMut.isPending}
              fullWidth
            />
          )}
          <Button
            title="Xem bracket"
            onPress={() => navigation.navigate('TournamentBracket', { tournamentId })}
            variant={isLobby ? 'outline' : 'primary'}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { fontSize: typography.size.sm, color: colors.textMuted },
  error: { fontSize: typography.size.sm, color: colors.error },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  icon: { fontSize: 64 },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center' },
  statusBadge: {
    fontSize: typography.size.xs, fontWeight: typography.weight.bold, textTransform: 'uppercase',
    letterSpacing: 1, paddingHorizontal: spacing.md, paddingVertical: 4,
    borderWidth: 1, borderRadius: borderRadius.full,
  },
  metaGrid: { flexDirection: 'row', gap: spacing.md },
  metaCard: { flex: 1, alignItems: 'center', gap: spacing.xs },
  metaLabel: { fontSize: typography.size.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  metaValue: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.gold },
  actions: { gap: spacing.md, marginTop: spacing.lg },
})
