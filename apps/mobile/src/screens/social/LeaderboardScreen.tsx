import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { Avatar } from '../../components/Avatar'
import { GlassCard } from '../../components/GlassCard'

type Period = 'daily' | 'weekly' | 'all-time'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily', label: 'Hôm nay' },
  { key: 'weekly', label: 'Tuần' },
  { key: 'all-time', label: 'Mọi lúc' },
]

export const LeaderboardScreen = () => {
  const navigation = useNavigation()
  const [period, setPeriod] = useState<Period>('daily')

  const lbQuery = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => api.get(`/api/leaderboard/${period}?size=50`).then((r) => r.data),
    staleTime: 30 * 1000,
  })

  const myRankQuery = useQuery({
    queryKey: ['my-rank', period],
    queryFn: () => api.get(`/api/leaderboard/${period}/my-rank`).then((r) => r.data),
    staleTime: 30 * 1000,
  })

  const entries = lbQuery.data?.content ?? lbQuery.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Bảng Xếp Hạng</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Period tabs */}
      <View style={styles.tabs}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.tab, period === p.key && styles.tabActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item: any, i) => item.userId ?? String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={lbQuery.isFetching}
            onRefresh={() => { lbQuery.refetch(); myRankQuery.refetch() }}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        renderItem={({ item, index }) => {
          const rank = index + 1
          const isTop3 = rank <= 3
          return (
            <GlassCard style={[styles.rankCard, isTop3 && styles.rankCardTop]}>
              <Text style={[styles.rank, isTop3 && styles.rankTop]}>{rank}</Text>
              <Avatar uri={item.avatarUrl} name={item.name ?? 'User'} size={36} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name ?? 'User'}</Text>
              </View>
              <Text style={[styles.score, isTop3 && styles.scoreTop]}>
                {(item.score ?? item.points ?? 0).toLocaleString()}
              </Text>
            </GlassCard>
          )
        }}
        ListFooterComponent={
          myRankQuery.data ? (
            <GlassCard style={[styles.rankCard, styles.myRankCard]}>
              <Text style={[styles.rank, styles.myRankText]}>{myRankQuery.data.rank ?? '—'}</Text>
              <MaterialCommunityIcons name="account" size={20} color={colors.gold} />
              <View style={styles.info}>
                <Text style={[styles.name, styles.myRankText]}>Bạn</Text>
              </View>
              <Text style={[styles.score, styles.myRankText]}>
                {(myRankQuery.data.score ?? myRankQuery.data.points ?? 0).toLocaleString()}
              </Text>
            </GlassCard>
          ) : null
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text.primary },

  tabs: {
    flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.full,
  },
  tabActive: { backgroundColor: colors.goldLight },
  tabText: { fontSize: 14, color: colors.text.muted, fontWeight: '500' },
  tabTextActive: { color: colors.gold },

  list: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing['4xl'] },

  rankCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 0,
  },
  rankCardTop: { borderColor: `${colors.gold}30` },
  rank: { width: 28, fontSize: 16, fontWeight: '700', color: colors.text.secondary, textAlign: 'center' },
  rankTop: { color: colors.gold },
  info: { flex: 1 },
  name: { fontSize: 15, color: colors.text.primary, fontWeight: '500' },
  score: { fontSize: 15, fontWeight: '700', color: colors.text.secondary },
  scoreTop: { color: colors.gold },

  myRankCard: { borderColor: colors.gold, borderWidth: 1, marginTop: spacing.md },
  myRankText: { color: colors.gold },
})
