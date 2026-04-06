import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { getTierByPoints, getNextTier } from '../../data/tiers'
import { getDailyVerse } from '../../data/verses'
import { useAuthStore } from '../../stores/authStore'
import { GlassCard } from '../../components/GlassCard'
import { TierBadge } from '../../components/TierBadge'
import { ProgressBar } from '../../components/ProgressBar'
import { Avatar } from '../../components/Avatar'
import { GoldButton } from '../../components/GoldButton'

// === Helpers ===

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function msUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return midnight.getTime() - now.getTime()
}

// === Game Mode Data ===

interface GameMode {
  id: string
  title: string
  description: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  tab: string
  screen?: string
  accentColor: string
}

const GAME_MODES: GameMode[] = [
  {
    id: 'practice',
    title: 'Luyện Tập',
    description: 'Không áp lực, không giới hạn',
    icon: 'book-open-variant',
    tab: 'RankedTab',
    screen: 'Practice',
    accentColor: colors.gameMode.practice,
  },
  {
    id: 'ranked',
    title: 'Thi Đấu Xếp Hạng',
    description: 'Cạnh tranh, tính điểm rank',
    icon: 'lightning-bolt',
    tab: 'RankedTab',
    screen: 'Ranked',
    accentColor: colors.gameMode.ranked,
  },
  {
    id: 'daily',
    title: 'Thử Thách Ngày',
    description: 'Chủ đề đặc biệt mỗi ngày',
    icon: 'calendar-today',
    tab: 'DailyTab',
    accentColor: colors.gameMode.daily,
  },
  {
    id: 'group',
    title: 'Nhóm Giáo Xứ',
    description: 'Học & thi đua cùng nhóm',
    icon: 'church',
    tab: 'GroupsTab',
    screen: 'Groups',
    accentColor: '#22c55e',
  },
  {
    id: 'multiplayer',
    title: 'Phòng Chơi',
    description: 'Thi đấu nhiều người realtime',
    icon: 'gamepad-variant',
    tab: 'RankedTab',
    screen: 'Multiplayer',
    accentColor: colors.gameMode.multiplayer,
  },
  {
    id: 'tournament',
    title: 'Giải Đấu',
    description: 'Bracket 1v1 loại trực tiếp',
    icon: 'trophy',
    tab: 'GroupsTab',
    screen: 'Tournaments',
    accentColor: '#f59e0b',
  },
]

// === Component ===

