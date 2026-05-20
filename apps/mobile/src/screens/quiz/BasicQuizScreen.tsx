import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import { apiClient } from '../../api/client'
import { useHaptic } from '../../hooks/useHaptic'
import { useSound } from '../../hooks/useSound'
import { colors, typography, spacing, borderRadius } from '../../theme'

const LETTERS = ['A', 'B', 'C', 'D']

interface BasicQuizQuestion {
  id: string
  content: string
  options: string[]
}

interface Review {
  questionId: string
  content: string
  options: string[]
  selectedOptions: number[]
  correctOptions: number[]
  explanation: string
  correct: boolean
}

interface BasicQuizResult {
  passed: boolean
  correctCount: number
  totalQuestions: number
  threshold: number
  attemptCount: number
  cooldownSeconds: number
  reviews: Review[]
}

function formatMmSs(s: number): string {
  const v = Math.max(0, s | 0)
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`
}

/**
 * Mobile port web apps/web/src/pages/BasicQuiz.tsx — catechism quiz 10 câu
 * gating cho Ranked. Simplified version: skip detailed ReviewList (defer),
 * giữ play + result (pass/fail) phases.
 */
export default function BasicQuizScreen() {
  const { t, i18n } = useTranslation()
  const navigation = useNavigation<any>()
  const qc = useQueryClient()
  const { trigger: haptic } = useHaptic()
  const { play: playSound } = useSound()
  const language = i18n.language

  const { data: questions, isLoading, isError, refetch } = useQuery<BasicQuizQuestion[]>({
    queryKey: ['basic-quiz-questions', language],
    queryFn: () => apiClient.get(`/api/basic-quiz/questions?language=${language}`).then(r => r.data),
    staleTime: 0,
    gcTime: 0,
  })

  const [phase, setPhase] = useState<'playing' | 'submitting' | 'result'>('playing')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Array<number | null>>([])
  const [result, setResult] = useState<BasicQuizResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [cooldownLeft, setCooldownLeft] = useState(0)

  useEffect(() => {
    if (questions && questions.length > 0 && answers.length === 0) {
      setAnswers(new Array(questions.length).fill(null))
    }
  }, [questions, answers.length])

  useEffect(() => {
    if (cooldownLeft <= 0) return
    const id = setInterval(() => setCooldownLeft(p => Math.max(0, p - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldownLeft])

  const total = questions?.length ?? 0
  const current = questions?.[currentIndex]
  const allAnswered = useMemo(
    () => answers.length === total && total > 0 && answers.every(a => a !== null),
    [answers, total],
  )

  async function submit() {
    if (!questions || !allAnswered) return
    setPhase('submitting')
    setSubmitError(null)
    try {
      const payload = {
        language,
        answers: questions.map((q, i) => ({
          questionId: q.id,
          selectedOptions: answers[i] != null ? [answers[i] as number] : [],
        })),
      }
      const res = await apiClient.post('/api/basic-quiz/submit', payload)
      const r = res.data as BasicQuizResult
      setResult(r)
      setCooldownLeft(r.cooldownSeconds)
      if (r.passed) {
        playSound('correct')
        haptic('success')
      } else {
        playSound('wrong')
        haptic('error')
      }
      qc.invalidateQueries({ queryKey: ['basic-quiz-status'] })
      setPhase('result')
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? err?.message ?? 'submit failed')
      setPhase('playing')
    }
  }

  if (isLoading || (!questions && !isError)) {
    return (
      <SafeScreen>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </SafeScreen>
    )
  }

  if (isError || !questions || questions.length === 0) {
    return (
      <SafeScreen>
        <View style={s.centered}>
          <Text style={s.errorIcon}>⚠</Text>
          <Text style={s.errorTitle}>{t('daily.basicQuiz.errorTitle')}</Text>
          <Text style={s.errorMsg}>{t('daily.basicQuiz.errorMessage')}</Text>
          <View style={s.actionsRow}>
            <Pressable onPress={() => refetch()} style={[s.btn, s.btnPrimary]}>
              <Text style={s.btnPrimaryText}>{t('daily.basicQuiz.retryLoad')}</Text>
            </Pressable>
            <Pressable onPress={() => navigation.popToTop()} style={[s.btn, s.btnSecondary]}>
              <Text style={s.btnSecondaryText}>{t('daily.basicQuiz.backHome')}</Text>
            </Pressable>
          </View>
        </View>
      </SafeScreen>
    )
  }

  if (phase === 'result' && result) {
    return (
      <SafeScreen>
        <ScrollView contentContainerStyle={s.resultContent}>
          <Text style={s.resultEmoji}>{result.passed ? '🎉' : '😅'}</Text>
          <Text style={s.resultTitle}>
            {result.passed
              ? t('daily.basicQuiz.passTitle')
              : t('daily.basicQuiz.failTitle', { correct: result.correctCount, total: result.totalQuestions })}
          </Text>
          <Text style={s.resultSubtitle}>
            {result.passed
              ? t('daily.basicQuiz.passSubtitle', { correct: result.correctCount, total: result.totalQuestions })
              : t('daily.basicQuiz.failSubtitle', { threshold: result.threshold })}
          </Text>
          {result.passed && (
            <View style={s.unlockBadge}>
              <Text style={s.unlockBadgeIcon}>✓</Text>
              <Text style={s.unlockBadgeText}>{t('daily.basicQuiz.passUnlock')}</Text>
            </View>
          )}
          {!result.passed && cooldownLeft > 0 && (
            <View style={s.cooldownBox}>
              <Text style={s.cooldownIcon}>⏱</Text>
              <Text style={s.cooldownText}>{t('daily.basicQuiz.cooldownMessage', { time: formatMmSs(cooldownLeft) })}</Text>
            </View>
          )}
          <View style={s.actionsCol}>
            {result.passed && (
              <Pressable onPress={() => navigation.replace('Ranked')} style={[s.btn, s.btnPrimary]}>
                <Text style={s.btnPrimaryText}>▶ {t('daily.basicQuiz.passCta')}</Text>
              </Pressable>
            )}
            <Pressable onPress={() => navigation.popToTop()} style={[s.btn, s.btnSecondary]}>
              <Text style={s.btnSecondaryText}>{t('daily.basicQuiz.backHome')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeScreen>
    )
  }

  // Playing phase
  return (
    <SafeScreen>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>📖 {t('daily.basicQuiz.title')}</Text>
          <Text style={s.headerCounter}>{t('daily.basicQuiz.counter', { current: currentIndex + 1, total })}</Text>
        </View>

        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${((currentIndex + 1) / total) * 100}%` }]} />
        </View>

        {current && (
          <ScrollView contentContainerStyle={s.scrollContent}>
            <View style={s.questionCard}>
              <Text style={s.questionText}>{current.content}</Text>
            </View>

            <View style={s.options}>
              {current.options.map((opt, idx) => {
                const isSel = answers[currentIndex] === idx
                return (
                  <Pressable
                    key={idx}
                    onPress={() => setAnswers(prev => { const next = [...prev]; next[currentIndex] = idx; return next })}
                    style={[s.option, isSel && s.optionSelected]}
                  >
                    <View style={[s.optionLetter, isSel && s.optionLetterSelected]}>
                      <Text style={[s.optionLetterText, isSel && s.optionLetterTextSelected]}>{LETTERS[idx]}</Text>
                    </View>
                    <Text style={[s.optionText, isSel && s.optionTextSelected]}>{opt}</Text>
                  </Pressable>
                )
              })}
            </View>

            {submitError && <Text style={s.submitError}>{submitError}</Text>}
          </ScrollView>
        )}

        <View style={s.footer}>
          <Pressable
            onPress={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            style={[s.btn, s.btnSecondary, currentIndex === 0 && s.btnDisabled]}
          >
            <Text style={s.btnSecondaryText}>{t('daily.basicQuiz.prev')}</Text>
          </Pressable>
          {currentIndex < total - 1 ? (
            <Pressable
              onPress={() => setCurrentIndex(i => Math.min(i + 1, total - 1))}
              disabled={answers[currentIndex] == null}
              style={[s.btn, s.btnPrimary, answers[currentIndex] == null && s.btnDisabled]}
            >
              <Text style={s.btnPrimaryText}>{t('daily.basicQuiz.next')}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={submit}
              disabled={!allAnswered || phase === 'submitting'}
              style={[s.btn, s.btnPrimary, (!allAnswered || phase === 'submitting') && s.btnDisabled]}
            >
              <Text style={s.btnPrimaryText}>
                {phase === 'submitting' ? t('daily.basicQuiz.submitting') : t('daily.basicQuiz.submit')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  errorIcon: { fontSize: 48 },
  errorTitle: { fontSize: 18, fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center' },
  errorMsg: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: typography.weight.bold, color: colors.textPrimary },
  headerCounter: { fontSize: 13, fontWeight: typography.weight.bold, color: colors.textSecondary },

  progressBar: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: spacing.lg },
  progressFill: { height: '100%', backgroundColor: colors.gold },

  scrollContent: { paddingBottom: spacing.lg, gap: spacing.lg },

  questionCard: {
    backgroundColor: 'rgba(50,52,64,0.4)',
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.10)',
  },
  questionText: { fontSize: 17, fontWeight: typography.weight.bold, color: colors.textPrimary, lineHeight: 25 },

  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 2, borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(232,168,50,0.10)',
    shadowColor: colors.gold, shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  optionLetter: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHighest,
  },
  optionLetterSelected: { backgroundColor: colors.gold },
  optionLetterText: { fontSize: 15, fontWeight: typography.weight.black, color: colors.gold },
  optionLetterTextSelected: { color: '#1a1208' },
  optionText: { flex: 1, fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  optionTextSelected: { color: colors.gold, fontWeight: typography.weight.semibold },

  submitError: { fontSize: 12, color: colors.error, padding: spacing.sm, textAlign: 'center' },

  footer: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  actionsCol: { width: '100%', gap: spacing.sm, marginTop: spacing.lg },
  btn: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.xl, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.gold, shadowColor: colors.gold, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  btnPrimaryText: { fontSize: 14, fontWeight: typography.weight.black, color: '#1a1208' },
  btnSecondary: { backgroundColor: colors.surfaceContainerHighest },
  btnSecondaryText: { fontSize: 14, fontWeight: typography.weight.bold, color: colors.textPrimary },
  btnDisabled: { opacity: 0.4 },

  resultContent: { padding: spacing.xl, alignItems: 'center', gap: spacing.md, paddingTop: spacing['2xl'] },
  resultEmoji: { fontSize: 72 },
  resultTitle: { fontSize: 22, fontWeight: typography.weight.black, color: colors.textPrimary, textAlign: 'center', letterSpacing: -0.3 },
  resultSubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  unlockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(232,168,50,0.12)',
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.4)',
    marginTop: spacing.sm,
  },
  unlockBadgeIcon: { fontSize: 16, color: colors.gold, fontWeight: typography.weight.bold },
  unlockBadgeText: { fontSize: 13, fontWeight: typography.weight.bold, color: colors.gold },
  cooldownBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(50,52,64,0.6)',
    marginTop: spacing.sm,
  },
  cooldownIcon: { fontSize: 16 },
  cooldownText: { fontSize: 13, fontWeight: typography.weight.semibold, color: colors.textSecondary },
})
