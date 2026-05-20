import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import HomeBanner from '../../components/home/HomeBanner'
import FeaturedDailyCard from '../../components/home/FeaturedDailyCard'
import DailyCompletedStrip from '../../components/home/DailyCompletedStrip'
import HeroRankedCard from '../../components/home/HeroRankedCard'
import FeaturedModeCard from '../../components/home/FeaturedModeCard'
import CompactCard from '../../components/home/CompactCard'
import SectionHeader from '../../components/home/SectionHeader'
import DailyMissionsCard from '../../components/home/DailyMissionsCard'
import MotivationCard from '../../components/home/MotivationCard'
import BibleJourneyCard from '../../components/home/BibleJourneyCard'
import VerseFooter from '../../components/home/VerseFooter'
import { apiClient } from '../../api/client'
import { colors, spacing } from '../../theme'

const MULTIPLAYER_UNLOCK_XP = 1000
const TOURNAMENT_UNLOCK_XP = 15000

interface DailyChallengeStatus {
  alreadyCompleted?: boolean
  questionCount?: number
  estimatedMinutes?: number
  correctCount?: number
  totalCount?: number
}

/**
 * BE response shape từ `/api/me/ranked-status` (RankedController.java:610-616):
 *   { date, livesRemaining, questionsCounted, pointsToday, cap, dailyLives, ... }
 *
 * `livesRemaining` = năng lượng còn lại (BE constant MAX_ENERGY=100 cho user mới).
 * `questionsCounted` = số câu đã làm hôm nay.
 * `cap` = daily question cap (default 30).
 *
 * Tên field trong BE legacy gọi "lives" (per SPEC-v2 comment "energy: 100/day, -5 per wrong").
 * Mobile + web rename UI sang "energy" — translate field name khi đọc.
 */
interface RankedStatus {
  livesRemaining?: number
  /** Legacy alias web uses — keep cho backward-compat nếu BE từng đổi. */
  energy?: number
  questionsCounted?: number
  cap?: number
  dailyLives?: number
}

/**
 * Basic Quiz (catechism) status — gating cho Ranked mode (web parity).
 * Web RankedFeaturedCard.tsx dùng cùng endpoint /api/basic-quiz/status.
 * `passed` = đã hoàn thành catechism với ≥ threshold đúng → unlock Ranked.
 * `cooldownRemainingSeconds` > 0 nghĩa là vừa fail, đang chờ retry.
 */
interface BasicQuizStatus {
  passed?: boolean
  cooldownRemainingSeconds?: number
  totalQuestions?: number
}

const ENERGY_MAX_DEFAULT = 100 // SPEC-v2 RankedController.MAX_ENERGY
const RANKED_CAP_DEFAULT = 30  // SPEC-v2 RankedController.DAILY_QUESTION_CAP

