import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import { listGroupQuizSets, GroupQuizSet } from '../../api/groupQuizSets'
import { PublishStatus } from '../../api/personalQuizSets'
import { colors, typography, spacing, borderRadius } from '../../theme'

type StatusFilter = 'ALL' | 'PUBLISHED' | 'ARCHIVED'

const FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: 'Tất cả',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Lưu trữ',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: 'Dễ', MEDIUM: 'TB', HARD: 'Khó', MIXED: 'Tổng hợp',
}

export default function GroupQuizSetListScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const groupId: string = route.params?.groupId ?? ''
  const [filter, setFilter] = useState<StatusFilter>('PUBLISHED')

  const { data: sets = [], isRefetching, refetch } = useQuery<GroupQuizSet[]>({
    queryKey: ['group-quiz-sets', groupId, filter],
    queryFn: () => listGroupQuizSets({
      groupId,
      status: filter === 'ALL' ? 'ALL' : (filter as PublishStatus),
    }),
    enabled: !!groupId,
  })

  return (
    <SafeScreen>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Bộ câu hỏi nhóm</Text>
          <Text style={s.subtitle}>{sets.length} bộ</Text>
        </View>

        <View style={s.filtersRow}>
          {(Object.keys(FILTER_LABELS) as StatusFilter[]).map(key => (
            <Pressable
              key={key}
              style={[s.filterPill, filter === key && s.filterPillActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[s.filterText, filter === key && s.filterTextActive]}>
                {FILTER_LABELS[key]}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={sets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.gold} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('QuizSetDetail', { setId: item.id, isPersonal: false, groupId })}
            >
              <Card style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
                  {item.difficulty && <Text style={s.difficulty}>{DIFFICULTY_LABEL[item.difficulty] ?? item.difficulty}</Text>}
                </View>
                {item.creatorName && <Text style={s.creator}>👤 {item.creatorName}</Text>}
                <View style={s.statsRow}>
                  <Text style={s.statItem}>📝 {item.totalQuestions ?? item.questionCount ?? 0} câu</Text>
                  {typeof item.playCount === 'number' && <Text style={s.statItem}>🎮 {item.playCount}</Text>}
                  {typeof item.avgRating === 'number' && <Text style={s.statItem}>⭐ {item.avgRating.toFixed(1)}</Text>}
                </View>
              </Card>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📚</Text>
              <Text style={s.emptyTitle}>Chưa có bộ câu hỏi nào</Text>
              <Text style={s.emptySubtitle}>Leader nhóm chưa tạo bộ câu hỏi</Text>
            </View>
          }
        />
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
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
  },
  filterPillActive: { backgroundColor: colors.gold },
  filterText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  filterTextActive: { color: colors.onSecondary, fontWeight: typography.weight.bold },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { gap: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  difficulty: {
    fontSize: typography.size.xs,
    color: colors.gold,
    fontWeight: typography.weight.bold,
    backgroundColor: 'rgba(232,168,50,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  creator: { fontSize: typography.size.xs, color: colors.textMuted },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  statItem: { fontSize: typography.size.xs, color: colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: spacing['2xl'] * 2, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  emptySubtitle: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center' },
})
