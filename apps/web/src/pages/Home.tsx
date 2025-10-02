import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import appLogo from '../assets/app-logo.png'

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="min-h-screen neon-bg flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-10 left-10 text-6xl neon-pink opacity-30 animate-pulse">?</div>
      <div className="absolute top-20 right-20 text-6xl neon-orange opacity-30 animate-pulse">!</div>
      <div className="absolute bottom-20 left-20 text-4xl neon-green opacity-20 animate-pulse">✦</div>
      <div className="absolute bottom-10 right-10 text-4xl neon-blue opacity-20 animate-pulse">◆</div>
      
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Main Title */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <img 
              src={appLogo} 
              alt="Bible Quiz Logo" 
              className="mx-auto w-96 h-auto drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(0, 255, 255, 0.6)) drop-shadow(0 0 60px rgba(255, 0, 255, 0.4))'
              }}
            />
          </div>
          <div className="neon-border-blue p-8 rounded-2xl mb-8 bg-black bg-opacity-30">
            <p className="text-2xl neon-text text-white mb-8 max-w-3xl mx-auto">
              Học Kinh Thánh qua trắc nghiệm - Chơi mà học với giao diện neon tuyệt đẹp
            </p>
          </div>
        </div>

        {/* Game Modes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Practice Mode */}
          <div className="neon-card p-8 text-center group hover:scale-105 transition-all duration-300">
            <div className="mb-6">
              <div className="w-20 h-20 neon-border-green rounded-full flex items-center justify-center mx-auto mb-4 group-hover:neon-border-pink transition-all duration-300">
                <svg className="w-10 h-10 neon-green group-hover:neon-pink transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold neon-green mb-4 group-hover:neon-pink transition-colors duration-300">Luyện Tập</h3>
              <p className="text-white opacity-80 mb-6 text-description">
                Chơi không giới hạn, không ảnh hưởng xếp hạng. Tự do chọn sách và độ khó.
              </p>
              <Link 
                to="/practice" 
                className="neon-btn neon-btn-green px-6 py-3"
              >
                Bắt Đầu Luyện Tập
              </Link>
            </div>
          </div>

          {/* Ranked Mode */}
          <div className="neon-card p-8 text-center group hover:scale-105 transition-all duration-300">
            <div className="mb-6">
              <div className="w-20 h-20 neon-border-orange rounded-full flex items-center justify-center mx-auto mb-4 group-hover:neon-border-blue transition-all duration-300">
                <svg className="w-10 h-10 neon-orange group-hover:neon-blue transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold neon-orange mb-4 group-hover:neon-blue transition-colors duration-300">Leo Hạng</h3>
              <p className="text-white opacity-80 mb-6 text-description">
                50 câu/ngày, 10 mạng. Tự động chuyển sách từ Sáng Thế Ký đến Khải Huyền.
              </p>
              <Link 
                to="/ranked" 
                className="neon-btn neon-btn-orange px-6 py-3"
              >
                Tham Gia Xếp Hạng
              </Link>
            </div>
          </div>

          {/* Multiplayer */}
          <div className="neon-card p-8 text-center group hover:scale-105 transition-all duration-300">
            <div className="mb-6">
              <div className="w-20 h-20 neon-border-pink rounded-full flex items-center justify-center mx-auto mb-4 group-hover:neon-border-green transition-all duration-300">
                <svg className="w-10 h-10 neon-pink group-hover:neon-green transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold neon-pink mb-4 group-hover:neon-green transition-colors duration-300">Nhiều Người</h3>
              <p className="text-white opacity-80 mb-6 text-description">
                Tạo phòng thi, mời bạn bè cùng chơi. Bảng xếp hạng realtime.
              </p>
              <Link 
                to="/rooms"
                className="neon-btn neon-btn-blue px-6 py-3"
              >
                Tìm Phòng Chơi
              </Link>
            </div>
          </div>
        </div>

        {/* User Info & Action Buttons */}
        <div className="text-center space-y-6">
          {isAuthenticated ? (
            <div className="mb-8">
              <div className="neon-card p-6 mb-6">
                <h3 className="text-2xl font-bold neon-green mb-2">Chào mừng trở lại!</h3>
                <p className="text-white opacity-80 mb-4">
                  Xin chào, <span className="neon-pink font-bold">{user?.name}</span>!
                </p>
                <p className="text-sm text-white opacity-60 mb-4 text-email">
                  Email: {user?.email}
                </p>
                <div className="flex justify-center space-x-6 mb-4">
                  <div className="text-center">
                    <div className="user-stat-label neon-green flex items-center justify-center">
                      <svg className="user-stat-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      Level
                    </div>
                    <div className="user-stat-value neon-green">1</div>
                  </div>
                  <div className="text-center">
                    <div className="user-stat-label neon-pink flex items-center justify-center">
                      <svg className="user-stat-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                      </svg>
                      Điểm Cao
                    </div>
                    <div className="user-stat-value neon-pink">0</div>
                  </div>
                  <div className="text-center">
                    <div className="user-stat-label neon-orange flex items-center justify-center">
                      <svg className="user-stat-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                      </svg>
                      Streak
                    </div>
                    <div className="user-stat-value neon-orange">0</div>
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="neon-btn neon-btn-pink px-6 py-2 text-sm"
                >
                  Đăng Xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-white opacity-80 mb-4">Chưa có tài khoản?</p>
              <Link 
                to="/login" 
                className="neon-btn neon-btn-blue text-xl px-12 py-4 inline-block"
              >
                Đăng Nhập / Đăng Ký
              </Link>
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-50"></div>
        <div className="absolute top-1/3 right-0 w-px h-32 bg-gradient-to-b from-transparent via-neon-pink to-transparent opacity-50"></div>
        <div className="absolute bottom-1/4 left-0 w-px h-24 bg-gradient-to-b from-transparent via-neon-green to-transparent opacity-50"></div>
      </div>
    </div>
  )
}