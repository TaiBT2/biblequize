import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import ShareCard from '../components/ShareCard'
import PageMeta from '../components/PageMeta'
import { getQuizLanguage } from '../utils/quizLanguage'

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
  sessionId?: string
}

interface LeaderboardEntry {
  rank: number
  name: string
  group?: string
  score: number
  time: string
  avatar?: string
}

interface DailyStats {
  totalPlayers: number
  averageScore: number
  averageTime: string
}

interface StreakData {
  currentStreak: number
  history: { date: string; completed: boolean }[]
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

function getToday(): string {
  return new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getLast7Days(t: (key: string) => string): { label: string; date: string; isToday: boolean }[] {
  const DAY_LABELS = [
    t('daily.daySun'), t('daily.dayMon'), t('daily.dayTue'),
    t('daily.dayWed'), t('daily.dayThu'), t('daily.dayFri'), t('daily.daySat'),
  ]
  const days: { label: string; date: string; isToday: boolean }[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push({
      label: i === 0 ? t('daily.today') : DAY_LABELS[d.getDay()],
      date: d.toISOString().split('T')[0],
      isToday: i === 0,
    })
  }
  return days
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-pulse">
      {/* Header skeleton */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="h-10 w-80 bg-surface-container-high rounded-lg" />
          <div className="h-4 w-40 bg-surface-container-high rounded" />
        </div>
        <div className="h-20 w-48 bg-surface-container-high rounded-2xl" />
      </section>

      {/* Hero skeleton */}
      <div className="h-80 bg-surface-container rounded-[2rem]" />

      {/* Stats skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-surface-container-high rounded-2xl" />
        ))}
      </section>

      {/* Bottom skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 h-80 bg-surface-container rounded-2xl" />
        <div className="lg:col-span-2 h-80 bg-surface-container rounded-2xl" />
      </div>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────
const DailyChallenge: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [challengeData, setChallengeData] = useState<DailyChallengeData | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

  // Result state
  const [showResult, setShowResult] = useState(false)
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(null)
  const [showShareCard, setShowShareCard] = useState(false)

  // Landing page data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [streak, setStreak] = useState<StreakData | null>(null)

  // Countdown
  const [countdown, setCountdown] = useState('')

  const last7Days = useMemo(() => getLast7Days(t), [t])

  // ── Countdown timer to midnight (always running) ───────────────────────
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      setCountdown(formatCountdown(tomorrow.getTime() - now.getTime()))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  // ── Load daily challenge ────────────────────────────────────────────────
  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const [challengeRes, leaderboardRes] = await Promise.allSettled([
          api.get(`/api/daily-challenge?language=${getQuizLanguage()}`),
          api.get('/api/leaderboard/daily'),
        ])

        if (challengeRes.status === 'fulfilled') {
          const data: DailyChallengeData = challengeRes.value.data
          setChallengeData(data)

          if (data.alreadyCompleted) {
            try {
              const resultRes = await api.get('/api/daily-challenge/result')
              setDailyResult(resultRes.data)
              setShowResult(true)
            } catch {
              // Result not available yet, show landing
            }
          }
        } else {
          setError(t('daily.loadError'))
        }

        if (leaderboardRes.status === 'fulfilled') {
          const lb = leaderboardRes.value.data
          if (Array.isArray(lb)) {
            setLeaderboard(lb.slice(0, 5))
          } else if (lb.entries) {
            setLeaderboard(lb.entries.slice(0, 5))
          }
          if (lb.stats) setStats(lb.stats)
          if (lb.streak) setStreak(lb.streak)
        }
      } catch (err) {
        console.error('Error loading daily challenge:', err)
        setError(t('daily.loadError'))
      } finally {
        setLoading(false)
      }
    }

    loadChallenge()
  }, [])

  // ── Start challenge ─────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!challengeData) return
    try {
      const startRes = await api.post('/api/daily-challenge/start')
      setSessionId(startRes.data.sessionId)
      setQuizStarted(true)
    } catch (err) {
      console.error('Error starting daily challenge:', err)
      setError(t('daily.startError'))
    }
  }, [challengeData])

  // ── Handle answer selection ─────────────────────────────────────────────
  const handleAnswer = useCallback(async (optionIndex: number) => {
    if (answered || !challengeData || !sessionId) return

    setSelectedAnswer(optionIndex)
    setAnswered(true)

    const question = challengeData.questions[currentIndex]
    const isCorrect = question.correctAnswer.includes(optionIndex)
    setResults(prev => [...prev, isCorrect])

    try {
      await api.post(`/api/sessions/${sessionId}/answer`, {
        questionId: question.id,
        selectedAnswer: optionIndex,
      })
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }, [answered, challengeData, sessionId, currentIndex])

  // ── Next question ───────────────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (!challengeData) return

    if (currentIndex + 1 >= challengeData.questions.length) {
      const correctCount = results.filter(Boolean).length
      const score = correctCount * 20

      // Persist completion server-side. Backend credits +50 XP into
      // UserDailyProgress the first time this fires per user per day
      // (idempotent via hasCompletedToday guard) — see DECISIONS.md
      // 2026-04-20 "Daily Challenge as secondary XP path".
      try {
        await api.post('/api/daily-challenge/complete', { score, correctCount })
      } catch (err) {
        console.error('Error marking daily completion:', err)
      }

      // Refresh server-derived views (Home tier progress, /api/me
      // counters) so the new XP shows up immediately.
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['me-tier-progress'] })

      try {
        const resultRes = await api.get('/api/daily-challenge/result')
        setDailyResult(resultRes.data)
      } catch {
        setDailyResult({
          completed: true,
          score,
          correctCount,
          totalQuestions: challengeData.questions.length,
          sessionId: sessionId || undefined,
        })
      }
      setShowResult(true)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setAnswered(false)
    }
  }, [challengeData, currentIndex, results, sessionId, queryClient])

  // ─── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingSkeleton />
  }

  // ─── Error ──────────────────────────────────────────────────────────────
  if (error && !challengeData) {
    return (
      <div data-testid="daily-error-state" className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-20 h-20 bg-error-container/20 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
        </div>
        <p className="text-on-surface-variant text-lg">{error}</p>
        <button
          data-testid="daily-error-retry-btn"
          onClick={() => window.location.reload()}
          className="gold-gradient px-8 py-3 rounded-xl text-on-secondary font-bold transition-all hover:scale-[1.02] active:scale-95"
        >
          {t('common.retry')}
        </button>
      </div>
    )
  }

  // ─── Result Screen ─────────────────────────────────────────────────────
  if (showResult && dailyResult) {
    const { correctCount, totalQuestions } = dailyResult
    const resultSessionId = dailyResult.sessionId || sessionId || ''

    return (
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">{t('daily.resultTitle')}</h2>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span className="text-sm font-medium">{getToday()}</span>
            </div>
          </div>
          <div className="bg-surface-container-high px-6 py-3 rounded-2xl border border-secondary/20 gold-glow flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{t('daily.refreshIn')}</span>
            <div className="font-mono text-2xl font-black text-secondary tracking-widest">
              {countdown}
            </div>
          </div>
        </section>

        {/* Result Card */}
        <section data-testid="daily-completed-badge" className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-secondary/20 via-tertiary/20 to-secondary/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
          <div className="relative bg-surface-container border border-outline-variant/30 rounded-[2rem] overflow-hidden p-10 flex flex-col items-center text-center space-y-8">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-secondary" style={FILL_1}>emoji_events</span>
            </div>
            <div className="space-y-4">
              <div data-testid="daily-score-display" className="text-6xl font-black text-on-surface">
                {correctCount}<span className="text-2xl text-on-surface-variant font-medium">/{totalQuestions}</span>
              </div>
              <p className="text-on-surface-variant text-lg">{t('daily.completedMessage')}</p>

              {/* +50 XP earned badge — backend credited via /complete. */}
              <div
                data-testid="daily-xp-earned"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30"
              >
                <span className="material-symbols-outlined text-secondary text-lg" style={FILL_1}>bolt</span>
                <span className="text-sm font-bold text-secondary">{t('daily.xpEarned')}</span>
              </div>

              {/* Stars */}
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalQuestions }, (_, i) => (
                  <span
                    key={i}
                    className={`material-symbols-outlined text-3xl ${i < correctCount ? 'text-secondary' : 'text-outline-variant/30'}`}
                    style={i < correctCount ? FILL_1 : undefined}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setShowShareCard(true)}
                className="gold-gradient px-8 py-4 rounded-2xl text-on-secondary font-black text-base shadow-lg hover:shadow-secondary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">share</span>
                {t('daily.shareResult')}
              </button>
              <Link
                to="/leaderboard"
                className="bg-surface-container-high px-8 py-4 rounded-2xl text-on-surface font-bold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">leaderboard</span>
                {t('daily.leaderboard')}
              </Link>
              <Link
                to="/"
                className="bg-surface-container-high px-8 py-4 rounded-2xl text-on-surface font-bold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">home</span>
                {t('daily.home')}
              </Link>
            </div>
          </div>
        </section>

        {/* Share Card */}
        {showShareCard && resultSessionId && (
          <section className="bg-surface-container rounded-2xl border border-outline-variant/10 p-6">
            <ShareCard
              sessionId={resultSessionId}
              score={dailyResult.score}
              correct={correctCount}
              total={totalQuestions}
              userName=""
            />
            <button
              onClick={() => setShowShareCard(false)}
              className="block mx-auto mt-4 text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium"
            >
              {t('common.close')}
            </button>
          </section>
        )}
      </div>
    )
  }

