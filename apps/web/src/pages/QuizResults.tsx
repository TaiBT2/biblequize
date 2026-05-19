import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import confetti from 'canvas-confetti'
import { soundManager } from '../services/soundManager'
import { haptic } from '../utils/haptics'

interface Question {
  id: string
  book: string
  chapter: number
  difficulty: 'easy' | 'medium' | 'hard'
  type: string
  content: string
  options: string[]
  correctAnswer: number[]
  explanation: string
}

interface QuizStats {
  totalScore: number
  correctAnswers: number
  totalQuestions: number
  accuracy: number
  averageTime: number
  totalTime: number
  baseScore?: number
  speedBonus?: number
  comboBonus?: number
  comboMultiplier?: number
  difficultyBreakdown: {
    easy: { correct: number; total: number; score: number }
    medium: { correct: number; total: number; score: number }
    hard: { correct: number; total: number; score: number }
  }
  timePerQuestion: number[]
  questions: Question[]
  userAnswers: (number | null)[]
  questionScores: number[]
}

interface QuizResultsProps {
  stats: QuizStats
  onPlayAgain: () => void
  onBackToHome: () => void
  isRanked?: boolean
  sessionId?: string
}

type Tone = 'perfect' | 'great' | 'ok' | 'learning' | 'encourage'

function pickTone(accuracy: number): { tone: Tone; emoji: string; state: 'high' | 'low' } {
  if (accuracy >= 90) return { tone: 'perfect', emoji: '🌟', state: 'high' }
  if (accuracy >= 70) return { tone: 'great', emoji: '👏', state: 'high' }
  if (accuracy >= 50) return { tone: 'ok', emoji: '💪', state: 'low' }
  if (accuracy >= 30) return { tone: 'learning', emoji: '📚', state: 'low' }
  return { tone: 'encourage', emoji: '🎯', state: 'low' }
}

