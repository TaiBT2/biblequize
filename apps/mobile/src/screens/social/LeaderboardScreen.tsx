import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Avatar from '../../components/ui/Avatar'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import { getTierByPoints } from '../../logic/tierProgression'
import { colors, typography, spacing, borderRadius } from '../../theme'

type Period = 'weekly' | 'season' | 'all-time'

const TABS: Array<{ key: Period; label: string }> = [
  { key: 'weekly', label: 'Tuần' },
  { key: 'season', label: 'Mùa' },
  { key: 'all-time', label: 'Tất cả' },
]

interface LbEntry {
  userId: string
  name: string
  avatarUrl?: string
  points: number
  questions?: number
  streak?: number
  rank?: number
}

interface SeasonInfo {
  active?: boolean
  endDate?: string
  name?: string
}

interface MyRankResp {
  rank?: number
  userId?: string
  name?: string
  avatarUrl?: string
  points?: number
  questions?: number
}

function formatCountdown(endIso?: string): string {
  if (!endIso) return ''
  const end = new Date(endIso).getTime()
  if (!Number.isFinite(end)) return ''
  const diff = end - Date.now()
  if (diff <= 0) return 'Đã kết thúc'
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (d > 0) return `${d}d ${h}h ${m}m`
  return `${h}h ${m}m`
}

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<Period>('weekly')
  const { user } = useAuthStore()
  const myUserId = user?.id

  const { data: list = [], isLoading, isFetching } = useQuery<LbEntry[]>({
    queryKey: ['leaderboard', period],
    queryFn: () => apiClient.get(`/api/leaderboard/${period}?size=20`).then(r => (Array.isArray(r.data) ? r.data : []))
      .catch(() => [] as LbEntry[]),
    staleTime: 30_000,
  })

  const { data: myRank } = useQuery<MyRankResp | null>({
    queryKey: ['leaderboard', 'my-rank', period],
    queryFn: () => apiClient.get(`/api/leaderboard/${period}/my-rank`).then(r => r.data).catch(() => null),
    staleTime: 30_000,
  })

  const { data: season } = useQuery<SeasonInfo | null>({
    queryKey: ['season', 'active'],
    queryFn: () => apiClient.get('/api/seasons/active').then(r => r.data).catch(() => null),
    staleTime: 5 * 60_000,
  })

  // Dedup + slice
  const seen = new Set<string>()
  const deduped = list.filter(e => {
    if (!e.userId || seen.has(e.userId)) return false
    seen.add(e.userId)
    return true
  })

  const top3 = deduped.slice(0, 3)
  const rest = deduped.slice(3, 20)
  const userInTop20 = myUserId ? deduped.some(e => e.userId === myUserId) : false

  // Ticking countdown
  const [, forceTick] = useState(0)
  useEffect(() => {
    if (!season?.endDate) return
    const id = setInterval(() => forceTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [season?.endDate])

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>🏆 Bảng Xếp Hạng</Text>
          {season?.active && season.endDate && (
            <View style={s.countdownPill}>
              <Text style={s.countdownIcon}>⏳</Text>
              <Text style={s.countdownText}>{formatCountdown(season.endDate)}</Text>
            </View>
          )}
        </View>

        {/* Tabs pill */}
        <View style={s.tabsPill}>
          {TABS.map(t => {
            const active = period === t.key
            return (
              <Pressable
                key={t.key}
                onPress={() => setPeriod(t.key)}
                style={[s.tab, active && s.tabActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Bảng ${t.label}`}
              >
                <Text style={[s.tabText, active && s.tabTextActive]}>{t.label}</Text>
              </Pressable>
            )
          })}
        </View>

        {/* Top-3 podium */}
        {isLoading ? (
          <View style={s.podiumLoading}>
            <ActivityIndicator color={colors.gold} />
          </View>
        ) : top3.length === 0 ? (
          <View style={s.emptyPodium}>
            <Text style={s.emptyIcon}>📊</Text>
            <Text style={s.empty}>Chưa có dữ liệu</Text>
          </View>
        ) : (
          <View style={s.podium}>
            <PodiumSlot entry={top3[1]} rank={2} isMe={top3[1]?.userId === myUserId} />
            <PodiumSlot entry={top3[0]} rank={1} isMe={top3[0]?.userId === myUserId} />
            <PodiumSlot entry={top3[2]} rank={3} isMe={top3[2]?.userId === myUserId} />
          </View>
        )}

        {/* Rank 4+ list */}
        {rest.length > 0 && (
          <View style={[s.list, isFetching && s.fetching]}>
            {rest.map((entry, i) => (
              <LbRow
                key={entry.userId}
                rank={i + 4}
                entry={entry}
                isMe={entry.userId === myUserId}
              />
            ))}
          </View>
        )}

        {/* Sticky my-rank row (chỉ khi user outside top 20) */}
        {!userInTop20 && myRank && typeof myRank.rank === 'number' && myRank.rank > 20 && myUserId && (
          <View style={s.myRankWrap}>
            <Text style={s.myRankLabel}>Hạng của bạn</Text>
            <LbRow
              rank={myRank.rank}
              entry={{
                userId: myUserId,
                name: myRank.name ?? user?.name ?? 'Bạn',
                avatarUrl: myRank.avatarUrl ?? user?.avatarUrl,
                points: myRank.points ?? 0,
                questions: myRank.questions,
              }}
              isMe
            />
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  )
}

const RANK_BADGE: Record<number, { glyph: string; bg: string }> = {
  1: { glyph: '👑', bg: '#e8a832' },
  2: { glyph: '🥈', bg: '#c0c0c0' },
  3: { glyph: '🥉', bg: '#cd7f32' },
}

function PodiumSlot({ entry, rank, isMe }: { entry?: LbEntry; rank: 1 | 2 | 3; isMe: boolean }) {
  if (!entry) {
    return <View style={[s.podiumCol, rank === 1 && s.podiumColFirst]} />
  }
  const tier = getTierByPoints(entry.points)
  const avatarSize = rank === 1 ? 64 : 48
  const badge = RANK_BADGE[rank]

  return (
    <View style={[s.podiumCol, rank === 1 && s.podiumColFirst]}>
      <Text style={s.podiumGlyph}>{badge.glyph}</Text>
      <View style={s.podiumAvatarWrap}>
        <Avatar
          uri={entry.avatarUrl}
          name={entry.name}
          size={avatarSize}
          borderColor={rank === 1 ? colors.gold : tier.color}
        />
        <View style={[s.podiumRankBadge, { backgroundColor: badge.bg }]}>
          <Text style={s.podiumRankNum}>{rank}</Text>
        </View>
      </View>
      <Text style={[s.podiumName, isMe && s.podiumNameMe]} numberOfLines={1}>
        {entry.name}{isMe && ' (Bạn)'}
      </Text>
      <Text style={[s.podiumTier, { color: tier.color }]} numberOfLines={1}>
        {tier.icon} {tier.name}
      </Text>
      <View style={[
        s.podiumBucket,
        rank === 1 && s.podiumBucketFirst,
        rank === 3 && s.podiumBucketThird,
        { borderColor: rank === 1 ? colors.gold : tier.color },
      ]}>
        <Text style={[s.podiumPoints, rank === 1 && s.podiumPointsFirst]}>
          {entry.points.toLocaleString()}
        </Text>
        {typeof entry.questions === 'number' && (
          <Text style={s.podiumQuestions}>{entry.questions} câu</Text>
        )}
      </View>
    </View>
  )
}

function LbRow({ rank, entry, isMe }: { rank: number; entry: LbEntry; isMe: boolean }) {
  const tier = getTierByPoints(entry.points)
  return (
    <View style={[s.row, isMe && s.rowMe]}>
      <Text style={[s.rowRank, isMe && s.rowRankMe]}>#{rank}</Text>
      <Avatar uri={entry.avatarUrl} name={entry.name} size={36} borderColor={isMe ? colors.gold : undefined} />
      <View style={s.rowInfo}>
        <View style={s.rowNameLine}>
          <Text style={[s.rowName, isMe && s.rowNameMe]} numberOfLines={1}>
            {entry.name}
          </Text>
          {isMe && <Text style={s.banBadge}>BẠN</Text>}
        </View>
        <View style={s.rowMeta}>
          <Text style={[s.rowTier, { color: isMe ? colors.onSecondary : tier.color }]} numberOfLines={1}>
            {tier.icon} {tier.name}
          </Text>
          {typeof entry.streak === 'number' && entry.streak > 0 && (
            <Text style={[s.rowStreak, isMe && { color: colors.onSecondary }]}>🔥 {entry.streak}</Text>
          )}
        </View>
      </View>
      <Text style={[s.rowPoints, isMe && s.rowPointsMe]}>{entry.points.toLocaleString()}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  content: { paddingBottom: spacing['2xl'] },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  countdownPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  countdownIcon: { fontSize: 12 },
  countdownText: { fontSize: 11, fontWeight: typography.weight.bold, color: colors.gold, fontVariant: ['tabular-nums'] },

  // Tabs pill container
  tabsPill: { flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, padding: 3, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
  tabActive: { backgroundColor: colors.gold, shadowColor: colors.gold, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  tabText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted },
  tabTextActive: { color: colors.onSecondary },

  // Podium
  podiumLoading: { paddingVertical: spacing['2xl'], alignItems: 'center' },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  podiumCol: { flex: 1, alignItems: 'center', gap: 4 },
  podiumColFirst: { marginBottom: 0 },
  podiumGlyph: { fontSize: 22 },
  podiumAvatarWrap: { position: 'relative' },
  podiumRankBadge: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bgPrimary },
  podiumRankNum: { fontSize: 11, fontWeight: typography.weight.black, color: '#1a1208' },
  podiumName: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center', marginTop: 6 },
  podiumNameMe: { color: colors.gold },
  podiumTier: { fontSize: 10, fontWeight: typography.weight.semibold, textAlign: 'center' },
  podiumBucket: {
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    borderTopWidth: 3,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
    minHeight: 60,
    justifyContent: 'center',
  },
  podiumBucketFirst: { minHeight: 90, backgroundColor: 'rgba(232,168,50,0.10)' },
  podiumBucketThird: { minHeight: 50 },
  podiumPoints: { fontSize: typography.size.base, fontWeight: typography.weight.black, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  podiumPointsFirst: { fontSize: 18, color: colors.gold },
  podiumQuestions: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  // List
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md },
  fetching: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.md, minHeight: 60 },
  rowMe: {
    backgroundColor: colors.gold,
    borderLeftWidth: 4,
    borderLeftColor: colors.onSecondary,
    shadowColor: colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  rowRank: { width: 32, fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  rowRankMe: { color: colors.onSecondary, fontWeight: typography.weight.black },
  rowInfo: { flex: 1 },
  rowNameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowName: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textPrimary, flexShrink: 1 },
  rowNameMe: { color: colors.onSecondary, fontWeight: typography.weight.black },
  banBadge: { fontSize: 9, fontWeight: typography.weight.black, color: colors.onSecondary, backgroundColor: 'rgba(26,18,8,0.2)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, letterSpacing: 0.5 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  rowTier: { fontSize: 10, fontWeight: typography.weight.semibold },
  rowStreak: { fontSize: 10, color: colors.warning, fontWeight: typography.weight.bold },
  rowPoints: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.gold, fontVariant: ['tabular-nums'] },
  rowPointsMe: { color: colors.onSecondary, fontWeight: typography.weight.black },

  // My-rank sticky
  myRankWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.xs },
  myRankLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: typography.weight.bold },

  // Empty state
  emptyPodium: { alignItems: 'center', paddingVertical: spacing['2xl'] * 2, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  empty: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center' },
})
