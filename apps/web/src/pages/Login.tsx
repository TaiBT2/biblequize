import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import styles from './Login.module.css'

type Tab = 'social' | 'email'
type EmailMode = 'login' | 'register'

export default function Login() {
  const [tab, setTab] = useState<Tab>('social')
  const [emailMode, setEmailMode] = useState<EmailMode>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

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

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleGoogleLogin = () => {
    setIsLoading(true)
    window.location.href = 'http://localhost:8080/oauth2/authorization/google'
  }

  const handleFacebookLogin = () => {
    setIsLoading(true)
    window.location.href = 'http://localhost:8080/oauth2/authorization/facebook'
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (emailMode === 'register') {
      if (!name.trim()) { setError('Vui lòng nhập họ tên'); return }
      if (password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự'); return }
      if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return }
    }

    setIsLoading(true)
    try {
      const { api } = await import('../api/client')
      const endpoint = emailMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload = emailMode === 'login'
        ? { email: email.trim(), password, rememberMe }
        : { name: name.trim(), email: email.trim(), password }

      const res = await api.post(endpoint, payload)
      const { accessToken, name: userName, email: userEmail, avatar, role } = res.data

      login({ accessToken, name: userName, email: userEmail, avatar: avatar || undefined, role })
      navigate('/', { replace: true })
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(message || (emailMode === 'login' ? 'Đăng nhập thất bại' : 'Đăng ký thất bại'))
    } finally {
      setIsLoading(false)
    }
  }

  const switchEmailMode = (mode: EmailMode) => {
    setEmailMode(mode)
    setError(null)
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full relative z-10">
        <div className="page-card px-8 py-10 md:px-10">

          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className={styles.logoRow}>
              <em className={styles.logoIcon}>✝</em>
              BibleQuiz
            </div>
            <h1 className={styles.pageTitle}>Đăng nhập</h1>
            <p className={styles.pageSubtitle}>Chào mừng bạn trở lại</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className={styles.dividerLine} />
            <span className={styles.dividerStar}>✦</span>
            <div className={styles.dividerLine} />
          </div>

          {/* Main Tab Switcher */}
          <div className="segmented-control mb-6">
            <button
              onClick={() => { setTab('social'); setError(null) }}
              className={`segmented-control-item flex-1 cursor-pointer${tab === 'social' ? ' active' : ''}`}
            >
              Mạng xã hội
            </button>
            <button
              onClick={() => { setTab('email'); setError(null) }}
              className={`segmented-control-item flex-1 cursor-pointer${tab === 'email' ? ' active' : ''}`}
            >
              Email & Mật khẩu
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-5 flex items-start gap-3 px-4 py-3 rounded-xl ${styles.errorBanner}`}>
              <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${styles.errorIcon}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          {/* --- Social Tab --- */}
          {tab === 'social' && (
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className={`w-full rounded-xl flex items-center px-5 py-3.5 font-bold transition-all disabled:opacity-50 ${styles.googleBtn}`}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="flex-1 text-center">
                  {isLoading ? 'Đang đăng nhập...' : 'Tiếp tục với Google'}
                </span>
              </button>

              <button
                onClick={handleFacebookLogin}
                disabled={isLoading}
                className={`w-full rounded-xl flex items-center px-5 py-3.5 font-bold transition-all disabled:opacity-50 ${styles.facebookBtn}`}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="flex-1 text-center">
                  {isLoading ? 'Đang đăng nhập...' : 'Tiếp tục với Facebook'}
                </span>
              </button>

              <p className={styles.oauthNote}>
                Đăng nhập an toàn qua OAuth2
              </p>
            </div>
          )}

          {/* --- Email Tab --- */}
          {tab === 'email' && (
            <div>
              {/* Login / Register sub-toggle */}
              <div className="segmented-control mb-6">
                <button
                  onClick={() => switchEmailMode('login')}
                  className={`segmented-control-item flex-1 cursor-pointer${emailMode === 'login' ? ' active' : ''}`}
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => switchEmailMode('register')}
                  className={`segmented-control-item flex-1 cursor-pointer${emailMode === 'register' ? ' active' : ''}`}
                >
                  Đăng ký
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {emailMode === 'register' && (
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${styles.fieldLabel}`}>
                      Họ tên
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                      className="form-input"
                    />
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${styles.fieldLabel}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="form-input"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${styles.fieldLabel}`}>
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={emailMode === 'register' ? 'Tối thiểu 8 ký tự' : '••••••••'}
                      required
                      className="form-input pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${styles.togglePasswordBtn}`}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {emailMode === 'register' && (
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${styles.fieldLabel}`}>
                      Xác nhận mật khẩu
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      required
                      className="form-input"
                    />
                  </div>
                )}

                {emailMode === 'login' && (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={styles.checkboxBox}
                        data-checked={rememberMe ? 'true' : 'false'}
                      >
                        {rememberMe && (
                          <svg className="w-3 h-3" fill="none" stroke="#0A0A0E" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={styles.rememberLabel}>Nhớ đăng nhập</span>
                    <span className={styles.rememberDays}>30 ngày</span>
                  </label>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="practice-start-btn w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading
                      ? 'Đang xử lý...'
                      : emailMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className={styles.dividerLine} />
              <span className={styles.dividerStarSm}>✦</span>
              <div className={styles.dividerLine} />
            </div>

            <p className={styles.termsText}>
              Bằng cách đăng nhập, bạn đồng ý với{' '}
              <Link to="/terms" className={styles.termsLink}>
                Điều khoản sử dụng
              </Link>{' '}
              và{' '}
              <Link to="/privacy" className={styles.termsLink}>
                Chính sách bảo mật
              </Link>
            </p>

            <Link
              to="/"
              className={`flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors ${styles.backLink}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
