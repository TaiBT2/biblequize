import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ProgressBar from '../../components/ui/ProgressBar'
import {
  startScheduledQuizAttempt, submitScheduledQuizAttempt,
  AttemptQuestion, SubmitAttemptResponse,
} from '../../api/scheduledQuiz'
import { ANSWER_COLORS } from '@biblequize/shared/constants'
import { colors, typography, spacing, borderRadius } from '../../theme'

const LETTERS = ['A', 'B', 'C', 'D']
const ANSWER_TINTS = [ANSWER_COLORS.A, ANSWER_COLORS.B, ANSWER_COLORS.C, ANSWER_COLORS.D]

type Phase = 'loading' | 'playing' | 'submitting' | 'result' | 'error'

export default function ScheduledQuizPlayScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const queryClient = useQueryClient()
  const groupId: string = route.params?.groupId ?? ''
  const quizId: string = route.params?.quizId ?? ''

  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<AttemptQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [qIndex, setQIndex] = useState(0)
  const [result, setResult] = useState<SubmitAttemptResponse | null>(null)
  const startedAt = useRef<number>(Date.now())

  // Start attempt once on mount
  useEffect(() => {
    startScheduledQuizAttempt(groupId, quizId)
      .then(res => {
        setQuestions(res.questions)
        startedAt.current = Date.now()
        setPhase('playing')
      })
      .catch((e: any) => {
        setPhase('error')
        Alert.alert('Không bắt đầu được', e?.response?.data?.message ?? 'Lỗi không xác định', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ])
      })
  }, [groupId, quizId, navigation])

  const submitMut = useMutation({
    mutationFn: () => {
      const timeSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))
      const ans = questions.map(q => ({ questionId: q.id, answerIndex: answers[q.id] ?? -1 }))
      return submitScheduledQuizAttempt(groupId, quizId, { answers: ans, timeSeconds })
    },
    onSuccess: (res) => {
      setResult(res)
      setPhase('result')
      queryClient.invalidateQueries({ queryKey: ['scheduled-quiz', groupId, quizId] })
      queryClient.invalidateQueries({ queryKey: ['scheduled-quiz-leaderboard', groupId, quizId] })
    },
    onError: (e: any) => {
      setPhase('playing')
      Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không submit được')
    },
  })

  const handleAnswer = (idx: number) => {
    const qid = questions[qIndex]?.id
    if (!qid) return
    setAnswers(prev => ({ ...prev, [qid]: idx }))
  }

  const handleNext = () => {
    if (qIndex < questions.length - 1) {
      setQIndex(i => i + 1)
    } else {
      setPhase('submitting')
      submitMut.mutate()
    }
  }

  if (phase === 'loading' || phase === 'error') {
    return <SafeScreen><View style={s.center}><Text style={s.muted}>Đang chuẩn bị câu hỏi...</Text></View></SafeScreen>
  }

  if (phase === 'result' && result) {
    const pct = result.totalQuestions > 0 ? Math.round((result.correctCount / result.totalQuestions) * 100) : 0
    return (
      <SafeScreen>
        <View style={s.resultContent}>
          <Text style={s.resultIcon}>{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'}</Text>
          <Text style={s.resultTitle}>Đã hoàn thành!</Text>
          <Card style={s.resultCard}>
            <View style={s.statRow}>
              <Text style={s.statLabel}>Điểm</Text>
              <Text style={s.statValue}>{result.score}</Text>
            </View>
            <View style={s.statRow}>
              <Text style={s.statLabel}>Đúng</Text>
              <Text style={s.statValue}>{result.correctCount}/{result.totalQuestions} ({pct}%)</Text>
            </View>
            <View style={s.statRow}>
              <Text style={s.statLabel}>Thời gian</Text>
              <Text style={s.statValue}>{result.timeSeconds}s</Text>
            </View>
            <View style={s.statRow}>
              <Text style={s.statLabel}>Lần thử thứ</Text>
              <Text style={s.statValue}>{result.attemptNumber}</Text>
            </View>
          </Card>
          <Button title="Về chi tiết" onPress={() => navigation.goBack()} fullWidth />
        </View>
      </SafeScreen>
    )
  }

  if (phase === 'submitting') {
    return <SafeScreen><View style={s.center}><Text style={s.muted}>Đang nộp bài...</Text></View></SafeScreen>
  }

  const q = questions[qIndex]
  if (!q) return null
  const progress = ((qIndex + 1) / questions.length) * 100
  const selected = answers[q.id]
  const isLast = qIndex === questions.length - 1

  return (
    <SafeScreen>
      <View style={s.container}>
        <View style={s.headerRow}>
          <Text style={s.qCount}>{qIndex + 1}/{questions.length}</Text>
        </View>
        <ProgressBar progress={progress} height={4} />

        <Card style={s.questionCard}>
          {q.book && q.chapter && <Text style={s.verseBadge}>{q.book.toUpperCase()} {q.chapter}</Text>}
          <Text style={s.questionText}>{q.content}</Text>
        </Card>

        <View style={s.answers}>
          {q.options.map((opt, idx) => {
            const tint = ANSWER_TINTS[idx]
            const isSel = selected === idx
            return (
              <Pressable
                key={idx}
                onPress={() => handleAnswer(idx)}
                style={[s.answerBtn, { borderColor: tint }, isSel && { backgroundColor: `${tint}33` }]}
              >
                <View style={[s.letter, { backgroundColor: tint }]}>
                  <Text style={s.letterText}>{LETTERS[idx]}</Text>
                </View>
                <Text style={s.answerText}>{opt}</Text>
              </Pressable>
            )
          })}
        </View>

        <View style={s.footer}>
          <Pressable
            disabled={qIndex === 0}
            onPress={() => setQIndex(i => Math.max(0, i - 1))}
            style={[s.navBtn, qIndex === 0 && s.navBtnDisabled]}
          >
            <Text style={s.navBtnText}>← Trước</Text>
          </Pressable>
          <Pressable
            disabled={selected === undefined}
            onPress={handleNext}
            style={[s.navBtn, s.navBtnPrimary, selected === undefined && s.navBtnDisabled]}
          >
            <Text style={[s.navBtnText, s.navBtnTextPrimary]}>{isLast ? 'Nộp bài' : 'Tiếp →'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { fontSize: typography.size.sm, color: colors.textMuted },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  qCount: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textSecondary },
  questionCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  verseBadge: { fontSize: typography.size.xs, color: colors.gold, fontWeight: typography.weight.medium, letterSpacing: 1 },
  questionText: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center', lineHeight: 28 },
  answers: { gap: spacing.sm },
  answerBtn: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  letter: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  letterText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  answerText: { flex: 1, fontSize: typography.size.base, color: colors.textPrimary },
  footer: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  navBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainer, alignItems: 'center' },
  navBtnPrimary: { backgroundColor: colors.gold },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  navBtnTextPrimary: { color: colors.onSecondary },
  resultContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.lg },
  resultIcon: { fontSize: 64 },
  resultTitle: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  resultCard: { width: '100%', gap: spacing.md, padding: spacing.lg },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: typography.size.sm, color: colors.textMuted },
  statValue: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.gold },
})
