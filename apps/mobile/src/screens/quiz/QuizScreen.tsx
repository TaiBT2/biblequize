import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  BackHandler,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import * as Haptics from 'expo-haptics'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { CircularTimer } from '../../components/CircularTimer'
import { ProgressBar } from '../../components/ProgressBar'
import { EnergyBar } from '../../components/EnergyBar'
import type { QuizStackParamList } from '../../navigation/types'

// === Types ===

interface Question {
  id: string
  book?: string
  bookName?: string
  chapter?: number
  difficulty: string
  content?: string
  questionText?: string
  options: string[]
  correctAnswer: number[]
  explanation?: string
}

// === Scoring ===

const BASE_SCORES: Record<string, number> = { easy: 10, medium: 20, hard: 30, EASY: 10, MEDIUM: 20, HARD: 30 }
const DIFF_MULT: Record<string, number> = { easy: 1, medium: 1.2, hard: 1.5, EASY: 1, MEDIUM: 1.2, HARD: 1.5 }

function calcScore(difficulty: string, timeLeft: number): number {
  const base = BASE_SCORES[difficulty] ?? 10
  const mult = DIFF_MULT[difficulty] ?? 1
  const timeBonus = Math.floor(timeLeft / 2)
  const perfectBonus = timeLeft >= 25 ? 5 : 0
  return Math.floor((base + timeBonus + perfectBonus) * mult)
}

// === Answer letters ===

const LETTERS = ['A', 'B', 'C', 'D']

// === Component ===

