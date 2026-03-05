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
    window.location.href = 'http://localhost:8080/oauth2/authorization/google'
  }

  const handleFacebookLogin = () => {
    setIsLoading(true)
    // TODO: Implement Facebook OAuth login
    window.location.href = 'http://localhost:8080/oauth2/authorization/facebook'
  }

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full relative z-10">
        <div className="page-card p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <img
                src="/app-logo.png"
                alt="Bible Quiz Logo"
                className="mx-auto w-64 h-auto"
              />
            </div>
            <div className="mb-6">
              <h1 className="text-4xl font-black text-[#4a3f35] mb-2 parchment-headline">ĐĂNG NHẬP</h1>
              <p className="text-[#7a6a5a]">Chào mừng bạn đến với Bible Quiz</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 border-2 border-red-200 rounded-xl bg-red-50">
              <p className="text-red-600 text-center font-semibold">{error}</p>
            </div>
          )}

          {/* Login Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white border-2 border-[#d6cfc4] rounded-full flex items-center justify-center px-6 py-3.5 text-lg font-bold text-[#5a5048] hover:bg-gray-50 hover:border-[#4bbf9f] transition-all disabled:opacity-50"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
            </button>

            <button
              onClick={handleFacebookLogin}
              disabled={isLoading}
              className="w-full bg-[#1877F2] text-white rounded-full flex items-center justify-center px-6 py-3.5 text-lg font-bold hover:bg-[#166fe5] shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Facebook'}
            </button>
          </div>

          {/* Terms */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#7a6a5a]">
              Bằng cách đăng nhập, bạn đồng ý với{' '}
              <Link to="/terms" className="text-[#4bbf9f] font-semibold hover:underline">
                Điều khoản sử dụng
              </Link>{' '}
              và{' '}
              <Link to="/privacy" className="text-[#4bbf9f] font-semibold hover:underline">
                Chính sách bảo mật
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-8 pt-6 border-t border-[#eeeae0] text-center">
            <Link
              to="/"
              className="text-[#7a6a5a] text-sm font-bold flex items-center justify-center gap-2 hover:text-[#4bbf9f] transition-all"
            >
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>

  )
}