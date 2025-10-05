import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="fixed top-0 left-0 w-full py-8 overflow-hidden" style={{ zIndex: 999999 }}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-cyan-900/20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <img 
                src="/src/assets/logo-new.png" 
                alt="Bible Quiz Logo" 
                className="relative w-12 h-12 transition-all duration-300 group-hover:scale-110 rounded-xl"
                style={{
                  filter: 'drop-shadow(0 0 12px #00FFFF) drop-shadow(0 0 24px #00FFFF)'
                }}
              />
            </div>
            <div className="flex flex-col">
              <h1 
                className="text-2xl lg:text-3xl font-black transition-all duration-300 group-hover:scale-105 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                style={{ 
                  textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
                }}
              >
                BIBLE QUIZ
              </h1>
              <p className="text-xs lg:text-sm text-gray-400 font-medium">Chơi để hiểu, hiểu để tin</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden xl:flex space-x-6 flex-shrink-0">
            <Link 
              to="/" 
              className="text-base font-medium transition-all duration-300 hover:opacity-80 whitespace-nowrap"
              style={{ color: '#FFFFFF' }}
            >
              Trang chủ
            </Link>
            <Link 
              to="/practice" 
              className="text-base font-medium transition-all duration-300 hover:opacity-80 whitespace-nowrap"
              style={{ color: '#FFFFFF' }}
            >
              Chơi ngay
            </Link>
            <Link 
              to="/leaderboard" 
              className="text-base font-medium transition-all duration-300 hover:opacity-80 whitespace-nowrap"
              style={{ color: '#FFFFFF' }}
            >
              Bảng xếp hạng
            </Link>
          </nav>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Profile Button */}
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/10"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                    border: '1px solid rgba(0, 255, 255, 0.3)'
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                       style={{
                         background: 'linear-gradient(135deg, #00FFFF, #9333EA)',
                         color: '#0E0B1A'
                       }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-medium hidden sm:block">{user?.name}</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => logout()}
                  className="p-2 rounded-xl transition-all duration-300 hover:bg-red-500/20"
                  style={{
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                  title="Đăng xuất"
                >
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>

          ) : (
            <Link
              to="/login"
              className="px-6 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #00FFFF 0%, #9333EA 100%)',
                color: '#0E0B1A',
                boxShadow: '0 4px 15px rgba(0, 255, 255, 0.3)'
              }}
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