export default function HomeScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  // Stale CTA fix (DC-STALE-M1): mirror web DC-STALE-3 — 10s staleTime +
  // refetchOnMount: 'always' để mỗi lần focus Home đều validate `alreadyCompleted`.
  // Tránh race-condition khi user complete daily trên device khác.
  const { data: daily, isLoading: dailyLoading } = useQuery<DailyChallengeStatus>({
    queryKey: ['daily-challenge'],
    queryFn: () => apiClient.get('/api/daily-challenge').then(r => r.data),
    staleTime: 10_000,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
  })

  const { data: missions } = useQuery<{ missions?: { completed?: boolean }[] }>({
    queryKey: ['daily-missions'],
    queryFn: () => apiClient.get('/api/daily-missions').then(r => r.data).catch(() => null as any),
    staleTime: 30_000,
  })

  const { data: ranked } = useQuery<RankedStatus>({
    queryKey: ['ranked-status'],
    queryFn: () => apiClient.get('/api/me/ranked-status').then(r => r.data).catch(() => ({})),
    staleTime: 60_000,
  })

  // Web parity: Ranked unlock gated bởi catechism quiz, KHÔNG phải XP threshold.
  // Trước (sai): rankedLocked = totalPoints < 1000. User pass catechism trên
  // web vẫn bị mobile lock do XP < 1000.
  const { data: basicQuizStatus } = useQuery<BasicQuizStatus>({
    queryKey: ['basic-quiz-status'],
    queryFn: () => apiClient.get('/api/basic-quiz/status').then(r => r.data).catch(() => null),
    staleTime: 30_000,
  })

  const totalPoints = me?.totalPoints ?? 0
  const streak = me?.currentStreak ?? 0
  const seasonPoints = me?.seasonPoints
  // BE field = livesRemaining (legacy "lives" name), fallback `energy` cho
  // future-proof, default MAX_ENERGY=100 khi BE chưa create record cho user.
  const energyRemaining = ranked?.livesRemaining ?? ranked?.energy ?? ENERGY_MAX_DEFAULT
  const energyMax = ENERGY_MAX_DEFAULT
  const rankedAnswered = ranked?.questionsCounted ?? 0
  const rankedCap = ranked?.cap ?? RANKED_CAP_DEFAULT
  const isDailyDone = !!daily?.alreadyCompleted

  // Web parity: ranked unlock = catechism passed (RankedFeaturedCard.tsx).
  // Khi data chưa load → assume locked (false-safe, BE enforce truth).
  const rankedLocked = !basicQuizStatus?.passed
  const multiplayerLocked = totalPoints < MULTIPLAYER_UNLOCK_XP
  const tournamentLocked = totalPoints < TOURNAMENT_UNLOCK_XP

  // MotivationCard ("Bước 1") onboarding nudge — chỉ hiện cho new user
  // chưa có engagement signals (web Home.tsx:213-226). Hide ngay khi user
  // bắt đầu chơi: complete daily, có streak, hoặc complete mission.
  const isNewUser = totalPoints < 1000
  const hasStreak = streak > 0
  const hasCompletedMission = !!missions?.missions?.some(m => m.completed)
  const shouldShowMotivation =
    isNewUser && !dailyLoading && !isDailyDone && !hasStreak && !hasCompletedMission

  const navTo = (tab: string, screen: string) => () => navigation.navigate(tab, { screen })

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <HomeBanner
          totalPoints={totalPoints}
          streak={streak}
          energyRemaining={energyRemaining}
          energyMax={energyMax}
          seasonPoints={seasonPoints}
        />

        {isDailyDone ? (
          <DailyCompletedStrip
            correctCount={daily?.correctCount ?? 0}
            totalCount={daily?.totalCount ?? daily?.questionCount ?? 5}
            onReview={navTo('QuizTab', 'DailyChallenge')}
          />
        ) : (
          <FeaturedDailyCard
            questionCount={daily?.questionCount ?? 5}
            estimatedMinutes={daily?.estimatedMinutes}
            onStart={navTo('QuizTab', 'DailyChallenge')}
          />
        )}

        {isDailyDone && !rankedLocked && (
          <HeroRankedCard
            energyRemaining={energyRemaining}
            energyMax={energyMax}
            rankedAnswered={rankedAnswered}
            rankedCap={rankedCap}
            onEnter={navTo('QuizTab', 'Ranked')}
          />
        )}

        {shouldShowMotivation && (
          <MotivationCard onStartDaily={navTo('QuizTab', 'DailyChallenge')} />
        )}

        <DailyMissionsCard />

        {/* Game modes — hiển thị khi:
            - !isDailyDone (CTA chính cho người dùng), HOẶC
            - isDailyDone + rankedLocked (HeroRankedCard không render vì
              chưa unlock, nên fallback compact 2-cell Practice + Ranked
              locked để user vẫn thấy 2 mode chính). */}
        {(!isDailyDone || rankedLocked) && (
          <>
            <SectionHeader title={t('home.primarySection')} />
            <View style={s.grid2}>
              <FeaturedModeCard
                theme="blue"
                icon="📖"
                title={t('home.practiceFeatured.title')}
                description={t('home.practiceFeatured.description')}
                badge={t('home.practiceFeatured.badge')}
                ctaLabel={t('home.practiceFeatured.cta')}
                onPress={navTo('QuizTab', 'PracticeSelect')}
                testID="featured-card-practice"
              />
              <FeaturedModeCard
                theme="gold"
                icon="⚡"
                title={t('home.rankedFeatured.title')}
                description={t('home.rankedFeatured.description')}
                badge={
                  rankedLocked
                    ? t('home.rankedFeatured.needBasicQuiz.badge')
                    : t('home.rankedFeatured.unlocked.badge')
                }
                meta={
                  !rankedLocked
                    ? t('home.rankedFeatured.energyMeta', { remaining: energyRemaining, max: energyMax })
                    : undefined
                }
                ctaLabel={
                  rankedLocked
                    ? t('home.rankedFeatured.needBasicQuiz.cta')
                    : t('home.rankedFeatured.unlocked.cta')
                }
                onPress={rankedLocked ? navTo('QuizTab', 'BasicQuiz') : navTo('QuizTab', 'Ranked')}
                testID="featured-card-ranked"
              />
            </View>
          </>
        )}

        <SectionHeader title={t('home.varietySection')} />
        <View style={s.grid2}>
          <CompactCard icon="📅" themeColor={colors.tertiary} title={t('home.weekly')}
            subtitle={t('home.weeklyDesc')}
            onPress={navTo('QuizTab', 'WeeklyQuiz')} />
          <CompactCard icon="🎲" themeColor="#ec4899" title={t('home.mystery')}
            subtitle={t('home.mysteryDesc')}
            onPress={navTo('QuizTab', 'MysteryMode')} />
        </View>
        <View style={s.grid2}>
          <CompactCard icon="⚡" themeColor="#f97316" title={t('home.speed')}
            subtitle={t('home.speedDesc')}
            onPress={navTo('QuizTab', 'SpeedRound')} />
          <View style={{ flex: 1 }} />
        </View>

        <SectionHeader title={t('home.communitySection')} />
        <View style={s.grid2}>
          <CompactCard icon="⛪" themeColor={colors.info} title={t('home.groups')}
            subtitle={t('home.groupsDesc')}
            onPress={() => navigation.navigate('GroupsTab')} />
          <CompactCard icon="👥" themeColor={colors.info} title={t('home.multiplayer')}
            subtitle={t('home.multiplayerDesc')}
            onPress={navTo('MultiplayerTab', 'MultiplayerLobby')}
            locked={multiplayerLocked}
            matchmakingHint={multiplayerLocked ? t('home.unlockAt', { xp: MULTIPLAYER_UNLOCK_XP }) : undefined} />
        </View>
        <View style={s.grid2}>
          <CompactCard icon="🏆" themeColor={colors.gold} title={t('home.tournament')}
            subtitle={t('home.tournamentDesc')}
            onPress={navTo('MultiplayerTab', 'MultiplayerLobby')}
            locked={tournamentLocked}
            matchmakingHint={tournamentLocked ? t('home.unlockAt', { xp: TOURNAMENT_UNLOCK_XP }) : undefined} />
          <View style={{ flex: 1 }} />
        </View>

        <BibleJourneyCard onPress={() => navigation.navigate('HomeTab', { screen: 'Journey' })} />

        <VerseFooter />
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['2xl'] },
  grid2: { flexDirection: 'row', gap: spacing.sm },
})
