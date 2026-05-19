import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { DailyLeaderboardCard, type DailyLbEntry } from '../../components/daily/DailyLeaderboardCard'
import { DailyStreakHeatmap } from '../../components/daily/DailyStreakHeatmap'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface DailyResultResponse {
  betterThanPercent?: number
  xpEarned?: number
  rankGlobal?: number
  score?: number
}

/**
 * DC-PARITY-M1: mirror web `pages/daily/HeroCard.tsx` DoneRight — SVG accuracy
 * ring (160×160 viewBox, r=70), gold gradient stroke, score in center, percent
 * + bonus XP messaging. Replaces generic `QuizResultsScreen` cho daily mode
 * (QuizScreen branches navigation by `stats.mode==='daily'`).
 */
export default function DailyResultScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const stats = route.params?.stats

  const correct = stats?.correctAnswers ?? 0
  const total = stats?.totalQuestions ?? 5
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0
  const isPerfect = correct >= 4 && total === 5

  // Fetch /result for betterThanPercent + authoritative XP. Optional — if BE
  // fails, fall back to local stats. Web: FeaturedDailyChallenge.tsx:88-92.
  const { data: result } = useQuery<DailyResultResponse>({
    queryKey: ['daily-challenge-result'],
    queryFn: () => apiClient.get('/api/daily-challenge/result').then(r => r.data),
    staleTime: 60_000,
  })

  const xpEarned = result?.xpEarned ?? (isPerfect ? 75 : 50)
  const betterThanPercent = result?.betterThanPercent

  const userName = useAuthStore(state => state.user?.name) ?? '—'
  const currentStreak = useAuthStore(state => state.user?.currentStreak) ?? 0
  const longestStreak = useAuthStore(state => state.user?.longestStreak)
  const myEntry: DailyLbEntry | null = result
    ? {
        rank: result.rankGlobal ?? 0,
        name: userName,
        score: result.score ?? stats?.totalScore ?? 0,
        correctCount: correct,
        totalQuestions: total,
      }
    : null

  const RING_RADIUS = 70
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
  const ringOffset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.statusBadge}>
          <View style={s.statusDot} />
          <Text style={s.statusText}>{t('daily.done.badge')}</Text>
        </View>

        <View style={s.ringWrap}>
          <Svg width={160} height={160} viewBox="0 0 160 160" style={s.ringSvg}>
            <Defs>
              <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#fbbf24" />
                <Stop offset="100%" stopColor="#d97706" />
              </LinearGradient>
            </Defs>
            <Circle cx="80" cy="80" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
            <Circle
              cx="80" cy="80" r={RING_RADIUS}
              fill="none" stroke="url(#ringGrad)" strokeWidth={12} strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={ringOffset}
              transform="rotate(-90 80 80)"
            />
          </Svg>
          <View style={s.ringCenter}>
            <Text style={s.ringScore}>{correct}</Text>
            <Text style={s.ringTotal}>{t('daily.done.scoreOf', { total })}</Text>
            <Text style={s.ringPercent}>{percent}%</Text>
          </View>
        </View>

        <Card style={s.bonusCard}>
          <Text style={s.bonusIcon}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.bonusLabel}>{t('daily.done.rewardLabel')}</Text>
            <Text style={s.bonusValue}>+{xpEarned} XP{isPerfect ? ` · ${t('daily.done.perfectBonus')}` : ''}</Text>
          </View>
        </Card>

        {betterThanPercent != null && (
          <Text style={s.betterThan}>
            🎯 {t('daily.done.betterThan', { percent: betterThanPercent })}
          </Text>
        )}

        <DailyStreakHeatmap currentStreak={currentStreak} longestStreak={longestStreak} />

        <DailyLeaderboardCard myEntry={myEntry} myCompleted={true} />

        <View style={s.actions}>
          <Button title={t('daily.done.reviewCta')} variant="outline" fullWidth
            onPress={() => navigation.replace('QuizReview', { stats })} />
          <Button title={t('daily.done.homeCta')} fullWidth
            onPress={() => navigation.popToTop()} />
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, alignItems: 'center', paddingTop: spacing['2xl'], gap: spacing.lg },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  statusText: { fontSize: 11, fontWeight: typography.weight.bold, color: '#86efac', letterSpacing: 0.5 },
  ringWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.md },
  ringSvg: { position: 'absolute' },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  ringScore: { fontSize: 42, fontWeight: typography.weight.black, color: colors.gold, lineHeight: 46 },
  ringTotal: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  ringPercent: { fontSize: 11, fontWeight: typography.weight.bold, color: '#4ade80', marginTop: 2 },
  bonusCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
  },
  bonusIcon: { fontSize: 28 },
  bonusLabel: { fontSize: 10, fontWeight: typography.weight.semibold, color: colors.textMuted, letterSpacing: 0.8 },
  bonusValue: { fontSize: 15, fontWeight: typography.weight.bold, color: colors.gold, marginTop: 2 },
  betterThan: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  actions: { width: '100%', gap: spacing.md, marginTop: spacing.md },
})
