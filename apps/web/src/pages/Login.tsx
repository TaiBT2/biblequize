import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/authStore'
import PageMeta from '../components/PageMeta'

export default function Login() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      switch (errorParam) {
        case 'oauth_failed':
          setError(t('auth.errorOAuthFailed'))
          break
        case 'no_tokens':
          setError(t('auth.errorNoTokens'))
          break
        case 'processing_failed':
          setError(t('auth.errorProcessingFailed'))
          break
        default:
          setError(t('auth.errorDefault'))
      }
    }
  }, [searchParams, t])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true)
    window.location.href = `${import.meta.env.VITE_API_URL || ''}/oauth2/authorization/google`
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { api } = await import('../api/client')
      const res = await api.post('/api/auth/login', {
        email: email.trim(),
        password,
      })
      const { accessToken, name: userName, email: userEmail, avatar, role } = res.data
      login({ accessToken, name: userName, email: userEmail, avatar: avatar || undefined, role })
      navigate('/', { replace: true })
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(message || t('auth.errorInvalid'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen">
      <PageMeta title={t('auth.login')} canonicalPath="/login" />
      {/* Left Side: Hero Section (60%) */}
      <section className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-60"
            alt="Open ancient Bible with warm golden light"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxJlgdtnJOGZm2rD3qWJIhidCCEsGzbGtOO2LChLsUCHKDsnHDpK9HiLjVWhArxiUU96Xc52lguYYo3Qb52fFd55lzlgYBCALYIYb-4cB21mPCPcj90LVUlgBXMwpWRJk3dOZXsNht3Ty9efDBTwbS6yDH-weC4O2aeDCzJ1h9eA2eCmrF2Il-6oYbTfPdylbn_zxtlZO2Jzqco6mGf4pvcobHQoNm7w0kN56yE4pPIV5ol4nYWvOX86BvbQPCS8SK5x0YeiO2vN0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-surface-container-lowest opacity-80" />
          {/* Radiant Glow Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-end p-20 w-full h-full">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-extrabold tracking-tight leading-tight mb-6 text-on-surface drop-shadow-2xl">
              {t('auth.discoverWord')} <br />
              <span className="text-secondary italic font-light">{t('auth.throughGames')}</span>
            </h1>
            <p className="text-xl text-on-surface-variant font-light max-w-lg leading-relaxed">
              {t('auth.heroDesc')}
            </p>
          </div>
          {/* Scriptural Accent Block */}
          <div className="mt-12 flex items-center gap-4">
            <div className="h-12 w-1 gold-gradient rounded-full" />
            <p className="italic text-secondary/80 font-medium">
              "{t('landing.verseText')}"
            </p>
          </div>
        </div>
      </section>

      {/* Right Side: Login Form (40%) */}
      <section className="w-full lg:w-[40%] flex flex-col justify-center items-center px-8 sm:px-12 md:px-24 bg-surface relative">
        <div className="w-full max-w-md space-y-8">
          {/* Brand Anchor */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-xl gold-gradient flex items-center justify-center mb-4 shadow-lg shadow-secondary/20">
              <span
                className="material-symbols-outlined text-on-secondary text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                menu_book
              </span>
            </div>
            <span className="text-2xl font-bold text-secondary uppercase tracking-[0.2em]">
              Bible Quiz
            </span>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">{t('auth.welcomeBack')}</h2>
            <p className="text-on-surface-variant">{t('auth.loginToContinue')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-error-container/20 border border-error/30">
              <span className="material-symbols-outlined text-error text-sm mt-0.5">error</span>
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div className="mt-8 space-y-6">
            {/* Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3.5 px-4 rounded-xl gold-gradient text-on-secondary font-bold flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-95 gold-glow shadow-lg shadow-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isGoogleLoading ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="currentColor"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="currentColor"
                  />
                </svg>
              )}
              {isGoogleLoading ? t('auth.loggingIn') : t('auth.continueWithGoogle')}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-outline-variant/30" />
              <span className="text-xs uppercase tracking-widest text-on-surface-variant/50 font-bold">
                {t('auth.orLoginWith')}
              </span>
              <div className="h-[1px] flex-1 bg-outline-variant/30" />
            </div>

            {/* Traditional Login Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  {t('auth.email')}
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface focus:ring-1 focus:ring-secondary/50 placeholder:text-on-surface-variant/40 transition-all"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end ml-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {t('auth.password')}
                  </label>
                  <a
                    href="#"
                    className="text-[10px] uppercase tracking-tighter font-bold text-secondary/60 hover:text-secondary transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </a>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">
                    lock
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface focus:ring-1 focus:ring-secondary/50 placeholder:text-on-surface-variant/40 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-4 mt-4 rounded-xl border border-secondary/20 text-secondary font-bold hover:bg-secondary/10 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    {t('auth.loggingIn')}
                  </>
                ) : (
                  <>
                    {t('auth.login')}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Links */}
          <div className="pt-8 flex flex-col items-center gap-4 border-t border-outline-variant/10">
            <p className="text-sm text-on-surface-variant">
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                className="text-secondary font-bold hover:underline decoration-secondary/30 underline-offset-4 ml-1"
              >
                {t('auth.registerNow')}
              </Link>
            </p>
            <Link
              to="/"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 hover:text-on-surface transition-colors py-2 px-4 rounded-full bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-sm">stadium</span>
              {t('auth.guestPlay')}
            </Link>
          </div>
        </div>

        {/* Absolute Footer */}
        <footer className="fixed bottom-4 right-4 flex gap-6 items-center">
          <a
            href="#"
            className="text-xs tracking-widest uppercase text-on-surface/50 hover:text-secondary transition-opacity opacity-100 hover:opacity-80"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-xs tracking-widest uppercase text-on-surface/50 hover:text-secondary transition-opacity opacity-100 hover:opacity-80"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-xs tracking-widest uppercase text-on-surface/50 hover:text-secondary transition-opacity opacity-100 hover:opacity-80"
          >
            Support
          </a>
          <span className="text-xs tracking-widest uppercase text-tertiary opacity-60">
            &copy; 2024 Bible Quiz Sanctuary
          </span>
        </footer>
      </section>

      {/* Top Left Floating Identity (mobile only) */}
      <div className="fixed top-8 left-8 z-50 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center shadow-lg">
            <span
              className="material-symbols-outlined text-on-secondary text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              menu_book
            </span>
          </div>
          <span className="text-lg font-bold text-secondary uppercase tracking-widest">Bible Quiz</span>
        </div>
      </div>
    </main>
  )
}
