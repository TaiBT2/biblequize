import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import BibleJourneyCard from '../components/BibleJourneyCard'
import ComebackModal from '../components/ComebackModal'
import CompactCard from '../components/CompactCard'
import DailyBonusModal from '../components/DailyBonusModal'
import DailyCompletedStrip from '../components/DailyCompletedStrip'
import DailyMissionsCard from '../components/DailyMissionsCard'
import FeaturedDailyCard from '../components/FeaturedDailyCard'
import HeroRankedCard from '../components/HeroRankedCard'
import HomeBanner from '../components/HomeBanner'
import HomeHud from '../components/HomeHud'
import MotivationCard from '../components/MotivationCard'
import RankedStandardCard from '../components/RankedStandardCard'
import SectionHeader from '../components/SectionHeader'
import TutorialOverlay from '../components/TutorialOverlay'
import VerseFooter from '../components/VerseFooter'
import { api } from '../api/client'

/* ── Helpers ── */
function msUntilMidnightUtc(): number {
  const now = new Date()
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  )
  return next.getTime() - now.getTime()
}

function formatHHMMSS(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ── Skeleton (HRV-22: vintage palette — bg-deep + line border + chunky-soft) ── */
function HomeSkeleton() {
  const block = 'rounded-2xl bg-bg-deep border border-line-soft shadow-chunky-soft'
  return (
    <div data-testid="home-skeleton" className="space-y-5 animate-pulse">
      <div className={`h-[40px] ${block}`} />
      <div className={`h-[180px] rounded-[22px] bg-bg-deep border border-line shadow-chunky-soft`} />
      <div className={`h-[140px] ${block}`} />
      <div className={`h-[180px] ${block}`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className={`h-[140px] ${block}`} />
        <div className={`h-[140px] ${block}`} />
      </div>
    </div>
  )
}

/* ── Card configs (extracted from GameModeGrid for inline render) ── */
interface ModeConfig {
  id: string
  icon: string
  iconFill?: boolean
  themeHex: string
  titleKey: string
  subtitleKey: string
  route: string
  /** Tier-locked threshold. Card click is disabled below this. */
  lockedUntilPoints?: number
  lockedUnlockTierKey?: string
  /** HRV-9 vintage corner badge i18n key (top-right uppercase tracked).
   *  Only Practice + Variety cards get this; Group cards stay plain. */
  cornerBadgeKey?: string
}

const PRACTICE_CARD: ModeConfig = {
  id: 'practice',
  icon: 'menu_book',
  iconFill: true,
  themeHex: '#6AB8E8',
  titleKey: 'gameModes.practice',
  subtitleKey: 'home.compactSubtitles.practice',
  route: '/practice',
  cornerBadgeKey: 'home.modeCorner.practice',
}

const VARIETY_CARDS: ModeConfig[] = [
  {
    id: 'weekly',
    icon: 'event',
    iconFill: true,
    themeHex: '#a855f7',
    titleKey: 'gameModes.weekly',
    subtitleKey: 'home.compactSubtitles.weekly',
    route: '/weekly-quiz',
    cornerBadgeKey: 'home.modeCorner.weekly',
  },
  {
    id: 'mystery',
    icon: 'casino',
    iconFill: true,
    themeHex: '#d4537e',
    titleKey: 'gameModes.mystery',
    subtitleKey: 'home.compactSubtitles.mystery',
    route: '/mystery-mode',
    cornerBadgeKey: 'home.modeCorner.mystery',
  },
  {
    id: 'speed',
    icon: 'speed',
    iconFill: true,
    themeHex: '#ff8c42',
    titleKey: 'gameModes.speed',
    subtitleKey: 'home.compactSubtitles.speed',
    route: '/speed-round',
    cornerBadgeKey: 'home.modeCorner.speed',
  },
]

const GROUP_CARDS: ModeConfig[] = [
  {
    id: 'group',
    icon: 'church',
    themeHex: '#4a9eff',
    titleKey: 'gameModes.groups',
    subtitleKey: 'home.compactSubtitles.group',
    route: '/groups',
  },
  {
    id: 'multiplayer',
    icon: 'gamepad',
    themeHex: '#9b59b6',
    titleKey: 'gameModes.rooms',
    subtitleKey: 'home.compactSubtitles.multiplayer',
    route: '/multiplayer',
  },
  {
    id: 'tournament',
    icon: 'trophy',
    themeHex: '#ff6b6b',
    titleKey: 'gameModes.tournament',
    subtitleKey: 'home.compactSubtitles.tournament',
    route: '/tournaments',
    lockedUntilPoints: 15_000,
    lockedUnlockTierKey: 'tiers.sage',
  },
]

const MATCHMAKING_HINT_MODES = new Set(['tournament', 'multiplayer'])

/* ── Main ── */
export default function Home() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const dcLang = (i18n.language === 'en' ? 'en' : 'vi') as 'vi' | 'en'

  // Tick once per second to refresh the countdown shown in the Daily strip
  // and (when daily is not done) the FeaturedDailyCard countdown override.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  const { data: tierData } = useQuery({
    queryKey: ['me-tier-progress'],
    queryFn: () => api.get('/api/me/tier-progress').then(r => r.data),
    staleTime: 60_000,
  })

  const { data: dcData, isLoading: dcLoading } = useQuery<{
    alreadyCompleted?: boolean
    totalQuestions?: number
  }>({
    queryKey: ['daily-challenge', dcLang],
    queryFn: () => api.get(`/api/daily-challenge?language=${dcLang}`).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: dcResult } = useQuery<{
    correctCount?: number
    totalQuestions?: number
  }>({
    queryKey: ['daily-challenge-result'],
    queryFn: () => api.get('/api/daily-challenge/result').then(r => r.data),
    enabled: !!dcData?.alreadyCompleted,
    staleTime: 60_000,
  })

  const { data: rankedStatus } = useQuery<{
    livesRemaining?: number
    dailyLives?: number
    questionsCounted?: number
    cap?: number
  }>({
    queryKey: ['ranked-status'],
    queryFn: () => api.get('/api/me/ranked-status').then(r => r.data),
    staleTime: 60_000,
  })

  const { data: missionsData, isLoading: missionsLoading } = useQuery<{
    missions?: Array<{ completed: boolean }>
  }>({
    queryKey: ['daily-missions'],
    queryFn: () => api.get('/api/me/daily-missions').then(r => r.data),
    staleTime: 30_000,
  })

  if (meLoading) return <HomeSkeleton />

  const totalPoints = tierData?.totalPoints ?? meData?.totalPoints ?? 0
  const dailyDone = !!dcData?.alreadyCompleted
  const dailyCorrect = dcResult?.correctCount ?? 0
  const dailyTotal = dcResult?.totalQuestions ?? dcData?.totalQuestions ?? 5
  const energyRemaining = rankedStatus?.livesRemaining ?? 100
  const energyMax = rankedStatus?.dailyLives ?? 100
  const rankedAnswered = rankedStatus?.questionsCounted ?? 0
  const rankedCap = rankedStatus?.cap ?? 100
  const isNewUser = totalPoints < 1000

  // MotivationCard ("Bước 1") onboarding nudge — only for brand-new users
  // showing zero engagement signals. Hides as soon as the user plays
  // Daily, starts a streak, or completes a mission.
  const hasStreak = (meData?.currentStreak ?? 0) > 0
  const hasCompletedMission = !!missionsData?.missions?.some(m => m.completed)
  const motivationDataReady = !meLoading && !dcLoading && !missionsLoading
  const shouldShowMotivation =
    isNewUser &&
    motivationDataReady &&
    !dailyDone &&
    !hasStreak &&
    !hasCompletedMission

  const countdown = formatHHMMSS(msUntilMidnightUtc())

  const renderModeCard = (card: ModeConfig) => {
    const isLocked =
      typeof card.lockedUntilPoints === 'number' &&
      totalPoints < card.lockedUntilPoints
    return (
      <CompactCard
        key={card.id}
        id={card.id}
        icon={card.icon}
        iconFill={card.iconFill}
        themeHex={card.themeHex}
        title={t(card.titleKey)}
        subtitle={t(card.subtitleKey)}
        onClick={() => navigate(card.route)}
        variant="vintage"
        cornerBadge={card.cornerBadgeKey ? (t(card.cornerBadgeKey) as string) : undefined}
        matchmakingHint={
          MATCHMAKING_HINT_MODES.has(card.id)
            ? { title: t('home.matchmakingHint') }
            : undefined
        }
        locked={
          isLocked && card.lockedUnlockTierKey
            ? {
                reason: t('home.modeLocked.reason', {
                  tier: t(card.lockedUnlockTierKey),
                }) as string,
              }
            : undefined
        }
      />
    )
  }

  return (
    <div data-testid="home-page" className="max-w-7xl mx-auto w-full">
      <ComebackModal />
      <DailyBonusModal />
      <TutorialOverlay />

      <HomeHud />
      <HomeBanner />

      {/* ── Daily section: State A featured / State B completed strip ── */}
      {dailyDone ? (
        <DailyCompletedStrip
          correctCount={dailyCorrect}
          totalCount={dailyTotal}
          countdownText={countdown}
          onReview={() => navigate('/daily')}
        />
      ) : (
        <FeaturedDailyCard onStart={() => navigate('/daily')} />
      )}

      {/* ── State B: Hero Ranked promoted right after the Daily strip ── */}
      {dailyDone && (
        <HeroRankedCard
          energyRemaining={energyRemaining}
          energyMax={energyMax}
          rankedAnswered={rankedAnswered}
          rankedCap={rankedCap}
          onEnter={() => navigate('/ranked')}
        />
      )}

      {/* ── Motivation nudge — slotted between Daily and Missions per
            Bui 2026-05-13. Only renders for new users with zero signals. */}
      {shouldShowMotivation && (
        <div className="mb-5">
          <MotivationCard />
        </div>
      )}

      {/* ── Daily Missions — render for all users (Bui 2026-05-14:
            removed prior `!isNewUser` gate; Daily Missions is the
            primary "today's task" surface and shouldn't disappear for
            new users). MotivationCard above still gates on isNewUser
            so the two coexist for brand-new users. */}
      <section data-testid="home-daily-missions" className="mb-5">
        <DailyMissionsCard />
      </section>

      {/* ── State A: Chế độ chơi chính (Practice + Ranked-standard 2-col) ── */}
      {!dailyDone && (
        <>
          <SectionHeader title={t('home.primary.title')} />
          <div
            data-testid="home-primary-grid"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
          >
            {renderModeCard(PRACTICE_CARD)}
            <RankedStandardCard
              energyRemaining={energyRemaining}
              rankedAnswered={rankedAnswered}
              rankedCap={rankedCap}
              onEnter={() => navigate('/ranked')}
            />
          </div>

          <SectionHeader
            title={t('home.variety.title')}
            tag={t('home.variety.subtitle')}
          />
          <div
            data-testid="home-variety-grid"
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
          >
            {VARIETY_CARDS.map(renderModeCard)}
          </div>
        </>
      )}

      {/* ── State B: Khám phá thêm (4-col flat) ── */}
      {dailyDone && (
        <>
          <SectionHeader
            title={t('home.explore.title')}
            tag={t('home.explore.subtitle')}
          />
          <div
            data-testid="home-explore-grid"
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            {renderModeCard(PRACTICE_CARD)}
            {VARIETY_CARDS.map(renderModeCard)}
          </div>
        </>
      )}

      {/* ── Thi đấu cộng đồng (both states) ── */}
      <SectionHeader title={t('home.group.title')} />
      <div
        data-testid="home-group-grid"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
      >
        {GROUP_CARDS.map(renderModeCard)}
      </div>

      {/* ── Journey (full-width) ── */}
      <section data-testid="home-journey" className="mt-7">
        <BibleJourneyCard />
      </section>

      {/* ── Verse footer (HR-8: Cormorant Garamond italic + drop cap) ── */}
      <VerseFooter />
    </div>
  )
}
