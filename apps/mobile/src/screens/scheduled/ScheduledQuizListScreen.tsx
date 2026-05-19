import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import { listScheduledQuizzes, ScheduledQuizSummary, ScheduledQuizStatus } from '../../api/scheduledQuiz'
import { colors, typography, spacing, borderRadius } from '../../theme'

type Filter = 'ACTIVE' | 'ENDED'

function formatDeadline(iso: string): string {
  const ts = new Date(iso).getTime()
  if (!Number.isFinite(ts)) return iso
  const diff = ts - Date.now()
  if (diff < 0) return 'Đã hết hạn'
  const days = Math.floor(diff / 86400000)
  if (days > 1) return `Còn ${days} ngày`
  const hrs = Math.floor(diff / 3600000)
  if (hrs > 1) return `Còn ${hrs} giờ`
  const mins = Math.max(1, Math.floor(diff / 60000))
  return `Còn ${mins} phút`
}

export default function ScheduledQuizListScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const groupId: string = route.params?.groupId ?? ''
  const canManage: boolean = route.params?.canManage ?? false
  const [filter, setFilter] = useState<Filter>('ACTIVE')

  const { data: quizzes = [], isRefetching, refetch } = useQuery<ScheduledQuizSummary[]>({
    queryKey: ['scheduled-quizzes', groupId, filter],
    queryFn: () => listScheduledQuizzes(groupId, filter as ScheduledQuizStatus),
    enabled: !!groupId,
  })

  return (
    <SafeScreen>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Lịch thi đấu</Text>
          <Text style={s.subtitle}>{quizzes.length} bộ</Text>
        </View>

        <View style={s.filtersRow}>
          {(['ACTIVE', 'ENDED'] as Filter[]).map(key => (
            <Pressable
              key={key}
              style={[s.filterPill, filter === key && s.filterPillActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[s.filterText, filter === key && s.filterTextActive]}>
                {key === 'ACTIVE' ? 'Đang mở' : 'Đã kết thúc'}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.gold} />}
          renderItem={({ item }) => {
            const isActive = item.status === 'ACTIVE'
            return (
              <Pressable
                onPress={() => navigation.navigate('ScheduledQuizDetail', { groupId, quizId: item.id })}
              >
                <Card style={s.card}>
                  <View style={s.cardHeader}>
                    <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
                    <View style={[s.statusBadge, isActive ? s.badgeActive : s.badgeEnded]}>
                      <Text style={[s.statusText, isActive ? s.badgeActiveText : s.badgeEndedText]}>
                        {isActive ? 'MỞ' : 'KẾT THÚC'}
                      </Text>
                    </View>
                  </View>
                  {item.description && <Text style={s.description} numberOfLines={2}>{item.description}</Text>}
                  <View style={s.metaRow}>
                    <Text style={s.metaItem}>📝 {item.questionCount} câu</Text>
                    <Text style={[s.metaItem, isActive && s.metaUrgent]}>⏰ {formatDeadline(item.deadline)}</Text>
                  </View>
                </Card>
              </Pressable>
            )
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📅</Text>
              <Text style={s.emptyTitle}>Chưa có lịch thi đấu</Text>
            </View>
          }
        />

        {canManage && (
          <Pressable
            style={s.fab}
            onPress={() => navigation.navigate('ScheduledQuizCreate', { groupId })}
          >
            <Text style={s.fabText}>+ Tạo lịch mới</Text>
          </Pressable>
        )}
      </View>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.xl, paddingBottom: spacing.md },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  filtersRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainer },
  filterPillActive: { backgroundColor: colors.gold },
  filterText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  filterTextActive: { color: colors.onSecondary, fontWeight: typography.weight.bold },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },
  card: { gap: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  badgeActive: { backgroundColor: 'rgba(34,197,94,0.15)' },
  badgeEnded: { backgroundColor: 'rgba(255,255,255,0.06)' },
  statusText: { fontSize: 10, fontWeight: typography.weight.bold, letterSpacing: 1 },
  badgeActiveText: { color: colors.success },
  badgeEndedText: { color: colors.textMuted },
  description: { fontSize: typography.size.xs, color: colors.textMuted },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  metaItem: { fontSize: typography.size.xs, color: colors.textSecondary },
  metaUrgent: { color: colors.gold, fontWeight: typography.weight.bold },
  empty: { alignItems: 'center', paddingTop: spacing['2xl'] * 2, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  fab: {
    position: 'absolute', bottom: spacing.xl, left: spacing.xl, right: spacing.xl,
    backgroundColor: colors.gold, borderRadius: borderRadius.full,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  fabText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.onSecondary },
})
