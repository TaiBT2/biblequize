import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'

interface UserStats {
  level: number
  highScore: number
  streak: number
  totalQuestions: number
  totalPoints: number
  accuracy: number
}

interface Achievement {
  id: string
  name: string
  icon: string
  category: string
  unlockedAt?: string
}

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<UserStats>({
    level: 1,
    highScore: 0,
    streak: 0,
    totalQuestions: 0,
    totalPoints: 0,
    accuracy: 0
  })
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [animationPhase, setAnimationPhase] = useState(0)
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [selectedAchievement, setSelectedAchievement] = useState<number | null>(null)

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return
      
      setLoading(true)
      try {
        const [achievementsRes, statsRes] = await Promise.all([
          api.get('/api/achievements/my-achievements'),
          api.get('/api/achievements/stats')
        ])
        
        setAchievements(achievementsRes.data || [])
        
        // Calculate stats from achievements data
        const userAchievements = achievementsRes.data || []
        const totalPoints = userAchievements.reduce((sum: number, ach: any) => sum + (ach.points || 0), 0)
        const level = Math.floor(totalPoints / 1000) + 1
        
        setStats({
          level,
          highScore: totalPoints,
          streak: Math.floor(Math.random() * 20) + 1, // Mock streak
          totalQuestions: Math.floor(Math.random() * 100) + 10,
          totalPoints,
          accuracy: Math.floor(Math.random() * 30) + 70
        })
      } catch (error) {
        console.error('Failed to load profile data:', error)
      } finally {
        setLoading(false)
        // Start animation sequence
        startAnimationSequence()
      }
    }
    
    loadProfileData()
  }, [user])

  const startAnimationSequence = () => {
    // Phase 1: Title appears
    setTimeout(() => setAnimationPhase(1), 200)
    // Phase 2: Player card fades in
    setTimeout(() => setAnimationPhase(2), 800)
    // Phase 3: Graph draws
    setTimeout(() => setAnimationPhase(3), 1500)
    // Phase 4: Achievements light up
    setTimeout(() => setAnimationPhase(4), 2500)
  }

  const getProgressData = () => {
    // Mock progress data for line graph
    return [
      { book: 'Genesis', progress: 85 },
      { book: 'Exodus', progress: 70 },
      { book: 'Leviticus', progress: 45 },
      { book: 'Numbers', progress: 30 },
      { book: 'Deuteronomy', progress: 15 }
    ]
  }

  const getTopAchievements = () => {
    const unlocked = achievements.filter(a => a.unlockedAt)
    const mockAchievements = [
      { name: 'TÂN BINH ÁNH LÀNG', icon: '⭐', color: 'neon-pink' },
      { name: 'HỌC GIẢ SÁNG THẾ', icon: '📖', color: 'neon-green' },
      { name: 'HỌC GIẢ', icon: '🌳', color: 'neon-orange' },
      { name: 'CHIẾN BINH HOÀN HẢO', icon: '7️⃣', color: 'neon-red' },
      { name: 'VUA BẢNG XẾP HẠNG', icon: '👑', color: 'neon-blue' }
    ]
    
    return mockAchievements.slice(0, 5)
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen neon-bg flex items-center justify-center">
        <div className="neon-card p-8 text-center">
          <h2 className="text-2xl neon-text mb-4">Vui lòng đăng nhập</h2>
          <p className="text-white opacity-80 mb-6">Bạn cần đăng nhập để xem hồ sơ</p>
          <Link to="/login" className="neon-btn neon-btn-blue px-6 py-3">
            Đăng Nhập
          </Link>
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
        <div className="absolute bottom-20 left-1/3 w-1 h-1 neon-purple rounded-full animate-ping"></div>
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
        {/* Main Title */}
        <h1 className={`neon-text text-6xl text-center mb-12 font-bold tracking-wider transition-all duration-1000 ${
          animationPhase >= 1 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform translate-y-8'
        }`}>
          HỒ SƠ NGƯỜI CHƠI
        </h1>

        {/* Player Card */}
        <div className={`neon-card p-8 mb-12 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 transition-all duration-1200 ${
          animationPhase >= 2 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform translate-y-12'
        }`}>
          {/* Player Name and Avatar */}
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 neon-border-green rounded-full flex items-center justify-center mr-6">
              <svg className="w-8 h-8 neon-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold neon-pink">{user.name?.toUpperCase()}</h2>
          </div>

          {/* Player Stats */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Left Side Stats */}
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="w-12 h-12 neon-border-yellow rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <div>
                  <div className="text-white opacity-80">Level</div>
                  <div className="text-2xl font-bold neon-yellow">{stats.level}</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-12 h-12 neon-border-yellow rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <div className="text-white opacity-80">ĐIỂM CAO</div>
                  <div className="text-2xl font-bold neon-yellow">{stats.highScore}</div>
                </div>
              </div>
            </div>

            {/* Right Side Stats */}
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="w-12 h-12 neon-border-red rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <div className="text-white opacity-80">ĐIỂM: {stats.totalPoints}</div>
                  <div className="text-2xl font-bold neon-red">{stats.totalPoints}</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-12 h-12 neon-border-red rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <div className="text-white opacity-80">Streak: {stats.streak}</div>
                  <div className="text-2xl font-bold neon-red">{stats.streak}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Graph */}
          <div className="mt-8">
            <h3 className="text-xl font-bold neon-green mb-4">TIẾN ĐỘ THEO SÁCH</h3>
            <div className="bg-black bg-opacity-30 p-4 rounded-lg relative">
              {/* Neon Line Graph */}
              <svg className="absolute inset-0 w-full h-32" viewBox="0 0 400 120">
                <defs>
                  <linearGradient id="neonLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00ff00" stopOpacity="0.8"/>
                    <stop offset="50%" stopColor="#00ffff" stopOpacity="1"/>
                    <stop offset="100%" stopColor="#00ff00" stopOpacity="0.8"/>
                  </linearGradient>
                </defs>
                <path
                  d="M 20 100 Q 100 60 180 80 T 360 40"
                  stroke="url(#neonLine)"
                  strokeWidth="3"
                  fill="none"
                  filter="drop-shadow(0 0 8px #00ff00)"
                  className={`transition-all duration-2000 ${
                    animationPhase >= 3 ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    strokeDasharray: animationPhase >= 3 ? 'none' : '1000',
                    strokeDashoffset: animationPhase >= 3 ? '0' : '1000',
                    transition: 'stroke-dashoffset 2s ease-in-out'
                  }}
                />
                {/* Data Points */}
                {getProgressData().map((item, index) => {
                  const points = [
                    { x: 20, y: 100 },
                    { x: 100, y: 60 },
                    { x: 180, y: 80 },
                    { x: 260, y: 50 },
                    { x: 360, y: 40 }
                  ]
                  const point = points[index]
                  const isHovered = hoveredPoint === index
                  
                  return (
                    <circle 
                      key={index}
                      cx={point.x} 
                      cy={point.y} 
                      r={isHovered ? 8 : 4} 
                      fill="#00ff00" 
                      filter={`drop-shadow(0 0 ${isHovered ? 12 : 6}px #00ff00)`}
                      className={`transition-all duration-300 cursor-pointer ${
                        animationPhase >= 3 ? 'opacity-100' : 'opacity-0'
                      }`}
                      onMouseEnter={() => setHoveredPoint(index)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{
                        animationDelay: `${index * 200}ms`
                      }}
                    />
                  )
                })}
              </svg>
              
              {/* Book Labels */}
              <div className="flex justify-between items-end h-32 relative z-10">
                {getProgressData().map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className={`text-xs text-center mt-auto transition-all duration-300 ${
                      hoveredPoint === index 
                        ? 'text-neon-green font-bold text-sm scale-110' 
                        : 'text-white opacity-80'
                    }`}>
                      {item.book}<br/>{item.progress}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Section */}
        <h2 className={`neon-text text-4xl text-center mb-8 font-bold tracking-wider transition-all duration-1000 ${
          animationPhase >= 4 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform translate-y-8'
        }`}>
          THÀNH TÍCH CỦA TÔI
        </h2>

        {/* Achievement Badges */}
        <div className="flex justify-center gap-8 mb-12">
          {getTopAchievements().map((achievement, index) => (
            <div key={index} className="text-center group">
              {/* Neon Sign Badge */}
              <div 
                className={`relative w-32 h-20 neon-border-glow rounded-lg flex items-center justify-center mb-3 transition-all duration-500 cursor-pointer ${
                  animationPhase >= 4 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-12'
                } group-hover:scale-110 group-hover:brightness-150 ${achievement.color}`}
                style={{ animationDelay: `${index * 200}ms` }}
                onClick={() => setSelectedAchievement(selectedAchievement === index ? null : index)}
              >
                {/* Neon Sign Effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-transparent via-white/5 to-transparent animate-pulse"></div>
                
                {/* Icon */}
                <div className="relative z-10">
                  <span className="text-3xl">{achievement.icon}</span>
                </div>
                
                {/* Neon Sign Border */}
                <div className="absolute inset-0 rounded-lg border-2 border-current opacity-50"></div>
                
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-lg bg-current opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </div>
              
              {/* Achievement Name */}
              <div className="text-sm font-bold neon-text text-center max-w-24 leading-tight">
                {achievement.name}
              </div>
              
              {/* Achievement Popup */}
              {selectedAchievement === index && (
                <div className="absolute z-50 mt-2 p-4 bg-black bg-opacity-90 neon-border-blue rounded-lg max-w-48">
                  <div className="text-sm text-white">
                    <div className="font-bold neon-blue mb-2">{achievement.name}</div>
                    <div className="text-xs opacity-80">
                      {achievement.name === 'TÂN BINH ÁNH LÀNG' && 'Hoàn thành quiz đầu tiên của bạn!'}
                      {achievement.name === 'HỌC GIẢ SÁNG THẾ' && 'Đọc và hiểu sách Genesis hoàn chỉnh!'}
                      {achievement.name === 'HỌC GIẢ' && 'Trở thành học giả Kinh Thánh!'}
                      {achievement.name === 'CHIẾN BINH HOÀN HẢO' && 'Đạt điểm hoàn hảo trong một quiz!'}
                      {achievement.name === 'VUA BẢNG XẾP HẠNG' && 'Dẫn đầu bảng xếp hạng!'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Button */}
        <div className="text-center">
          <Link 
            to="/" 
            className="neon-btn neon-btn-blue px-12 py-4 text-xl font-bold tracking-wider"
          >
            QUAY VỀ SẢNH CHỜ
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Profile