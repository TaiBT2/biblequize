import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import BookProgress from '../components/BookProgress'

interface RankedStatus {
  date: string
  livesRemaining: number
  questionsCounted: number
  pointsToday: number
  cap: number
  dailyLives: number
  currentBook: string
  currentBookIndex: number
  isPostCycle: boolean
  currentDifficulty: string
  nextBook?: string
  resetAt: string
  bookProgress?: {
    currentIndex: number
    totalBooks: number
    currentBook: string
    nextBook: string
    isCompleted: boolean
    progressPercentage: number
  }
  questionsInCurrentBook?: number
  correctAnswersInCurrentBook?: number
}

export default function Ranked() {
  const [rankedStatus, setRankedStatus] = useState<RankedStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isQuizStarted, setIsQuizStarted] = useState(false)
  const navigate = useNavigate()

  const fetchStatus = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/api/me/ranked-status')
      // Always use API data only, completely ignore localStorage
      let merged = res.data
      console.log('API Response:', res.data)
      
      // Clear any old localStorage data to prevent conflicts
      localStorage.removeItem('rankedProgress')
      
      console.log('Setting rankedStatus to:', merged)
      setRankedStatus(merged)
    } catch (e) {
      console.error('Failed to load ranked status', e)
      setRankedStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial load
    fetchStatus()
    
    // Auto-refresh only when page becomes visible (user comes back from quiz)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStatus()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Cleanup event listener on unmount
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const startRankedQuiz = async () => {
    try {
      const res = await api.post('/api/ranked/sessions')
      const sessionId = res.data.sessionId
      // Fetch ranked questions (default 10, current book if available)
      let questions: any[] = []
      try {
        const params1: any = { limit: 10 }
        if (rankedStatus?.currentBook) params1.book = rankedStatus.currentBook
        // Only pass difficulty when not 'all'
        if (rankedStatus?.currentDifficulty && rankedStatus.currentDifficulty !== 'all') {
          params1.difficulty = rankedStatus.currentDifficulty
        }
        const q = await api.get('/api/questions', { params: params1 })
        questions = q.data || []
        if (!questions || questions.length === 0) {
          // Fallback: fetch with no filters
          const q2 = await api.get('/api/questions', { params: { limit: 10 } })
          questions = q2.data || []
        }
      } catch (e) {
        console.error('Failed to fetch ranked questions', e)
      }
      setIsQuizStarted(true)
      navigate('/quiz', { state: { sessionId, mode: 'ranked', questions, showExplanation: false, isRanked: true } })
    } catch (e) {
      console.error('Failed to start ranked session', e)
      alert('Không thể bắt đầu xếp hạng, vui lòng thử lại')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen neon-bg flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 left-20 text-5xl neon-orange opacity-20 animate-pulse">🏆</div>
        <div className="absolute bottom-20 right-20 text-5xl neon-pink opacity-20 animate-pulse">⚡</div>
        
        <div className="text-center">
          <div className="neon-card p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
            <p className="neon-text text-white">Đang tải...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!rankedStatus) {
    return (
      <div className="min-h-screen neon-bg flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 left-20 text-5xl neon-red opacity-20 animate-pulse">❌</div>
        <div className="absolute bottom-20 right-20 text-5xl neon-blue opacity-20 animate-pulse">🔄</div>
        
        <div className="text-center">
          <div className="neon-card p-8">
            <p className="neon-text text-white mb-6">Không thể tải trạng thái xếp hạng</p>
            <Link 
              to="/" 
              className="neon-btn neon-btn-blue px-6 py-2"
            >
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const canPlay = rankedStatus.livesRemaining > 0 && rankedStatus.questionsCounted < rankedStatus.cap
  const progressPercentage = (rankedStatus.questionsCounted / rankedStatus.cap) * 100
  
  console.log('Ranked Status Debug:', {
    livesRemaining: rankedStatus.livesRemaining,
    questionsCounted: rankedStatus.questionsCounted,
    cap: rankedStatus.cap,
    canPlay: canPlay
  })

  return (
    <div className="min-h-screen neon-bg flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-10 left-10 text-4xl neon-orange opacity-20 animate-pulse">🏆</div>
      <div className="absolute top-20 right-20 text-4xl neon-pink opacity-20 animate-pulse">⚡</div>
      <div className="absolute bottom-20 left-20 text-3xl neon-green opacity-15 animate-pulse">📈</div>
      <div className="absolute bottom-10 right-10 text-3xl neon-blue opacity-15 animate-pulse">🎯</div>
      
      <div className="max-w-6xl w-full mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="neon-border-orange p-8 rounded-2xl mb-8 bg-black bg-opacity-30">
            <h1 className="text-6xl font-bold mb-4 glitch">
              <span className="neon-orange">C</span>
              <span className="neon-pink">H</span>
              <span className="neon-green">Ế</span>
              <span className="neon-blue"> Đ</span>
              <span className="neon-orange">Ộ</span>
              <span className="neon-pink"> X</span>
              <span className="neon-green">Ế</span>
              <span className="neon-blue">P</span>
              <span className="neon-orange"> H</span>
              <span className="neon-pink">Ạ</span>
              <span className="neon-green">N</span>
              <span className="neon-blue">G</span>
            </h1>
            <p className="text-xl neon-text text-white">Leo hạng với 50 câu/ngày, 10 mạng</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Lives */}
          <div className="neon-card p-6 text-center group hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 neon-border-pink rounded-full flex items-center justify-center mx-auto mb-4 group-hover:neon-border-red transition-all duration-300">
              <svg className="w-8 h-8 neon-pink group-hover:neon-red transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold neon-pink mb-2">{rankedStatus.livesRemaining}</h3>
            <p className="text-white opacity-80 mb-1">Mạng còn lại</p>
            <p className="text-sm text-white opacity-60">/ {rankedStatus.dailyLives}</p>
          </div>

          {/* Questions Counted */}
          <div className="neon-card p-6 text-center group hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 neon-border-blue rounded-full flex items-center justify-center mx-auto mb-4 group-hover:neon-border-green transition-all duration-300">
              <svg className="w-8 h-8 neon-blue group-hover:neon-green transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold neon-blue mb-2">{rankedStatus.questionsCounted}</h3>
            <p className="text-white opacity-80 mb-1">Câu đã tính</p>
            <p className="text-sm text-white opacity-60">/ {rankedStatus.cap}</p>
          </div>

          {/* Points Today */}
          <div className="neon-card p-6 text-center group hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 neon-border-orange rounded-full flex items-center justify-center mx-auto mb-4 group-hover:neon-border-yellow transition-all duration-300">
              <svg className="w-8 h-8 neon-orange group-hover:neon-yellow transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold neon-orange mb-2">{rankedStatus.pointsToday}</h3>
            <p className="text-white opacity-80">Điểm hôm nay</p>
          </div>

          {/* Current Book */}
          <div className="neon-card p-6 text-center group hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 neon-border-green rounded-full flex items-center justify-center mx-auto mb-4 group-hover:neon-border-blue transition-all duration-300">
              <svg className="w-8 h-8 neon-green group-hover:neon-blue transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold neon-green mb-2">{rankedStatus.currentBook}</h3>
            <p className="text-white opacity-80 mb-1">Sách hiện tại</p>
            {rankedStatus.nextBook && (
              <p className="text-sm text-white opacity-60">Tiếp theo: {rankedStatus.nextBook}</p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="neon-card p-8 mb-8">
          <h3 className="text-xl font-bold neon-blue mb-6 text-center">Tiến độ hôm nay</h3>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-neon-blue to-neon-pink h-4 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-white">
            <span className="neon-blue font-bold">{rankedStatus.questionsCounted} / {rankedStatus.cap} câu</span>
            <span className="neon-pink font-bold">{Math.round(progressPercentage)}%</span>
          </div>
        </div>

        {/* Book Progression */}
        <div className="mb-8">
          <BookProgress 
            currentBook={rankedStatus.currentBook}
            nextBook={rankedStatus.nextBook}
            currentIndex={rankedStatus.bookProgress?.currentIndex || rankedStatus.currentBookIndex + 1}
            totalBooks={rankedStatus.bookProgress?.totalBooks || 66}
            progressPercentage={rankedStatus.bookProgress?.progressPercentage || 0}
            isCompleted={rankedStatus.bookProgress?.isCompleted || rankedStatus.isPostCycle}
            questionsInCurrentBook={rankedStatus.questionsInCurrentBook || 0}
            correctAnswersInCurrentBook={rankedStatus.correctAnswersInCurrentBook || 0}
          />
        </div>

        {/* Status Messages */}
        {!canPlay && (
          <div className="neon-border-orange p-6 mb-8 bg-black bg-opacity-30">
            <div className="flex items-start">
              <svg className="w-6 h-6 neon-orange mt-1 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-bold neon-orange mb-2">Không thể chơi xếp hạng</h4>
                <p className="text-white opacity-80">
                  {rankedStatus.livesRemaining === 0 
                    ? 'Bạn đã hết mạng. Hãy chờ reset ngày mai hoặc chơi luyện tập.'
                    : 'Bạn đã đạt giới hạn 50 câu/ngày. Hãy chờ reset ngày mai.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {rankedStatus.isPostCycle && (
          <div className="neon-border-pink p-6 mb-8 bg-black bg-opacity-30">
            <div className="flex items-start">
              <svg className="w-6 h-6 neon-pink mt-1 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h4 className="font-bold neon-pink mb-2">Hậu chu kỳ</h4>
                <p className="text-white opacity-80">
                  Bạn đã hoàn thành tất cả sách! Bây giờ sẽ nhận câu hỏi khó từ bất kỳ sách nào.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center space-y-6">
          {canPlay ? (
            <button
              onClick={startRankedQuiz}
              className="neon-btn neon-btn-orange px-12 py-4 text-xl"
            >
              Bắt Đầu Xếp Hạng
            </button>
          ) : (
            <div className="flex justify-center gap-6">
              <button
                disabled
                className="neon-btn neon-btn-blue px-12 py-4 text-xl opacity-50 cursor-not-allowed"
              >
                Không thể chơi xếp hạng
              </button>
              <Link
                to="/practice"
                className="neon-btn neon-btn-green px-12 py-4 text-xl"
              >
                Chuyển sang Luyện Tập
              </Link>
            </div>
          )}

          <div className="neon-card p-4">
            <p className="text-white opacity-80">
              Reset hàng ngày lúc: <span className="neon-blue font-bold">{new Date(rankedStatus.resetAt).toLocaleTimeString('vi-VN')}</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center mt-8">
          <Link 
            to="/" 
            className="neon-btn neon-btn-green px-6 py-2"
          >
            ← Quay lại trang chủ
          </Link>
          <Link 
            to="/leaderboard" 
            className="neon-btn neon-btn-blue px-6 py-2 ml-3"
          >
            📊 Bảng Xếp Hạng
          </Link>
          <button
            onClick={() => {
              setIsLoading(true)
              fetchStatus()
            }}
            className="neon-btn neon-btn-orange px-4 py-2 ml-3 text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-orange to-transparent opacity-50"></div>
        <div className="absolute top-1/3 right-0 w-px h-32 bg-gradient-to-b from-transparent via-neon-pink to-transparent opacity-50"></div>
        <div className="absolute bottom-1/4 left-0 w-px h-24 bg-gradient-to-b from-transparent via-neon-green to-transparent opacity-50"></div>
      </div>
    </div>
  )
}