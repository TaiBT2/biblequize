import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'

interface UserStats {
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  currentStreak: number
  longestStreak: number
  totalPoints: number
  rank: number
  level: number
}

export default function Profile() {
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    if (!authUser) {
      navigate('/login')
      return
    }

    const fetchUserStats = async () => {
      try {
        const response = await api.get('/user/stats')
        setUserStats(response.data)
      } catch (error) {
        console.error('Error fetching user stats:', error)
        // Mock data for now
        setUserStats({
          totalQuestions: 150,
          correctAnswers: 120,
          accuracy: 80,
          currentStreak: 5,
          longestStreak: 12,
          totalPoints: 1200,
          rank: 25,
          level: 3
        })
      }
      setIsLoading(false)
    }

    fetchUserStats()
  }, [authUser, navigate])

  const handleSave = async () => {
    try {
      await api.put('/user/profile', { name: editName })
      // Update auth context
      // Note: In a real app, you'd refresh the user data
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleCancel = () => {
    setEditName(authUser?.name || '')
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen neon-bg flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 left-20 text-5xl neon-green opacity-20 animate-pulse">👤</div>
        <div className="absolute bottom-20 right-20 text-5xl neon-pink opacity-20 animate-pulse">📊</div>
        
        <div className="text-center">
          <div className="neon-card p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
            <p className="neon-text text-white">Đang tải...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className="min-h-screen neon-bg flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 left-20 text-5xl neon-red opacity-20 animate-pulse">❌</div>
        <div className="absolute bottom-20 right-20 text-5xl neon-blue opacity-20 animate-pulse">🔐</div>
        
        <div className="text-center">
          <div className="neon-card p-8">
            <p className="neon-text text-white mb-6">Bạn cần đăng nhập để xem hồ sơ</p>
            <Link 
              to="/login" 
              className="neon-btn neon-btn-blue px-6 py-2"
            >
              Đăng Nhập
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen neon-bg flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-10 left-10 text-4xl neon-green opacity-20 animate-pulse">👤</div>
      <div className="absolute top-20 right-20 text-4xl neon-pink opacity-20 animate-pulse">📊</div>
      <div className="absolute bottom-20 left-20 text-3xl neon-blue opacity-15 animate-pulse">🏆</div>
      <div className="absolute bottom-10 right-10 text-3xl neon-orange opacity-15 animate-pulse">⚡</div>
      
      <div className="max-w-6xl w-full mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="neon-border-blue p-8 rounded-2xl mb-8 bg-black bg-opacity-30">
            <h1 className="text-6xl font-bold mb-4 glitch">
              <span className="neon-blue">H</span>
              <span className="neon-pink">Ồ</span>
              <span className="neon-green"> S</span>
              <span className="neon-orange">Ơ</span>
              <span className="neon-pink"> C</span>
              <span className="neon-blue">Á</span>
              <span className="neon-green"> N</span>
              <span className="neon-orange">H</span>
              <span className="neon-pink">Â</span>
              <span className="neon-blue">N</span>
            </h1>
            <p className="text-xl neon-text text-white">Thông tin cá nhân và thống kê</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Profile Info */}
          <div className="neon-card p-8">
            <h2 className="text-2xl font-bold neon-blue mb-6 text-center">Thông tin cá nhân</h2>
            
            <div className="text-center mb-8">
              <div className="w-32 h-32 neon-border-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-16 h-16 neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium neon-green mb-2">
                  Tên
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-3 bg-black bg-opacity-50 border-2 border-neon-blue rounded-lg text-white neon-blue focus:neon-border-pink transition-all duration-300"
                  />
                ) : (
                  <p className="text-white text-lg">{authUser.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium neon-green mb-2">
                  Email
                </label>
                <p className="text-white text-lg text-email">{authUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium neon-green mb-2">
                  Vai trò
                </label>
                <p className="text-white text-lg">Người chơi</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="neon-btn neon-btn-green px-6 py-2"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={handleCancel}
                    className="neon-btn neon-btn-pink px-6 py-2"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditName(authUser.name)
                    setIsEditing(true)
                  }}
                  className="neon-btn neon-btn-blue px-6 py-2"
                >
                  Chỉnh Sửa
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="neon-card p-8">
            <h2 className="text-2xl font-bold neon-pink mb-6 text-center">Thống kê</h2>
            
            {userStats && (
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 neon-border-green rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="user-stat-value neon-green">{userStats.totalQuestions}</div>
                  <div className="user-stat-label neon-green">Tổng câu hỏi</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 neon-border-pink rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 neon-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="user-stat-value neon-pink">{userStats.accuracy}%</div>
                  <div className="user-stat-label neon-pink">Độ chính xác</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 neon-border-orange rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 neon-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="user-stat-value neon-orange">{userStats.currentStreak}</div>
                  <div className="user-stat-label neon-orange">Streak hiện tại</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 neon-border-blue rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="user-stat-value neon-blue">{userStats.totalPoints}</div>
                  <div className="user-stat-label neon-blue">Tổng điểm</div>
                </div>

                <div className="text-center col-span-2">
                  <div className="w-16 h-16 neon-border-green rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="user-stat-value neon-green">Level {userStats.level}</div>
                  <div className="user-stat-label neon-green">Cấp độ hiện tại</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-8 space-y-4">
          <button
            onClick={logout}
            className="neon-btn neon-btn-red px-8 py-3 text-lg"
          >
            Đăng Xuất
          </button>
          
          <div>
            <Link 
              to="/" 
              className="neon-btn neon-btn-green px-6 py-2"
            >
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-50"></div>
        <div className="absolute top-1/3 right-0 w-px h-32 bg-gradient-to-b from-transparent via-neon-pink to-transparent opacity-50"></div>
        <div className="absolute bottom-1/4 left-0 w-px h-24 bg-gradient-to-b from-transparent via-neon-green to-transparent opacity-50"></div>
      </div>
    </div>
  )
}
