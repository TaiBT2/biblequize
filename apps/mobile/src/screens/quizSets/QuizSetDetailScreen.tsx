import React from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { getSetFull, deleteSet, QuizSetFull } from '../../api/personalQuizSets'
import { colors, typography, spacing, borderRadius } from '../../theme'

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
  MIXED: 'Tổng hợp',
}

export default function QuizSetDetailScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const queryClient = useQueryClient()
  const setId: string = route.params?.setId ?? ''
  const isPersonal: boolean = route.params?.isPersonal ?? true

  const { data: set, isLoading, error } = useQuery<QuizSetFull>({
    queryKey: ['quiz-set-full', setId],
    queryFn: () => getSetFull(setId),
    enabled: !!setId,
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteSet(setId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-sets'] })
      navigation.goBack()
    },
    onError: (e: any) => Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không xoá được'),
  })

  const confirmDelete = () => {
    Alert.alert('Xoá bộ câu hỏi?', 'Hành động này không thể hoàn tác.', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => deleteMut.mutate() },
    ])
  }

  if (isLoading) {
    return <SafeScreen><View style={s.center}><Text style={s.muted}>Đang tải...</Text></View></SafeScreen>
  }
  if (error || !set) {
    return <SafeScreen><View style={s.center}><Text style={s.error}>Không tải được bộ câu hỏi</Text></View></SafeScreen>
  }

  const isDraft = set.publishStatus === 'DRAFT'
  const previewQuestions = set.questions?.slice(0, 5) ?? []
  const remainingCount = (set.totalQuestions ?? 0) - previewQuestions.length

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.headerRow}>
          <Text style={s.title}>{set.name}</Text>
          <View style={[s.statusBadge, isDraft ? s.badgeDraft : s.badgePublished]}>
            <Text style={[s.statusText, isDraft ? s.badgeDraftText : s.badgePublishedText]}>
              {isDraft ? 'NHÁP' : 'ĐÃ XUẤT BẢN'}
            </Text>
          </View>
        </View>

        <View style={s.metaRow}>
          {set.difficulty && <Text style={s.metaItem}>📊 {DIFFICULTY_LABEL[set.difficulty] ?? set.difficulty}</Text>}
          {set.estimatedDurationMin && <Text style={s.metaItem}>⏱ {set.estimatedDurationMin} phút</Text>}
          {set.language && <Text style={s.metaItem}>🗣 {set.language.toUpperCase()}</Text>}
        </View>

        {set.coverScripture && (
          <Card style={s.scriptureCard}>
            <Text style={s.scriptureLabel}>Câu Kinh Thánh tham chiếu</Text>
            <Text style={s.scriptureText}>{set.coverScripture}</Text>
          </Card>
        )}

        {set.description && (
          <View>
            <Text style={s.sectionLabel}>Mô tả</Text>
            <Text style={s.description}>{set.description}</Text>
          </View>
        )}

        {set.tags && set.tags.length > 0 && (
          <View>
            <Text style={s.sectionLabel}>Tags</Text>
            <View style={s.tagsRow}>
              {set.tags.map(tag => (
                <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
              ))}
            </View>
          </View>
        )}

        <View>
          <Text style={s.sectionLabel}>Câu hỏi ({set.totalQuestions ?? 0})</Text>
          {previewQuestions.length === 0 ? (
            <Text style={s.muted}>Chưa có câu hỏi</Text>
          ) : (
            previewQuestions.map((q, i) => (
              <Card key={q.id} style={s.questionCard}>
                <Text style={s.questionNum}>Câu {i + 1}</Text>
                <Text style={s.questionText} numberOfLines={2}>{q.content}</Text>
              </Card>
            ))
          )}
          {remainingCount > 0 && (
            <Text style={s.moreHint}>...và {remainingCount} câu khác</Text>
          )}
        </View>

        <View style={s.actions}>
          {isPersonal && (
            <Button
              title="Chỉnh sửa"
              onPress={() => navigation.navigate('PersonalQuizSetEditor', { setId })}
              fullWidth
            />
          )}
          {isPersonal && (
            <Button
              title="Xoá bộ"
              onPress={confirmDelete}
              variant="outline"
              fullWidth
            />
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing['2xl'] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { fontSize: typography.size.sm, color: colors.textMuted },
  error: { fontSize: typography.size.sm, color: colors.error },
  headerRow: { gap: spacing.sm },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.full },
  badgeDraft: { backgroundColor: 'rgba(232,168,50,0.15)' },
  badgePublished: { backgroundColor: 'rgba(34,197,94,0.15)' },
  statusText: { fontSize: 11, fontWeight: typography.weight.bold, letterSpacing: 1 },
  badgeDraftText: { color: colors.gold },
  badgePublishedText: { color: colors.success },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaItem: { fontSize: typography.size.sm, color: colors.textSecondary },
  scriptureCard: { gap: spacing.xs, borderLeftWidth: 3, borderLeftColor: colors.gold },
  scriptureLabel: { fontSize: typography.size.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  scriptureText: { fontSize: typography.size.base, fontStyle: 'italic', color: colors.gold },
  sectionLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  description: { fontSize: typography.size.base, color: colors.textPrimary, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { backgroundColor: colors.surfaceContainer, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  tagText: { fontSize: typography.size.xs, color: colors.textSecondary },
  questionCard: { gap: spacing.xs, marginBottom: spacing.sm },
  questionNum: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.gold },
  questionText: { fontSize: typography.size.sm, color: colors.textPrimary },
  moreHint: { fontSize: typography.size.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },
  actions: { gap: spacing.md, marginTop: spacing.lg },
})
