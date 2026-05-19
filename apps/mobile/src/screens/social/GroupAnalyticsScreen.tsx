import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface WeeklyActivity {
  date: string
  activeCount: number
}

interface TopContributor {
  userId: string
  name: string
  avatarUrl?: string
  score: number
  questionsAnswered: number
}

interface GroupAnalytics {
  totalMembers: number
  activeToday: number
  activeWeek: number
  inactiveCount?: number
  avgScore?: number
  accuracy?: number
  totalQuizzes?: number
  totalPointsWeek?: number
  weeklyActivity?: WeeklyActivity[]
  topContributors?: TopContributor[]
  groupAgeDays?: number
}

const MIN_GROUP_AGE_DAYS = 7 // GD-2 rule: hide charts cho group <7 ngày

export default function GroupAnalyticsScreen() {
  const route = useRoute<any>()
  const groupId: string = route.params?.groupId ?? ''

  const { data, isLoading, error } = useQuery<GroupAnalytics>({
    queryKey: ['group-analytics', groupId],
    queryFn: () => apiClient.get(`/api/groups/${groupId}/analytics`).then(r => r.data),
    enabled: !!groupId,
  })

  if (isLoading) return <SafeScreen><View style={s.center}><Text style={s.muted}>Đang tải...</Text></View></SafeScreen>
  if (error) return <SafeScreen><View style={s.center}><Text style={s.error}>Bạn không có quyền xem phân tích nhóm này.</Text></View></SafeScreen>
  if (!data) return <SafeScreen><View style={s.center}><Text style={s.muted}>Không có dữ liệu</Text></View></SafeScreen>

  const tooYoung = data.groupAgeDays != null && data.groupAgeDays < MIN_GROUP_AGE_DAYS
  const maxActivity = Math.max(1, ...(data.weeklyActivity ?? []).map(w => w.activeCount))

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>📊 Phân tích nhóm</Text>

        <View style={s.statsGrid}>
          <Card style={s.statCard}>
            <Text style={s.statLabel}>Thành viên</Text>
            <Text style={s.statValue}>{data.totalMembers ?? 0}</Text>
          </Card>
          <Card style={s.statCard}>
            <Text style={s.statLabel}>Hôm nay</Text>
            <Text style={[s.statValue, { color: colors.success }]}>{data.activeToday ?? 0}</Text>
          </Card>
          <Card style={s.statCard}>
            <Text style={s.statLabel}>Tuần này</Text>
            <Text style={s.statValue}>{data.activeWeek ?? 0}</Text>
          </Card>
          {data.accuracy != null && (
            <Card style={s.statCard}>
              <Text style={s.statLabel}>Chính xác</Text>
              <Text style={s.statValue}>{Math.round(data.accuracy * 100)}%</Text>
            </Card>
          )}
        </View>

        {tooYoung ? (
          <Card style={s.youngCard}>
            <Text style={s.youngIcon}>⏳</Text>
            <Text style={s.youngText}>
              Biểu đồ sẽ hiển thị khi nhóm hoạt động được ít nhất {MIN_GROUP_AGE_DAYS} ngày.
            </Text>
          </Card>
        ) : (
          <>
            {data.weeklyActivity && data.weeklyActivity.length > 0 && (
              <View>
                <Text style={s.sectionLabel}>Hoạt động 7 ngày</Text>
                <Card style={s.chartCard}>
                  <View style={s.chartRow}>
                    {data.weeklyActivity.map(w => {
                      const heightPct = (w.activeCount / maxActivity) * 100
                      return (
                        <View key={w.date} style={s.barCol}>
                          <View style={s.barTrack}>
                            <View style={[s.barFill, { height: `${heightPct}%` }]} />
                          </View>
                          <Text style={s.barLabel}>{w.date.slice(-2)}</Text>
                          <Text style={s.barCount}>{w.activeCount}</Text>
                        </View>
                      )
                    })}
                  </View>
                </Card>
              </View>
            )}

            {data.topContributors && data.topContributors.length > 0 && (
              <View>
                <Text style={s.sectionLabel}>Đóng góp hàng đầu</Text>
                {data.topContributors.slice(0, 10).map((c, i) => (
                  <Card key={c.userId} style={s.contributorRow}>
                    <Text style={s.contribRank}>#{i + 1}</Text>
                    <Avatar uri={c.avatarUrl} name={c.name} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.contribName}>{c.name}</Text>
                      <Text style={s.contribMeta}>{c.questionsAnswered} câu trả lời</Text>
                    </View>
                    <Text style={s.contribScore}>{c.score}</Text>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing['2xl'] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  muted: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center' },
  error: { fontSize: typography.size.sm, color: colors.error, textAlign: 'center' },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: { flexBasis: '47%', flexGrow: 1, alignItems: 'center', gap: spacing.xs },
  statLabel: { fontSize: typography.size.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.gold },
  sectionLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  youngCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  youngIcon: { fontSize: 48 },
  youngText: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center' },
  chartCard: { paddingVertical: spacing.lg },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { height: 80, width: '70%', backgroundColor: colors.surfaceContainerHigh, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { backgroundColor: colors.gold, width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 10, color: colors.textMuted },
  barCount: { fontSize: 10, color: colors.textPrimary, fontWeight: typography.weight.bold },
  contributorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  contribRank: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold, width: 32 },
  contribName: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary },
  contribMeta: { fontSize: typography.size.xs, color: colors.textMuted },
  contribScore: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.gold },
})
