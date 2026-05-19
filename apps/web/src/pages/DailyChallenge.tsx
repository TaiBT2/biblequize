import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import ShareCard from '../components/ShareCard'
import PageMeta from '../components/PageMeta'
import { getQuizLanguage } from '../utils/quizLanguage'
import { AnswerButton, type AnswerState } from '../components/quiz/AnswerButton'
import { wrapProperNouns, formatVerseRef, getQuestionLengthClass } from '../utils/textHelpers'
import { useAuthStore } from '../store/authStore'
import { PageHeader } from './daily/PageHeader'
import { HeroCard } from './daily/HeroCard'
import { DailyLeaderboard, type DailyLbEntry } from './daily/DailyLeaderboard'
import { StreakCard } from './daily/StreakCard'
import { HeatmapCard, type HeatmapDay } from './daily/HeatmapCard'

// ─── Types ──────────────────────────────────────────────────────────────────
interface Question {
  id: string
  book: string
  chapter: number
  content: string
  options: string[]
  correctAnswer: number[]
  explanation: string
}

interface DailyChallengeData {
  questions: Question[]
  alreadyCompleted: boolean
  sessionId: string
  date: string
  title?: string
  description?: string
  questionCount?: number
  timeLimit?: number
}

interface DailyResult {
  completed: boolean
  score: number
  correctCount: number
  totalQuestions: number
  xpEarned?: number
  xpMinCorrect?: number
  sessionId?: string
  betterThanPercent?: number
  completedAt?: string | number
  timeSeconds?: number
  rankGlobal?: number
  rankGroup?: number
}

interface YesterdaySummary {
  completed: boolean
  correctCount?: number
  totalQuestions?: number
  timeSeconds?: number
  score?: number
}

