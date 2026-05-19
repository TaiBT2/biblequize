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
import RankedStandardCard from '../../components/home/RankedStandardCard'
import CompactCard from '../../components/home/CompactCard'
import SectionHeader from '../../components/home/SectionHeader'
import DailyMissionsCard from '../../components/home/DailyMissionsCard'
import { apiClient } from '../../api/client'
import { colors, spacing } from '../../theme'

const RANKED_UNLOCK_XP = 1000
const MULTIPLAYER_UNLOCK_XP = 1000
const TOURNAMENT_UNLOCK_XP = 15000

interface DailyChallengeStatus {
  alreadyCompleted?: boolean
  questionCount?: number
  estimatedMinutes?: number
  correctCount?: number
  totalCount?: number
}

interface RankedStatus {
  energyRemaining?: number
  energyMax?: number
  rankedAnswered?: number
  rankedCap?: number
}

export default function HomeScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  const { data: daily } = useQuery<DailyChallengeStatus>({
    queryKey: ['daily-challenge'],
    queryFn: () => apiClient.get('/api/daily-challenge').then(r => r.data),
    staleTime: 60_000,
  })

  const { data: ranked } = useQuery<RankedStatus>({
    queryKey: ['ranked-status'],
    queryFn: () => apiClient.get('/api/me/ranked-status').then(r => r.data).catch(() => ({})),
    staleTime: 60_000,
  })

  const totalPoints = me?.totalPoints ?? 0
  const streak = me?.currentStreak ?? 0
  const seasonPoints = me?.seasonPoints
  const energyRemaining = ranked?.energyRemaining ?? 0
  const energyMax = ranked?.energyMax ?? 100
  const rankedAnswered = ranked?.rankedAnswered ?? 0
  const rankedCap = ranked?.rankedCap ?? 30
  const isDailyDone = !!daily?.alreadyCompleted

  const rankedLocked = totalPoints < RANKED_UNLOCK_XP
  const multiplayerLocked = totalPoints < MULTIPLAYER_UNLOCK_XP
  const tournamentLocked = totalPoints < TOURNAMENT_UNLOCK_XP

  const navTo = (tab: string, screen: string) => () => navigation.navigate(tab, { screen })

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <HomeBanner
          totalPoints={totalPoints}
          streak={streak}
          energyRemaining={ranked?.energyRemaining}
          energyMax={ranked?.energyMax}
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

        <DailyMissionsCard />

        {!isDailyDone && (
          <>
            <SectionHeader title={t('home.gameModes')} />
            <View style={s.grid2}>
              <CompactCard
                icon="📖"
                title={t('home.practice')}
                subtitle={t('home.practiceDesc')}
                onPress={navTo('QuizTab', 'PracticeSelect')}
              />
              <RankedStandardCard
                energyRemaining={energyRemaining}
                energyMax={energyMax}
                rankedAnswered={rankedAnswered}
                rankedCap={rankedCap}
                onEnter={navTo('QuizTab', 'Ranked')}
                locked={rankedLocked}
              />
            </View>
          </>
        )}

        <SectionHeader title="Chế độ đa dạng" />
        <View style={s.grid2}>
          <CompactCard icon="📅" themeColor={colors.tertiary} title="Thử thách tuần"
            subtitle="7 câu / tuần"
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

        <SectionHeader title="Thi đấu cộng đồng" />
        <View style={s.grid2}>
          <CompactCard icon="⛪" themeColor={colors.info} title={t('nav.groups')}
            subtitle="Nhóm Hội Thánh"
            onPress={() => navigation.navigate('GroupsTab')} />
          <CompactCard icon="👥" themeColor={colors.info} title={t('home.multiplayer')}
            subtitle={t('home.multiplayerDesc')}
            onPress={navTo('MultiplayerTab', 'MultiplayerLobby')}
            locked={multiplayerLocked}
            matchmakingHint={multiplayerLocked ? `Mở khoá @ ${MULTIPLAYER_UNLOCK_XP} XP` : undefined} />
        </View>
        <View style={s.grid2}>
          <CompactCard icon="🏆" themeColor={colors.gold} title="Giải đấu"
            subtitle="Bracket loại trực tiếp"
            onPress={navTo('MultiplayerTab', 'MultiplayerLobby')}
            locked={tournamentLocked}
            matchmakingHint={tournamentLocked ? `Mở khoá @ ${TOURNAMENT_UNLOCK_XP} XP` : undefined} />
          <View style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['2xl'] },
  grid2: { flexDirection: 'row', gap: spacing.sm },
})
