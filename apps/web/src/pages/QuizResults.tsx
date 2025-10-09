import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'

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
      <div className="min-h-screen style={{ backgroundColor: '#0E0B1A' }} flex items-center justify-center p-4">
        <div className="neon-card p-8 text-center max-w-md">
          <h2 className="neon-text text-2xl mb-4">⚠️ Không có dữ liệu kết quả</h2>
          <p className="text-gray-300 mb-6">
            Có vẻ như có lỗi khi tải dữ liệu quiz. Vui lòng thử lại.
          </p>
          <div className="space-y-4">
            <button
              onClick={onBackToHome}
              className="neon-btn neon-btn-blue px-6 py-2"
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
    <div className="min-h-screen style={{ backgroundColor: '#0E0B1A' }} flex items-center justify-center p-4">
      <div className="neon-card p-8 text-center max-w-4xl w-full">
        <h2 className="neon-text text-4xl mb-8">🎯 Kết Quả Bài Quiz</h2>
        
        {/* Simple Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="neon-card p-6">
            <div className="neon-green text-3xl font-bold mb-2">
              {scoreDisplay}
            </div>
            <div className="text-gray-300">Tổng điểm</div>
          </div>
          <div className="neon-card p-6">
            <div className="neon-blue text-3xl font-bold mb-2">
              {correctDisplay}/{stats.totalQuestions || 0}
            </div>
            <div className="text-gray-300">Câu đúng</div>
          </div>
          <div className="neon-card p-6">
            <div className="neon-pink text-3xl font-bold mb-2">
              {totalMinutes}:{totalSeconds.toString().padStart(2, '0')}
            </div>
            <div className="text-gray-300">Tổng thời gian</div>
          </div>
        </div>

        {/* Celebration particles for good performance */}
        {stats.totalQuestions > 0 && stats.correctAnswers / stats.totalQuestions >= 0.8 && (
          <div className="relative h-0">
            <div className="pointer-events-none select-none" style={{
              position: 'absolute', left: 0, right: 0, top: -12, height: 0,
              filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.45))'
            }}>
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
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/review', { state: { stats } })}
            className="neon-btn neon-btn-orange px-8 py-3 text-lg"
          >
            🔎 Xem Lại Câu Trả Lời
          </button>
          <button
            onClick={onPlayAgain}
            className="px-8 py-3 text-lg font-semibold rounded-xl text-[#0E0B1A]"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #86efac 100%)', boxShadow: '0 8px 25px rgba(34,197,94,0.35)' }}
          >
            🔄 Chơi Tiếp
          </button>
          <button
            onClick={onBackToHome}
            className="neon-btn neon-btn-blue px-8 py-3 text-lg"
          >
            🏠 Về Màn Ranked
          </button>
        </div>

        {/* Performance insights */}
        {stats.questions && stats.questions.length > 0 && (
          <div className="mt-10 text-left max-w-3xl mx-auto">
            <h3 className="text-gray-200 font-semibold mb-3">📊 Phân tích hiệu suất</h3>
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
          <div className="text-green-300 font-bold mb-1">🏆 Chủ đề mạnh nhất</div>
          <div className="text-gray-200">—</div>
        </div>
        <div className="neon-card p-4">
          <div className="text-pink-300 font-bold mb-1">✏️ Cần cải thiện</div>
          <div className="text-gray-200">—</div>
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
      <div className="neon-card p-4">
        <div className="text-green-300 font-bold mb-1">🏆 Chủ đề mạnh nhất</div>
        <div className="text-gray-200">{`${strongest.book} (${Math.round(strongest.acc * 100)}%)`}</div>
      </div>
      <div className="neon-card p-4">
        <div className="text-pink-300 font-bold mb-1">✏️ Cần cải thiện</div>
        <div className="text-gray-200">{allPerfect ? 'Không có! Bạn đã nắm vững tất cả.' : `${weakest.book} (${Math.round(weakest.acc * 100)}%)`}</div>
      </div>
    </div>
  )
}

export default QuizResults
