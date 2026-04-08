import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import ProgressBar from '../../components/ui/ProgressBar'
import { useAuthStore } from '../../stores/authStore'
import { apiClient } from '../../api/client'
import { getTierProgress } from '../../logic/tierProgression'
import { colors, typography, spacing, borderRadius } from '../../theme'

const GAME_MODES = [
  { id: 'practice', icon: '📖', title: 'Luyện Tập', desc: 'Học không áp lực', route: 'PracticeSelect', color: colors.gold },
  { id: 'ranked', icon: '⚡', title: 'Thi Đấu', desc: 'Tranh tài xếp hạng', route: 'Ranked', color: colors.gold },
  { id: 'daily', icon: '📅', title: 'Thử Thách Ngày', desc: '5 câu mỗi ngày', route: 'DailyChallenge', color: colors.tertiary },
  { id: 'mystery', icon: '🎲', title: 'Mystery', desc: 'Random 1.5x XP', route: 'MysteryMode', color: '#ec4899' },
  { id: 'speed', icon: '⚡', title: 'Speed Round', desc: '10 câu × 10s', route: 'SpeedRound', color: '#f97316' },
  { id: 'multiplayer', icon: '👥', title: 'Chơi Cùng', desc: 'Tạo phòng PvP', route: 'MultiplayerLobby', color: colors.info },
]

export default function HomeScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const { user } = useAuthStore()

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  const totalPoints = meData?.totalPoints ?? 0
  const tier = getTierProgress(totalPoints)
  const streak = meData?.currentStreak ?? 0

  return (
    <SafeScreen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.brand}>BibleQuiz</Text>
          <View style={styles.topRight}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>{streak}</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('ProfileTab')}>
              <Avatar uri={user?.avatarUrl} name={user?.name} size={36} borderColor={colors.gold} />
            </Pressable>
          </View>
        </View>

        {/* Tier progress card */}
        <Card style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierIcon}>{tier.current.icon}</Text>
            <View style={styles.tierInfo}>
              <Text style={styles.tierName}>{tier.current.name}</Text>
              <Text style={styles.tierPoints}>
                {totalPoints.toLocaleString()}{tier.next ? ` / ${tier.next.minPoints.toLocaleString()}` : ''} XP
              </Text>
            </View>
          </View>
          <ProgressBar progress={tier.percent} height={8} />
          {tier.next && (
            <Text style={styles.tierNext}>
              Còn {tier.pointsToNext.toLocaleString()} XP đến {tier.next.name}
            </Text>
          )}
        </Card>

        {/* Game modes grid */}
        <Text style={styles.sectionTitle}>Chế độ chơi</Text>
        <View style={styles.modesGrid}>
          {GAME_MODES.map((mode) => (
            <Pressable
              key={mode.id}
              onPress={() => navigation.navigate('QuizTab', { screen: mode.route })}
              style={({ pressed }) => [styles.modeCard, pressed && styles.pressed]}
            >
              <Text style={styles.modeIcon}>{mode.icon}</Text>
              <Text style={styles.modeTitle}>{mode.title}</Text>
              <Text style={styles.modeDesc}>{mode.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* Leaderboard preview */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Bảng Xếp Hạng</Text>
          <Pressable onPress={() => navigation.navigate('Leaderboard')}>
            <Text style={styles.viewAll}>Xem tất cả</Text>
          </Pressable>
        </View>
        <LeaderboardPreview />
      </ScrollView>
    </SafeScreen>
  )
}

function LeaderboardPreview() {
  const { data } = useQuery({
    queryKey: ['home-leaderboard'],
    queryFn: () => apiClient.get('/api/leaderboard/weekly?size=3').then(r => r.data),
    staleTime: 60_000,
  })

  const entries = Array.isArray(data) ? data : []
  if (entries.length === 0) return null

  return (
    <Card>
      {entries.map((entry: any, i: number) => (
        <View key={entry.userId ?? i} style={[styles.lbRow, i < entries.length - 1 && styles.lbRowBorder]}>
          <Text style={styles.lbRank}>#{i + 1}</Text>
          <Avatar uri={entry.avatarUrl} name={entry.name} size={32} />
          <Text style={styles.lbName} numberOfLines={1}>{entry.name}</Text>
          <Text style={styles.lbPoints}>{entry.points?.toLocaleString()} XP</Text>
        </View>
      ))}
    </Card>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  brand: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.gold },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  streakIcon: { fontSize: 14 },
  streakText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold, marginLeft: spacing.xs },
  tierCard: { marginBottom: spacing.xl },
  tierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  tierIcon: { fontSize: 32, marginRight: spacing.md },
  tierInfo: { flex: 1 },
  tierName: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.gold },
  tierPoints: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 },
  tierNext: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'right' },
  sectionTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.xl },
  viewAll: { fontSize: typography.size.sm, color: colors.gold, fontWeight: typography.weight.bold },
  modesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  modeCard: {
    width: '48%', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.borderDefault,
  },
  pressed: { opacity: 0.8 },
  modeIcon: { fontSize: 24, marginBottom: spacing.sm },
  modeTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  modeDesc: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing.xs },
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  lbRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderDefault },
  lbRank: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold, width: 28 },
  lbName: { flex: 1, fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.textPrimary },
  lbPoints: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textSecondary },
})
