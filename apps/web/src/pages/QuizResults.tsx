import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { soundManager } from '../services/soundManager'
import { haptic } from '../utils/haptics'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

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

const QuizResults: React.FC<QuizResultsProps> = ({ stats, onPlayAgain, onBackToHome, isRanked = false, sessionId }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [scoreDisplay, setScoreDisplay] = useState(0)
  const [correctDisplay, setCorrectDisplay] = useState(0)
  const [timeDisplay, setTimeDisplay] = useState(0)

  function getGradeText(accuracy: number): { text: string; color: string; emoji: string } {
    if (accuracy >= 95) return { text: t('results.excellent'), color: 'text-yellow-400', emoji: '👑' }
    if (accuracy >= 80) return { text: t('results.excellent'), color: 'text-[#4ade80]', emoji: '⭐' }
    if (accuracy >= 60) return { text: t('results.good'), color: 'text-secondary', emoji: '💪' }
    if (accuracy >= 40) return { text: t('results.tryHarder'), color: 'text-blue-400', emoji: '📖' }
    return { text: t('results.tryHarder'), color: 'text-error', emoji: '🙏' }
  }

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

  // Animate counters
  useEffect(() => {
    const targetScore = stats.totalScore || 0
    const targetCorrect = stats.correctAnswers || 0
    const targetTime = Math.floor((stats.totalTime || 0) / 1000)
    const steps = 40
    let frame = 0
    const interval = setInterval(() => {
      frame++
      const p = Math.min(1, frame / steps)
      setScoreDisplay(Math.round(targetScore * p))
      setCorrectDisplay(Math.round(targetCorrect * p))
      setTimeDisplay(Math.round(targetTime * p))
      if (p >= 1) clearInterval(interval)
    }, 800 / steps)
    return () => clearInterval(interval)
  }, [stats.totalScore, stats.correctAnswers, stats.totalTime])

  // Sound effects on mount
  useEffect(() => {
    const accuracy = stats.totalQuestions > 0 ? (stats.correctAnswers / stats.totalQuestions) * 100 : 0
    if (accuracy >= 95) {
      soundManager.play('perfectScore')
      haptic.tierUp()
    } else if (accuracy >= 70) {
      soundManager.play('quizComplete')
      haptic.correct()
    } else {
      soundManager.play('quizComplete')
    }
  }, [])

  // Save ranked progress
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

  const accuracy = stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0
  const grade = getGradeText(accuracy)
  const totalMin = Math.floor(timeDisplay / 60)
  const totalSec = timeDisplay % 60
  const circumference = 2 * Math.PI * 70
  const strokeOffset = circumference - (circumference * accuracy) / 100
  const showConfetti = accuracy >= 80

  // Book insights
  const bookMap: Record<string, { correct: number; total: number }> = {}
  stats.questions?.forEach((q, idx) => {
    if (!bookMap[q.book]) bookMap[q.book] = { correct: 0, total: 0 }
    bookMap[q.book].total++
    if (stats.userAnswers[idx] !== null && stats.userAnswers[idx] === q.correctAnswer[0]) bookMap[q.book].correct++
  })
  const bookEntries = Object.entries(bookMap).map(([book, v]) => ({ book, ...v, acc: v.total ? v.correct / v.total : 0 }))
  const strongest = bookEntries.length > 0 ? bookEntries.reduce((a, b) => (b.acc > a.acc ? b : a)) : null
  const weakest = bookEntries.length > 0 ? bookEntries.reduce((a, b) => (b.acc < a.acc ? b : a)) : null

  return (
    <div data-testid="quiz-results-page" className="min-h-screen bg-[#11131e] flex items-center justify-center p-4 py-12">
      <main className="max-w-md mx-auto w-full flex flex-col items-center gap-8">

        {/* Score Circle */}
        <section className="relative flex flex-col items-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-surface-container-highest" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="url(#goldGrad)" strokeWidth="12" strokeLinecap="round"
                style={{ strokeDasharray: circumference, strokeDashoffset: strokeOffset, transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease-out' }} />
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f8bd45" />
                  <stop offset="100%" stopColor="#e7c268" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span data-testid="quiz-results-score" className="text-4xl font-extrabold tracking-tighter text-on-surface">{correctDisplay}/{stats.totalQuestions}</span>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-secondary font-bold text-lg uppercase tracking-widest">{accuracy}% {t('results.accuracy')}</p>
            <h1 className={`text-3xl font-black mt-1 ${grade.color}`}>{grade.text}</h1>
          </div>
        </section>

        {/* Confetti */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="absolute text-sm animate-bounce"
                style={{ left: `${10 + Math.random() * 80}%`, top: `${Math.random() * 40}%`, animationDelay: `${i * 50}ms`, color: i % 3 === 0 ? '#f8bd45' : i % 3 === 1 ? '#4ade80' : '#e7c268' }}>
                ✦
              </span>
            ))}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <div className="glass-card rounded-2xl py-3 px-2 flex flex-col items-center text-center border border-white/5">
            <span className="material-symbols-outlined text-secondary mb-1">schedule</span>
            <span className="text-sm font-bold text-on-surface">{totalMin}m {totalSec.toString().padStart(2, '0')}s</span>
          </div>
          <div className="glass-card rounded-2xl py-3 px-2 flex flex-col items-center text-center border border-white/5">
            <span className="material-symbols-outlined text-secondary mb-1" style={FILL_1}>stars</span>
            <span className="text-sm font-bold text-secondary">+{scoreDisplay} XP</span>
          </div>
          <div className="glass-card rounded-2xl py-3 px-2 flex flex-col items-center text-center border border-white/5">
            <span className="material-symbols-outlined text-[#ff6b6b] mb-1" style={FILL_1}>local_fire_department</span>
            <span className="text-sm font-bold text-on-surface">Streak</span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="glass-card w-full rounded-2xl p-6 space-y-4 border border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant font-medium">{t('results.baseScore')}:</span>
            <span className="font-bold text-on-surface">{stats.totalScore}</span>
          </div>
          <div className="pt-4 mt-2 border-t border-outline-variant/20 flex justify-between items-center">
            <span className="text-lg font-bold text-on-surface">{t('results.total')}:</span>
            <span className="text-3xl font-black text-secondary">{scoreDisplay} {t('results.points')}</span>
          </div>
        </div>

        {/* Insights */}
        {bookEntries.length > 0 && (
          <div className="glass-card w-full rounded-2xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">analytics</span>
              {t('results.analysis')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#4ade80]/5 border border-[#4ade80]/20 rounded-xl p-4">
                <p className="text-[#4ade80] font-bold text-xs mb-1 flex items-center gap-1">{t('results.strongest')}</p>
                <p className="text-on-surface font-bold text-sm">{strongest?.book} ({Math.round((strongest?.acc ?? 0) * 100)}%)</p>
              </div>
              <div className="bg-error/5 border border-error/20 rounded-xl p-4">
                <p className="text-error font-bold text-xs mb-1 flex items-center gap-1">{t('results.needsImprovement')}</p>
                <p className="text-on-surface font-bold text-sm">
                  {weakest && weakest.acc < 1 ? `${weakest.book} (${Math.round(weakest.acc * 100)}%)` : t('results.allExcellent')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <div className="flex gap-3 w-full">
            <button data-testid="quiz-results-review-btn" onClick={() => navigate('/review', { state: { stats } })}
              className="flex-1 glass-card py-4 rounded-xl font-bold text-on-surface flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-all border border-white/5">
              <span className="material-symbols-outlined text-sm">edit_note</span>
              {t('results.review')}
            </button>
            <button onClick={onPlayAgain}
              className="flex-1 glass-card py-4 rounded-xl font-bold text-on-surface flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-all border border-white/5">
              <span className="material-symbols-outlined text-sm">refresh</span>
              {t('results.playAgain')}
            </button>
          </div>
          <button data-testid="quiz-results-home-btn" onClick={onBackToHome}
            className="w-full gold-gradient py-4 rounded-xl font-black text-on-secondary shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <span className="material-symbols-outlined" style={FILL_1}>home</span>
            {t('results.home')}
          </button>
        </div>
      </main>
    </div>
  )
}

export default QuizResults