export const QuizScreen = () => {
  const navigation = useNavigation<any>()
  const route = useRoute<RouteProp<QuizStackParamList, 'Quiz'>>()
  const { sessionId, mode } = route.params
  const isRanked = mode === 'ranked'
  const isDaily = mode === 'daily'
  const isMultiplayer = mode === 'multiplayer'

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [lives, setLives] = useState(5)
  const [correctCount, setCorrectCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [lastScore, setLastScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        let qs: Question[] = []
        if (isRanked) {
          // Ranked: try ranked endpoint first, fallback to standard
          try {
            const res = await api.get(`/api/ranked/sessions/${sessionId}/questions`)
            qs = res.data?.questions ?? res.data ?? []
          } catch { /* fallback below */ }
        }
        if (qs.length === 0) {
          // Standard/daily/practice: session endpoint
          const res = await api.get(`/api/sessions/${sessionId}`)
          qs = res.data?.questions ?? res.data?.sessionQuestions ?? []
        }
        if (qs.length === 0) {
          throw new Error('No questions')
        }
        setQuestions(qs)
      } catch {
        Alert.alert('Lỗi', 'Không tải được câu hỏi')
        navigation.goBack()
      } finally {
        setIsLoading(false)
      }
    }
    loadQuestions()
  }, [sessionId, navigation])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !showResult && !isCompleted && !isLoading) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
      return () => clearTimeout(timer)
    }
    if (timeLeft === 0 && !showResult && !isCompleted && !isLoading) {
      handleAnswerSelect(-1) // Auto-submit timeout
    }
  }, [timeLeft, showResult, isCompleted, isLoading])

  // Block back gesture
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit()
      return true
    })
    return () => handler.remove()
  }, [])

  const handleExit = () => {
    Alert.alert(
      'Thoát?',
      'Tiến trình hiện tại sẽ không được lưu.',
      [
        { text: 'Tiếp tục', style: 'cancel' },
        {
          text: 'Thoát',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    )
  }

  const handleAnswerSelect = useCallback(
    async (answerIndex: number) => {
      if (showResult || isCompleted) return

      const question = questions[currentIndex]
      if (!question) return

      setSelectedAnswer(answerIndex)

      let correct = false
      let earnedScore = 0

      try {
        if (isRanked) {
          const res = await api.post(
            `/api/ranked/sessions/${sessionId}/answer`,
            {
              questionId: question.id,
              answer: answerIndex,
              clientElapsedMs: (30 - timeLeft) * 1000,
            }
          )
          correct = res.data?.correct ?? (question.correctAnswer?.[0] === answerIndex)
          if (correct) earnedScore = calcScore(question.difficulty, timeLeft)
        } else if (sessionId) {
          const res = await api.post(`/api/sessions/${sessionId}/answer`, {
            questionId: question.id,
            answer: answerIndex,
            clientElapsedMs: (30 - timeLeft) * 1000,
          })
          correct = res.data?.isCorrect ?? res.data?.correct ?? false
          if (correct) earnedScore = calcScore(question.difficulty, timeLeft)
        } else {
          correct = question.correctAnswer?.[0] === answerIndex
          if (correct) earnedScore = calcScore(question.difficulty, timeLeft)
        }
      } catch {
        // Fallback to local check
        correct = question.correctAnswer?.[0] === answerIndex
        if (correct) earnedScore = calcScore(question.difficulty, timeLeft)
      }

      // Haptic feedback
      if (correct) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      }

      setIsCorrect(correct)
      setLastScore(earnedScore)

      if (correct) {
        setScore((s) => s + earnedScore)
        setCombo((c) => c + 1)
        setCorrectCount((c) => c + 1)
      } else {
        setCombo(0)
        setLives((l) => Math.max(0, l - 1))
      }

      setShowResult(true)
    },
    [showResult, isCompleted, questions, currentIndex, sessionId, isRanked, timeLeft]
  )

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setIsCompleted(true)
      navigation.replace('QuizResults', { sessionId })
      return
    }

    setCurrentIndex((i) => i + 1)
    setSelectedAnswer(null)
    setShowResult(false)
    setIsCorrect(null)
    setTimeLeft(30)
    setLastScore(0)
  }

  // Loading
  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingCenter}>
          <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const question = questions[currentIndex]
  const questionText = question?.content ?? question?.questionText ?? ''
  const bookName = question?.book ?? question?.bookName ?? ''
  const isLastQuestion = currentIndex + 1 >= questions.length

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.questionCount}>
          Câu hỏi {currentIndex + 1}/{questions.length}
        </Text>

        <View style={styles.scoreTag}>
          <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.gold} />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      {/* Progress */}
      <ProgressBar
        progress={(currentIndex + 1) / questions.length}
        height={3}
      />

      <ScrollView
        contentContainerStyle={styles.quizContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Combo */}
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="star-four-points"
              size={18}
              color={combo > 0 ? colors.gold : colors.text.muted}
            />
            <Text style={[styles.statText, combo > 0 && styles.statGold]}>
              x{combo}
            </Text>
          </View>

          {/* Timer */}
          <CircularTimer timeLeft={timeLeft} totalTime={30} size={64} />

          {/* Lives */}
          <EnergyBar lives={lives} barHeight={18} />
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          {bookName ? (
            <Text style={styles.bookRef}>
              {bookName} {question?.chapter ?? ''}
            </Text>
          ) : null}
          <Text style={styles.questionText}>{questionText}</Text>
        </View>

        {/* Answers */}
        <View style={styles.answersGrid}>
          {question?.options?.map((option, i) => {
            const isCorrectAnswer = question.correctAnswer?.[0] === i
            const isSelected = selectedAnswer === i

            const dynamicBtnStyle = showResult
              ? isCorrectAnswer
                ? { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: '#22c55e' }
                : isSelected
                  ? { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' }
                  : { opacity: 0.5 as const }
              : isSelected
                ? { backgroundColor: `${colors.gold}15`, borderColor: colors.gold }
                : undefined

            const dynamicLetterStyle = showResult
              ? isCorrectAnswer
                ? { backgroundColor: '#22c55e' }
                : isSelected
                  ? { backgroundColor: '#ef4444' }
                  : undefined
              : isSelected
                ? { backgroundColor: colors.gold }
                : undefined

            const dynamicTextColor = showResult
              ? isCorrectAnswer
                ? '#22c55e'
                : isSelected
                  ? '#ef4444'
                  : colors.text.primary
              : colors.text.primary

            return (
              <TouchableOpacity
                key={i}
                style={[styles.answerButton, styles.answerDefault, dynamicBtnStyle]}
                onPress={() => handleAnswerSelect(i)}
                disabled={showResult}
                activeOpacity={0.7}
              >
                <View style={[styles.letterBadge, styles.letterDefault, dynamicLetterStyle]}>
                  <Text style={styles.letterText}>{LETTERS[i]}</Text>
                </View>
                <Text style={[styles.answerText, { color: dynamicTextColor }]} numberOfLines={3}>
                  {option}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* Result Modal */}
      {showResult && (
        <View style={styles.resultModal}>
          <View style={styles.resultContent}>
            <View
              style={[
                styles.resultIcon,
                isCorrect ? styles.resultIconCorrect : styles.resultIconWrong,
              ]}
            >
              <MaterialCommunityIcons
                name={isCorrect ? 'check' : 'close'}
                size={28}
                color="#fff"
              />
            </View>
            <View style={styles.resultTextBlock}>
              <Text style={styles.resultTitle}>
                {isCorrect ? 'Chính xác!' : 'Sai rồi!'}
              </Text>
              <Text style={styles.resultSubtitle}>
                {isCorrect ? `+${lastScore} Điểm` : 'Không được điểm'}
              </Text>
            </View>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {isLastQuestion ? 'XEM KẾT QUẢ' : 'CÂU TIẾP THEO'}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={colors.bg.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

// === Styles ===

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.text.secondary, fontSize: 16 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeBtn: { padding: spacing.xs },
  questionCount: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  scoreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  scoreText: { fontSize: 14, fontWeight: '700', color: colors.gold },

  // Quiz content
  quizContent: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 16, fontWeight: '700', color: colors.text.muted },
  statGold: { color: colors.gold },

  // Question
  questionCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing['2xl'],
    marginBottom: spacing['2xl'],
    alignItems: 'center',
  },
  bookRef: {
    fontSize: 12,
    color: colors.gold,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 28,
  },

  // Answers
  answersGrid: { gap: spacing.md },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  answerDefault: {
    backgroundColor: colors.bg.surfaceContainer,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  letterBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterDefault: { backgroundColor: colors.bg.surfaceContainerHighest },
  letterText: { fontSize: 14, fontWeight: '700', color: colors.text.primary },

  answerText: { flex: 1, fontSize: 15, lineHeight: 22 },

  // Result Modal
  resultModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.surfaceContainerHigh,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingBottom: spacing['4xl'],
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconCorrect: { backgroundColor: '#22c55e' },
  resultIconWrong: { backgroundColor: '#ef4444' },
  resultTextBlock: { flex: 1 },
  resultTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  resultSubtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },

  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  nextButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bg.primary,
  },
})
