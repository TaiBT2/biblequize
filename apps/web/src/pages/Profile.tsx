import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useAuth, useAuthStore } from '../store/authStore'
import { getTierByPoints, getNextTier } from '../data/tiers'
import { soundManager } from '../services/soundManager'
import { isHapticsEnabled, setHapticsEnabled } from '../utils/haptics'
import WeaknessWidget from '../components/WeaknessWidget'

const FILL_STYLE = { fontVariationSettings: "'FILL' 1" }

interface UserProfile {
  name: string
  email: string
  avatarUrl?: string
  totalPoints: number
  currentStreak: number
  longestStreak: number
  role: string
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: string | null
}

interface SessionHistory {
  id: string
  completedAt: string
  score: number
}

type HeatmapColor =
  | 'bg-secondary'
  | 'bg-secondary/60'
  | 'bg-secondary/80'
  | 'bg-secondary/30'
  | 'bg-surface-container-high'

function buildHeatmapCells(history: SessionHistory[]): HeatmapColor[] {
  if (!history || history.length === 0) return []

  const dateCounts = new Map<string, number>()
  for (const session of history) {
    const date = session.completedAt?.slice(0, 10)
    if (date) {
      dateCounts.set(date, (dateCounts.get(date) ?? 0) + 1)
    }
  }

  // Build last 80 days heatmap
  const cells: HeatmapColor[] = []
  const today = new Date()
  for (let i = 79; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const count = dateCounts.get(key) ?? 0
    if (count === 0) cells.push('bg-surface-container-high')
    else if (count <= 2) cells.push('bg-secondary/30')
    else if (count <= 5) cells.push('bg-secondary/60')
    else if (count <= 8) cells.push('bg-secondary/80')
    else cells.push('bg-secondary')
  }
  return cells
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-2xl ${className}`} />
}

function ProfileSkeleton() {
  return (
    <>
      <section className="relative rounded-3xl overflow-hidden mb-12">
        <SkeletonBlock className="h-48 md:h-72 rounded-3xl" />
      </section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        <SkeletonBlock className="md:col-span-2 h-64" />
        <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
        </div>
      </div>
      <SkeletonBlock className="h-48 mb-12" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {[1, 2, 3, 4, 5].map(i => <SkeletonBlock key={i} className="h-48" />)}
      </div>
    </>
  )
}

const Profile: React.FC = () => {
  const { t } = useTranslation()
  const { user: authUser, isAuthenticated } = useAuth()

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/api/me')).data,
    enabled: isAuthenticated,
  })

  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['my-achievements'],
    queryFn: async () => {
      try { return (await api.get('/api/achievements/me')).data } catch { return [] }
    },
    enabled: isAuthenticated,
  })

  const { data: historyData } = useQuery<{ content?: SessionHistory[] }>({
    queryKey: ['my-history'],
    queryFn: async () => {
      try { return (await api.get('/api/me/history')).data } catch { return { content: [] } }
    },
    enabled: isAuthenticated,
  })

  if (!isAuthenticated || !authUser) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-secondary">
            {t('profile.loginRequired')}
          </h2>
          <Link
            to="/login"
            className="px-6 py-3 rounded-lg font-bold gold-gradient text-on-secondary inline-block"
          >
            {t('auth.login')}
          </Link>
        </div>
      </div>
    )
  }

  if (profileLoading) return <ProfileSkeleton />

  if (profileError || !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-error">
            {t('profile.loadError')}
          </h2>
          <p className="text-on-surface-variant mb-4">{t('profile.tryAgainLater')}</p>
        </div>
      </div>
    )
  }

  const points = profile.totalPoints ?? 0
  const currentTier = getTierByPoints(points)
  const nextTier = getNextTier(points)
  const tierProgress = {
    currentTierName: t(currentTier.nameKey),
    nextTierName: nextTier ? t(nextTier.nameKey) : 'Max',
    currentExp: points,
    nextTierExp: nextTier?.minPoints ?? currentTier.maxPoints,
    progressPercent: nextTier
      ? Math.min(100, Math.round(((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100))
      : 100,
    expRemaining: nextTier ? nextTier.minPoints - points : 0,
  }

  const quickStats = [
    { icon: 'quiz', iconFill: false, label: t('profile.totalPoints'), value: (profile.totalPoints ?? 0).toLocaleString(), bgColor: 'bg-secondary/10', textColor: 'text-secondary', testId: 'profile-stats-points' },
    { icon: 'bolt', iconFill: true, label: t('profile.bestStreak'), value: `${profile.longestStreak ?? 0} ${t('common.days')}`, bgColor: 'bg-[#e7c268]/10', textColor: 'text-[#e7c268]', testId: 'profile-stats-streak' },
    { icon: 'local_fire_department', iconFill: true, label: t('profile.currentStreak'), value: `${profile.currentStreak ?? 0} ${t('common.days')}`, bgColor: 'bg-primary/10', textColor: 'text-primary', hiddenOnMobile: true, testId: undefined },
  ]

  const history = historyData?.content ?? (Array.isArray(historyData) ? historyData as unknown as SessionHistory[] : [])
  const heatmapCells = buildHeatmapCells(history)
  const hasHeatmapData = heatmapCells.length > 0

  const badges = achievements.map(a => ({
    icon: a.icon || 'emoji_events',
    name: a.name,
    description: a.description,
    locked: !a.unlockedAt,
  }))

  return (
    <div data-testid="profile-page">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden mb-12">
        <div className="h-48 md:h-72 relative">
          <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-background" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        <div className="absolute bottom-6 left-6 md:left-10 flex flex-col md:flex-row items-end gap-6 w-full pr-12">
          <div data-testid="profile-avatar" className="w-24 h-24 md:w-40 md:h-40 rounded-3xl border-4 border-background bg-surface-container-high overflow-hidden shadow-2xl relative z-10">
            {profile.avatarUrl ? (
              <img alt="User avatar" className="w-full h-full object-cover" src={profile.avatarUrl} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-secondary">
                <span className="material-symbols-outlined text-6xl">person</span>
              </div>
            )}
          </div>
          <div className="flex-1 pb-4">
            <h1 data-testid="profile-name" className="text-3xl md:text-5xl font-black text-on-surface tracking-tight mb-1">
              {profile.name}
            </h1>
            <p data-testid="profile-tier-badge" className="text-secondary font-bold flex items-center gap-2 text-lg">
              <span className="material-symbols-outlined text-xl" style={FILL_STYLE}>verified</span>
              {tierProgress.currentTierName}
            </p>
          </div>
          <div className="hidden lg:flex gap-3 pb-4">
            <button className="px-6 py-3 bg-surface-container-highest border border-outline-variant/20 rounded-xl font-bold text-sm hover:bg-surface-bright transition-colors">
              {t('profile.editProfile')}
            </button>
            <button className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary hover:bg-secondary/20 transition-colors">
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid Stats & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        {/* Tier Progress */}
        <div data-testid="profile-tier-progress" className="md:col-span-2 bg-surface-container rounded-3xl p-10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-on-surface tracking-tight uppercase">
                {t('profile.tierProgress')}
              </h2>
              <span className="text-xs font-black bg-tertiary-container text-tertiary px-4 py-1.5 rounded-full uppercase tracking-widest">
                {tierProgress.nextTierName} ({t('profile.next')})
              </span>
            </div>
            <div className="relative h-5 w-full bg-primary-container rounded-full overflow-hidden mb-6">
              <div
                className="absolute top-0 left-0 h-full gold-gradient rounded-full shadow-[0_0_12px_rgba(232,168,50,0.3)]"
                style={{ width: `${tierProgress.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm font-bold text-on-surface-variant uppercase tracking-tighter">
              <span data-testid="profile-tier-current-name">{tierProgress.currentTierName}</span>
              <span data-testid="profile-tier-exp">
                {tierProgress.currentExp.toLocaleString()} / {tierProgress.nextTierExp.toLocaleString()} EXP
              </span>
              <span data-testid="profile-tier-next-name">{tierProgress.nextTierName}</span>
            </div>
          </div>
          <div className="mt-10 flex gap-6 items-center">
            <div className="flex -space-x-3">
              <div className="w-12 h-12 rounded-full border-2 border-surface-container bg-surface-container-high flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-surface-container bg-surface-container-high flex items-center justify-center text-on-surface-variant opacity-50">
                <span className="material-symbols-outlined text-2xl">lock</span>
              </div>
            </div>
            <p className="text-base text-on-surface-variant italic font-medium leading-relaxed">
              {tierProgress.expRemaining > 0
                ? <>&ldquo;{t('profile.expRemaining', { exp: tierProgress.expRemaining.toLocaleString(), tier: tierProgress.nextTierName })}&rdquo;</>
                : <>&ldquo;{t('profile.maxTierReached')}&rdquo;</>
              }
            </p>
          </div>
        </div>

        {/* Quick Stats Column */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              data-testid={stat.testId}
              className={`bg-surface-container rounded-3xl p-8 flex items-center gap-5${
                stat.hiddenOnMobile ? ' hidden md:flex' : ''
              }`}
            >
              <div className={`p-4 ${stat.bgColor} rounded-2xl ${stat.textColor}`}>
                <span
                  className="material-symbols-outlined text-3xl"
                  style={stat.iconFill ? FILL_STYLE : undefined}
                >
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-on-surface-variant tracking-widest">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-on-surface">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Section */}
      <section data-testid="profile-heatmap" className="bg-surface-container rounded-3xl p-10 mb-12 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-xl font-bold text-on-surface tracking-tight uppercase">
            {t('profile.learningLog')}
          </h2>
          <div className="flex items-center gap-6 text-xs font-bold text-on-surface-variant">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-surface-container-high rounded-sm" />
              <span>{t('profile.restDay')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-secondary/30 rounded-sm" />
              <span>{t('profile.lightDay')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-secondary rounded-sm" />
              <span>{t('profile.activeDay')}</span>
            </div>
          </div>
        </div>
        {hasHeatmapData ? (
          <div className="overflow-x-auto pb-4">
            <div className="streak-grid min-w-[600px] gap-1.5">
              {heatmapCells.map((colorClass, i) => (
                <div key={i} className={`h-5 ${colorClass} rounded-sm`} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-on-surface-variant text-center py-8">
            {t('profile.startPlaying')}
          </p>
        )}
      </section>

      {/* Badge Collection */}
      <section data-testid="profile-badges-section">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-on-surface tracking-tight uppercase">
            {t('profile.badgeCollection')}
          </h2>
          <a
            className="text-secondary text-sm font-black uppercase tracking-widest hover:underline"
            href="#"
          >
            {t('home.viewAll')}
          </a>
        </div>
        {achievementsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {[1, 2, 3, 4, 5].map(i => <SkeletonBlock key={i} className="h-48" />)}
          </div>
        ) : badges.length === 0 ? (
          <p className="text-on-surface-variant text-center py-8">
            {t('profile.noBadges')}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {badges.map((badge) => (
              <div
                key={badge.name}
                className={`bg-surface-container rounded-3xl p-8 flex flex-col items-center text-center group${
                  badge.locked
                    ? ' opacity-40 grayscale'
                    : ' hover:bg-surface-container-high'
                } transition-all`}
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 border ${
                    badge.locked
                      ? 'bg-surface-container-high border-outline-variant/10'
                      : 'glass-effect border-secondary/20 shadow-[0_0_15px_rgba(232,168,50,0.1)] group-hover:scale-110'
                  } transition-transform`}
                >
                  <span
                    className={`material-symbols-outlined text-4xl ${
                      badge.locked ? 'text-on-surface-variant' : 'text-secondary'
                    }`}
                    style={!badge.locked ? FILL_STYLE : undefined}
                  >
                    {badge.icon}
                  </span>
                </div>
                <p className="text-sm font-black text-on-surface mb-2">{badge.name}</p>
                <p className="text-xs text-on-surface-variant font-medium">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Weakness Analysis */}
      <div data-testid="profile-weakness-widget">
        <WeaknessWidget />
      </div>

      {/* Sound & Haptics Settings */}
      <SoundHapticsSettings />

      {/* Prestige + Cosmetics */}
      <PrestigeSection />

      {/* Delete Account */}
      <DeleteAccountSection />
    </div>
  )
}

function SoundHapticsSettings() {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled)
  const [volume, setVolume] = useState(Math.round(soundManager.volume * 100))
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled())

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary" style={FILL_STYLE}>
          volume_up
        </span>
        <h2 className="text-lg font-black text-on-surface">Âm thanh & Rung</h2>
      </div>

      <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10 space-y-4">
        {/* Sound toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface">Âm thanh hiệu ứng</span>
          <button
            onClick={() => {
              const next = !soundEnabled
              setSoundEnabled(next)
              soundManager.setEnabled(next)
              if (next) soundManager.play('buttonTap')
            }}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              soundEnabled ? 'bg-secondary' : 'bg-surface-container-high'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
              soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Volume slider */}
        {soundEnabled && (
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">volume_down</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value)
                setVolume(v)
                soundManager.setVolume(v / 100)
              }}
              className="flex-1 h-1 bg-surface-container-high rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-secondary"
            />
            <span className="text-xs font-bold text-on-surface-variant w-8 text-right">{volume}%</span>
          </div>
        )}

        {/* Haptics toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface">Rung phản hồi</span>
          <button
            onClick={() => {
              const next = !hapticsOn
              setHapticsOn(next)
              setHapticsEnabled(next)
            }}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              hapticsOn ? 'bg-secondary' : 'bg-surface-container-high'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
              hapticsOn ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>
    </section>
  )
}

function PrestigeSection() {
  const { data } = useQuery<{
    canPrestige: boolean; prestigeLevel: number; daysAtTier6: number
    daysRequired: number; nextPrestigeName: string | null
  }>({
    queryKey: ['prestige-status'],
    queryFn: () => api.get('/api/me/prestige-status').then(r => r.data),
    staleTime: 60_000,
  })

  if (!data) return null

  const PRESTIGE_ICONS = ['', '🥈', '🥇', '🌈']
  const { prestigeLevel, daysAtTier6, daysRequired, canPrestige, nextPrestigeName } = data

  return (
    <section data-testid="profile-prestige-section" className="mt-8 space-y-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary" style={FILL_STYLE}>
          military_tech
        </span>
        <h2 className="text-lg font-black text-on-surface">Prestige</h2>
        {prestigeLevel > 0 && (
          <span className="text-sm font-bold text-secondary">
            P{prestigeLevel} {PRESTIGE_ICONS[prestigeLevel]}
          </span>
        )}
      </div>

      <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
        {prestigeLevel === 0 && daysAtTier6 === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Đạt Tier 6 (Sứ Đồ) và ở đó 30 ngày để mở khóa Prestige.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Ngày ở Tier 6</span>
              <span data-testid="profile-days-at-tier6" className="font-bold text-on-surface">{daysAtTier6}/{daysRequired}</span>
            </div>
            <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all"
                style={{ width: `${Math.min(100, (daysAtTier6 / daysRequired) * 100)}%` }}
              />
            </div>
            {canPrestige && nextPrestigeName && (
              <div className="mt-4 p-4 bg-secondary/10 border border-secondary/20 rounded-xl text-center">
                <p className="text-sm font-bold text-secondary mb-2">
                  🏆 Đủ điều kiện Prestige!
                </p>
                <p className="text-xs text-on-surface-variant mb-3">
                  Bắt đầu hành trình mới với danh hiệu "{nextPrestigeName}"
                </p>
                <Link
                  to="/cosmetics"
                  className="inline-block px-4 py-2 text-xs font-bold gold-gradient text-on-secondary rounded-lg"
                >
                  Xem chi tiết
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function DeleteAccountSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [confirmPhrase, setConfirmPhrase] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const expectedPhrase = t('profile.deleteAccountConfirmPhrase')
  const isValid = confirmPhrase === expectedPhrase

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await api.delete('/api/me/account', { data: { confirmPhrase } })
      useAuthStore.getState().logout()
      localStorage.clear()
      navigate('/login')
    } catch (e: any) {
      setError(e.response?.data?.error ?? e.userMessage ?? t('common.error'))
      setDeleting(false)
    }
  }

  return (
    <section className="glass-card mt-8">
      <div className="border-t border-error/20 pt-6">
        <h3 className="text-error font-semibold mb-2">{t('profile.dangerZone')}</h3>
        <button
          data-testid="profile-delete-account-btn"
          onClick={() => setShowModal(true)}
          className="text-error border border-error/30 px-4 py-2 rounded-lg text-sm hover:bg-error/10 transition-colors"
        >
          {t('profile.deleteAccount')}
        </button>
      </div>

      {showModal && (
        <div data-testid="delete-account-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-error">{t('profile.deleteAccountTitle')}</h2>

            <div className="bg-error/10 border border-error/30 rounded-lg p-4">
              <p className="text-sm text-error">{t('profile.deleteAccountWarning')}</p>
              <ul className="text-sm text-error/80 mt-2 space-y-1 list-disc pl-5">
                <li>{t('profile.deleteAccountData1')}</li>
                <li>{t('profile.deleteAccountData2')}</li>
                <li>{t('profile.deleteAccountData3')}</li>
                <li>{t('profile.deleteAccountData4')}</li>
              </ul>
            </div>

            <p className="text-sm text-on-surface-variant">
              {t('profile.deleteAccountConfirmLabel', { phrase: expectedPhrase })}
            </p>
            <input
              data-testid="profile-delete-confirm-input"
              type="text"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder={expectedPhrase}
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-on-surface text-sm focus:border-error outline-none"
            />

            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex gap-3">
              <button
                data-testid="delete-account-cancel-btn"
                onClick={() => { setShowModal(false); setConfirmPhrase(''); setError('') }}
                className="flex-1 px-4 py-2 rounded-lg border border-outline-variant/20 text-on-surface-variant text-sm hover:bg-surface-container-high"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={!isValid || deleting}
                className="flex-1 bg-error text-on-error rounded-lg py-2 text-sm font-semibold disabled:opacity-30 transition-opacity"
              >
                {deleting ? t('profile.deleteAccountDeleting') : t('profile.deleteAccountBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Profile
