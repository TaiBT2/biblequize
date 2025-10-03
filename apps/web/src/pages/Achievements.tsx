import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  points: number
  unlockedAt?: string
  isNotified?: boolean
}

const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')
  const { user } = useAuth()

  useEffect(() => {
    const loadAchievements = async () => {
      if (!user) return
      
      setLoading(true)
      try {
        const [achievementsRes, statsRes] = await Promise.all([
          api.get('/api/achievements/my-achievements'),
          api.get('/api/achievements/stats')
        ])
        
        setAchievements(achievementsRes.data || [])
        setStats(statsRes.data || {})
      } catch (error) {
        console.error('Failed to load achievements:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAchievements()
  }, [user])

  const categories = ['all', 'quiz', 'streak', 'points', 'books', 'accuracy']
  
  const filteredAchievements = activeTab === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === activeTab)

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      quiz: '🎯',
      streak: '🔥',
      points: '💰',
      books: '📚',
      accuracy: '🎯'
    }
    return icons[category] || '🏆'
  }

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      quiz: 'Quiz',
      streak: 'Chuỗi',
      points: 'Điểm',
      books: 'Sách',
      accuracy: 'Chính xác'
    }
    return names[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      quiz: 'neon-green',
      streak: 'neon-orange',
      points: 'neon-pink',
      books: 'neon-blue',
      accuracy: 'neon-purple'
    }
    return colors[category] || 'neon-text'
  }

  if (!user) {
    return (
      <div className="min-h-screen neon-bg flex items-center justify-center">
        <div className="neon-card p-8 text-center">
          <h2 className="text-2xl neon-text mb-4">Đăng nhập để xem thành tích</h2>
          <p className="text-white opacity-80">Bạn cần đăng nhập để xem các thành tích của mình</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen neon-bg relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-2 h-2 neon-pink rounded-full animate-ping"></div>
        <div className="absolute top-20 right-20 w-1 h-1 neon-green rounded-full animate-ping"></div>
        <div className="absolute top-1/3 left-1/4 w-1 h-1 neon-blue rounded-full animate-ping"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 neon-orange rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-1/3 w-1 h-1 neon-pink rounded-full animate-ping"></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 neon-green rounded-full animate-ping"></div>
      </div>
      
      {/* Circuit Board Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-blue to-transparent"></div>
        <div className="absolute top-1/2 right-0 w-px h-32 bg-gradient-to-b from-transparent via-neon-pink to-transparent"></div>
        <div className="absolute bottom-1/3 left-0 w-px h-24 bg-gradient-to-b from-transparent via-neon-green to-transparent"></div>
        <div className="absolute top-1/3 right-1/4 w-px h-20 bg-gradient-to-b from-transparent via-neon-orange to-transparent"></div>
      </div>

      <div className="container mx-auto max-w-6xl p-4 relative z-10">
        <h1 className="neon-text text-6xl text-center mb-12 font-bold tracking-wider">
          THÀNH TÍCH CỦA TÔI
        </h1>
        
        {/* Stats Overview */}
        <div className="neon-card p-6 mb-8">
          <h2 className="text-2xl font-bold neon-blue mb-4">Tổng Quan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold neon-green">{stats.unlocked || 0}</div>
              <div className="text-white opacity-80">Đã mở khóa</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold neon-pink">{stats.total || 0}</div>
              <div className="text-white opacity-80">Tổng số</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold neon-orange">{stats.percentage || 0}%</div>
              <div className="text-white opacity-80">Hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-3 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`neon-btn px-4 py-2 ${
                activeTab === category ? 'neon-btn-blue' : ''
              }`}
            >
              {category === 'all' ? 'Tất cả' : `${getCategoryIcon(category)} ${getCategoryName(category)}`}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="text-center text-white">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
            <p className="mt-4 text-lg">Đang tải thành tích...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredAchievements.map(achievement => (
              <div
                key={achievement.id}
                className={`relative group transition-all duration-500 ${
                  achievement.unlockedAt ? 'transform hover:scale-110' : 'opacity-60'
                }`}
              >
                {/* Achievement Badge */}
                <div className={`relative w-48 h-48 mx-auto mb-4 rounded-2xl ${
                  achievement.unlockedAt 
                    ? 'neon-border-glow bg-gradient-to-br from-black via-gray-900 to-black' 
                    : 'border-2 border-gray-600 bg-gray-800'
                }`}>
                  {/* Glow Effect for Unlocked */}
                  {achievement.unlockedAt && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-white/5 to-transparent animate-pulse"></div>
                  )}
                  
                  {/* Icon Container */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`text-8xl transition-all duration-300 ${
                      achievement.unlockedAt 
                        ? getCategoryColor(achievement.category)
                        : 'text-gray-500'
                    }`}>
                      {achievement.icon}
                    </div>
                  </div>
                  
                  {/* Lock Icon for Locked Achievements */}
                  {!achievement.unlockedAt && (
                    <div className="absolute top-2 right-2 text-gray-400">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Points Badge */}
                  <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                    achievement.unlockedAt 
                      ? 'bg-neon-orange text-black' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    +{achievement.points}
                  </div>
                </div>
                
                {/* Achievement Info */}
                <div className="text-center">
                  <h3 className={`text-lg font-bold mb-2 ${
                    achievement.unlockedAt ? 'neon-text' : 'text-gray-400'
                  }`}>
                    {achievement.name}
                  </h3>
                  <p className={`text-sm mb-3 ${
                    achievement.unlockedAt ? 'text-white opacity-80' : 'text-gray-500'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  {/* Unlock Date */}
                  {achievement.unlockedAt && (
                    <div className="text-xs text-green-400 font-medium">
                      Mở khóa: {new Date(achievement.unlockedAt).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredAchievements.length === 0 && !loading && (
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl mb-2">Chưa có thành tích nào</h3>
            <p className="opacity-80">Hãy chơi quiz để mở khóa các thành tích!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Achievements
