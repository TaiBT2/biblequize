import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useAuth, useAuthStore } from '../store/authStore'
import { getTierByPoints, getNextTier, TIERS } from '../data/tiers'
import { soundManager } from '../services/soundManager'
import { isHapticsEnabled, setHapticsEnabled } from '../utils/haptics'

const FILL_STYLE = { fontVariationSettings: "'FILL' 1" }

interface UserProfile {
  name: string
  email: string
  avatarUrl?: string
  totalPoints: number
  currentStreak: number
  longestStreak: number
  role: string
  createdAt?: string
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
  totalQuestions?: number
  correctAnswers?: number
  status?: string
}

interface BookAccuracy {
  book: string
  totalAnswered: number
  correct: number
  wrong: number
  accuracy: number
}

interface WeaknessData {
  weakBooks: BookAccuracy[]
  strongBooks: BookAccuracy[]
  suggestedPractice: string | null
}

type HeatmapLevel = 0 | 1 | 2 | 3 | 4

const WEEKS = 53
const HEATMAP_DAYS = WEEKS * 7

function buildHeatmapLevels(history: SessionHistory[]): HeatmapLevel[] {
  const dateCounts = new Map<string, number>()
  for (const session of history) {
    const date = session.completedAt?.slice(0, 10)
    if (date) dateCounts.set(date, (dateCounts.get(date) ?? 0) + 1)
  }
  const cells: HeatmapLevel[] = []
  const today = new Date()
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const count = dateCounts.get(key) ?? 0
    if (count === 0) cells.push(0)
    else if (count <= 2) cells.push(1)
    else if (count <= 5) cells.push(2)
    else if (count <= 8) cells.push(3)
    else cells.push(4)
  }
  return cells
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-2xl ${className}`} />
}

function ProfileSkeleton() {
  return (
    <>
      <SkeletonBlock className="h-32 rounded-3xl mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} className="h-24" />)}
      </div>
      <SkeletonBlock className="h-56 mb-6" />
      <SkeletonBlock className="h-48 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map(i => <SkeletonBlock key={i} className="h-36" />)}
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
          <h2 className="text-2xl font-bold mb-4 text-secondary">{t('profile.loginRequired')}</h2>
          <Link to="/login" className="px-6 py-3 rounded-lg font-bold gold-gradient text-on-secondary inline-block">
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
          <h2 className="text-2xl font-bold mb-4 text-error">{t('profile.loadError')}</h2>
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
    nextTierName: nextTier ? t(nextTier.nameKey) : t('profile.tierMaxLabel'),
    currentExp: points,
    nextTierExp: nextTier?.minPoints ?? currentTier.maxPoints,
    progressPercent: nextTier
      ? Math.min(100, Math.round(((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100))
      : 100,
    expRemaining: nextTier ? nextTier.minPoints - points : 0,
  }

  const history = historyData?.content ?? (Array.isArray(historyData) ? historyData as unknown as SessionHistory[] : [])
  const totalSessions = history.length
  const totalQuestions = history.reduce((sum, s) => sum + (s.totalQuestions ?? 0), 0)
  const totalCorrect = history.reduce((sum, s) => sum + (s.correctAnswers ?? 0), 0)
  const correctRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0
  const heatmapLevels = buildHeatmapLevels(history)
  const activeDays = heatmapLevels.filter(l => l > 0).length
  const initial = (profile.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div data-testid="profile-page" className="space-y-4">
      {/* Page title row */}
      <div>
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">{t('profile.title')}</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">{t('profile.subtitle')}</p>
      </div>

      {/* Hero */}
      <HeroCompact
        profile={profile}
        initial={initial}
        tierEmoji={currentTier.iconEmoji}
        tierName={tierProgress.currentTierName}
        tierLevel={currentTier.id}
      />

      {/* Stats strip */}
      <StatsStrip
        points={points}
        currentStreak={profile.currentStreak ?? 0}
        longestStreak={profile.longestStreak ?? 0}
        totalSessions={totalSessions}
        totalQuestions={totalQuestions}
        totalCorrect={totalCorrect}
        correctRate={correctRate}
      />

      {/* Tier progress */}
      <TierProgressCard
        currentTier={currentTier}
        nextTier={nextTier}
        tierProgress={tierProgress}
        currentStreak={profile.currentStreak ?? 0}
      />

      {/* Heatmap */}
      <HeatmapCard cells={heatmapLevels} activeDays={activeDays} />

      {/* Badges */}
      <BadgeCollection achievements={achievements} loading={achievementsLoading} />

      {/* Analytics + Practice CTA */}
      <AnalyticsCard />

      {/* Prestige */}
      <PrestigeSection />

      {/* Sound + haptics */}
      <SoundHapticsSettings />

      {/* Danger zone */}
      <DeleteAccountSection />
    </div>
  )
}

/* ========== Hero ========== */

function HeroCompact({ profile, initial, tierEmoji, tierName, tierLevel }: {
  profile: UserProfile
  initial: string
  tierEmoji: string
  tierName: string
  tierLevel: number
}) {
  const { t } = useTranslation()
  return (
    <section className="relative overflow-hidden rounded-3xl border border-outline-variant/10 bg-gradient-to-br from-secondary/[0.08] to-surface-container/40 p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center gap-5">
      <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-gradient-radial from-secondary/10 to-transparent pointer-events-none" />

      <div className="relative shrink-0">
        <div data-testid="profile-avatar" className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gradient-to-br from-outline to-outline-variant flex items-center justify-center text-4xl font-extrabold text-white border-[3px] border-secondary/40 shadow-2xl">
          {profile.avatarUrl ? (
            <img alt="User avatar" className="w-full h-full object-cover" src={profile.avatarUrl} />
          ) : initial}
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-base border-[3px] border-background">
          {tierEmoji}
        </div>
      </div>

      <div className="flex-1 min-w-0 relative">
        <h2 data-testid="profile-name" className="text-2xl md:text-[26px] font-extrabold text-on-surface tracking-tight truncate">
          {profile.name}
        </h2>
        <span data-testid="profile-tier-badge" className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-xs font-semibold text-secondary">
          <span>{tierEmoji}</span> {tierName} · {t('profile.tierCurrentSub', { n: tierLevel }).split('·')[0].trim()}
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-on-surface-variant">
          <span data-testid="profile-email" className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">mail</span>
            {profile.email}
          </span>
          {profile.createdAt && (
            <span data-testid="profile-join-date" className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {t('profile.joinedOn')} {new Date(profile.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 relative shrink-0">
        <button
          aria-label={t('profile.share')}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-on-surface hover:bg-white/10 transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
        </button>
        <button className="h-10 px-4 rounded-xl gold-gradient text-on-secondary text-sm font-semibold inline-flex items-center gap-1.5 hover:shadow-[0_6px_18px_rgba(232,168,50,0.3)] transition-shadow">
          <span className="material-symbols-outlined text-[18px]">edit</span>
          {t('profile.editProfile')}
        </button>
      </div>
    </section>
  )
}

/* ========== Stats strip ========== */

function StatsStrip({ points, currentStreak, longestStreak, totalSessions, totalQuestions, totalCorrect, correctRate }: {
  points: number
  currentStreak: number
  longestStreak: number
  totalSessions: number
  totalQuestions: number
  totalCorrect: number
  correctRate: number
}) {
  const { t } = useTranslation()
  const dayWord = t('common.days')

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        testId="profile-stats-points"
        icon="emoji_events"
        iconBg="bg-secondary/15 text-secondary"
        label={t('profile.totalPoints')}
        value={points.toLocaleString()}
        sub={t('profile.statRankUnranked')}
      />
      <StatCard
        testId="profile-stats-streak"
        icon="local_fire_department"
        iconFill
        iconBg="bg-orange-500/15 text-orange-400"
        label={t('profile.currentStreak')}
        value={`${currentStreak} ${dayWord}`}
        sub={t('profile.statLongestSub', { n: longestStreak })}
        subClass="text-emerald-400"
        extra={<span className="sr-only">{longestStreak} {dayWord}</span>}
      />
      <StatCard
        testId="profile-total-sessions"
        icon="history"
        iconBg="bg-purple-500/15 text-purple-400"
        label={t('profile.totalSessions')}
        value={`${totalSessions}`}
        sub={t('profile.statQuestionsAnswered', { n: totalQuestions })}
      />
      <StatCard
        testId="profile-correct-rate"
        icon="check_circle"
        iconFill
        iconBg="bg-emerald-500/15 text-emerald-400"
        label={t('profile.correctRate')}
        value={`${correctRate}%`}
        sub={t('profile.statCorrectFraction', { correct: totalCorrect, total: totalQuestions })}
      />
    </section>
  )
}

function StatCard({ testId, icon, iconFill, iconBg, label, value, sub, subClass, extra }: {
  testId?: string
  icon: string
  iconFill?: boolean
  iconBg: string
  label: string
  value: string
  sub?: string
  subClass?: string
  extra?: React.ReactNode
}) {
  return (
    <div data-testid={testId} className="bg-surface-container/60 backdrop-blur-sm border border-outline-variant/10 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className="material-symbols-outlined text-[22px]" style={iconFill ? FILL_STYLE : undefined}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
        <p className="text-[22px] font-extrabold text-on-surface leading-tight tracking-tight mt-0.5 truncate">{value}</p>
        {sub && <p className={`text-[11px] mt-0.5 ${subClass ?? 'text-on-surface-variant'}`}>{sub}</p>}
        {extra}
      </div>
    </div>
  )
}

/* ========== Tier progress ========== */

function TierProgressCard({ currentTier, nextTier, tierProgress, currentStreak }: {
  currentTier: typeof TIERS[number]
  nextTier: typeof TIERS[number] | null
  tierProgress: {
    currentTierName: string
    nextTierName: string
    currentExp: number
    nextTierExp: number
    progressPercent: number
    expRemaining: number
  }
  currentStreak: number
}) {
  const { t } = useTranslation()
  // Sub-stars: 5 buckets across current tier progress
  const starsFilled = Math.min(5, Math.floor(tierProgress.progressPercent / 20))
  const stars = [0, 1, 2, 3, 4].map(i => {
    if (i < starsFilled) return 'filled'
    if (i === starsFilled && tierProgress.progressPercent < 100) return 'current'
    return 'empty'
  })

  // ETA: rough heuristic — assume avg 50 EXP/day at current streak (no real data)
  const etaDays = nextTier && currentStreak > 0
    ? Math.ceil(tierProgress.expRemaining / Math.max(40, currentStreak * 20))
    : null

  return (
    <section data-testid="profile-tier-progress" className="bg-surface-container/60 backdrop-blur-sm border border-outline-variant/10 rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-outline to-outline-variant flex items-center justify-center text-[22px] border border-white/10 shrink-0">
            {currentTier.iconEmoji}
          </div>
          <div className="min-w-0">
            <p data-testid="profile-tier-current-name" className="text-base font-bold text-on-surface truncate">
              {t(currentTier.nameKey)}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {t('profile.tierCurrentSub', { n: currentTier.id })}
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-2xl text-white/20 hidden sm:block">arrow_forward</span>
        <div className="flex items-center gap-3 shrink-0">
          {nextTier ? (
            <>
              <div className="text-right">
                <p data-testid="profile-tier-next-name" className="text-[13px] font-semibold text-secondary">
                  {t(nextTier.nameKey)}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {t('profile.tierNextSub', { n: nextTier.id, exp: tierProgress.expRemaining.toLocaleString() })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-dashed border-secondary/40 flex items-center justify-center text-[22px] opacity-70">
                {nextTier.iconEmoji}
              </div>
            </>
          ) : (
            <span className="text-xs font-bold text-secondary uppercase">{t('profile.tierMaxLabel')}</span>
          )}
        </div>
      </div>

      {/* Sub-stars */}
      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
          {t('profile.subStarsLabel', { n: starsFilled })}
        </p>
        <div className="flex items-center justify-between px-1">
          {stars.map((state, i) => (
            <div
              key={i}
              className={
                state === 'filled'
                  ? 'w-6 h-6 rounded-full gold-gradient text-on-secondary flex items-center justify-center text-[13px] shadow-[0_0_10px_rgba(232,168,50,0.4)]'
                  : state === 'current'
                  ? 'w-6 h-6 rounded-full bg-secondary/15 border border-secondary text-secondary flex items-center justify-center text-[13px] animate-pulse'
                  : 'w-6 h-6 rounded-full bg-white/5 border border-white/10 text-white/20 flex items-center justify-center text-[13px]'
              }
            >
              ★
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar with milestones */}
      <div className="relative mt-5 mb-7">
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full gold-gradient rounded-full shadow-[0_0_10px_rgba(232,168,50,0.5)] relative"
            style={{ width: `${tierProgress.progressPercent}%` }}
          >
            {tierProgress.progressPercent > 0 && tierProgress.progressPercent < 100 && (
              <div className="absolute -right-0.5 -top-0.5 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-background shadow-[0_0_12px_rgba(232,168,50,0.8)]" />
            )}
          </div>
        </div>
        {[50, 90].map(p => (
          <React.Fragment key={p}>
            <div className="absolute -top-0.5 w-0.5 h-3.5 bg-white/20 rounded" style={{ left: `${p}%` }} />
            <div
              className="absolute top-4 text-[9px] font-semibold uppercase tracking-wider text-white/40 -translate-x-1/2"
              style={{ left: `${p}%` }}
            >
              {p}%
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-3">
          <div data-testid="profile-tier-exp" className="text-xs text-on-surface-variant">
            <span className="text-lg font-extrabold text-secondary tracking-tight align-baseline">
              {`${tierProgress.currentExp.toLocaleString()} / ${tierProgress.nextTierExp.toLocaleString()}`}
            </span>
            <span className="ml-1">EXP</span>
          </div>
          {nextTier && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {etaDays != null ? t('profile.tierEta', { days: etaDays }) : t('profile.tierEtaUnknown')}
            </div>
          )}
        </div>
        {nextTier && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-xs font-semibold text-secondary self-start sm:self-auto">
            <span className="material-symbols-outlined text-[16px]">lock_open</span>
            {t('profile.tierUnlockNext')}: {t(nextTier.nameKey)}
          </div>
        )}
      </div>
    </section>
  )
}

/* ========== Heatmap ========== */

const HEATMAP_BG: Record<HeatmapLevel, string> = {
  0: 'bg-white/[0.04]',
  1: 'bg-secondary/25',
  2: 'bg-secondary/50',
  3: 'bg-secondary/75',
  4: 'bg-secondary',
}

function HeatmapCard({ cells, activeDays }: { cells: HeatmapLevel[]; activeDays: number }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const hasData = activeDays > 0

  return (
    <section data-testid="profile-heatmap" className="bg-surface-container/60 backdrop-blur-sm border border-outline-variant/10 rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">grid_view</span>
            {t('profile.learningLog')}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">{t('profile.heatmapYearLabel')}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
          <span><span className="text-on-surface font-bold">{activeDays}</span> {t('profile.heatmapTotalLabel')}</span>
        </div>
      </div>

      {hasData ? (
        <div className="overflow-x-auto pb-1">
          <div
            className="grid gap-[3px] min-w-max"
            style={{
              gridTemplateRows: 'repeat(7, 12px)',
              gridAutoFlow: 'column',
              gridAutoColumns: '12px',
            }}
          >
            {cells.map((level, i) => (
              <div key={i} className={`rounded-[2px] ${HEATMAP_BG[level]}`} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-on-surface-variant">
            <span>{t('profile.heatmapLow')}</span>
            {[0, 1, 2, 3, 4].map(l => (
              <div key={l} className={`w-2.5 h-2.5 rounded-[2px] ${HEATMAP_BG[l as HeatmapLevel]}`} />
            ))}
            <span>{t('profile.heatmapHigh')}</span>
          </div>
        </div>
      ) : (
        <p className="text-on-surface-variant text-center py-6">{t('profile.startPlaying')}</p>
      )}

      {!hasData && (
        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-secondary/[0.05] border border-dashed border-secondary/20">
          <div className="text-xs text-on-surface-variant">
            🌱 <strong className="text-on-surface font-semibold">{t('profile.heatmapEmptyTitle')}</strong>{' '}
            {t('profile.heatmapEmptyDesc')}
          </div>
          <button
            onClick={() => navigate('/daily')}
            className="h-9 px-3 rounded-lg gold-gradient text-on-secondary text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            {t('profile.heatmapPlayCta')}
          </button>
        </div>
      )}
    </section>
  )
}

/* ========== Badge collection ========== */

type BadgeTab = 'all' | 'unlocked' | 'locked'

function BadgeCollection({ achievements, loading }: { achievements: Achievement[]; loading: boolean }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<BadgeTab>('all')

  const unlockedCount = achievements.filter(a => a.unlockedAt).length
  const lockedCount = achievements.length - unlockedCount

  const filtered = useMemo(() => {
    if (tab === 'unlocked') return achievements.filter(a => a.unlockedAt)
    if (tab === 'locked') return achievements.filter(a => !a.unlockedAt)
    return achievements
  }, [achievements, tab])

  return (
    <section data-testid="profile-badges-section" className="bg-surface-container/60 backdrop-blur-sm border border-outline-variant/10 rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-secondary">workspace_premium</span>
          {t('profile.badgeCollection')}
        </h2>
        <a className="text-xs font-semibold text-secondary hover:underline" href="#">
          {t('profile.badgeViewAll', { n: achievements.length })} →
        </a>
      </div>

      <div className="flex gap-1.5 mb-4">
        {([
          { id: 'all' as const, label: t('profile.badgeTabAll'), count: achievements.length },
          { id: 'unlocked' as const, label: t('profile.badgeTabUnlocked'), count: unlockedCount },
          { id: 'locked' as const, label: t('profile.badgeTabLocked'), count: lockedCount },
        ]).map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? 'px-3.5 py-1.5 rounded-full bg-secondary/15 border border-secondary/30 text-xs font-semibold text-secondary'
                : 'px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-on-surface-variant hover:text-on-surface'
            }
          >
            {item.label} <span className="opacity-70 ml-0.5">{item.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <SkeletonBlock key={i} className="h-32" />)}
        </div>
      ) : achievements.length === 0 ? (
        <p className="text-on-surface-variant text-center py-8">{t('profile.noBadges')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {filtered.map(a => <BadgeTile key={a.id} achievement={a} />)}
        </div>
      )}
    </section>
  )
}

function BadgeTile({ achievement }: { achievement: Achievement }) {
  const unlocked = !!achievement.unlockedAt
  return (
    <div
      className={
        unlocked
          ? 'relative aspect-square rounded-2xl p-3 flex flex-col items-center justify-center text-center bg-gradient-to-b from-secondary/10 to-secondary/[0.02] border border-secondary/25 hover:-translate-y-0.5 transition-transform'
          : 'relative aspect-square rounded-2xl p-3 flex flex-col items-center justify-center text-center bg-white/[0.03] border border-white/5'
      }
    >
      {!unlocked && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-black/40 flex items-center justify-center">
          <span className="material-symbols-outlined text-[10px] text-white/50">lock</span>
        </div>
      )}
      <div
        className={
          unlocked
            ? 'w-11 h-11 rounded-full mb-2 flex items-center justify-center bg-secondary/20 text-secondary'
            : 'w-11 h-11 rounded-full mb-2 flex items-center justify-center bg-white/5 text-white/20'
        }
      >
        <span className="material-symbols-outlined text-2xl" style={unlocked ? FILL_STYLE : undefined}>
          {achievement.icon || 'emoji_events'}
        </span>
      </div>
      <p className={`text-[11px] font-bold ${unlocked ? 'text-on-surface' : 'text-white/40'}`}>{achievement.name}</p>
      <p className="text-[9px] text-on-surface-variant mt-0.5 leading-tight line-clamp-2">{achievement.description}</p>
    </div>
  )
}

/* ========== Analytics card ========== */

function AnalyticsCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery<WeaknessData>({
    queryKey: ['weaknesses'],
    queryFn: () => api.get('/api/me/weaknesses').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  if (isLoading || !data) return null
  if (data.weakBooks.length === 0 && data.strongBooks.length === 0) return null

  const suggested = data.suggestedPractice ?? data.weakBooks[0]?.book ?? null
  const suggestedBook = data.weakBooks.find(b => b.book === suggested) ?? data.weakBooks[0]

  return (
    <section data-testid="profile-weakness-widget" className="bg-surface-container/60 backdrop-blur-sm border border-outline-variant/10 rounded-2xl p-5 md:p-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface inline-flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[18px] text-secondary">analytics</span>
        {t('profile.analyticsTitle')}
      </h2>

      {data.strongBooks.length > 0 && (
        <>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 inline-flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            {t('profile.strongBooks')}
          </h3>
          <div className="mb-5">
            {data.strongBooks.slice(0, 3).map(b => (
              <BookRow key={b.book} book={b} barClass="bg-gradient-to-r from-emerald-500 to-emerald-400" />
            ))}
          </div>
        </>
      )}

      {data.weakBooks.length > 0 && (
        <>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-rose-400 inline-flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-[16px]">trending_down</span>
            {t('profile.weakBooks')}
          </h3>
          <div className="mb-4">
            {data.weakBooks.slice(0, 3).map(b => (
              <BookRow key={b.book} book={b} barClass="bg-gradient-to-r from-rose-500 to-rose-400" />
            ))}
          </div>
        </>
      )}

      {suggestedBook && (
        <button
          onClick={() => navigate(`/practice?book=${encodeURIComponent(suggestedBook.book)}`)}
          className="w-full mt-2 p-4 rounded-xl bg-gradient-to-br from-secondary/15 to-secondary/[0.05] border border-secondary/25 hover:bg-secondary/20 transition-colors flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined">psychology</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-on-surface">{t('profile.practiceCtaTitle', { book: suggestedBook.book })}</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {t('profile.practiceCtaSub', { n: suggestedBook.wrong })}
            </p>
          </div>
          <span className="material-symbols-outlined text-secondary">arrow_forward</span>
        </button>
      )}
    </section>
  )
}

function BookRow({ book, barClass }: { book: BookAccuracy; barClass: string }) {
  const pct = Math.round(book.accuracy * 100)
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <div className="text-[13px] font-semibold text-on-surface flex-1 truncate">{book.book}</div>
      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs font-bold text-on-surface min-w-[44px] text-right">{pct}%</div>
    </div>
  )
}

/* ========== Sound + haptics ========== */

function SoundHapticsSettings() {
  const { t } = useTranslation()
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled)
  const [volume, setVolume] = useState(Math.round(soundManager.volume * 100))
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled())

  return (
    <section className="bg-surface-container/60 backdrop-blur-sm border border-outline-variant/10 rounded-2xl p-5 md:p-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface inline-flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[18px] text-secondary" style={FILL_STYLE}>volume_up</span>
        {t('profile.soundAndHapticsTitle')}
      </h2>

      <div className="divide-y divide-white/[0.04]">
        <div className="flex items-center justify-between py-3 gap-4">
          <span className="text-sm text-on-surface">{t('profile.soundEffectsLabel')}</span>
          <div className="flex items-center gap-3">
            {soundEnabled && (
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
                className="w-32 h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            )}
            {soundEnabled && <span className="text-xs font-bold text-secondary w-8 text-right">{volume}%</span>}
            <Toggle
              on={soundEnabled}
              onChange={(next) => {
                setSoundEnabled(next)
                soundManager.setEnabled(next)
                if (next) soundManager.play('buttonTap')
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between py-3 gap-4">
          <span className="text-sm text-on-surface">{t('profile.hapticsLabel')}</span>
          <Toggle on={hapticsOn} onChange={(next) => { setHapticsOn(next); setHapticsEnabled(next) }} />
        </div>
      </div>
    </section>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-10 h-[22px] rounded-full relative transition-colors ${on ? 'gold-gradient' : 'bg-white/10'}`}
      aria-pressed={on}
    >
      <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'right-[3px]' : 'left-[3px]'}`} />
    </button>
  )
}

/* ========== Prestige ========== */

function PrestigeSection() {
  const { t } = useTranslation()
  const { data } = useQuery<{
    canPrestige: boolean; prestigeLevel: number; daysAtTier6: number
    daysRequired: number; nextPrestigeName: string | null
  }>({
    queryKey: ['prestige-status'],
    queryFn: () => api.get('/api/me/prestige-status').then(r => r.data),
    staleTime: 60_000,
  })

  if (!data) return null
  const { prestigeLevel, daysAtTier6, daysRequired, canPrestige, nextPrestigeName } = data
  const progress = Math.min(100, (daysAtTier6 / daysRequired) * 100)

  return (
    <section data-testid="profile-prestige-section" className="rounded-2xl p-5 md:p-6 bg-gradient-to-br from-secondary/[0.08] to-purple-500/[0.05] border border-secondary/20 flex flex-col sm:flex-row items-start sm:items-center gap-5">
      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/15 to-purple-500/10 border border-secondary/30 flex items-center justify-center shrink-0">
        <span className="text-[32px]">👑</span>
        {!canPrestige && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-secondary/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">lock</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-[15px] font-bold text-on-surface inline-flex items-center gap-2">
          {t('profile.prestigeTitle')}
          {prestigeLevel > 0 && <span className="text-sm text-secondary font-bold">P{prestigeLevel}</span>}
        </h2>
        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
          {t('profile.prestigeFullDescription')}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold">🌱 1</span>
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-secondary to-purple-400" style={{ width: `${progress}%` }} />
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-on-surface-variant text-[10px] font-bold">👑 6</span>
        </div>
        <p className="text-[11px] text-on-surface-variant mt-2">
          <span data-testid="profile-days-at-tier6" className="font-bold text-on-surface">{daysAtTier6}</span>/{daysRequired} {t('profile.prestigeDaysLabel').toLowerCase()}
        </p>
        {canPrestige && nextPrestigeName && (
          <Link to="/cosmetics" className="inline-flex mt-3 px-3 py-1.5 rounded-lg gold-gradient text-on-secondary text-xs font-bold">
            {t('profile.prestigeEligibleTitle')}
          </Link>
        )}
      </div>
    </section>
  )
}

/* ========== Danger zone ========== */

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
    <section className="rounded-2xl p-5 bg-error/[0.04] border border-error/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-error/15 text-error flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined">warning</span>
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-bold text-error">{t('profile.dangerZone')}</p>
        <p className="text-[11px] text-on-surface-variant mt-1">{t('profile.dangerDesc')}</p>
      </div>
      <button
        data-testid="profile-delete-account-btn"
        onClick={() => setShowModal(true)}
        className="h-10 px-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-semibold hover:bg-error/20 transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
      >
        <span className="material-symbols-outlined text-[18px]">delete_forever</span>
        {t('profile.deleteAccount')}
      </button>

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
