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

  console.log('QuizResults rendering with stats:', stats);
  console.log('Questions in stats:', stats.questions);
  console.log('User answers:', stats.userAnswers);

  // Fallback if no stats
  if (!stats) {
    return (
      <div className="min-h-screen neon-bg flex items-center justify-center p-4">
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

  // Simple version for testing
  const totalMinutes = Math.floor((stats.totalTime || 0) / 60000)
  const totalSeconds = Math.floor(((stats.totalTime || 0) % 60000) / 1000)

  const saveProgress = async () => {
    try {
      // Save to localStorage for immediate UI update
      const prev = JSON.parse(localStorage.getItem('rankedProgress') || '{}')
      const today = new Date().toISOString().slice(0,10)
      const updated = {
        date: today,
        livesRemaining: Math.max(0, (prev.livesRemaining ?? 1000) - (stats.totalQuestions - stats.correctAnswers)),
        questionsCounted: (prev.questionsCounted ?? 0) + stats.totalQuestions,
        pointsToday: (prev.pointsToday ?? 0) + (stats.totalScore ?? 0),
        cap: 1000,
        dailyLives: 1000,
      }
      localStorage.setItem('rankedProgress', JSON.stringify(updated))
      
      // Note: Database updates are handled in Quiz.tsx during gameplay
      // No need to submit again here to avoid duplicate submissions
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  // Save once when mounted
  React.useEffect(() => { saveProgress() }, [])

  return (
    <div className="min-h-screen neon-bg flex items-center justify-center p-4">
      <div className="neon-card p-8 text-center max-w-4xl w-full">
        <h2 className="neon-text text-4xl mb-8">🎯 Kết Quả Bài Quiz</h2>
        
        {/* Simple Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="neon-card p-6">
            <div className="neon-green text-3xl font-bold mb-2">
              {stats.totalScore || 0}
            </div>
            <div className="text-gray-300">Tổng điểm</div>
          </div>
          <div className="neon-card p-6">
            <div className="neon-blue text-3xl font-bold mb-2">
              {stats.correctAnswers || 0}/{stats.totalQuestions || 0}
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
            className="neon-btn neon-btn-green px-8 py-3 text-lg"
          >
            🔄 Chơi Lại
          </button>
          <button
            onClick={onBackToHome}
            className="neon-btn neon-btn-blue px-8 py-3 text-lg"
          >
            🏠 Về Trang Chủ
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuizResults
