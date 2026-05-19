import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import { addQuestion, updateQuestion, AddQuestionBody, EditorQuestion } from '../../api/personalQuizSets'
import { colors, typography, spacing, borderRadius } from '../../theme'
import { ANSWER_COLORS } from '@biblequize/shared/constants'

const LETTERS = ['A', 'B', 'C', 'D']
const ANSWER_TINTS = [ANSWER_COLORS.A, ANSWER_COLORS.B, ANSWER_COLORS.C, ANSWER_COLORS.D]
const DIFFICULTIES: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']
const DIFFICULTY_LABEL = { easy: 'Dễ', medium: 'TB', hard: 'Khó' } as const

export default function QuestionEditorScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const queryClient = useQueryClient()

  const setId: string = route.params?.setId ?? ''
  const questionId: string | undefined = route.params?.questionId
  const prefill: EditorQuestion | undefined = route.params?.question
  const isEdit = !!questionId

  const [content, setContent] = useState(prefill?.content ?? '')
  const [options, setOptions] = useState<string[]>(prefill?.options ?? ['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState<number>(prefill?.correctAnswer?.[0] ?? 0)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(prefill?.difficulty ?? 'medium')
  const [book, setBook] = useState(prefill?.book ?? '')
  const [chapter, setChapter] = useState(prefill?.chapter ? String(prefill.chapter) : '')
  const [explanation, setExplanation] = useState(prefill?.explanation ?? '')

  const buildBody = (): AddQuestionBody => ({
    content: content.trim(),
    options: options.map(o => o.trim()),
    correctAnswer: correctIndex,
    difficulty,
    book: book.trim(),
    chapter: chapter ? Number(chapter) || null : null,
    explanation: explanation.trim() || undefined,
    language: 'vi',
  })

  const validate = (): string | null => {
    if (!content.trim()) return 'Nội dung câu hỏi không được trống'
    if (options.some(o => !o.trim())) return 'Tất cả đáp án phải có nội dung'
    if (!book.trim()) return 'Sách Kinh Thánh không được trống'
    return null
  }

  const mut = useMutation({
    mutationFn: () => isEdit
      ? updateQuestion(setId, questionId!, buildBody())
      : addQuestion(setId, buildBody()).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-set-full', setId] })
      navigation.goBack()
    },
    onError: (e: any) => Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không lưu được câu hỏi'),
  })

  const handleSave = () => {
    const err = validate()
    if (err) { Alert.alert('Thiếu thông tin', err); return }
    mut.mutate()
  }

  const updateOption = (idx: number, value: string) => {
    setOptions(prev => prev.map((o, i) => i === idx ? value : o))
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{isEdit ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</Text>

        <Text style={s.label}>Nội dung câu hỏi</Text>
        <TextInput
          style={[s.input, s.multiline]}
          value={content}
          onChangeText={setContent}
          placeholder="Nhập câu hỏi..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <Text style={s.label}>4 đáp án (chọn đáp án đúng)</Text>
        {options.map((opt, idx) => {
          const tint = ANSWER_TINTS[idx]
          const isCorrect = correctIndex === idx
          return (
            <View key={idx} style={s.optionRow}>
              <Pressable
                onPress={() => setCorrectIndex(idx)}
                style={[s.optionLetter, { backgroundColor: tint }, isCorrect && s.optionLetterActive]}
              >
                <Text style={s.optionLetterText}>{LETTERS[idx]}</Text>
              </Pressable>
              <TextInput
                style={[s.input, { flex: 1 }, isCorrect && s.optionCorrect]}
                value={opt}
                onChangeText={(v) => updateOption(idx, v)}
                placeholder={`Đáp án ${LETTERS[idx]}`}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          )
        })}
        <Text style={s.hint}>Đáp án đúng: <Text style={s.hintHighlight}>{LETTERS[correctIndex]}</Text></Text>

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

        <View style={s.row2}>
          <View style={{ flex: 2 }}>
            <Text style={s.label}>Sách</Text>
            <TextInput
              style={s.input}
              value={book}
              onChangeText={setBook}
              placeholder="vd: Sáng Thế Ký"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Chương</Text>
            <TextInput
              style={s.input}
              value={chapter}
              onChangeText={setChapter}
              placeholder="vd: 1"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Text style={s.label}>Giải thích (tuỳ chọn)</Text>
        <TextInput
          style={[s.input, s.multiline]}
          value={explanation}
          onChangeText={setExplanation}
          placeholder="Giải thích thêm về đáp án đúng..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <View style={s.actions}>
          <Button
            title={mut.isPending ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm câu hỏi')}
            onPress={handleSave}
            disabled={mut.isPending}
            fullWidth
          />
          <Button
            title="Huỷ"
            onPress={() => navigation.goBack()}
            variant="outline"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing['2xl'] },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
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
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  optionLetter: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  optionLetterActive: { borderWidth: 3, borderColor: colors.success },
  optionLetterText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  optionCorrect: { borderWidth: 2, borderColor: colors.success },
  hint: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center' },
  hintHighlight: { color: colors.success, fontWeight: typography.weight.bold },
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
  row2: { flexDirection: 'row', gap: spacing.md },
  actions: { gap: spacing.md, marginTop: spacing.xl },
})
