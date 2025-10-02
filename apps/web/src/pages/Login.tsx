import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      switch (errorParam) {
        case 'oauth_failed':
          setError('Đăng nhập OAuth thất bại. Vui lòng thử lại.')
          break
        case 'no_tokens':
          setError('Không nhận được token xác thực. Vui lòng thử lại.')
          break
        case 'processing_failed':
          setError('Lỗi xử lý đăng nhập. Vui lòng thử lại.')
          break
        default:
          setError('Có lỗi xảy ra trong quá trình đăng nhập.')
      }
    }
  }, [searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/'
    }
  }, [isAuthenticated])

  const handleGoogleLogin = () => {
    setIsLoading(true)
    // TODO: Implement Google OAuth login
    window.location.href = 'http://localhost:8081/oauth2/authorization/google'
  }

  const handleFacebookLogin = () => {
    setIsLoading(true)
    // TODO: Implement Facebook OAuth login
    window.location.href = 'http://localhost:8081/oauth2/authorization/facebook'
  }

  return (
    <div className="min-h-screen neon-bg flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 left-20 text-5xl neon-green opacity-20 animate-pulse">🔐</div>
      <div className="absolute bottom-20 right-20 text-5xl neon-pink opacity-20 animate-pulse">⚡</div>
      <div className="absolute top-1/2 left-10 text-3xl neon-blue opacity-15 animate-pulse">✨</div>
      <div className="absolute top-1/3 right-10 text-3xl neon-orange opacity-15 animate-pulse">🌟</div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="neon-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="/app-logo.png" 
                alt="Bible Quiz Logo" 
                className="mx-auto w-80 h-auto drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.5)) drop-shadow(0 0 40px rgba(255, 0, 255, 0.3))'
                }}
              />
            </div>
            <div className="neon-border-blue p-6 rounded-xl mb-6 bg-black bg-opacity-30">
              <h1 className="text-4xl font-bold neon-blue mb-2 glitch">ĐĂNG NHẬP</h1>
              <p className="text-white opacity-80">Chào mừng bạn đến với Bible Quiz</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 neon-border-red rounded-lg bg-red-900 bg-opacity-20">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Login Buttons */}
          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full neon-btn neon-btn-blue flex items-center justify-center px-6 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
            </button>

            <button
              onClick={handleFacebookLogin}
              disabled={isLoading}
              className="w-full neon-btn neon-btn-pink flex items-center justify-center px-6 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Facebook'}
            </button>
          </div>

          {/* Terms */}
          <div className="mt-8 text-center">
            <p className="text-sm text-white opacity-70">
              Bằng cách đăng nhập, bạn đồng ý với{' '}
              <Link to="/terms" className="neon-blue hover:neon-pink transition-colors duration-300">
                Điều khoản sử dụng
              </Link>{' '}
              và{' '}
              <Link to="/privacy" className="neon-blue hover:neon-pink transition-colors duration-300">
                Chính sách bảo mật
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="neon-btn neon-btn-green px-6 py-2 text-sm"
            >
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>

        {/* Decorative Lines */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-pink to-transparent opacity-50"></div>
      </div>
    </div>
  )
}