import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { apiClient } from '../../api/client'
import { colors, typography, spacing } from '../../theme'

interface PlayerScore {
  userId?: string
  username: string
  avatarUrl?: string
  score: number
}

const PODIUM_BADGES = ['🥇', '🥈', '🥉']

export default function MultiplayerResultsScreen() {
  const { t } = useTranslation()
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const roomId: string | undefined = route.params?.roomId
  const navLeaderboard: PlayerScore[] | undefined = route.params?.leaderboard

  // Fallback fetch khi user nav direct vào screen (no QUIZ_END payload).
  const { data: fetched } = useQuery<PlayerScore[]>({
    queryKey: ['room-leaderboard', roomId],
    queryFn: () => apiClient.get(`/api/rooms/${roomId}/leaderboard`).then(r => r.data),
    enabled: !!roomId && !navLeaderboard,
  })

  const leaderboard = (navLeaderboard ?? fetched ?? []).slice().sort((a, b) => b.score - a.score)
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  // Podium visual order: 2nd (left), 1st (center taller), 3rd (right)
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
    ? [top3[1], top3[0]]
    : top3

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Kết quả</Text>

        {leaderboard.length === 0 ? (
          <Text style={s.empty}>Không có dữ liệu xếp hạng</Text>
        ) : (
          <>
            <View style={s.podium}>
              {podiumOrder.map((p, i) => {
                const actualRank = leaderboard.indexOf(p)
                const isFirst = actualRank === 0
                return (
                  <View key={p.userId ?? p.username} style={[s.podiumSlot, isFirst && s.podiumFirst]}>
                    <Text style={s.podiumRank}>{PODIUM_BADGES[actualRank]}</Text>
                    <Avatar
                      name={p.username}
                      size={isFirst ? 56 : 48}
                      borderColor={isFirst ? colors.gold : undefined}
                    />
                    <Text style={[s.podiumName, isFirst && { color: colors.gold }]}>{p.username}</Text>
                    <Text style={[s.podiumScore, isFirst && { color: colors.gold }]}>{p.score}</Text>
                  </View>
                )
              })}
            </View>

            {rest.length > 0 && (
              <View style={s.restList}>
                {rest.map((p, i) => (
                  <Card key={p.userId ?? p.username} style={s.restRow}>
                    <Text style={s.restRank}>#{i + 4}</Text>
                    <Avatar name={p.username} size={36} />
                    <Text style={s.restName}>{p.username}</Text>
                    <Text style={s.restScore}>{p.score}</Text>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}

        {roomId && (
          <Button
            title="📊 Xem chi tiết trận"
            onPress={() => navigation.navigate('RoomAnalytics', { roomId })}
            variant="outline"
            fullWidth
          />
        )}
        <Button title="Về trang chủ" onPress={() => navigation.popToTop()} fullWidth />
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center' },
  empty: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: spacing.md, paddingTop: spacing.xl },
  podiumSlot: { alignItems: 'center', gap: spacing.sm, flex: 1 },
  podiumFirst: { marginBottom: spacing.xl },
  podiumRank: { fontSize: 24 },
  podiumName: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary },
  podiumScore: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textSecondary },
  restList: { gap: spacing.sm },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  restRank: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted, width: 32 },
  restName: { flex: 1, fontSize: typography.size.base, color: colors.textPrimary },
  restScore: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.gold },
})
