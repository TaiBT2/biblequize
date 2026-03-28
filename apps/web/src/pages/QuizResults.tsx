import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './QuizResults.module.css'

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
  const [showDetailedReview, setShowDetailedReview] = useState(false)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null)
  const [scoreDisplay, setScoreDisplay] = useState(0)
  const [correctDisplay, setCorrectDisplay] = useState(0)
  const [timeDisplay, setTimeDisplay] = useState(0)

  console.log('QuizResults rendering with stats:', stats);
  console.log('Questions in stats:', stats.questions);
  console.log('User answers:', stats.userAnswers);

  // Fallback if no stats
  if (!stats) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center p-4">
        <div className="page-card p-8 text-center max-w-md w-full">
          <h2 className={`text-2xl font-black mb-4 ${styles.noDataTitle}`}>⚠️ Không có dữ liệu kết quả</h2>
          <p className={styles.noDataText}>
            Có vẻ như có lỗi khi tải dữ liệu quiz. Vui lòng thử lại.
          </p>
          <div className="space-y-4">
            <button
              onClick={onBackToHome}
              className="btn-secondary w-full"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Animate counters on mount
  useEffect(() => {
    const targetScore = stats.totalScore || 0
    const targetCorrect = stats.correctAnswers || 0
    const targetTime = Math.floor((stats.totalTime || 0) / 1000)
    const duration = 800
    const steps = 40
    let frame = 0
    const interval = setInterval(() => {
      frame++
      const progress = Math.min(1, frame / steps)
      setScoreDisplay(Math.round(targetScore * progress))
      setCorrectDisplay(Math.round(targetCorrect * progress))
      setTimeDisplay(Math.round(targetTime * progress))
      if (progress >= 1) clearInterval(interval)
    }, duration / steps)
    return () => clearInterval(interval)
  }, [stats.totalScore, stats.correctAnswers, stats.totalTime])

  const totalMinutes = Math.floor((timeDisplay || 0) / 60)
  const totalSeconds = Math.floor((timeDisplay || 0) % 60)

  const saveProgress = async () => {
    try {
      // Only save progress for ranked mode
      if (!isRanked) return

      // Don't call server API here as it will overwrite the current progress
      // The progress is already saved during gameplay in Quiz.tsx
      console.log('QuizResults: Skipping server API call to avoid overwriting progress')

      // Just ensure localStorage has today's data
      const today = new Date().toISOString().slice(0, 10)
      const currentSnapshot = JSON.parse(localStorage.getItem('rankedSnapshot') || '{}')

      if (currentSnapshot.date === today) {
        console.log('QuizResults: Using existing localStorage data:', currentSnapshot)
        localStorage.setItem('rankedProgress', JSON.stringify({
          ...currentSnapshot,
          cap: 500,
          dailyLives: 30
        }))
      } else {
        console.log('QuizResults: Setting defaults for new day')
        const defaultData = {
          date: today,
          livesRemaining: 30,
          questionsCounted: 0,
          pointsToday: 0,
          cap: 500,
          dailyLives: 30,
        }
        localStorage.setItem('rankedSnapshot', JSON.stringify(defaultData))
        localStorage.setItem('rankedProgress', JSON.stringify(defaultData))
      }
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  // Save once when mounted
  React.useEffect(() => { saveProgress() }, [])

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4 py-12">
      <div className="page-card p-8 md:p-12 text-center max-w-4xl w-full">
        <h2 className={styles.title}>🎯 Kết quả bài quiz</h2>

        {/* Simple Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { value: String(scoreDisplay), label: 'Tổng điểm' },
            { value: `${correctDisplay}/${stats.totalQuestions || 0}`, label: 'Câu đúng' },
            { value: `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`, label: 'Thời gian' },
          ].map(({ value, label }) => (
            <div key={label} className={styles.statCard}>
              <div className={styles.statValue}>
                {value}
              </div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* Celebration particles for good performance */}
        {stats.totalQuestions > 0 && stats.correctAnswers / stats.totalQuestions >= 0.8 && (
          <div className="relative h-0">
            <div className={styles.confettiWrapper}>
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${45 + Math.random() * 10}%`,
                    top: 0,
                    opacity: 0.8,
                    fontSize: '12px',
                    color: i % 2 ? '#67e8f9' : '#22c55e',
                    animation: `confetti${i % 3} 1000ms ease-out ${i * 30}ms forwards`,
                  }}
                >
                  ✦
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
          <button
            onClick={() => navigate('/review', { state: { stats } })}
            className="btn-secondary px-8 py-3.5 text-lg"
          >
            🔎 Xem Lại
          </button>
          <button
            onClick={onPlayAgain}
            className="btn-primary px-10 py-3.5 text-lg"
          >
            🔄 Chơi Tiếp
          </button>
          <button
            onClick={onBackToHome}
            className="btn-secondary px-8 py-3.5 text-lg"
          >
            🏠 Trang Chủ
          </button>
        </div>

        {/* Performance insights */}
        {stats.questions && stats.questions.length > 0 && (
          <div className={styles.insightsPanel}>
            <h3 className={styles.insightsPanelTitle}>
              <span>📊</span> Phân tích kết quả
            </h3>
            <Insights stats={stats} />
          </div>
        )}
      </div>
    </div>
  )
}

// Simple insights component: strongest and weakest books by accuracy
const Insights: React.FC<{ stats: QuizStats }> = ({ stats }) => {
  const map: Record<string, { correct: number; total: number }> = {}
  stats.questions.forEach((q, idx) => {
    const book = q.book
    if (!map[book]) map[book] = { correct: 0, total: 0 }
    map[book].total += 1
    const ans = stats.userAnswers[idx]
    if (ans !== null && ans === q.correctAnswer[0]) map[book].correct += 1
  })
  const entries = Object.entries(map).map(([book, v]) => ({ book, correct: v.correct, total: v.total, acc: v.total ? v.correct / v.total : 0 }))
  if (entries.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="neon-card p-4">
          <div className={styles.insightCardLabelStrong}>🏆 Chủ đề mạnh nhất</div>
          <div className={styles.insightCardMuted}>—</div>
        </div>
        <div className={styles.insightCardWeak}>
          <div className={styles.insightCardLabelWeak}>✏️ Cần cải thiện</div>
          <div className={styles.insightCardMuted}>—</div>
        </div>
      </div>
    )
  }
  const strongest = entries.reduce((best, cur) => (cur.acc > best.acc ? cur : best), entries[0])
  const weakest = entries.reduce((worst, cur) => (cur.acc < worst.acc ? cur : worst), entries[0])
  const minAcc = weakest.acc
  const maxAcc = strongest.acc
  const allPerfect = minAcc === maxAcc && maxAcc === 1
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className={styles.insightCardStrong}>
        <div className={styles.insightCardLabelStrong}>
          <span>🏆</span> Chủ đề mạnh nhất
        </div>
        <div className={styles.insightCardValue}>{`${strongest.book} (${Math.round(strongest.acc * 100)}%)`}</div>
      </div>
      <div className={styles.insightCardWeak}>
        <div className={styles.insightCardLabelWeak}>
          <span>✏️</span> Cần cải thiện
        </div>
        <div className={styles.insightCardValue}>{allPerfect ? 'Không có! Bạn đã nắm vững tất cả.' : `${weakest.book} (${Math.round(weakest.acc * 100)}%)`}</div>
      </div>
    </div>
  )
}

export default QuizResults
