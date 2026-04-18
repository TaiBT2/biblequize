import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/authStore'
import { api } from '../api/client'
import PageMeta from '../components/PageMeta'

export default function Register() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch', { defaultValue: 'Passwords do not match' }))
      return
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort', { defaultValue: 'Password must be at least 8 characters' }))
      return
    }

    setIsLoading(true)
    try {
      const res = await api.post('/api/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
      })
      const { accessToken, name: userName, email: userEmail, avatar, role } = res.data
      login({ accessToken, name: userName, email: userEmail, avatar: avatar || undefined, role })
      navigate('/', { replace: true })
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(message || t('auth.errorRegister', { defaultValue: 'Registration failed' }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen">
      <PageMeta title={t('auth.register', { defaultValue: 'Register' })} canonicalPath="/register" />

      {/* Left Hero (hidden on mobile) */}
      <section className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-secondary/10 via-transparent to-surface-container-lowest" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-end p-20 w-full h-full">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-extrabold tracking-tight leading-tight mb-6 text-on-surface drop-shadow-2xl">
              {t('auth.joinUs', { defaultValue: 'Join the' })} <br />
              <span className="text-secondary italic font-light">{t('auth.journeyBegins', { defaultValue: 'journey of faith' })}</span>
            </h1>
            <p className="text-xl text-on-surface-variant font-light max-w-lg leading-relaxed">
              {t('auth.registerHero', { defaultValue: 'Create your account to track progress, compete with others, and grow in scripture.' })}
            </p>
          </div>
          <div className="mt-12 flex items-center gap-4">
            <div className="h-12 w-1 gold-gradient rounded-full" />
            <p className="italic text-secondary/80 font-medium">
              "{t('landing.verseText')}"
            </p>
          </div>
        </div>
      </section>

      {/* Right Form */}
      <section className="w-full lg:w-[40%] flex flex-col justify-center items-center px-8 sm:px-12 md:px-24 bg-surface relative">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-xl gold-gradient flex items-center justify-center mb-4 shadow-lg shadow-secondary/20">
              <span className="material-symbols-outlined text-on-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                menu_book
              </span>
            </div>
            <span className="text-2xl font-bold text-secondary uppercase tracking-[0.2em]">Bible Quiz</span>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">
              {t('auth.createAccount', { defaultValue: 'Create your account' })}
            </h2>
            <p className="text-on-surface-variant">
              {t('auth.alreadyHaveAccount', { defaultValue: 'Already have an account?' })}{' '}
              <Link to="/login" className="text-secondary font-bold hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </div>

          {error && (
            <div data-testid="register-error-msg" className="flex items-start gap-3 px-4 py-3 rounded-xl bg-error-container/20 border border-error/30">
              <span className="material-symbols-outlined text-error text-sm mt-0.5">error</span>
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-8">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                {t('auth.name', { defaultValue: 'Full Name' })}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">
                  person
                </span>
                <input
                  data-testid="register-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface focus:ring-1 focus:ring-secondary/50 placeholder:text-on-surface-variant/40 transition-all"
                  placeholder={t('auth.namePlaceholder', { defaultValue: 'John Doe' })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                {t('auth.email')}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">
                  mail
                </span>
                <input
                  data-testid="register-email-input"
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
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                {t('auth.password')}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">
                  lock
                </span>
                <input
                  data-testid="register-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface focus:ring-1 focus:ring-secondary/50 placeholder:text-on-surface-variant/40 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                {t('auth.confirmPassword', { defaultValue: 'Confirm password' })}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">
                  lock
                </span>
                <input
                  data-testid="register-confirm-password-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface focus:ring-1 focus:ring-secondary/50 placeholder:text-on-surface-variant/40 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              data-testid="register-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-6 rounded-xl gold-gradient text-on-secondary font-bold hover:scale-[1.02] transition-all duration-300 gold-glow shadow-lg shadow-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  {t('auth.registering', { defaultValue: 'Registering...' })}
                </>
              ) : (
                <>
                  {t('auth.register', { defaultValue: 'Create account' })}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-6 flex flex-col items-center gap-3 border-t border-outline-variant/10">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 hover:text-on-surface transition-colors py-2 px-4 rounded-full bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-sm">stadium</span>
              {t('auth.guestPlay')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
