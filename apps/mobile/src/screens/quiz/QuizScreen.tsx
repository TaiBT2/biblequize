import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, Alert, BackHandler } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import ProgressBar from '../../components/ui/ProgressBar'
import CountdownTimer from '../../components/quiz/CountdownTimer'
import { apiClient } from '../../api/client'
import { calculateScore } from '../../logic/scoring'
import { useHaptic } from '../../hooks/useHaptic'
import { colors, typography, spacing, borderRadius } from '../../theme'

const LETTERS = ['A', 'B', 'C', 'D']

// Per-position colour for the Answer Color Mapping (web parity, QZ-P0-1).
// rgb triplets so we can use rgba() for varying opacity per state.
const POS_RGB = [
  '232,130,106', // A — Coral  (#E8826A)
  '106,184,232', // B — Sky    (#6AB8E8)
  '232,199,106', // C — Gold   (#E8C76A)
  '122,184,122', // D — Sage   (#7AB87A)
] as const

// True/False questions render only 2 answers — per spec they map to A
// (Coral) + D (Sage), skipping Sky + Gold so the contrast is maximal.
function colorPositionFor(idx: number, total: number): number {
  if (total === 2) return idx === 0 ? 0 : 3
  return idx
}

/**
 * Format a verse reference for the badge above the question (QZ-P0-2).
 * Mirrors `apps/web/src/utils/textHelpers.ts#formatVerseRef`. Kept inline
 * here rather than imported to avoid pulling React-DOM utils into the
 * RN bundle.
 */
function formatVerseRef(q: { book: string; chapter?: number; verseStart?: number; verseEnd?: number }): string {
  const book = q.book.toUpperCase()
  if (!q.chapter) return book
  if (!q.verseStart) return `${book} ${q.chapter}`
  if (q.verseEnd && q.verseEnd !== q.verseStart) {
    return `${book} ${q.chapter}:${q.verseStart}-${q.verseEnd}`
  }
  return `${book} ${q.chapter}:${q.verseStart}`
}

