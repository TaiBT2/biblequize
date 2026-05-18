import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useAuth } from '../store/authStore'
import { getTierByPoints, getNextTier } from '../data/tiers'
import type { Achievement, SessionHistory, UserProfile } from '../components/profile/types'
import { SkeletonBlock } from '../components/profile/SkeletonBlock'
import { HeroCompact } from '../components/profile/HeroCompact'
import { StatsStrip } from '../components/profile/StatsStrip'
import { TierProgressCard } from '../components/profile/TierProgressCard'
import { HeatmapCard, buildHeatmapLevels } from '../components/profile/HeatmapCard'
import { BadgeCollection } from '../components/profile/BadgeCollection'
import { AnalyticsCard } from '../components/profile/AnalyticsCard'
import { PrestigeSection } from '../components/profile/PrestigeSection'
import { SoundHapticsSettings } from '../components/profile/SoundHapticsSettings'
import { DeleteAccountSection } from '../components/profile/DeleteAccountSection'

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
      <div>
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">{t('profile.title')}</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">{t('profile.subtitle')}</p>
      </div>

      <HeroCompact
        profile={profile}
        initial={initial}
        tierEmoji={currentTier.iconEmoji}
        tierName={tierProgress.currentTierName}
        tierLevel={currentTier.id}
      />

      <StatsStrip
        points={points}
        currentStreak={profile.currentStreak ?? 0}
        longestStreak={profile.longestStreak ?? 0}
        totalSessions={totalSessions}
        totalQuestions={totalQuestions}
        totalCorrect={totalCorrect}
        correctRate={correctRate}
      />

      <TierProgressCard
        currentTier={currentTier}
        nextTier={nextTier}
        tierProgress={tierProgress}
        currentStreak={profile.currentStreak ?? 0}
      />

      <HeatmapCard cells={heatmapLevels} activeDays={activeDays} />

      <BadgeCollection achievements={achievements} loading={achievementsLoading} />

      <AnalyticsCard />

      <PrestigeSection />

      <SoundHapticsSettings />

      <DeleteAccountSection />
    </div>
  )
}

export default Profile