const QuizResults: React.FC<QuizResultsProps> = ({ stats, onPlayAgain, onBackToHome, isRanked = false }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [scoreDisplay, setScoreDisplay] = useState(0)

  // Sounds, haptics & confetti on mount (must be before any early-return to satisfy hooks rules)
  useEffect(() => {
    if (!stats || stats.totalQuestions <= 0) return
    const acc = (stats.correctAnswers / stats.totalQuestions) * 100
    if (acc >= 95) {
      soundManager.play('perfectScore')
      haptic.tierUp()
    } else if (acc >= 70) {
      soundManager.play('quizComplete')
      haptic.correct()
    } else {
      soundManager.play('quizComplete')
    }

    if (acc >= 70) {
      const colors = ['#e8a832', '#fbbf24', '#4ade80', '#84cc16', '#f8bd45']
      const burst = (originX: number) => confetti({
        particleCount: acc >= 90 ? 90 : 55,
        spread: 75,
        startVelocity: 45,
        origin: { x: originX, y: 0.7 },
        colors,
        scalar: 0.9,
        ticks: 220
      })
      burst(0.25)
      burst(0.75)
      if (acc >= 90) {
        const t1 = window.setTimeout(() => burst(0.5), 250)
        const t2 = window.setTimeout(() => {
          confetti({ particleCount: 60, spread: 110, startVelocity: 35, origin: { x: 0.5, y: 0.4 }, colors, scalar: 0.8 })
        }, 600)
        return () => {
          window.clearTimeout(t1)
          window.clearTimeout(t2)
        }
      }
    }
  }, [stats])

  // Animate total score counter
  useEffect(() => {
    if (!stats) return
    const target = stats.totalScore || 0
    const steps = 40
    let frame = 0
    const interval = setInterval(() => {
      frame++
      const p = Math.min(1, frame / steps)
      setScoreDisplay(Math.round(target * p))
      if (p >= 1) clearInterval(interval)
    }, 600 / steps)
    return () => clearInterval(interval)
  }, [stats])

  // Save ranked progress (mirror previous behavior)
  useEffect(() => {
    if (!isRanked) return
    try {
      const today = new Date().toISOString().slice(0, 10)
      const snap = JSON.parse(localStorage.getItem('rankedSnapshot') || '{}')
      if (snap.date === today) {
        localStorage.setItem('rankedProgress', JSON.stringify({ ...snap, cap: 500, dailyLives: 30 }))
      } else {
        const defaults = { date: today, livesRemaining: 30, questionsCounted: 0, pointsToday: 0, cap: 500, dailyLives: 30 }
        localStorage.setItem('rankedSnapshot', JSON.stringify(defaults))
        localStorage.setItem('rankedProgress', JSON.stringify(defaults))
      }
    } catch { /* ignore */ }
  }, [isRanked])

  // Book aggregates
  const { books, primaryBook, accuracy, diffRows, breakdown, isHigh, tone, emoji } = useMemo(() => {
    if (!stats) {
      return {
        books: [] as { book: string; correct: number; total: number; acc: number }[],
        primaryBook: '',
        accuracy: 0,
        diffRows: [] as { key: 'easy' | 'medium' | 'hard'; correct: number; total: number; pct: number }[],
        breakdown: null as null | { base: number; speed: number; combo: number; multiplier: number; total: number; hasBonuses: boolean },
        isHigh: false,
        tone: 'learning' as Tone,
        emoji: '📚'
      }
    }

    const bookMap: Record<string, { correct: number; total: number }> = {}
    stats.questions?.forEach((q, idx) => {
      if (!bookMap[q.book]) bookMap[q.book] = { correct: 0, total: 0 }
      bookMap[q.book].total++
      if (stats.userAnswers[idx] !== null && stats.userAnswers[idx] === q.correctAnswer[0]) {
        bookMap[q.book].correct++
      }
    })
    const bookList = Object.entries(bookMap).map(([book, v]) => ({
      book,
      correct: v.correct,
      total: v.total,
      acc: v.total ? v.correct / v.total : 0
    }))

    const acc = stats.totalQuestions > 0
      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
      : 0

    const rows = (['easy', 'medium', 'hard'] as const).map((k) => {
      const b = stats.difficultyBreakdown[k]
      const pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0
      return { key: k, correct: b.correct, total: b.total, pct }
    }).filter(r => r.total > 0)

    const base = typeof stats.baseScore === 'number' ? stats.baseScore : null
    const speed = typeof stats.speedBonus === 'number' ? stats.speedBonus : 0
    const combo = typeof stats.comboBonus === 'number' ? stats.comboBonus : 0
    const multiplier = typeof stats.comboMultiplier === 'number' ? stats.comboMultiplier : 1
    const total = stats.totalScore || 0
    const hasBonuses = (speed > 0 || combo > 0) && base !== null && base !== total

    const t = pickTone(acc)

    return {
      books: bookList,
      primaryBook: bookList[0]?.book ?? '',
      accuracy: acc,
      diffRows: rows,
      breakdown: hasBonuses ? { base: base ?? total, speed, combo, multiplier, total, hasBonuses: true } : null,
      isHigh: t.state === 'high',
      tone: t.tone,
      emoji: t.emoji
    }
  }, [stats])

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#11131e] flex items-center justify-center p-4">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md w-full border border-outline-variant/10">
          <span className="material-symbols-outlined text-error text-5xl mb-4 block">error</span>
          <h2 className="text-2xl font-black text-on-surface mb-2">{t('results.noData')}</h2>
          <p className="text-on-surface-variant text-sm mb-6">{t('results.errorLoading')}</p>
          <button onClick={onBackToHome} className="gold-gradient text-on-secondary font-black px-8 py-3 rounded-xl">
            {t('errors.goHome')}
          </button>
        </div>
      </div>
    )
  }

  // Hero variant tokens
  const heroBg = isHigh
    ? 'from-[rgba(74,222,128,0.08)] to-[rgba(50,52,64,0.4)]'
    : 'from-[rgba(96,165,250,0.08)] to-[rgba(50,52,64,0.4)]'
  const heroBorder = isHigh ? 'border-[rgba(74,222,128,0.25)]' : 'border-[rgba(96,165,250,0.25)]'
  const heroMessageClass = isHigh
    ? 'bg-gradient-to-br from-[#fbbf24] to-[#84cc16] bg-clip-text text-transparent'
    : 'text-[#93c5fd]'
  const accuracyColor = isHigh ? 'text-[#4ade80]' : 'text-[#93c5fd]'

  // Insight card (only show if we have a clear book context)
  const showInsight = books.length === 1
  const insightTone = isHigh
    ? { bg: 'bg-[rgba(74,222,128,0.06)]', border: 'border-[rgba(74,222,128,0.2)]', iconBg: 'bg-[rgba(74,222,128,0.15)]', iconBorder: 'border-[rgba(74,222,128,0.3)]', iconColor: 'text-[#86efac]' }
    : { bg: 'bg-[rgba(167,139,250,0.06)]', border: 'border-[rgba(167,139,250,0.2)]', iconBg: 'bg-[rgba(167,139,250,0.15)]', iconBorder: 'border-[rgba(167,139,250,0.3)]', iconColor: 'text-[#c4b5fd]' }

  // Multi-book breakdown
  const sorted = [...books].sort((a, b) => b.acc - a.acc)
  const strongest = sorted[0]
  const weakest = sorted.length > 1 ? sorted[sorted.length - 1] : null

  const diffMeta = {
    easy: { label: t('results.difficulty.easy'), labelShort: t('results.difficulty.easy'), labelColor: 'text-[#86efac]', barClass: 'bg-gradient-to-r from-[#4ade80] to-[#22c55e]' },
    medium: { label: t('results.difficulty.medium'), labelShort: t('results.difficulty.mediumShort'), labelColor: 'text-[#93c5fd]', barClass: 'bg-gradient-to-r from-[#60a5fa] to-[#3b82f6]' },
    hard: { label: t('results.difficulty.hard'), labelShort: t('results.difficulty.hard'), labelColor: 'text-[#fca5a5]', barClass: 'bg-gradient-to-r from-[#f87171] to-[#dc2626]' }
  } as const

  return (
    <div data-testid="quiz-results-page" className="min-h-screen bg-[#11131e] p-4 py-8 md:py-12">
      <main className="max-w-2xl mx-auto w-full flex flex-col">

        {/* HERO BLOCK */}
        <section
          className={`relative overflow-hidden rounded-3xl border-[1.5px] ${heroBorder} bg-gradient-to-br ${heroBg} px-6 py-7 md:px-8 md:py-8 mb-4 text-center`}
          data-testid="quiz-results-hero"
        >
          {isHigh && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 30%, rgba(251,191,36,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(74,222,128,0.12) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(232,168,50,0.1) 0%, transparent 50%)'
              }}
            />
          )}

          <div className="relative z-10">
            <div className="text-5xl md:text-6xl mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">{emoji}</div>
            <h1
              data-testid="quiz-results-grade"
              className={`text-2xl md:text-[28px] font-extrabold leading-tight mb-1.5 ${heroMessageClass}`}
            >
              {t(`results.tones.${tone}`)}
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant max-w-md mx-auto mb-5 leading-relaxed">
              {t(`results.tonesSub.${tone}`, { book: primaryBook || '' })}
            </p>

            {/* 3 stat row */}
            <div className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-white/[0.06] max-w-md mx-auto">
              <div className="bg-[rgba(17,19,30,0.5)] py-3 px-2">
                <div data-testid="quiz-results-score" className="text-lg md:text-xl font-extrabold leading-none mb-1 tabular-nums text-on-surface">
                  {stats.correctAnswers}
                  <span className="text-[#6b7280] font-semibold text-[0.7em]">/{stats.totalQuestions}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
                  <span className="md:hidden">{t('results.stats.correctShort')}</span>
                  <span className="hidden md:inline">{t('results.stats.correct')}</span>
                </div>
              </div>
              <div className="bg-[rgba(17,19,30,0.5)] py-3 px-2">
                <div data-testid="quiz-results-accuracy" className={`text-lg md:text-xl font-extrabold leading-none mb-1 tabular-nums ${accuracyColor}`}>
                  {accuracy}%
                </div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">{t('results.stats.accuracyShort')}</div>
              </div>
              <div className="bg-[rgba(17,19,30,0.5)] py-3 px-2">
                <div data-testid="quiz-results-total-score" className="text-lg md:text-xl font-extrabold leading-none mb-1 tabular-nums bg-gradient-to-br from-[#e8a832] to-[#fbbf24] bg-clip-text text-transparent">
                  {scoreDisplay}
                </div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
                  <span className="md:hidden">{t('results.stats.scoreShort')}</span>
                  <span className="hidden md:inline">{t('results.stats.score')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SCORE BREAKDOWN — only when there are real bonuses */}
        {breakdown && (
          <section className="bg-[rgba(50,52,64,0.4)] border border-[rgba(232,168,50,0.1)] rounded-2xl px-5 py-4 md:px-6 md:py-5 mb-3.5" data-testid="quiz-results-breakdown">
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-on-surface-variant inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#fbbf24]">check_circle</span>
                {t('results.breakdown.base')}
              </span>
              <span className="font-bold text-on-surface tabular-nums">{breakdown.base}</span>
            </div>
            {breakdown.speed > 0 && (
              <div className="flex items-center justify-between py-2 text-sm border-t border-white/[0.04]">
                <span className="text-on-surface-variant inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#fbbf24]">timer</span>
                  {t('results.breakdown.speedBonus')}
                </span>
                <span className="font-bold text-[#4ade80] tabular-nums">+{breakdown.speed}</span>
              </div>
            )}
            {breakdown.combo > 0 && (
              <div className="flex items-center justify-between py-2 text-sm border-t border-white/[0.04]">
                <span className="text-on-surface-variant inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#fbbf24]">local_fire_department</span>
                  {t('results.breakdown.combo', { multiplier: breakdown.multiplier })}
                </span>
                <span className="font-bold text-[#4ade80] tabular-nums">+{breakdown.combo}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3.5 mt-1.5 border-t-2 border-[rgba(232,168,50,0.2)]">
              <span className="font-bold text-on-surface text-[15px]">{t('results.breakdown.total')}</span>
              <span className="text-[22px] font-extrabold bg-gradient-to-br from-[#e8a832] to-[#fbbf24] bg-clip-text text-transparent tabular-nums">
                {scoreDisplay}
              </span>
            </div>
          </section>
        )}

        {/* INSIGHT CARD — only single-book context (placeholder text, no percentile API yet) */}
        {showInsight && (
          <section className={`flex items-center gap-3.5 rounded-2xl border ${insightTone.border} ${insightTone.bg} px-4 py-3.5 mb-3.5`} data-testid="quiz-results-insight">
            <div className={`w-10 h-10 rounded-[10px] grid place-items-center flex-shrink-0 border ${insightTone.iconBorder} ${insightTone.iconBg} ${insightTone.iconColor}`}>
              <span className="material-symbols-outlined text-[22px]">{isHigh ? 'trophy' : 'insights'}</span>
            </div>
            <p className="text-xs md:text-[13px] text-[#d1d5db] leading-relaxed">
              {primaryBook && (
                <>
                  <strong className={isHigh ? 'text-[#86efac] font-bold' : 'text-[#c4b5fd] font-bold'}>
                    {primaryBook}
                  </strong>
                  {' · '}
                </>
              )}
              {t('results.stats.correct')}: <strong className="text-on-surface font-bold">{stats.correctAnswers}/{stats.totalQuestions}</strong>
              {isHigh && <> · <strong className="text-[#86efac] font-bold">+1 streak</strong> 🔥</>}
            </p>
          </section>
        )}

        {/* ANALYSIS — diff rows for single-book; strongest/weakest for multi-book */}
        {books.length === 1 && diffRows.length > 0 && (
          <section className="bg-[rgba(50,52,64,0.3)] border border-white/[0.04] rounded-2xl px-5 py-4 md:px-6 md:py-5 mb-4">
            <h3 className="text-[13px] font-bold mb-3.5 flex items-center gap-2 text-[#d1d5db]">
              <span className="material-symbols-outlined text-base text-[#fbbf24]">analytics</span>
              {t('results.difficulty.title')}
            </h3>
            <div className="space-y-1">
              {diffRows.map(row => {
                const meta = diffMeta[row.key]
                return (
                  <div key={row.key} className="grid grid-cols-[58px_1fr_60px] md:grid-cols-[80px_1fr_70px] gap-2.5 items-center py-1.5">
                    <div className={`text-xs font-bold ${meta.labelColor}`}>
                      <span className="md:hidden">{meta.labelShort}</span>
                      <span className="hidden md:inline">{meta.label}</span>
                    </div>
                    <div className="h-2 bg-white/[0.05] rounded overflow-hidden">
                      <div
                        className={`h-full rounded ${meta.barClass} transition-[width] duration-500`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <div className="text-xs font-bold text-on-surface text-right tabular-nums">
                      {row.correct}/{row.total} <span className="text-[#6b7280] text-[10px] font-medium">{row.pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {books.length > 1 && strongest && (
          <section className="bg-[rgba(50,52,64,0.3)] border border-white/[0.04] rounded-2xl px-5 py-4 md:px-6 md:py-5 mb-4">
            <h3 className="text-[13px] font-bold mb-3.5 flex items-center gap-2 text-[#d1d5db]">
              <span className="material-symbols-outlined text-base text-[#fbbf24]">analytics</span>
              {t('results.analysis')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#4ade80]/5 border border-[#4ade80]/20 rounded-xl p-3.5">
                <p className="text-[#4ade80] font-bold text-xs mb-1">{t('results.strongest')}</p>
                <p className="text-on-surface font-bold text-sm">{strongest.book} ({Math.round(strongest.acc * 100)}%)</p>
              </div>
              <div className="bg-error/5 border border-error/20 rounded-xl p-3.5">
                <p className="text-error font-bold text-xs mb-1">{t('results.needsImprovement')}</p>
                <p className="text-on-surface font-bold text-sm">
                  {weakest && weakest.acc < 1 ? `${weakest.book} (${Math.round(weakest.acc * 100)}%)` : t('results.allExcellent')}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-2">
          <button
            data-testid="quiz-results-review-btn"
            onClick={() => navigate('/review', { state: { stats } })}
            className="w-full py-3.5 rounded-xl border border-white/[0.08] bg-[rgba(50,52,64,0.5)] text-[#d1d5db] hover:text-on-surface font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-base">visibility</span>
            <span className="md:hidden">{t('results.review')}</span>
            <span className="hidden md:inline">{t('results.actions.reviewLong')}</span>
          </button>
          <button
            data-testid="quiz-results-play-btn"
            onClick={onPlayAgain}
            className="w-full py-3.5 rounded-xl bg-gradient-to-br from-[#e8a832] to-[#d97706] text-[#11131e] shadow-[0_6px_20px_rgba(232,168,50,0.3)] font-extrabold text-sm flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span className="md:hidden">{t('results.playAgain')}</span>
            <span className="hidden md:inline">{t('results.actions.playAgainBook')}</span>
          </button>
        </div>
        <button
          data-testid="quiz-results-home-btn"
          onClick={onBackToHome}
          className="mt-2 w-full py-2.5 text-xs text-[#6b7280] hover:text-on-surface-variant underline underline-offset-[3px]"
        >
          {t('results.actions.backHome')}
        </button>

      </main>
    </div>
  )
}

export default QuizResults