export default function QuizScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const queryClient = useQueryClient()
  const { trigger: haptic } = useHaptic()
  const { questions = [], sessionId, mode = 'practice', timePerQuestion = 30, showExplanation = true } = route.params ?? {}
  const isDailyMode = mode === 'daily'

  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [timeLeft, setTimeLeft] = useState(timePerQuestion)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [perQuestionResults, setPerQuestionResults] = useState<(boolean | null)[]>(
    new Array(questions.length).fill(null),
  )
  const [correctCount, setCorrectCount] = useState(0)
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null))
  const [questionScores, setQuestionScores] = useState<number[]>(new Array(questions.length).fill(0))
  // Daily mode: BE strip correctAnswer khỏi GET /api/daily-challenge payload
  // cho đến khi user complete (security). Phải lấy correctAnswer từ POST
  // /api/daily-challenge/answer response. Lưu state để render highlight reveal.
  const [revealedCorrectIdx, setRevealedCorrectIdx] = useState<number | null>(null)
  // Web parity: explanation hiển thị qua pill toggle (collapsed=true) ↔ panel
  // (collapsed=false). Mặc định collapsed=true → user thấy pill nhỏ, tap để
  // xem full. Apps/web/src/pages/DailyChallenge.tsx:544-590.
  const [explanationCollapsed, setExplanationCollapsed] = useState(true)

  const question = questions[qIndex]
  const progress = questions.length > 0 ? ((qIndex + 1) / questions.length) * 100 : 0

  // Back button quit confirmation
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(t('quiz.quitTitle'), t('quiz.quitConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.yes'), style: 'destructive', onPress: () => navigation.goBack() },
      ])
      return true
    })
    return () => handler.remove()
  }, [navigation, t])

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft((t: number) => t - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      handleSelect(-1)
    }
  }, [timeLeft, showResult])

  const handleSelect = useCallback(async (idx: number) => {
    if (showResult) return
    setSelected(idx)
    setShowResult(true)

    // Daily mode: BE strip correctAnswer khỏi GET payload. Phải hỏi /answer
    // endpoint để biết đáp án đúng. Practice/Ranked: question.correctAnswer
    // có sẵn trong payload (controller khác không strip).
    let correctIdx: number | undefined = question?.correctAnswer?.[0]
    let correct = false

    if (isDailyMode) {
      try {
        const res = await apiClient.post('/api/daily-challenge/answer', {
          questionId: question.id,
          answer: idx,
        })
        correct = !!res.data?.isCorrect
        const ca = res.data?.correctAnswer
        if (Array.isArray(ca) && ca.length > 0) correctIdx = ca[0]
        queryClient.invalidateQueries({ queryKey: ['daily-missions'] })
      } catch {
        // Fallback: dùng local check (sai khi BE strip, nhưng tránh stuck).
        correct = idx === (correctIdx ?? -1)
      }
    } else {
      correct = idx === (correctIdx ?? -1)
      try {
        if (sessionId) {
          await apiClient.post(`/api/sessions/${sessionId}/answer`, {
            questionId: question.id,
            answer: idx,
            clientElapsedMs: (timePerQuestion - timeLeft) * 1000,
          })
        }
      } catch { /* non-critical */ }
    }

    setIsCorrect(correct)
    setRevealedCorrectIdx(correctIdx ?? null)

    if (correct) haptic('success')
    else haptic('error')

    let qScore = 0
    if (correct) {
      qScore = calculateScore({
        difficulty: question.difficulty,
        isCorrect: true,
        elapsedMs: (timePerQuestion - timeLeft) * 1000,
        timeLimitMs: timePerQuestion * 1000,
        comboCount: combo,
        tierMultiplier: 1.0, // TODO: fetch real tier multiplier from /api/me
      })
      setScore(s => s + qScore)
      setCombo(c => c + 1)
      setCorrectCount(c => c + 1)
    } else {
      setCombo(0)
    }

    const newAnswers = [...userAnswers]
    newAnswers[qIndex] = idx
    setUserAnswers(newAnswers)
    const newScores = [...questionScores]
    newScores[qIndex] = qScore
    setQuestionScores(newScores)
    setPerQuestionResults(prev => {
      const next = [...prev]
      next[qIndex] = correct
      return next
    })
  }, [showResult, question, combo, timeLeft, qIndex, userAnswers, questionScores, sessionId, timePerQuestion, isDailyMode, queryClient, haptic])

  const nextQuestion = async () => {
    if (qIndex + 1 >= questions.length) {
      // Daily mode: POST /complete + invalidate 8 queries (web parity
      // apps/web/src/pages/DailyChallenge.tsx:382-402).
      if (isDailyMode) {
        try {
          await apiClient.post('/api/daily-challenge/complete', {
            score,
            correctCount,
          })
        } catch { /* non-critical — UI already shows result */ }
        queryClient.invalidateQueries({ queryKey: ['me'] })
        queryClient.invalidateQueries({ queryKey: ['daily-missions'] })
        queryClient.invalidateQueries({ queryKey: ['daily-challenge'] })
        queryClient.invalidateQueries({ queryKey: ['daily-challenge-result'] })
        queryClient.invalidateQueries({ queryKey: ['ranked-status'] })
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
        queryClient.invalidateQueries({ queryKey: ['daily-leaderboard'] })
      }
      const stats = {
        totalScore: score,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        accuracy: questions.length > 0 ? (correctCount / questions.length) * 100 : 0,
        questions,
        userAnswers,
        questionScores,
        mode,
      }
      navigation.replace(isDailyMode ? 'DailyResults' : 'QuizResults', { stats })
    } else {
      setQIndex(i => i + 1)
      setSelected(null)
      setShowResult(false)
      setIsCorrect(null)
      setRevealedCorrectIdx(null)
      setExplanationCollapsed(true)
      setTimeLeft(timePerQuestion)
    }
  }

  if (!question) return null

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => Alert.alert(t('quiz.quitTitle'), t('quiz.quitConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.yes'), style: 'destructive', onPress: () => navigation.goBack() },
          ])} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.qCount}>{qIndex + 1}/{questions.length}</Text>
          </View>
          <View style={styles.comboBadge}>
            <Text style={styles.comboText}>🔥 {combo}</Text>
          </View>
        </View>

        {/* Multi-segment progress (web parity): per-question state visualization.
            Past correct = green, past wrong = red, current = gold, upcoming = muted. */}
        <View style={styles.segmentsRow}>
          {questions.map((_: any, i: number) => {
            let bg: string = 'rgba(255,255,255,0.08)'
            if (i < qIndex) {
              bg = perQuestionResults[i] ? colors.success : colors.error
            } else if (i === qIndex) {
              bg = colors.gold
            }
            return <View key={i} style={[styles.segment, { backgroundColor: bg }]} />
          })}
        </View>

        <View style={styles.timerRow}>
          <CountdownTimer timeLeft={timeLeft} timeLimit={timePerQuestion} size={64} />
        </View>

        {/* Question card với left gold accent bar (signature Sacred Modernist). */}
        <View style={styles.questionCard}>
          <View style={styles.questionAccentBar} />
          <View style={styles.verseBadge}>
            <Text style={styles.verseBadgeText}>📖 {formatVerseRef(question)}</Text>
          </View>
          <Text style={styles.questionText}>{question.content}</Text>
        </View>

        {/* Answers — per-position colour mapping (Coral/Sky/Gold/Sage), QZ-P0-1.
            Reveal states (correct=green, wrong=red) override the position colour. */}
        <View style={styles.answers}>
          {question.options?.map((opt: string, idx: number) => {
            const isSel = selected === idx
            // revealedCorrectIdx (state) thay vì question.correctAnswer trực
            // tiếp vì BE strip field khi alreadyCompleted=false (daily mode).
            const correctIdx = revealedCorrectIdx ?? question.correctAnswer?.[0]
            const isRight = showResult && idx === correctIdx
            const isWrong = showResult && isSel && idx !== correctIdx
            // Web parity: khi đã reveal, các đáp án không đúng/không chọn fade
            // gray để correct answer nổi bật (eliminate ambiguity giữa
            // default position tint vs correct reveal).
            const isFaded = showResult && !isRight && !isSel
            const total = question.options?.length ?? 0
            const rgb = POS_RGB[colorPositionFor(idx, total)]

            const useReveal = isRight || isWrong
            const positionStyle = useReveal || isFaded
              ? null
              : isSel
                ? { borderColor: `rgb(${rgb})`, backgroundColor: `rgba(${rgb},0.20)` }
                : { borderColor: `rgba(${rgb},0.30)`, backgroundColor: `rgba(${rgb},0.10)` }

            return (
              <Pressable
                key={idx}
                onPress={() => handleSelect(idx)}
                disabled={showResult}
                style={[
                  styles.answerBtn,
                  positionStyle,
                  isRight && styles.ansCorrect,
                  isWrong && styles.ansWrong,
                  isFaded && styles.ansFaded,
                ]}
              >
                <View
                  style={[
                    styles.letter,
                    !useReveal && !isFaded && { backgroundColor: `rgba(${rgb},0.30)` },
                    isFaded && styles.letterFaded,
                    isRight && styles.letterCorrect,
                    isWrong && styles.letterWrong,
                  ]}
                >
                  <Text
                    style={[
                      styles.letterText,
                      !useReveal && !isFaded && { color: `rgb(${rgb})` },
                      isFaded && styles.letterTextFaded,
                      (isRight || isWrong) && { color: '#fff' },
                    ]}
                  >
                    {LETTERS[idx]}
                  </Text>
                </View>
                <Text style={[
                  styles.ansText,
                  (isRight || isWrong) && styles.ansTextReveal,
                  isFaded && styles.ansTextFaded,
                ]} numberOfLines={2}>
                  {opt}
                </Text>
                {isRight && (
                  <Text style={styles.ansBadgeCorrect}>✓ ĐÚNG{isSel ? ' · BẠN CHỌN' : ''}</Text>
                )}
                {isWrong && (
                  <Text style={styles.ansBadgeWrong}>✗ BẠN CHỌN</Text>
                )}
              </Pressable>
            )
          })}
        </View>

        {/* Floating feedback bar (web parity) — fixed bottom với glass-panel
            effect, large rounded icon + bonus points hint + gold gradient CTA. */}
        {showResult && (() => {
          const correctIdx = revealedCorrectIdx ?? question.correctAnswer?.[0]
          const correctOptionText = correctIdx != null ? question.options?.[correctIdx] : undefined
          const hasExp = showExplanation && question.explanation
          const showExplanationUi = isCorrect !== null && (!isCorrect || hasExp)
          return (
            <>
              {showExplanationUi && (
                explanationCollapsed ? (
                  <Pressable
                    onPress={() => setExplanationCollapsed(false)}
                    style={[
                      styles.expPill,
                      isCorrect ? styles.expPillCorrect : styles.expPillWrong,
                    ]}
                  >
                    <Text style={styles.expPillIcon}>💡</Text>
                    <Text style={[styles.expPillText, isCorrect ? styles.expPillTextCorrect : styles.expPillTextWrong]}>
                      Xem giải thích
                    </Text>
                  </Pressable>
                ) : (
                  <View style={[styles.expPanel, isCorrect ? styles.expPanelCorrect : styles.expPanelWrong]}>
                    <View style={styles.expHeader}>
                      {!isCorrect && correctOptionText && (
                        <View style={styles.expCorrectAns}>
                          <Text style={styles.expCorrectIcon}>✓</Text>
                          <Text style={styles.expCorrectText} numberOfLines={2}>
                            Đáp án đúng: {correctOptionText}
                          </Text>
                        </View>
                      )}
                      <Pressable onPress={() => setExplanationCollapsed(true)} style={styles.expClose}>
                        <Text style={styles.expCloseText}>✕</Text>
                      </Pressable>
                    </View>
                    {hasExp && (
                      <View style={styles.expBody}>
                        <Text style={styles.expBodyIcon}>💡</Text>
                        <Text style={styles.expBodyText}>{question.explanation}</Text>
                      </View>
                    )}
                  </View>
                )
              )}
              <View style={[styles.resultBar, isCorrect ? styles.resultCorrect : styles.resultWrong]}>
                <View style={styles.resultTopRow}>
                  <View style={[styles.resultIconCircle, isCorrect ? styles.resultIconCorrect : styles.resultIconWrong]}>
                    <Text style={styles.resultIconText}>{isCorrect ? '✓' : '✗'}</Text>
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{isCorrect ? 'Chính xác!' : 'Sai rồi'}</Text>
                    <Text style={[styles.resultSubtitle, isCorrect ? styles.resultSubCorrect : styles.resultSubWrong]}>
                      {isCorrect ? (isDailyMode ? '+20 điểm thưởng' : `+${questionScores[qIndex] ?? 0} điểm`) : 'Không cộng điểm'}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={nextQuestion} style={styles.nextBtn}>
                  <Text style={styles.nextText}>{qIndex + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}</Text>
                </Pressable>
              </View>
            </>
          )
        })()}
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 18, color: colors.textMuted },
  headerCenter: { alignItems: 'center' },
  qCount: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textSecondary },
  comboBadge: { backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  comboText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold },
  segmentsRow: { flexDirection: 'row', gap: 6, marginTop: spacing.xs },
  segment: { flex: 1, height: 5, borderRadius: 2.5 },
  timerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  questionCard: {
    position: 'relative',
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius['2xl'],
    padding: spacing.xl, paddingLeft: spacing.xl + 4,
    marginBottom: spacing.xl, minHeight: 100, justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,168,50,0.10)',
  },
  questionAccentBar: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 4,
    backgroundColor: colors.gold,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  verseBadge: {
    backgroundColor: 'rgba(232,168,50,0.10)',
    borderColor: 'rgba(232,168,50,0.20)',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  verseBadgeText: {
    color: colors.gold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    letterSpacing: 1,
  },
  questionText: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center', lineHeight: 30 },
  answers: { gap: spacing.md, flex: 1 },
  answerBtn: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl,
    borderWidth: 2, borderColor: 'transparent',
  },
  // ansSelected dropped — per-position selected style now inline (uses
  // POS_RGB so the gold accent matches the position colour).
  // Web parity: rgba(74,222,128,0.18) bg + #4ade80 border + green glow shadow.
  ansCorrect: {
    borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.18)',
    shadowColor: '#4ade80', shadowOpacity: 0.35, shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  // Web parity: rgba(239,68,68,0.15) bg + #ef4444 border.
  ansWrong: { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.15)' },
  // Web parity disabled state: transparent everything + opacity 0.25
  // (mockup spec, AnswerButton.tsx case 'disabled').
  ansFaded: { borderColor: 'transparent', backgroundColor: 'transparent', opacity: 0.25 },
  letter: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  letterCorrect: { backgroundColor: '#4ade80' },
  letterWrong: { backgroundColor: '#ef4444' },
  letterFaded: { backgroundColor: 'rgba(255,255,255,0.06)' },
  letterText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.gold },
  letterTextFaded: { color: colors.textMuted },
  ansText: { flex: 1, fontSize: typography.size.base, color: colors.textPrimary, fontWeight: typography.weight.medium },
  ansTextReveal: { color: '#fff', fontWeight: typography.weight.semibold },
  ansTextFaded: { color: colors.textMuted },
  ansBadgeCorrect: {
    fontSize: 10, fontWeight: typography.weight.bold, color: '#4ade80',
    marginLeft: spacing.sm, letterSpacing: 0.3,
  },
  ansBadgeWrong: {
    fontSize: 10, fontWeight: typography.weight.bold, color: '#f87171',
    marginLeft: spacing.sm, letterSpacing: 0.3,
  },
  resultBar: {
    padding: spacing.md, gap: spacing.md,
    borderRadius: borderRadius['2xl'], marginTop: spacing.md,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  resultTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resultCorrect: { borderColor: 'rgba(34,197,94,0.4)' },
  resultWrong: { borderColor: 'rgba(239,68,68,0.4)' },
  resultIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  resultIconCorrect: { backgroundColor: 'rgba(34,197,94,0.20)' },
  resultIconWrong: { backgroundColor: 'rgba(239,68,68,0.20)' },
  resultIconText: { fontSize: 22, fontWeight: typography.weight.bold, color: colors.textPrimary },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary, lineHeight: 18 },
  resultSubtitle: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, marginTop: 2 },
  resultSubCorrect: { color: colors.success },
  resultSubWrong: { color: colors.error },
  expPill: {
    alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(50,52,64,0.85)',
    borderWidth: 1,
    marginTop: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  expPillCorrect: { borderColor: 'rgba(232,168,50,0.30)' },
  expPillWrong: { borderColor: 'rgba(239,68,68,0.30)' },
  expPillIcon: { fontSize: 13 },
  expPillText: { fontSize: 12, fontWeight: typography.weight.bold, letterSpacing: 0.3 },
  expPillTextCorrect: { color: colors.gold },
  expPillTextWrong: { color: '#f87171' },
  expPanel: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(50,52,64,0.95)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  expPanelCorrect: { borderColor: 'rgba(74,222,128,0.20)' },
  expPanelWrong: { borderColor: 'rgba(239,68,68,0.20)' },
  expHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  expCorrectAns: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  expCorrectIcon: { fontSize: 14, color: '#4ade80', fontWeight: typography.weight.bold },
  expCorrectText: { flex: 1, fontSize: 13, fontWeight: typography.weight.bold, color: '#4ade80' },
  expClose: { padding: 4 },
  expCloseText: { fontSize: 14, color: colors.textMuted },
  expBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  expBodyIcon: { fontSize: 13, color: 'rgba(232,168,50,0.7)', marginTop: 1 },
  expBodyText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  nextBtn: {
    backgroundColor: colors.gold, borderRadius: borderRadius.xl,
    paddingVertical: spacing.md, alignItems: 'center',
    shadowColor: colors.gold, shadowOpacity: 0.35, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  nextText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.onSecondary, letterSpacing: 0.3 },
})
