import React from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import { listMySets, QuizSet } from '../../api/personalQuizSets'
import { colors, typography, spacing, borderRadius } from '../../theme'

function formatRelative(iso?: string): string {
  if (!iso) return ''
  const ts = new Date(iso).getTime()
  if (!Number.isFinite(ts)) return ''
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  return `${Math.floor(hrs / 24)} ngày trước`
}

export default function MySetsScreen() {
  const navigation = useNavigation<any>()
  const { data: sets = [], isLoading, refetch, isRefetching } = useQuery<QuizSet[]>({
    queryKey: ['my-sets'],
    queryFn: listMySets,
  })

  return (
    <SafeScreen>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Bộ câu hỏi của tôi</Text>
          <Text style={s.subtitle}>{sets.length} bộ</Text>
        </View>

        <FlatList
          data={sets}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.gold} />}
          renderItem={({ item }) => {
            const isDraft = item.publishStatus === 'DRAFT'
            const qCount = item.totalQuestions ?? item.questionCount ?? 0
            return (
              <Pressable
                style={s.cardWrap}
                onPress={() => navigation.navigate('QuizSetDetail', { setId: item.id, isPersonal: true })}
              >
                <Card style={s.card}>
                  <View style={[s.statusBadge, isDraft ? s.badgeDraft : s.badgePublished]}>
                    <Text style={[s.statusText, isDraft ? s.badgeDraftText : s.badgePublishedText]}>
                      {isDraft ? 'NHÁP' : 'ĐÃ XB'}
                    </Text>
                  </View>
                  <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.cardMeta}>{qCount} câu</Text>
                  <Text style={s.cardMeta}>{formatRelative(item.updatedAt ?? item.createdAt)}</Text>
                </Card>
              </Pressable>
            )
          }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📚</Text>
                <Text style={s.emptyTitle}>Chưa có bộ câu hỏi</Text>
                <Text style={s.emptySubtitle}>Tạo bộ đầu tiên để chia sẻ hoặc luyện tập</Text>
              </View>
            ) : null
          }
        />

        <Pressable
          style={s.fab}
          onPress={() => navigation.navigate('PersonalQuizSetEditor', { setId: undefined })}
        >
          <Text style={s.fabText}>+ Tạo bộ mới</Text>
        </Pressable>
      </View>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.xl, paddingBottom: spacing.md },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  cardWrap: { flex: 1 },
  card: { gap: spacing.xs, minHeight: 120 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeDraft: { backgroundColor: 'rgba(232,168,50,0.15)' },
  badgePublished: { backgroundColor: 'rgba(34,197,94,0.15)' },
  statusText: { fontSize: 10, fontWeight: typography.weight.bold, letterSpacing: 1 },
  badgeDraftText: { color: colors.gold },
  badgePublishedText: { color: colors.success },
  cardName: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary, marginTop: spacing.xs },
  cardMeta: { fontSize: typography.size.xs, color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: spacing['2xl'] * 2, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  emptySubtitle: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  fabText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.onSecondary },
})