export const HomeScreen = () => {
  const navigation = useNavigation<any>()
  const { user } = useAuthStore()
  const verse = getDailyVerse()

  const [refreshing, setRefreshing] = useState(false)
  const [lbPeriod, setLbPeriod] = useState<'daily' | 'weekly'>('daily')
  const [countdown, setCountdown] = useState(msUntilMidnight())

  // Daily countdown
  useEffect(() => {
    const timer = setInterval(() => setCountdown(msUntilMidnight()), 1000)
    return () => clearInterval(timer)
  }, [])

  // API queries
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/me').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const lbQuery = useQuery({
    queryKey: ['home-leaderboard', lbPeriod],
    queryFn: () =>
      api.get(`/api/leaderboard/${lbPeriod}?size=5`).then((r) => r.data),
    staleTime: 30 * 1000,
  })

  const myRankQuery = useQuery({
    queryKey: ['home-my-rank', lbPeriod],
    queryFn: () =>
      api.get(`/api/leaderboard/${lbPeriod}/my-rank`).then((r) => r.data),
    staleTime: 30 * 1000,
  })

  const rankedQuery = useQuery({
    queryKey: ['ranked-status'],
    queryFn: () => api.get('/api/me/ranked-status').then((r) => r.data),
    staleTime: 60 * 1000,
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      meQuery.refetch(),
      lbQuery.refetch(),
      myRankQuery.refetch(),
      rankedQuery.refetch(),
    ])
    setRefreshing(false)
  }, [meQuery, lbQuery, myRankQuery, rankedQuery])

  // Tier info
  const totalPoints = meQuery.data?.totalPoints ?? 0
  const tier = getTierByPoints(totalPoints)
  const nextTier = getNextTier(totalPoints)
  const tierProgress = nextTier
    ? (totalPoints - tier.minPoints) / (nextTier.minPoints - tier.minPoints)
    : 1

  // Ranked energy
  const energy = rankedQuery.data?.livesRemaining ?? 0
  const maxEnergy = rankedQuery.data?.dailyLives ?? 100

  const getStatusText = (mode: GameMode): string => {
    switch (mode.id) {
      case 'practice':
        return 'Không giới hạn'
      case 'ranked':
        return rankedQuery.isLoading ? '...' : `⚡ ${energy}/${maxEnergy}`
      case 'daily':
        return formatCountdown(countdown)
      case 'multiplayer':
        return 'Tìm phòng'
      default:
        return ''
    }
  }

  if (meQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* === Hero: Greeting + Tier === */}
        <View style={styles.heroSection}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.name?.split(' ')[0] ?? 'bạn'}!
          </Text>
          <View style={styles.tierRow}>
            <TierBadge points={totalPoints} size="lg" />
            {nextTier && (
              <View style={styles.tierProgress}>
                <Text style={styles.tierProgressLabel}>
                  {totalPoints.toLocaleString()} / {nextTier.minPoints.toLocaleString()} điểm
                </Text>
                <ProgressBar progress={tierProgress} height={8} />
                <Text style={styles.nextTierText}>
                  Hạng kế: {nextTier.icon} {nextTier.name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* === Game Modes === */}
        <Text style={styles.sectionTitle}>Chế độ chơi</Text>
        <View style={styles.gameModeList}>
          {GAME_MODES.map((mode) => {
            const noEnergy = mode.id === 'ranked' && energy <= 0 && !rankedQuery.isLoading
            return (
              <TouchableOpacity
                key={mode.id}
                activeOpacity={noEnergy ? 1 : 0.7}
                onPress={() => {
                  if (noEnergy) return
                  if (mode.screen) {
                    navigation.navigate(mode.tab, { screen: mode.screen })
                  } else {
                    navigation.navigate(mode.tab)
                  }
                }}
                style={[styles.gameModeCard, noEnergy && styles.disabledCard]}
              >
                <View style={[styles.gameModeIcon, { backgroundColor: `${mode.accentColor}20` }]}>
                  <MaterialCommunityIcons
                    name={mode.icon}
                    size={24}
                    color={mode.accentColor}
                  />
                </View>
                <View style={styles.gameModeInfo}>
                  <Text style={styles.gameModeTitle}>{mode.title}</Text>
                  <Text style={styles.gameModeDesc}>{mode.description}</Text>
                </View>
                <Text style={[styles.gameModeStatus, { color: mode.accentColor }]}>
                  {getStatusText(mode)}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* === Mini Leaderboard === */}
        <View style={styles.lbHeader}>
          <Text style={styles.sectionTitle}>Bảng Xếp Hạng</Text>
          <View style={styles.lbTabs}>
            {(['daily', 'weekly'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setLbPeriod(p)}
                style={[styles.lbTab, lbPeriod === p && styles.lbTabActive]}
              >
                <Text
                  style={[styles.lbTabText, lbPeriod === p && styles.lbTabTextActive]}
                >
                  {p === 'daily' ? 'Hôm nay' : 'Tuần'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <GlassCard style={styles.lbCard}>
          {lbQuery.isLoading ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <>
              {(lbQuery.data?.content ?? lbQuery.data ?? []).slice(0, 5).map((entry: any, i: number) => (
                <View key={entry.userId ?? i} style={[styles.lbRow, i === 0 && styles.lbFirstRow]}>
                  <Text style={[styles.lbRank, i === 0 && styles.lbRankFirst]}>
                    {i + 1}
                  </Text>
                  <Avatar uri={entry.avatarUrl} name={entry.name ?? 'User'} size={32} />
                  <Text style={styles.lbName} numberOfLines={1}>
                    {entry.name ?? 'User'}
                  </Text>
                  <Text style={styles.lbScore}>{(entry.score ?? entry.points ?? 0).toLocaleString()}</Text>
                </View>
              ))}

              {myRankQuery.data && (
                <View style={[styles.lbRow, styles.lbMyRow]}>
                  <Text style={styles.lbRank}>{myRankQuery.data.rank ?? '—'}</Text>
                  <Avatar uri={user?.avatar} name={user?.name ?? 'Me'} size={32} />
                  <Text style={[styles.lbName, styles.lbMyName]} numberOfLines={1}>
                    Bạn
                  </Text>
                  <Text style={[styles.lbScore, styles.lbMyScore]}>
                    {(myRankQuery.data.score ?? myRankQuery.data.points ?? 0).toLocaleString()}
                  </Text>
                </View>
              )}
            </>
          )}
        </GlassCard>

        {/* === Daily Verse === */}
        <GlassCard style={styles.verseCard}>
          <Text style={styles.verseText}>"{verse.text}"</Text>
          <Text style={styles.verseRef}>— {verse.ref}</Text>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  )
}

// === Styles ===

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing['4xl'] },

  // Hero
  heroSection: { marginBottom: spacing['2xl'] },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  tierProgress: { flex: 1 },
  tierProgressLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  nextTierText: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  // Game Modes
  gameModeList: { gap: spacing.md, marginBottom: spacing['2xl'] },
  gameModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing.lg,
    gap: spacing.md,
  },
  disabledCard: { opacity: 0.5 },
  gameModeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameModeInfo: { flex: 1 },
  gameModeTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  gameModeDesc: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  gameModeStatus: { fontSize: 12, fontWeight: '600' },

  // Leaderboard
  lbHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  lbTabs: { flexDirection: 'row', gap: spacing.sm },
  lbTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  lbTabActive: { backgroundColor: colors.goldLight },
  lbTabText: { fontSize: 13, color: colors.text.muted, fontWeight: '500' },
  lbTabTextActive: { color: colors.gold },
  lbCard: { marginBottom: spacing['2xl'] },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  lbFirstRow: {
    backgroundColor: `${colors.gold}10`,
    borderRadius: borderRadius.md,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  lbMyRow: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  lbRank: { width: 24, fontSize: 14, fontWeight: '700', color: colors.text.secondary, textAlign: 'center' },
  lbRankFirst: { color: colors.gold },
  lbName: { flex: 1, fontSize: 14, color: colors.text.primary },
  lbMyName: { color: colors.gold },
  lbScore: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  lbMyScore: { color: colors.gold },

  // Verse
  verseCard: { marginBottom: spacing.xl },
  verseText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  verseRef: { fontSize: 12, color: colors.gold, fontWeight: '500' },
})