  // ─── Quiz View ──────────────────────────────────────────────────────────
  if (quizStarted && challengeData && challengeData.questions.length > 0) {
    const question = challengeData.questions[currentIndex]
    const totalQuestions = challengeData.questions.length

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <section className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">{t('daily.title')}</h2>
            <p className="text-sm text-on-surface-variant">{t('quiz.question', { current: currentIndex + 1, total: totalQuestions })}</p>
          </div>
          <div className="bg-surface-container-high px-4 py-2 rounded-xl border border-outline-variant/10 text-sm font-mono font-bold text-secondary">
            {getToday()}
          </div>
        </section>

        {/* Progress bar */}
        <div className="flex gap-2">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i < currentIndex
                  ? results[i]
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : i === currentIndex
                    ? 'bg-secondary'
                    : 'bg-outline-variant/20'
              }`}
            />
          ))}
        </div>

        {/* Question Card */}
        <section className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary/10 via-tertiary/10 to-secondary/10 rounded-[2rem] blur-lg opacity-0 group-hover:opacity-100 transition duration-500" />
          <div className="relative bg-surface-container border border-outline-variant/20 rounded-[2rem] p-8 space-y-6">
            {question.book && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/30 border border-primary/10 text-[10px] uppercase tracking-wider font-bold text-on-primary-container">
                <span className="material-symbols-outlined text-xs">menu_book</span>
                {question.book} {question.chapter ? `- ${t('daily.chapter')} ${question.chapter}` : ''}
              </span>
            )}

            <h3 className="text-xl font-bold text-on-surface leading-relaxed">{question.content}</h3>

            <div className="space-y-3">
              {question.options.map((option, i) => {
                let stateClasses = 'bg-surface-container-high border-outline-variant/20 hover:bg-surface-container-highest hover:border-secondary/30'
                if (answered) {
                  if (question.correctAnswer.includes(i)) {
                    stateClasses = 'bg-green-500/10 border-green-500/40 text-green-400'
                  } else if (i === selectedAnswer) {
                    stateClasses = 'bg-red-500/10 border-red-500/40 text-red-400'
                  } else {
                    stateClasses = 'bg-surface-container-high border-outline-variant/10 opacity-50'
                  }
                }

                return (
                  <button
                    key={i}
                    data-testid={`daily-option-${i}`}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3 ${stateClasses} ${
                      !answered ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
                    }`}
                    onClick={() => handleAnswer(i)}
                    disabled={answered}
                  >
                    <span className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-sm font-black text-on-surface-variant shrink-0">
                      {LETTERS[i]}
                    </span>
                    <span className="font-medium text-on-surface pt-1">{option}</span>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {answered && question.explanation && (
              <div className="p-4 bg-primary-container/20 rounded-xl border border-primary/10">
                <p className="text-[11px] uppercase tracking-widest text-on-primary-container font-bold mb-1">{t('daily.explanation')}</p>
                <p className="text-sm leading-relaxed text-on-primary-container/80">{question.explanation}</p>
              </div>
            )}

            {/* Next button */}
            {answered && (
              <button
                data-testid="daily-next-btn"
                onClick={handleNext}
                className="w-full gold-gradient py-4 rounded-2xl text-on-secondary font-black text-base shadow-lg hover:shadow-secondary/20 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              >
                {currentIndex + 1 >= totalQuestions ? t('daily.viewResult') : t('daily.nextQuestion')}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            )}
          </div>
        </section>
      </div>
    )
  }

  // ─── No data ────────────────────────────────────────────────────────────
  if (!challengeData || challengeData.questions.length === 0) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">hourglass_empty</span>
        </div>
        <h3 className="text-2xl font-bold text-on-surface">{t('daily.noQuestions')}</h3>
        <p className="text-on-surface-variant">{t('daily.comeBackLater')}</p>
        <Link
          to="/"
          className="gold-gradient px-8 py-3 rounded-xl text-on-secondary font-bold transition-all hover:scale-[1.02] active:scale-95"
        >
          {t('daily.home')}
        </Link>
      </div>
    )
  }

  // ─── Landing Page (before quiz starts) ─────────────────────────────────
  const completedDates = new Set(
    streak?.history?.filter((h) => h.completed).map((h) => h.date) ?? []
  )
  const currentStreak = streak?.currentStreak ?? 0
  const challengeTitle = challengeData.title ?? t('daily.defaultTitle')
  const challengeDesc = challengeData.description ?? t('daily.defaultDesc')
  const questionCount = challengeData.questionCount ?? challengeData.questions.length
  const timeLimit = challengeData.timeLimit ?? 5

  return (
    <div data-testid="daily-page" className="max-w-5xl mx-auto space-y-12">
      <PageMeta
        title="Thu thach hang ngay"
        description="5 cau hoi Kinh Thanh moi ngay — thu suc voi cong dong va chia se ket qua."
        canonicalPath="/daily"
      />
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">{t('daily.title')}</h2>
          <div className="flex items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span className="text-sm font-medium">{getToday()}</span>
          </div>
        </div>
        <div data-testid="daily-countdown" className="bg-surface-container-high px-6 py-3 rounded-2xl border border-secondary/20 gold-glow flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{t('daily.refreshIn')}</span>
          <div className="font-mono text-2xl font-black text-secondary tracking-widest">
            {countdown}
          </div>
        </div>
      </section>

      {/* Hero Challenge Card */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-secondary/20 via-tertiary/20 to-secondary/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-surface-container border border-outline-variant/30 rounded-[2rem] overflow-hidden p-10 flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-secondary" style={FILL_1}>local_fire_department</span>
          </div>
          <div className="space-y-4">
            {!challengeData.alreadyCompleted && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-error-container/20 border border-error/20">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-error">{t('daily.notCompleted')}</span>
              </div>
            )}
            <h3 className="text-3xl font-bold text-on-surface leading-tight">{challengeTitle}</h3>
            <p className="text-on-surface-variant max-w-md mx-auto leading-relaxed">
              {challengeDesc}
            </p>
            <div className="flex items-center justify-center gap-6 text-sm font-medium text-on-surface-variant/80">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">quiz</span> {t('daily.questionCount', { count: questionCount })}
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">timer</span> {t('daily.timeLimit', { minutes: timeLimit })}
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">public</span> {t('daily.everyone')}
              </span>
            </div>
          </div>
          <button
            data-testid="daily-start-btn"
            onClick={handleStart}
            className="gold-gradient px-12 py-5 rounded-2xl text-on-secondary font-black text-lg shadow-lg hover:shadow-secondary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            {t('daily.startChallenge')}
          </button>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-container-highest rounded-lg text-primary">
              <span className="material-symbols-outlined">group</span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('daily.totalPlayers')}</span>
          </div>
          <div className="text-3xl font-black text-on-surface">
            {stats?.totalPlayers?.toLocaleString() ?? '---'}
          </div>
        </div>
        <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-container-highest rounded-lg text-secondary">
              <span className="material-symbols-outlined">star</span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('daily.averageScore')}</span>
          </div>
          <div className="text-3xl font-black text-on-surface">
            {stats?.averageScore != null ? `${stats.averageScore}%` : '---'}
          </div>
        </div>
        <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-container-highest rounded-lg text-tertiary">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('daily.averageTime')}</span>
          </div>
          <div className="text-3xl font-black text-on-surface">
            {stats?.averageTime ?? '---'}
          </div>
        </div>
      </section>

      {/* Bottom Layout: Leaderboard & History */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Leaderboard Preview */}
        <section data-testid="daily-leaderboard" className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-on-surface">{t('daily.todayLeaderboard')}</h4>
            <Link to="/leaderboard" className="text-secondary text-sm font-bold flex items-center gap-1 hover:underline">
              {t('daily.viewFull')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="bg-surface-container rounded-2xl border border-outline-variant/10 divide-y divide-outline-variant/5 overflow-hidden">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">leaderboard</span>
                <p className="text-sm">{t('daily.noOneCompleted')}</p>
              </div>
            ) : (
              leaderboard.map((entry, idx) => (
                <div
                  key={entry.rank}
                  data-testid="daily-leaderboard-row"
                  className={`flex items-center justify-between p-4 transition-colors ${
                    idx === 0
                      ? 'bg-secondary/5 hover:bg-secondary/10'
                      : 'hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-6 text-center font-black ${idx === 0 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                      {entry.rank}
                    </span>
                    <div className={`w-10 h-10 rounded-full overflow-hidden ${
                      idx === 0 ? 'border-2 border-secondary' : 'border border-outline-variant/30'
                    }`}>
                      {entry.avatar ? (
                        <img alt="Avatar" className="w-full h-full object-cover" src={entry.avatar} />
                      ) : (
                        <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant">person</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{entry.name}</p>
                      {entry.group && (
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">{entry.group}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${idx === 0 ? 'text-secondary' : 'text-on-surface'}`}>{entry.score}</p>
                    {entry.time && (
                      <p className="text-[10px] text-on-surface-variant font-medium">{entry.time}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* History Strip & Streak */}
        <section className="lg:col-span-2 space-y-6">
          <h4 className="text-xl font-bold text-on-surface">{t('daily.historyAndStreak')}</h4>
          <div className="bg-surface-container rounded-2xl border border-outline-variant/10 p-6 space-y-8">
            {/* Streak info */}
            <div data-testid="daily-streak-display" className="flex items-center gap-4">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary relative">
                <span className="material-symbols-outlined text-4xl" style={FILL_1}>local_fire_department</span>
                {currentStreak > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary text-on-secondary text-[10px] font-black rounded-full flex items-center justify-center border-4 border-surface-container">
                    {currentStreak}
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-black text-on-surface">
                  {currentStreak > 0 ? t('daily.streakDays', { count: currentStreak }) : t('daily.startNewStreak')}
                </p>
                <p className="text-xs text-on-surface-variant font-medium">
                  {currentStreak > 0
                    ? t('daily.streakCompleted', { count: currentStreak })
                    : t('daily.completeToStart')
                  }
                </p>
              </div>
            </div>

            {/* Calendar strip */}
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black">{t('daily.last7Days')}</p>
              <div className="flex justify-between items-center px-1">
                {last7Days.map((day) => {
                  const completed = completedDates.has(day.date)
                  const isFuture = !day.isToday && new Date(day.date) > new Date()

                  return (
                    <div key={day.date} className={`flex flex-col items-center gap-2 ${isFuture ? 'opacity-40' : ''}`}>
                      <span className={`text-[10px] font-bold ${day.isToday ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {day.label}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        day.isToday && !completed
                          ? 'bg-surface-container-highest border-2 border-dashed border-secondary/50'
                          : completed
                            ? 'bg-surface-container-high border border-outline-variant/20'
                            : 'bg-surface-container-high border border-outline-variant/20'
                      }`}>
                        {completed && (
                          <span className="material-symbols-outlined text-sm text-secondary" style={FILL_1}>check_circle</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bible verse */}
            <div className="p-4 bg-primary-container/20 rounded-xl border border-primary/10">
              <p className="text-[11px] leading-relaxed italic text-on-primary-container">
                {t('daily.bibleVerse')}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default DailyChallenge
