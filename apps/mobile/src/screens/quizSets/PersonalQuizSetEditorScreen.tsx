import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  createSet, getSetFull, updateSet, publishSet, deleteQuestion,
  QuizSetFull, CreateQuizSetBody, QuizSetDifficulty,
} from '../../api/personalQuizSets'
import { colors, typography, spacing, borderRadius } from '../../theme'

const DIFFICULTIES: QuizSetDifficulty[] = ['EASY', 'MEDIUM', 'HARD', 'MIXED']
const DIFFICULTY_LABEL: Record<QuizSetDifficulty, string> = {
  EASY: 'Dễ', MEDIUM: 'TB', HARD: 'Khó', MIXED: 'Tổng hợp',
}

const PUBLISH_MIN_QUESTIONS = 5

export default function PersonalQuizSetEditorScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const queryClient = useQueryClient()
  const initialSetId: string | undefined = route.params?.setId

  // For create mode, auto-create DRAFT on mount then store ID.
  const [setId, setSetId] = useState<string | undefined>(initialSetId)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  // Local form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [coverScripture, setCoverScripture] = useState('')
  const [difficulty, setDifficulty] = useState<QuizSetDifficulty>('MEDIUM')
  const [duration, setDuration] = useState('')

  const { data: set, refetch } = useQuery<QuizSetFull>({
    queryKey: ['quiz-set-full', setId],
    queryFn: () => getSetFull(setId!),
    enabled: !!setId,
  })

  // Sync remote data → local form khi set load lần đầu (không override khi user typing)
  useEffect(() => {
    if (!set) return
    setName(set.name ?? '')
    setDescription(set.description ?? '')
    setTagsInput((set.tags ?? []).join(', '))
    setCoverScripture(set.coverScripture ?? '')
    if (set.difficulty) setDifficulty(set.difficulty)
    if (set.estimatedDurationMin) setDuration(String(set.estimatedDurationMin))
  }, [set?.id])

  // Re-fetch khi screen focus (sau khi user thêm/sửa question rồi quay lại)
  useFocusEffect(
    React.useCallback(() => {
      if (setId) refetch()
    }, [setId, refetch]),
  )

  // Create mode → POST mới ngay khi mount
  useEffect(() => {
    if (initialSetId) return
    if (setId) return
    createSet({ name: 'Bộ câu hỏi mới' })
      .then(s => setSetId(s.id))
      .catch((e: any) => Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không tạo được bộ mới'))
  }, [initialSetId, setId])

  const buildBody = (): Partial<CreateQuizSetBody> => ({
    name: name.trim(),
    description: description.trim() || undefined,
    tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
    coverScripture: coverScripture.trim() || undefined,
    difficulty,
    estimatedDurationMin: duration ? Number(duration) || undefined : undefined,
  })

  const saveMut = useMutation({
    mutationFn: () => updateSet(setId!, buildBody()),
    onSuccess: () => {
      setSavedAt(Date.now())
      queryClient.invalidateQueries({ queryKey: ['my-sets'] })
      queryClient.invalidateQueries({ queryKey: ['quiz-set-full', setId] })
    },
    onError: (e: any) => Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không lưu được'),
  })

  const publishMut = useMutation({
    mutationFn: () => publishSet(setId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-sets'] })
      queryClient.invalidateQueries({ queryKey: ['quiz-set-full', setId] })
      Alert.alert('Đã xuất bản', 'Bộ câu hỏi đã chuyển sang trạng thái Đã xuất bản.')
    },
    onError: (e: any) => Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không xuất bản được'),
  })

  const handlePublish = () => {
    if (!name.trim()) {
      Alert.alert('Thiếu tên', 'Bộ câu hỏi cần có tên trước khi xuất bản.')
      return
    }
    if ((set?.totalQuestions ?? 0) < PUBLISH_MIN_QUESTIONS) {
      Alert.alert('Chưa đủ câu hỏi', `Cần tối thiểu ${PUBLISH_MIN_QUESTIONS} câu hỏi.`)
      return
    }
    Alert.alert('Xuất bản?', 'Bộ sẽ chuyển sang Đã xuất bản và hiển thị công khai.', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xuất bản', onPress: () => publishMut.mutate() },
    ])
  }

  const handleRemoveQuestion = (qid: string) => {
    if (!setId) return
    Alert.alert('Xoá câu hỏi?', '', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: async () => {
        try {
          await deleteQuestion(setId, qid)
          refetch()
        } catch (e: any) {
          Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không xoá được')
        }
      }},
    ])
  }

  if (!setId) {
    return <SafeScreen><View style={s.center}><Text style={s.muted}>Đang tạo bộ mới...</Text></View></SafeScreen>
  }

  const isDraft = (set?.publishStatus ?? 'DRAFT') === 'DRAFT'
  const totalQ = set?.totalQuestions ?? 0

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <TextInput
          style={s.titleInput}
          value={name}
          onChangeText={setName}
          placeholder="Tên bộ câu hỏi..."
          placeholderTextColor={colors.textMuted}
        />

        <View style={s.statusRow}>
          <Text style={[s.statusBadge, isDraft ? s.badgeDraft : s.badgePublished]}>
            {isDraft ? 'NHÁP' : 'ĐÃ XB'}
          </Text>
          {savedAt && (
            <Text style={s.savedHint}>Đã lưu lúc {new Date(savedAt).toLocaleTimeString().slice(0, 5)}</Text>
          )}
        </View>

        <Text style={s.label}>Mô tả</Text>
        <TextInput
          style={[s.input, s.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả ngắn về bộ câu hỏi"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <Text style={s.label}>Tags (cách nhau bởi dấu phẩy)</Text>
        <TextInput
          style={s.input}
          value={tagsInput}
          onChangeText={setTagsInput}
          placeholder="vd: Cựu Ước, Sáng Thế Ký"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={s.label}>Câu Kinh Thánh tham chiếu</Text>
        <TextInput
          style={s.input}
          value={coverScripture}
          onChangeText={setCoverScripture}
          placeholder="vd: Sáng Thế Ký 1:1"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={s.label}>Độ khó</Text>
        <View style={s.segmentRow}>
          {DIFFICULTIES.map(d => (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              style={[s.segmentBtn, difficulty === d && s.segmentBtnActive]}
            >
              <Text style={[s.segmentText, difficulty === d && s.segmentTextActive]}>
                {DIFFICULTY_LABEL[d]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.label}>Thời lượng ước tính (phút)</Text>
        <TextInput
          style={s.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="vd: 15"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
        />

        <View style={s.questionsHeader}>
          <Text style={s.label}>Câu hỏi ({totalQ})</Text>
          <Pressable
            style={s.addBtn}
            onPress={() => navigation.navigate('QuestionEditor', { setId })}
          >
            <Text style={s.addBtnText}>+ Thêm câu hỏi</Text>
          </Pressable>
        </View>

        {(set?.questions ?? []).map((q, i) => (
          <Card key={q.id} style={s.questionRow}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('QuestionEditor', { setId, questionId: q.id, question: q })}
            >
              <Text style={s.questionNum}>Câu {i + 1}</Text>
              <Text style={s.questionText} numberOfLines={2}>{q.content || '(chưa có nội dung)'}</Text>
            </Pressable>
            <Pressable onPress={() => handleRemoveQuestion(q.id)} hitSlop={8}>
              <Text style={s.deleteIcon}>🗑</Text>
            </Pressable>
          </Card>
        ))}

        <View style={s.actions}>
          <Button
            title={saveMut.isPending ? 'Đang lưu...' : 'Lưu metadata'}
            onPress={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            fullWidth
          />
          {isDraft && (
            <Button
              title={publishMut.isPending ? 'Đang xuất bản...' : 'Xuất bản'}
              onPress={handlePublish}
              variant="outline"
              disabled={publishMut.isPending}
              fullWidth
            />
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing['2xl'] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { fontSize: typography.size.sm, color: colors.textMuted },
  titleInput: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.full, fontSize: 11, fontWeight: typography.weight.bold, letterSpacing: 1, overflow: 'hidden' },
  badgeDraft: { backgroundColor: 'rgba(232,168,50,0.15)', color: colors.gold },
  badgePublished: { backgroundColor: 'rgba(34,197,94,0.15)', color: colors.success },
  savedHint: { fontSize: typography.size.xs, color: colors.textMuted, fontStyle: 'italic' },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textSecondary, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.size.base,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', gap: spacing.xs },
  segmentBtn: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: colors.gold },
  segmentText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  segmentTextActive: { color: colors.onSecondary, fontWeight: typography.weight.bold },
  questionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg },
  addBtn: { backgroundColor: colors.gold, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  addBtnText: { color: colors.onSecondary, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  questionNum: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.gold },
  questionText: { fontSize: typography.size.sm, color: colors.textPrimary, marginTop: 2 },
  deleteIcon: { fontSize: 20, padding: spacing.xs },
  actions: { gap: spacing.md, marginTop: spacing.xl },
})