interface ActiveSeason {
  id: string
  name: string
  isActive: boolean
}

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }
const LETTERS = ['A', 'B', 'C', 'D']

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatCountdown(diff: number): string {
  if (diff <= 0) return '00:00:00'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getTodayLabel(t: (key: string) => string): string {
  const d = new Date()
  const dayKeys = [
    'daily.dayNameSunday', 'daily.dayNameMonday', 'daily.dayNameTuesday',
    'daily.dayNameWednesday', 'daily.dayNameThursday', 'daily.dayNameFriday', 'daily.dayNameSaturday',
  ]
  return `${t(dayKeys[d.getDay()])}, ${d.toLocaleDateString('vi-VN')}`
}

function getLast7Days(t: (key: string) => string, completedDates: Set<string>) {
  const DAY_LABELS = [
    t('daily.daySun'), t('daily.dayMon'), t('daily.dayTue'),
    t('daily.dayWed'), t('daily.dayThu'), t('daily.dayFri'), t('daily.daySat'),
  ]
  const days: { label: string; date: string; isToday: boolean; completed: boolean }[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    days.push({
      label: DAY_LABELS[d.getDay()],
      date: iso,
      isToday: i === 0,
      completed: completedDates.has(iso),
    })
  }
  return days
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="max-w-[1280px] mx-auto p-2 space-y-6 animate-pulse">
      <div className="h-16 bg-surface-container-high rounded-xl" />
      <div className="h-80 bg-surface-container rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <div className="h-96 bg-surface-container rounded-2xl" />
        <div className="h-96 bg-surface-container rounded-2xl" />
      </div>
      <div className="h-40 bg-surface-container rounded-2xl" />
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────
const DailyChallenge: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userName = useAuthStore((s) => s.user?.name)
  const userAvatar = useAuthStore((s) => s.user?.avatar)
  const userStreak = useAuthStore((s) => s.user?.currentStreak ?? 0)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // Page-level state
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [currentExplanation, setCurrentExplanation] = useState<string>('')
  const [results, setResults] = useState<boolean[]>([])
  const [correctAnswerIndices, setCorrectAnswerIndices] = useState<number[]>([])
  // Hidden by default so the panel doesn't cover the answer grid on short
  // mobile viewports (S21 Ultra report 2026-05-19). User taps pill to expand.
  const [explanationCollapsed, setExplanationCollapsed] = useState(true)
  const explanationRef = useRef<HTMLDivElement>(null)

  // Result state
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(null)
  const [showShareCard, setShowShareCard] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  // Countdown
  const [countdown, setCountdown] = useState('')

  // ── Countdown timer to UTC midnight ─────────────────────────────────────
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      tomorrow.setUTCHours(0, 0, 0, 0)
      setCountdown(formatCountdown(tomorrow.getTime() - now.getTime()))
    }
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  // Click-outside on the explanation panel collapses it so the answer grid
  // behind is visible. Only attach the listener while a panel is open.
  useEffect(() => {
    if (!answered || explanationCollapsed) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const node = explanationRef.current
      if (node && !node.contains(e.target as Node)) {
        setExplanationCollapsed(true)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [answered, explanationCollapsed])

  // ── Data fetching via TanStack Query ────────────────────────────────────
  const challengeQuery = useQuery<DailyChallengeData>({
    queryKey: ['daily-challenge', getQuizLanguage()],
    queryFn: () => api.get(`/api/daily-challenge?language=${getQuizLanguage()}`).then((r) => r.data),
    staleTime: 60_000,
  })

  const resultQuery = useQuery<DailyResult>({
    queryKey: ['daily-challenge-result'],
    queryFn: () => api.get('/api/daily-challenge/result').then((r) => r.data),
    enabled: isAuthenticated && challengeQuery.data?.alreadyCompleted === true,
    staleTime: 30_000,
  })

  const leaderboardQuery = useQuery<unknown>({
    queryKey: ['daily-leaderboard'],
    queryFn: () => api.get('/api/leaderboard/daily?size=10').then((r) => r.data),
    staleTime: 60_000,
  })

  const yesterdayQuery = useQuery<YesterdaySummary>({
    queryKey: ['daily-yesterday'],
    queryFn: () => api.get('/api/daily-challenge/yesterday-summary').then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  })

  const historyQuery = useQuery<HeatmapDay[]>({
    queryKey: ['daily-history-30'],
    queryFn: () => api.get('/api/daily-challenge/history?days=30').then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  })

  const seasonQuery = useQuery<ActiveSeason | null>({
    queryKey: ['season-active'],
    queryFn: () => api.get('/api/seasons/active').then((r) => r.data).catch(() => null),
    staleTime: 30 * 60_000,
  })

  // Sync resultQuery → local dailyResult so completion handler can also push.
  // When the /result payload omits {completed:true} but challengeData says
  // alreadyCompleted, we still mark complete using whatever fields are
  // available (BE consistency varies; FE must not get stuck on "ready").
  useEffect(() => {
    const challenge = challengeQuery.data as (DailyChallengeData & { score?: number }) | undefined
    const result = resultQuery.data
    if (result?.completed) {
      setDailyResult(result)
    } else if (challenge?.alreadyCompleted) {
      setDailyResult({
        completed: true,
        score: result?.score ?? challenge.score ?? 0,
        correctCount: result?.correctCount ?? 0,
        totalQuestions: result?.totalQuestions ?? challenge.questionCount ?? 5,
        xpEarned: result?.xpEarned ?? 0,
        completedAt: result?.completedAt,
        betterThanPercent: result?.betterThanPercent,
        rankGlobal: result?.rankGlobal,
        rankGroup: result?.rankGroup,
        timeSeconds: result?.timeSeconds,
        sessionId: result?.sessionId,
      })
    }
  }, [resultQuery.data, challengeQuery.data])

  const challengeData = challengeQuery.data
  const isCompleted = !!dailyResult?.completed
  const loading = challengeQuery.isLoading

  // ── Derived ─────────────────────────────────────────────────────────────
  const todayLabel = useMemo(() => getTodayLabel(t), [t])

  const historyDays = useMemo<HeatmapDay[]>(() => {
    const data = historyQuery.data
    return Array.isArray(data) ? data : []
  }, [historyQuery.data])

  const completedDates = useMemo(() => {
    const set = new Set<string>()
    historyDays.forEach((d) => { if (d.completed) set.add(d.date) })
    return set
  }, [historyDays])

  const last7Days = useMemo(
    () => getLast7Days(t, completedDates),
    [t, completedDates]
  )

  // Source of truth for the user's consecutive-day streak is the
  // backend (User.currentStreak via /api/me) — same value the sidebar
  // StreakWidget shows. Previously this was recomputed from Daily
  // Challenge history alone, which broke when the user kept a streak
  // through other quiz modes without completing today's Daily, leaving
  // the page showing 0 while the sidebar showed 2.
  const currentStreak = userStreak

  const leaderboardEntries = useMemo<DailyLbEntry[]>(() => {
    const data = leaderboardQuery.data
    if (!data) return []
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray((data as { entries?: unknown[] }).entries)
        ? (data as { entries?: unknown[] }).entries!
        : []
    return (rawList as Array<Record<string, unknown>>).map((entry, idx) => ({
      rank: (entry.rank as number) ?? idx + 1,
      name: (entry.name as string) ?? (entry.userName as string) ?? '—',
      tier: entry.tier as string | undefined,
      score: (entry.score as number) ?? (entry.points as number) ?? 0,
      correctCount: entry.correctCount as number | undefined,
      totalQuestions: entry.totalQuestions as number | undefined,
      timeLabel: entry.time as string | undefined,
      avatarUrl: entry.avatar as string | undefined,
    }))
  }, [leaderboardQuery.data])

  const myEntry = useMemo<DailyLbEntry | null | undefined>(() => {
    if (!isCompleted || !dailyResult) return null
    return {
      rank: dailyResult.rankGlobal ?? 0,
      name: userName ?? '—',
      score: dailyResult.score,
      correctCount: dailyResult.correctCount,
      totalQuestions: dailyResult.totalQuestions,
      avatarUrl: userAvatar,
      avatarInitial: (userName ?? '?').charAt(0).toUpperCase(),
      isMe: true,
    }
  }, [isCompleted, dailyResult, userName, userAvatar])

  // ── Start challenge ─────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!challengeData) return
    try {
      const startRes = await api.post('/api/daily-challenge/start')
      setSessionId(startRes.data.sessionId)
      setQuizStarted(true)
    } catch {
      setError(t('daily.startError'))
    }
  }, [challengeData, t])

  // ── Handle answer selection ─────────────────────────────────────────────
  const handleAnswer = useCallback(async (optionIndex: number) => {
    if (answered || !challengeData || !sessionId) return
    setSelectedAnswer(optionIndex)
    setAnswered(true)
    const question = challengeData.questions[currentIndex]
    try {
      const res = await api.post('/api/daily-challenge/answer', {
        questionId: question.id,
        answer: optionIndex,
      })
      const correctAnswer: number[] = res.data.correctAnswer ?? []
      const correct: boolean = res.data.isCorrect ?? correctAnswer.includes(optionIndex)
      setCorrectAnswerIndices(correctAnswer)
      setIsCorrect(correct)
      setCurrentExplanation(res.data.explanation ?? '')
      setResults((prev) => [...prev, correct])
    } catch {
      setCorrectAnswerIndices([])
      setIsCorrect(false)
      setCurrentExplanation('')
      setResults((prev) => [...prev, false])
    }
    // Refresh daily-missions widget so "answer_correct" + "answer_combo"
    // tick/reset without an F5 (mission tracking happens BE-side in
    // DailyChallengeService.checkAnswer when authenticated).
    queryClient.invalidateQueries({ queryKey: ['daily-missions'] })
  }, [answered, challengeData, sessionId, currentIndex, queryClient])

  // ── Next question ───────────────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (!challengeData) return
    if (currentIndex + 1 >= challengeData.questions.length) {
      const correctCount = results.filter(Boolean).length
      const score = correctCount * 20
      try {
        await api.post('/api/daily-challenge/complete', { score, correctCount })
      } catch { /* ignore */ }

      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['me-tier-progress'] })
      queryClient.invalidateQueries({ queryKey: ['daily-missions'] })
      // Bugfix: invalidate the `alreadyCompleted` status query too, not
      // just the result query. Home page reads ['daily-challenge', lang]
      // to decide State A (todo) vs State B (done + Hero Ranked promoted)
      // — without this invalidation it stayed stale `alreadyCompleted:
      // false` after completion, so the user saw the State-A daily card
      // until they F5'd. Partial-key match invalidates all language
      // variants (['daily-challenge','vi'] and ['daily-challenge','en']).
      queryClient.invalidateQueries({ queryKey: ['daily-challenge'] })
      queryClient.invalidateQueries({ queryKey: ['daily-challenge-result'] })
      queryClient.invalidateQueries({ queryKey: ['daily-history-30'] })
      queryClient.invalidateQueries({ queryKey: ['daily-leaderboard'] })
      // Ranked-status query feeds HeroRankedCard energy/cap stats — refetch
      // so the promoted-after-Daily Hero card shows fresh numbers if the
      // user already played some ranked questions during the daily session.
      queryClient.invalidateQueries({ queryKey: ['ranked-status'] })

      const XP_MIN_CORRECT = 4
      const localResult: DailyResult = {
        completed: true,
        score,
        correctCount,
        totalQuestions: challengeData.questions.length,
        xpEarned: correctCount >= XP_MIN_CORRECT ? 50 : 0,
        xpMinCorrect: XP_MIN_CORRECT,
        sessionId: sessionId || undefined,
        completedAt: new Date().toISOString(),
      }
      try {
        const resultRes = await api.get('/api/daily-challenge/result')
        const apiData = resultRes.data
        setDailyResult({
          ...localResult,
          score: apiData.score ?? score,
          correctCount: apiData.correctCount > 0 ? apiData.correctCount : correctCount,
          totalQuestions: apiData.totalQuestions > 0 ? apiData.totalQuestions : challengeData.questions.length,
          betterThanPercent: apiData.betterThanPercent,
          rankGlobal: apiData.rankGlobal,
        })
      } catch {
        setDailyResult(localResult)
      }
      setQuizStarted(false)
    } else {
      setCurrentIndex((p) => p + 1)
      setSelectedAnswer(null)
      setAnswered(false)
      setIsCorrect(null)
      setCurrentExplanation('')
      setCorrectAnswerIndices([])
      setExplanationCollapsed(true)
    }
  }, [challengeData, currentIndex, results, sessionId, queryClient])

  // ─── Loading ────────────────────────────────────────────────────────────
  if (loading) return <LoadingSkeleton />

  // ─── Error ──────────────────────────────────────────────────────────────
  if (challengeQuery.isError && !challengeData) {
    return (
      <div data-testid="daily-error-state" className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-20 h-20 bg-error-container/20 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
        </div>
        <p className="text-on-surface-variant text-lg">{error ?? t('daily.loadError')}</p>
        <button
          data-testid="daily-error-retry-btn"
          onClick={() => window.location.reload()}
          className="gold-gradient px-8 py-3 rounded-xl text-on-secondary font-bold"
        >
          {t('common.retry')}
        </button>
      </div>
    )
  }

  // ─── Quiz View (active gameplay) ────────────────────────────────────────
  if (quizStarted && challengeData && challengeData.questions.length > 0) {
    const question = challengeData.questions[currentIndex]
    const totalQuestions = challengeData.questions.length
    const correctOptionText = question.options[correctAnswerIndices[0] ?? -1] ?? ''

    return (
      <main className="relative min-h-screen pt-6 pb-12 px-6 flex flex-col items-center justify-center max-w-5xl mx-auto">
        <div className="w-full flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-on-surface">{t('daily.title')}</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">{t('quiz.question', { current: currentIndex + 1, total: totalQuestions })}</p>
          </div>
          <div className="bg-surface-container-high px-4 py-2 rounded-xl border border-outline-variant/10 text-sm font-mono font-bold text-secondary">
            {todayLabel}
          </div>
        </div>

        <div className="w-full flex gap-2 mb-10">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i < currentIndex
                  ? results[i] ? 'bg-green-500' : 'bg-red-500'
                  : i === currentIndex ? 'bg-secondary' : 'bg-outline-variant/20'
              }`}
            />
          ))}
        </div>

        <div className="w-full space-y-6 md:space-y-16">
          {(() => {
            const lenClass = getQuestionLengthClass(question.content)
            const mobileFontCls =
              lenClass === 'short'  ? 'text-[21px] font-bold text-center' :
              lenClass === 'medium' ? 'text-[18px] font-semibold text-center' :
                                      'text-[15px] font-semibold text-left'
            return (
              <div
                data-question-length={lenClass}
                className="relative w-full aspect-auto min-h-[160px] md:aspect-[21/7] md:min-h-0 flex flex-col items-center justify-center text-center p-5 md:p-10 bg-surface-container-low rounded-2xl md:rounded-[2.5rem] border border-outline-variant/10 shadow-2xl overflow-hidden"
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 md:w-2 h-20 md:h-32 bg-secondary rounded-r-full" />
                <div className="inline-flex items-center gap-1.5 bg-secondary/10 border border-secondary/20 rounded-full px-3 py-1 mb-3 md:mb-4">
                  <span className="material-symbols-outlined text-secondary text-xs">menu_book</span>
                  <span className="text-secondary text-[11px] font-medium tracking-wider">
                    {formatVerseRef({ book: question.book, chapter: question.chapter })}
                  </span>
                </div>
                <h2
                  data-testid="daily-question-text"
                  className={`question-text font-headline ${mobileFontCls} md:text-4xl md:font-extrabold md:text-center tracking-tight leading-snug max-w-3xl text-on-surface w-full`}
                >
                  {wrapProperNouns(question.content)}
                </h2>
                <div className="hidden md:flex mt-6 items-center gap-2 text-on-surface-variant/60">
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {question.book}{question.chapter ? ` - ${t('quiz.chapter', { chapter: question.chapter })}` : ''}
                  </span>
                </div>
              </div>
            )
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {question.options.map((option, i) => {
              let state: AnswerState = 'default'
              // Only enter the reveal branch once the API has reported the
              // correct indices — otherwise the picked option flashes 'wrong'
              // (red + X badge) for ~100ms while `correctAnswerIndices` is
              // still []. Until then, show 'selected' (per-letter color +
              // glow) as click acknowledgment.
              if (answered && isCorrect !== null) {
                if (correctAnswerIndices.includes(i)) state = 'correct'
                else if (i === selectedAnswer) state = 'wrong'
                else state = 'disabled'
              } else if (i === selectedAnswer) {
                state = 'selected'
              }
              return (
                <AnswerButton
                  key={i}
                  index={i as 0 | 1 | 2 | 3}
                  letter={LETTERS[i] as 'A' | 'B' | 'C' | 'D'}
                  text={option}
                  state={state}
                  onClick={() => handleAnswer(i)}
                  testId={`daily-option-${i}`}
                />
              )
            })}
          </div>
        </div>

        {answered && isCorrect !== null && (!isCorrect || currentExplanation) && (
          explanationCollapsed ? (
            <button
              data-testid="daily-explanation-pill"
              type="button"
              onClick={() => setExplanationCollapsed(false)}
              className={`fixed bottom-48 sm:bottom-36 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full glass-panel border text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform ${
                isCorrect ? 'border-secondary/30 text-secondary' : 'border-error/30 text-error'
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={FILL_1}>lightbulb</span>
              {t('quiz.showExplanationAgain', 'Xem giải thích')}
            </button>
          ) : (
            <div ref={explanationRef} className="fixed bottom-48 sm:bottom-36 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-3rem)] max-w-lg">
              <div className={`glass-panel p-5 rounded-2xl border space-y-3 max-h-[50vh] overflow-y-auto ${isCorrect ? 'border-green-500/20' : 'border-error/20'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!isCorrect && correctOptionText && (
                      <>
                        <span className="material-symbols-outlined text-green-400 text-sm flex-shrink-0" style={FILL_1}>check_circle</span>
                        <span className="text-sm font-bold text-green-400 truncate">
                          {t('quiz.correctAnswerIs', { answer: correctOptionText })}
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    data-testid="daily-explanation-close"
                    type="button"
                    onClick={() => setExplanationCollapsed(true)}
                    className="text-on-surface-variant/60 hover:text-on-surface transition-colors -mr-1 flex-shrink-0"
                    aria-label={t('quiz.minimizeExplanation', 'Thu nhỏ')}
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
                {currentExplanation && (
                  <p className="text-on-surface-variant text-sm leading-relaxed flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-secondary/60">lightbulb</span>
                    <span>{currentExplanation}</span>
                  </p>
                )}
              </div>
            </div>
          )
        )}

        {answered && isCorrect !== null && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-lg">
            <div
              data-testid="daily-answer-feedback"
              className="bg-surface-container-highest p-4 sm:p-5 rounded-3xl border border-secondary/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 glass-panel"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-secondary/20' : 'bg-error/20'}`}>
                  <span
                    className={`material-symbols-outlined text-2xl ${isCorrect ? 'text-secondary' : 'text-error'}`}
                    style={FILL_1}
                  >{isCorrect ? 'verified' : 'cancel'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-on-surface leading-tight">
                    {isCorrect ? t('quiz.correct') : t('quiz.incorrect')}
                  </p>
                  <p className={`text-xs font-medium leading-tight mt-0.5 ${isCorrect ? 'text-secondary/80' : 'text-error/80'}`}>
                    {isCorrect ? t('quiz.bonusPoints', { points: 20 }) : t('quiz.noPoints')}
                  </p>
                </div>
              </div>
              <button
                data-testid="daily-next-btn"
                onClick={handleNext}
                className="bg-gradient-to-r from-secondary to-tertiary text-on-secondary px-6 sm:px-8 py-3 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all hover:brightness-110 whitespace-nowrap w-full sm:w-auto"
              >
                {currentIndex + 1 >= totalQuestions ? t('daily.viewResult') : t('daily.nextQuestion')}
              </button>
            </div>
          </div>
        )}
      </main>
    )
  }

  // ─── No data — only block when not completed; completed users still see hero ─
  if ((!challengeData || !Array.isArray(challengeData.questions) || challengeData.questions.length === 0) && !isCompleted) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">hourglass_empty</span>
        </div>
        <h3 className="text-2xl font-bold text-on-surface">{t('daily.noQuestions')}</h3>
        <p className="text-on-surface-variant">{t('daily.comeBackLater')}</p>
        <Link to="/" className="gold-gradient px-8 py-3 rounded-xl text-on-secondary font-bold">{t('daily.home')}</Link>
      </div>
    )
  }

  // ─── Unified state-aware Landing ────────────────────────────────────────
  const questionCount = challengeData?.questionCount ?? challengeData?.questions?.length ?? 5
  const timeLimit = challengeData?.timeLimit ?? 5
  const seasonName = seasonQuery.data?.isActive ? seasonQuery.data.name : undefined

  const heroDone = isCompleted && dailyResult ? {
    correctCount: dailyResult.correctCount,
    totalQuestions: dailyResult.totalQuestions,
    score: dailyResult.score,
    xpEarned: dailyResult.xpEarned ?? 0,
    betterThanPercent: dailyResult.betterThanPercent,
    completedAt: typeof dailyResult.completedAt === 'number'
      ? new Date(dailyResult.completedAt).toISOString()
      : dailyResult.completedAt,
    timeSeconds: dailyResult.timeSeconds,
    rankGlobal: dailyResult.rankGlobal,
    rankGroup: dailyResult.rankGroup,
    resultsBreakdown: results.length === dailyResult.totalQuestions ? results : undefined,
  } : undefined

  return (
    <div data-testid="daily-page" className="max-w-[1280px] mx-auto p-2">
      <PageMeta
        title="Thu thach hang ngay"
        description="5 cau hoi Kinh Thanh moi ngay — thu suc voi cong dong va chia se ket qua."
        canonicalPath="/daily"
      />

      <PageHeader todayLabel={todayLabel} countdown={countdown} seasonName={seasonName} />

      <HeroCard
        state={isCompleted ? 'done' : 'ready'}
        questionCount={questionCount}
        timeLimit={timeLimit}
        yesterday={yesterdayQuery.data}
        onStart={handleStart}
        done={heroDone}
        onReview={() => setShowReviewModal(true)}
        onShare={() => setShowShareCard(true)}
        onDownload={() => setShowShareCard(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 mb-7">
        <DailyLeaderboard
          entries={leaderboardEntries}
          myEntry={myEntry}
          myCompleted={isCompleted}
        />
        <StreakCard
          currentStreak={currentStreak}
          last7Days={last7Days}
          freezeUsed={0}
          freezeMax={1}
        />
      </div>

      {historyDays.length > 0 && (
        <div className="mb-7">
          <HeatmapCard days={historyDays} />
        </div>
      )}

      {/* Review modal — shows the 5 questions with correct answers + explanations.
          Backend reveals correctAnswer/explanation in GET /api/daily-challenge
          payload only when the user has already completed today. */}
      {showReviewModal && challengeData?.questions && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowReviewModal(false)}>
          <div className="max-w-2xl w-full bg-[rgba(50,52,64,0.95)] backdrop-blur-md rounded-2xl border border-[rgba(232,168,50,0.2)] p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">visibility</span>
                {t('daily.review.title')}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 grid place-items-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-5">
              {challengeData.questions.map((q, idx) => {
                const correctIdx = q.correctAnswer?.[0] ?? -1
                const userGotIt = results[idx]
                return (
                  <div key={q.id} className="bg-[rgba(17,19,30,0.6)] border border-white/5 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-2 flex-1">
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full grid place-items-center text-xs font-bold ${
                          userGotIt === undefined
                            ? 'bg-white/10 text-on-surface-variant'
                            : userGotIt ? 'bg-[#4ade80]/20 text-[#4ade80]' : 'bg-error/20 text-error'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-bold text-on-surface leading-relaxed">{q.content}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant flex-shrink-0 px-2 py-0.5 rounded bg-white/5">
                        {q.book} {q.chapter}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 mb-3">
                      {q.options.map((opt, i) => {
                        const isCorrect = i === correctIdx
                        return (
                          <div
                            key={i}
                            className={`px-3 py-2 rounded-lg text-xs flex items-start gap-2 border ${
                              isCorrect
                                ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
                                : 'bg-white/5 border-white/5 text-on-surface-variant'
                            }`}
                          >
                            <span className="font-bold">{LETTERS[i]}.</span>
                            <span className="flex-1">{opt}</span>
                            {isCorrect && <span className="material-symbols-outlined text-sm">check_circle</span>}
                          </div>
                        )
                      })}
                    </div>
                    {q.explanation && (
                      <div className="text-xs text-on-surface-variant leading-relaxed bg-secondary/5 border-l-2 border-secondary/40 px-3 py-2 rounded">
                        <span className="material-symbols-outlined text-sm align-middle mr-1 text-secondary/70">lightbulb</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareCard && dailyResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowShareCard(false)}>
          <div className="max-w-md w-full glass-card rounded-2xl border border-white/5 p-6" onClick={(e) => e.stopPropagation()}>
            <ShareCard
              sessionId={dailyResult.sessionId ?? sessionId ?? ''}
              score={dailyResult.score}
              correct={dailyResult.correctCount}
              total={dailyResult.totalQuestions}
              userName={userName ?? ''}
            />
            <button
              onClick={() => setShowShareCard(false)}
              className="block mx-auto mt-4 text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyChallenge
