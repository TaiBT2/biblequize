import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import BookProgress from '../components/BookProgress'
import { useAuth } from '../contexts/AuthContext'

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
  const { user, isAuthenticated, logout } = useAuth()


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
    
    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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
    <div className="min-h-screen" style={{ backgroundColor: '#0E0B1A' }}>

      {/* Main Content */}
      <div className="flex items-center justify-center relative overflow-hidden py-8" style={{ zIndex: 1 }}>
      {/* Background Elements */}
        <div className="absolute top-10 left-10 text-4xl opacity-20 animate-pulse" style={{ color: '#FF8C42' }}>🏆</div>
        <div className="absolute top-20 right-20 text-4xl opacity-20 animate-pulse" style={{ color: '#FF6B9D' }}>⚡</div>
        <div className="absolute bottom-20 left-20 text-3xl opacity-15 animate-pulse" style={{ color: '#00FF88' }}>📈</div>
        <div className="absolute bottom-10 right-10 text-3xl opacity-15 animate-pulse" style={{ color: '#00FFFF' }}>🎯</div>
      
        <div className="max-w-6xl w-full mx-auto px-4 relative" style={{ zIndex: 2 }}>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="p-8 rounded-2xl mb-8"
               style={{
                 background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
                 border: '2px solid #FF8C42',
                 boxShadow: '0 0 30px rgba(255, 140, 66, 0.3), inset 0 0 30px rgba(255, 140, 66, 0.1)',
                 backdropFilter: 'blur(10px)'
               }}>
            <h1 className="text-6xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #00FFFF 0%, #9333EA 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
                }}>
              CHẾ ĐỘ XẾP HẠNG
            </h1>
            <p className="text-xl text-white opacity-90 mb-2">Leo hạng với 50 câu/ngày, 10 mạng</p>
            <p className="text-lg text-yellow-300 font-semibold">Chứng tỏ sự am hiểu của bạn và chinh phục bảng vàng!</p>
          </div>
        </div>

        {/* Rewards Section - Premium Vitrine */}
        <div className="mb-8 p-8 rounded-3xl relative overflow-hidden"
             style={{
               background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 140, 0, 0.15) 50%, rgba(255, 215, 0, 0.1) 100%)',
               border: '3px solid #FFD700',
               boxShadow: '0 0 50px rgba(255, 215, 0, 0.5), inset 0 0 50px rgba(255, 215, 0, 0.1)',
               backdropFilter: 'blur(15px)'
             }}>
          {/* Animated background elements */}
          <div className="absolute top-4 right-4 text-6xl opacity-20 animate-pulse">✨</div>
          <div className="absolute bottom-4 left-4 text-4xl opacity-15 animate-bounce">🏆</div>
          
          <div className="flex items-center justify-between">
            {/* Left side - Avatar Frame Preview */}
            <div className="flex-1 pr-8">
              <h3 className="text-3xl font-bold mb-4" style={{ 
                color: '#FFD700',
                textShadow: '0 0 25px rgba(255, 215, 0, 0.7)'
              }}>🏆 Phần Thưởng Mùa Này</h3>
              
              {/* Avatar Frame Preview */}
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full border-4 border-yellow-400 relative overflow-hidden"
                     style={{
                       background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                       boxShadow: '0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.3)'
                     }}>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">A</span>
                  </div>
                  {/* Glowing ring effect */}
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-300 animate-ping opacity-75"></div>
                </div>
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce">👑</div>
              </div>
              
              <p className="text-lg text-white mt-4 font-medium">Khung Avatar Độc Quyền</p>
              <p className="text-sm text-yellow-200">Chỉ dành cho Top 100</p>
            </div>
            
            {/* Right side - Rewards List */}
            <div className="flex-1 pl-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 rounded-xl"
                     style={{
                       background: 'rgba(255, 215, 0, 0.1)',
                       border: '1px solid rgba(255, 215, 0, 0.3)'
                     }}>
                  <div className="text-3xl">🏆</div>
                  <div>
                    <p className="text-lg font-bold text-white">Danh hiệu: Học Giả Xuất Sắc</p>
                    <p className="text-sm text-yellow-200">Vinh danh vĩnh viễn</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 rounded-xl"
                     style={{
                       background: 'rgba(255, 215, 0, 0.1)',
                       border: '1px solid rgba(255, 215, 0, 0.3)'
                     }}>
                  <div className="text-3xl">✨</div>
                  <div>
                    <p className="text-lg font-bold text-white">500 Điểm Thưởng</p>
                    <p className="text-sm text-yellow-200">Nâng cấp nhanh chóng</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 rounded-xl"
                     style={{
                       background: 'rgba(255, 215, 0, 0.1)',
                       border: '1px solid rgba(255, 215, 0, 0.3)'
                     }}>
                  <div className="text-3xl">💎</div>
                  <div>
                    <p className="text-lg font-bold text-white">Quyền Truy cập VIP</p>
                    <p className="text-sm text-yellow-200">Tính năng độc quyền</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Lives */}
          <div className="p-6 text-center group hover:scale-105 hover:shadow-2xl hover:border-opacity-100 transition-all duration-300 cursor-pointer rounded-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
                 border: '2px solid #FF6B9D',
                 boxShadow: '0 0 30px rgba(255, 107, 157, 0.3), inset 0 0 30px rgba(255, 107, 157, 0.1)',
                 backdropFilter: 'blur(10px)'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.boxShadow = '0 0 50px rgba(255, 107, 157, 0.6), inset 0 0 50px rgba(255, 107, 157, 0.2)';
                 e.currentTarget.style.borderColor = '#FF6B9D';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 107, 157, 0.3), inset 0 0 30px rgba(255, 107, 157, 0.1)';
                 e.currentTarget.style.borderColor = '#FF6B9D';
               }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300"
                 style={{
                   border: '2px solid #FF6B9D',
                   boxShadow: '0 0 15px #FF6B9D, inset 0 0 15px rgba(255, 107, 157, 0.1)'
                 }}>
              <svg className="w-8 h-8 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF6B9D' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-5xl font-black mb-2" style={{ 
              color: '#FF6B9D',
              textShadow: '0 0 20px rgba(255, 107, 157, 0.5)'
            }}>{rankedStatus.livesRemaining}</h3>
            <p className="text-sm text-white opacity-80 mb-1">Mạng còn lại</p>
            <p className="text-xs text-white opacity-60">/ {rankedStatus.dailyLives}</p>
          </div>

          {/* Questions Counted */}
          <div className="p-6 text-center group hover:scale-105 hover:shadow-2xl hover:border-opacity-100 transition-all duration-300 cursor-pointer rounded-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
                 border: '2px solid #00FFFF',
                 boxShadow: '0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)',
                 backdropFilter: 'blur(10px)'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.boxShadow = '0 0 50px rgba(0, 255, 255, 0.6), inset 0 0 50px rgba(0, 255, 255, 0.2)';
                 e.currentTarget.style.borderColor = '#00FFFF';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)';
                 e.currentTarget.style.borderColor = '#00FFFF';
               }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300"
                 style={{
                   border: '2px solid #00FFFF',
                   boxShadow: '0 0 15px #00FFFF, inset 0 0 15px rgba(0, 255, 255, 0.1)'
                 }}>
              <svg className="w-8 h-8 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#00FFFF' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-5xl font-black mb-2" style={{ 
              color: '#00FFFF',
              textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
            }}>{rankedStatus.questionsCounted}</h3>
            <p className="text-sm text-white opacity-80 mb-1">Câu đã tính</p>
            <p className="text-xs text-white opacity-60">/ {rankedStatus.cap}</p>
          </div>

          {/* Points Today */}
          <div className="p-6 text-center group hover:scale-105 hover:shadow-2xl hover:border-opacity-100 transition-all duration-300 cursor-pointer rounded-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
                 border: '2px solid #FF8C42',
                 boxShadow: '0 0 30px rgba(255, 140, 66, 0.3), inset 0 0 30px rgba(255, 140, 66, 0.1)',
                 backdropFilter: 'blur(10px)'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.boxShadow = '0 0 50px rgba(255, 140, 66, 0.6), inset 0 0 50px rgba(255, 140, 66, 0.2)';
                 e.currentTarget.style.borderColor = '#FF8C42';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 140, 66, 0.3), inset 0 0 30px rgba(255, 140, 66, 0.1)';
                 e.currentTarget.style.borderColor = '#FF8C42';
               }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300"
                 style={{
                   border: '2px solid #FF8C42',
                   boxShadow: '0 0 15px #FF8C42, inset 0 0 15px rgba(255, 140, 66, 0.1)'
                 }}>
              <svg className="w-8 h-8 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF8C42' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-5xl font-black mb-2" style={{ 
              color: '#FF8C42',
              textShadow: '0 0 20px rgba(255, 140, 66, 0.5)'
            }}>{rankedStatus.pointsToday}</h3>
            <p className="text-sm text-white opacity-80">Điểm hôm nay</p>
          </div>

          {/* Current Book */}
          <div className="p-6 text-center group hover:scale-105 hover:shadow-2xl hover:border-opacity-100 transition-all duration-300 cursor-pointer rounded-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
                 border: '2px solid #00FF88',
                 boxShadow: '0 0 30px rgba(0, 255, 136, 0.3), inset 0 0 30px rgba(0, 255, 136, 0.1)',
                 backdropFilter: 'blur(10px)'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.boxShadow = '0 0 50px rgba(0, 255, 136, 0.6), inset 0 0 50px rgba(0, 255, 136, 0.2)';
                 e.currentTarget.style.borderColor = '#00FF88';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.3), inset 0 0 30px rgba(0, 255, 136, 0.1)';
                 e.currentTarget.style.borderColor = '#00FF88';
               }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300"
                 style={{
                   border: '2px solid #00FF88',
                   boxShadow: '0 0 15px #00FF88, inset 0 0 15px rgba(0, 255, 136, 0.1)'
                 }}>
              <svg className="w-8 h-8 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#00FF88' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-black mb-2" style={{ 
              color: '#00FF88',
              textShadow: '0 0 15px rgba(0, 255, 136, 0.5)'
            }}>{rankedStatus.currentBook}</h3>
            <p className="text-sm text-white opacity-80 mb-1">Sách hiện tại</p>
            {rankedStatus.nextBook && (
              <div className="flex items-center justify-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#00FF88' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <p className="text-xs text-white opacity-60">Tiếp theo: {rankedStatus.nextBook}</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-8 mb-8 rounded-2xl"
             style={{
               background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
               border: '2px solid #00FFFF',
               boxShadow: '0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)',
               backdropFilter: 'blur(10px)'
             }}>
          <h3 className="text-2xl font-bold mb-6 text-center" style={{ 
            color: '#00FFFF',
            textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
          }}>Tiến độ hôm nay</h3>
          <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden mb-4 relative">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-green-400 rounded-full transition-all duration-1000 relative"
              style={{ 
                width: `${progressPercentage}%`,
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.6)'
              }}
            >
              {/* Glowing end effect */}
              <div className="absolute right-0 top-0 w-2 h-full bg-white opacity-80 rounded-r-full"></div>
              <div className="absolute right-0 top-0 w-1 h-full bg-white opacity-100 rounded-r-full"></div>
            </div>
            {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
            </div>
          {progressPercentage === 0 ? (
            <div className="text-center">
              <div className="text-2xl font-bold mb-2" style={{ 
                color: '#FFD700',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.7)'
              }}>
                🚀 Hãy bắt đầu thử thách hôm nay!
              </div>
              <p className="text-lg text-yellow-200">Chinh phục 50 câu để leo hạng</p>
          </div>
          ) : (
          <div className="flex justify-between text-white">
              <span className="font-bold text-lg" style={{ color: '#00FFFF' }}>{rankedStatus.questionsCounted} / {rankedStatus.cap} câu</span>
              <span className="font-bold text-lg" style={{ color: '#FF6B9D' }}>{Math.round(progressPercentage)}%</span>
          </div>
          )}
        </div>

        {/* Book Progression */}
        <div className="mb-8 p-6 rounded-2xl"
             style={{
               background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.8) 0%, rgba(26, 11, 46, 0.8) 50%, rgba(22, 33, 62, 0.8) 100%)',
               border: '2px solid #00FF88',
               boxShadow: '0 0 30px rgba(0, 255, 136, 0.2), inset 0 0 30px rgba(0, 255, 136, 0.05)',
               backdropFilter: 'blur(10px)'
             }}>
          <h3 className="text-2xl font-bold mb-6 text-center" style={{ 
            color: '#00FF88',
            textShadow: '0 0 20px rgba(0, 255, 136, 0.5)'
          }}>Tiến Độ Kinh Thánh</h3>
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
          <div className="p-6 mb-8 rounded-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
                 border: '2px solid #FF8C42',
                 boxShadow: '0 0 30px rgba(255, 140, 66, 0.3), inset 0 0 30px rgba(255, 140, 66, 0.1)',
                 backdropFilter: 'blur(10px)'
               }}>
            <div className="flex items-start">
              <svg className="w-6 h-6 mt-1 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF8C42' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-bold mb-2" style={{ color: '#FF8C42' }}>Không thể chơi xếp hạng</h4>
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
          <div className="p-6 mb-8 rounded-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
                 border: '2px solid #FF6B9D',
                 boxShadow: '0 0 30px rgba(255, 107, 157, 0.3), inset 0 0 30px rgba(255, 107, 157, 0.1)',
                 backdropFilter: 'blur(10px)'
               }}>
            <div className="flex items-start">
              <svg className="w-6 h-6 mt-1 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF6B9D' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h4 className="font-bold mb-2" style={{ color: '#FF6B9D' }}>Hậu chu kỳ</h4>
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
              className="px-16 py-6 text-2xl font-black rounded-2xl transition-all duration-300 hover:scale-110 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #00FFFF 0%, #00FF88 50%, #FF6B9D 100%)',
                color: '#0E0B1A',
                boxShadow: '0 8px 30px rgba(0, 255, 255, 0.6), 0 0 50px rgba(0, 255, 136, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Bắt Đầu Xếp Hạng</span>
              </div>
            </button>
          ) : (
            <div className="flex justify-center gap-6">
              <button
                disabled
                className="px-12 py-4 text-xl font-bold rounded-xl opacity-50 cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #00FFFF 0%, #9333EA 100%)',
                  color: '#0E0B1A'
                }}
              >
                Không thể chơi xếp hạng
              </button>
              <Link
                to="/practice"
                className="px-12 py-4 text-xl font-bold rounded-xl transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #00FF88 0%, #00FFFF 100%)',
                  color: '#0E0B1A',
                  boxShadow: '0 4px 15px rgba(0, 255, 136, 0.4)'
                }}
              >
                Chuyển sang Luyện Tập
              </Link>
            </div>
          )}

          <div className="p-4 rounded-2xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(22, 18, 40, 0.9) 0%, rgba(26, 11, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)',
                 border: '2px solid #00FFFF',
                 boxShadow: '0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)',
                 backdropFilter: 'blur(10px)'
               }}>
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#00FFFF' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            <p className="text-white opacity-80">
                Reset hàng ngày lúc: <span className="font-bold" style={{ color: '#00FFFF' }}>{new Date(rankedStatus.resetAt).toLocaleTimeString('vi-VN')}</span>
            </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center mt-8 space-y-4">
          {/* Primary Action */}
          <div>
          <Link 
            to="/" 
              className="inline-flex items-center px-8 py-3 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #00FF88 0%, #00FFFF 100%)',
                color: '#0E0B1A',
                boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)'
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại trang chủ
          </Link>
          </div>
          
          {/* Secondary Actions */}
          <div className="flex justify-center gap-4">
          <Link 
            to="/leaderboard" 
              className="inline-flex items-center px-6 py-2 font-bold rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'transparent',
                color: '#00FFFF',
                border: '2px solid #00FFFF',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Bảng Xếp Hạng
          </Link>
          <button
            onClick={() => {
              setIsLoading(true)
              fetchStatus()
            }}
              className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'transparent',
                color: '#FF8C42',
                border: '2px solid #FF8C42',
                boxShadow: '0 0 15px rgba(255, 140, 66, 0.3)'
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
          </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-50"></div>
        <div className="absolute top-1/3 right-0 w-px h-32 bg-gradient-to-b from-transparent via-pink-400 to-transparent opacity-50"></div>
        <div className="absolute bottom-1/4 left-0 w-px h-24 bg-gradient-to-b from-transparent via-green-400 to-transparent opacity-50"></div>
        </div>
      </div>
    </div>
  )
}