import { useTranslation } from 'react-i18next'
import React, { useCallback, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { Question } from '../../types/models'
import SafeScreen from '../../components/layout/SafeScreen'
import { useStomp } from '../../hooks/useStomp'
import { colors, typography, spacing, borderRadius } from '../../theme'
import { ANSWER_COLORS } from '@biblequize/shared/constants'

interface PlayerScore {
  userId?: string
  username: string
  score: number
}

const LETTERS = ['A', 'B', 'C', 'D']
const ANSWER_TINTS = [ANSWER_COLORS.A, ANSWER_COLORS.B, ANSWER_COLORS.C, ANSWER_COLORS.D]

/**
 * Minimal SPEED_RACE multiplayer quiz flow:
 *   - Subscribe /topic/room/{id}, listen QUESTION_START, ROUND_END, QUIZ_END
 *   - Tap answer → send /app/room/{id}/answer { questionIndex, answerIndex, reactionTimeMs }
 *   - QUIZ_END → navigate to Results với leaderboard payload
 *
 * Defer S3: countdown timer animation, mode-specific overlays (BR eliminate,
 * TVT team scores, SD match), sound/haptic, combo banner, perfect detection.
 */
export default function MultiplayerQuizScreen() {
  const { t } = useTranslation()
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const roomId: string = route.params?.roomId ?? ''

  const [question, setQuestion] = useState<Question | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const questionStartedAt = useRef<number>(0)

  const handleMessage = useCallback((msg: any) => {
    switch (msg?.type) {
      case 'QUESTION_START': {
        const d = msg.data
        questionStartedAt.current = d.startedAtMs ?? Date.now()
        setQuestion(d.question)
        setQuestionIndex(d.questionIndex)
        setTotalQuestions(d.totalQuestions)
        setSelected(null)
        setCorrectIndex(null)
        break
      }
      case 'ROUND_END': {
        setCorrectIndex(msg.data?.correctIndex ?? null)
        break
      }
      case 'QUIZ_END': {
        const leaderboard: PlayerScore[] = msg.data?.leaderboard ?? []
        navigation.replace('MultiplayerResults', { roomId, leaderboard })
        break
      }
    }
  }, [navigation, roomId])

  const { connected, send } = useStomp({ roomId, onMessage: handleMessage })

  const handleAnswer = (idx: number) => {
    if (selected !== null || correctIndex !== null) return
    setSelected(idx)
    const reactionTimeMs = Date.now() - questionStartedAt.current
    if (!send(`/app/room/${roomId}/answer`, { questionIndex, answerIndex: idx, reactionTimeMs })) {
      setSelected(null)
      Alert.alert('Mất kết nối', 'Đang kết nối lại...')
    }
  }

  if (!question) {
    return (
      <SafeScreen>
        <View style={s.center}>
          <Text style={s.waiting}>
            {connected ? 'Đang chờ câu hỏi...' : 'Đang kết nối...'}
          </Text>
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen>
      <View style={s.container}>
        <Text style={s.questionMeta}>
          Câu {questionIndex + 1} / {totalQuestions} · {question.book}
        </Text>

        <View style={s.questionCard}>
          <Text style={s.questionText}>{question.content}</Text>
        </View>

        <View style={s.answers}>
          {question.options.map((opt, idx) => {
            const isSelected = selected === idx
            const isCorrect = correctIndex === idx
            const isWrong = correctIndex !== null && isSelected && !isCorrect
            const tint = ANSWER_TINTS[idx]

            return (
              <Pressable
                key={idx}
                onPress={() => handleAnswer(idx)}
                disabled={selected !== null}
                style={[
                  s.answerBtn,
                  { borderColor: tint },
                  isCorrect && s.answerCorrect,
                  isWrong && s.answerWrong,
                  isSelected && correctIndex === null && { backgroundColor: `${tint}22` },
                ]}
              >
                <View style={[s.letterBadge, { backgroundColor: tint }]}>
                  <Text style={s.letterText}>{LETTERS[idx]}</Text>
                </View>
                <Text style={s.answerText}>{opt}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waiting: { fontSize: typography.size.base, color: colors.textMuted },
  questionMeta: { fontSize: typography.size.sm, color: colors.textMuted, fontWeight: typography.weight.bold },
  questionCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
  },
  answers: { gap: spacing.md },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
  },
  answerCorrect: { backgroundColor: 'rgba(34, 197, 94, 0.18)', borderColor: colors.success },
  answerWrong: { backgroundColor: 'rgba(239, 68, 68, 0.18)', borderColor: colors.error },
  letterBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  letterText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  answerText: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.textPrimary, flex: 1 },
})
