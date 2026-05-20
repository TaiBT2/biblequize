import { useTranslation } from 'react-i18next'
import React, { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg'
import SafeScreen from '../../components/layout/SafeScreen'
import { DailyLeaderboardCard, type DailyLbEntry } from '../../components/daily/DailyLeaderboardCard'
import { DailyStreakHeatmap } from '../../components/daily/DailyStreakHeatmap'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface DailyResultResponse {
  betterThanPercent?: number
  xpEarned?: number
  rankGlobal?: number
  rankGroup?: number
  score?: number
  timeSeconds?: number
  completedAt?: string
  resultsBreakdown?: boolean[]
  // BE getResultData fields cần thiết khi user vào DailyResults qua "Xem lại"
  // (không có stats route param từ quiz session). Source: DailyChallengeService
  // .getResultData line 167-168.
  correctCount?: number
  totalQuestions?: number
}

function formatTime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatCompletedAt(iso?: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

/**
 * Daily challenge done screen — port web `pages/daily/HeroCard.tsx` DoneLeft +
 * DoneRight unified vào single mobile column (web là 2-col grid). Hierarchy:
 * status badge → title → desc → accuracy ring → summary card (4 rows + question
 * dots) → rank chips (#global #group) → review CTA. Streak heatmap +
 * leaderboard rendered dưới hero card.
 */
export default function DailyResultScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  // Defensive: stats có thể null khi nav pop/restore state.
  const stats = (route.params?.stats ?? {}) as {
    correctAnswers?: number
    totalQuestions?: number
    totalScore?: number
    questionScores?: number[] | null
    questions?: unknown[] | null
  }
  const pulse = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      ]),
    ).start()
  }, [pulse])

  const { data: result } = useQuery<DailyResultResponse>({
    queryKey: ['daily-challenge-result'],
    queryFn: () => apiClient.get('/api/daily-challenge/result').then(r => r.data),
    staleTime: 60_000,
  })

  // Fall back to BE result khi stats route param thiếu — xảy ra khi user
  // navigate qua "Xem lại" (HomeScreen DailyCompletedStrip) thay vì ngay
  // sau finish quiz. Stats từ local quiz session không tồn tại trong path
  // này, phải đọc từ /api/daily-challenge/result.
  const correct = stats.correctAnswers ?? result?.correctCount ?? 0
  const total = stats.totalQuestions ?? result?.totalQuestions ?? 5
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0
  const isPerfect = correct === total && total > 0

  const xpEarned = result?.xpEarned ?? (isPerfect ? 75 : 50)
  const betterThanPercent = result?.betterThanPercent
  const timeSeconds = result?.timeSeconds
  const rankGlobal = result?.rankGlobal
  const rankGroup = result?.rankGroup
  const completedAt = result?.completedAt
  const breakdown: boolean[] = result?.resultsBreakdown
    ?? (Array.isArray(stats.questionScores) ? stats.questionScores.map((sc: number) => sc > 0) : [])

  const userName = useAuthStore(state => state.user?.name) ?? '—'
  const currentStreak = useAuthStore(state => state.user?.currentStreak) ?? 0
  const longestStreak = useAuthStore(state => state.user?.longestStreak)
  const myEntry: DailyLbEntry | null = result
    ? {
        rank: rankGlobal ?? 0, name: userName,
        score: result.score ?? stats.totalScore ?? 0,
        correctCount: correct, totalQuestions: total,
      }
    : null

  const RING_RADIUS = 70
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
  const ringOffset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        {/* Hero card — DoneLeft + DoneRight unified */}
        <View style={s.hero}>
          {/* Status badge */}
          <View style={s.statusBadge}>
            <Animated.View style={[s.statusDot, { opacity: pulse }]} />
            <Text style={s.statusText}>
              {t('daily.done.statusBadge', { time: formatCompletedAt(completedAt) })}
            </Text>
          </View>

          {/* Title + desc */}
          <Text style={s.title}>{t('daily.done.title')}</Text>
          <Text style={s.desc}>
            {betterThanPercent != null ? (
              <>
                {t('daily.done.descPrefix')}{' '}
                <Text style={s.descHighlight}>{betterThanPercent}%</Text>{' '}
                {t('daily.done.descPlayers')}
              </>
            ) : t('daily.done.descNoData')}
          </Text>

          {/* Accuracy ring */}
          <View style={s.ringWrap}>
            <Svg width={160} height={160} viewBox="0 0 160 160" style={s.ringSvg}>
              <Defs>
                <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#fbbf24" />
                  <Stop offset="100%" stopColor="#d97706" />
                </LinearGradient>
              </Defs>
              <Circle cx="80" cy="80" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
              <Circle cx="80" cy="80" r={RING_RADIUS}
                fill="none" stroke="url(#ringGrad)" strokeWidth={12} strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={ringOffset}
                transform="rotate(-90 80 80)" />
            </Svg>
            <View style={s.ringCenter}>
              <Text style={s.ringScore}>{correct}</Text>
              <Text style={s.ringTotal}>{t('daily.done.scoreOf', { total })}</Text>
              <Text style={s.ringPercent}>{t('daily.done.scorePercent', { percent })}</Text>
            </View>
          </View>

          {/* Summary card — 4 rows + question dots */}
          <View style={s.summary}>
            <SummaryRow icon="✓" label={t('daily.done.rowCorrect')} value={`${correct} / ${total}`} valueColor="#4ade80" />
            {timeSeconds != null && (
              <SummaryRow icon="🕐" label={t('daily.done.rowTime')} value={formatTime(timeSeconds)} />
            )}
            {betterThanPercent != null && (
              <SummaryRow icon="📈" label={t('daily.done.rowBetterThan')}
                value={t('daily.done.betterThanValue', { percent: betterThanPercent })}
                valueColor="#4ade80" />
            )}
            <SummaryRow icon="🏆" label={t('daily.done.rowXP')} value={`+${xpEarned} XP`}
              valueColor={colors.gold} lastRow />
            {breakdown.length > 0 && (
              <View style={s.dotsRow}>
                {breakdown.map((ok, i) => (
                  <View key={i} style={[s.qDot, ok ? s.qDotCorrect : s.qDotWrong]} />
                ))}
              </View>
            )}
          </View>

          {/* Rank chips */}
          {(rankGlobal != null || rankGroup != null) && (
            <View style={s.rankRow}>
              <RankChip label={t('daily.done.rankGlobal')}
                value={rankGlobal != null ? `#${rankGlobal}` : '—'} highlight />
              <RankChip label={t('daily.done.rankGroup')}
                value={rankGroup != null ? `#${rankGroup}` : '—'} success />
            </View>
          )}

          {/* Review CTA */}
          <Pressable
            onPress={() => navigation.replace('QuizReview', { stats })}
            style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
          >
            <Text style={s.ctaIcon}>👁</Text>
            <Text style={s.ctaText}>{t('daily.done.cta')}</Text>
          </Pressable>
        </View>

        <DailyStreakHeatmap currentStreak={currentStreak} longestStreak={longestStreak} />
        <DailyLeaderboardCard myEntry={myEntry} myCompleted={true} />

        <Pressable
          onPress={() => navigation.popToTop()}
          style={({ pressed }) => [s.homeBtn, pressed && s.ctaPressed]}
        >
          <Text style={s.homeBtnText}>{t('daily.done.homeCta')}</Text>
        </Pressable>
      </ScrollView>
    </SafeScreen>
  )
}

function SummaryRow({ icon, label, value, valueColor, lastRow }: {
  icon: string; label: string; value: string; valueColor?: string; lastRow?: boolean
}) {
  return (
    <View style={[s.summaryRow, !lastRow && s.summaryRowBorder]}>
      <View style={s.summaryLabel}>
        <Text style={s.summaryIcon}>{icon}</Text>
        <Text style={s.summaryLabelText}>{label}</Text>
      </View>
      <Text style={[s.summaryValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  )
}

function RankChip({ label, value, highlight, success }: {
  label: string; value: string; highlight?: boolean; success?: boolean
}) {
  return (
    <View style={s.rankChip}>
      <Text style={[
        s.rankValue,
        highlight && { color: colors.gold },
        success && { color: '#4ade80' },
      ]}>{value}</Text>
      <Text style={s.rankLabel}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['2xl'] },

  hero: {
    backgroundColor: 'rgba(50,52,64,0.4)',
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.15)',
    padding: spacing.xl,
    gap: spacing.md,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.30)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  statusText: { fontSize: 10, fontWeight: typography.weight.bold, color: '#86efac', letterSpacing: 0.5 },

  title: { fontSize: 26, fontWeight: typography.weight.black, color: colors.textPrimary, letterSpacing: -0.5, lineHeight: 32 },
  desc: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  descHighlight: { color: '#4ade80', fontWeight: typography.weight.bold },

  ringWrap: { width: 160, height: 160, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.sm },
  ringSvg: { position: 'absolute' },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  ringScore: { fontSize: 42, fontWeight: typography.weight.black, color: colors.gold, lineHeight: 46 },
  ringTotal: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  ringPercent: { fontSize: 11, fontWeight: typography.weight.bold, color: '#4ade80', marginTop: 2 },

  summary: {
    backgroundColor: 'rgba(17,19,30,0.5)',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  summaryLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  summaryIcon: { fontSize: 14 },
  summaryLabelText: { fontSize: 12, color: colors.textMuted },
  summaryValue: { fontSize: 13, fontWeight: typography.weight.bold, color: colors.textPrimary },
  dotsRow: { flexDirection: 'row', gap: 4, marginTop: 12 },
  qDot: { flex: 1, height: 8, borderRadius: 2 },
  qDotCorrect: { backgroundColor: '#4ade80' },
  qDotWrong: { backgroundColor: '#ef4444' },

  rankRow: { flexDirection: 'row', gap: spacing.sm },
  rankChip: {
    flex: 1, alignItems: 'center',
    backgroundColor: 'rgba(17,19,30,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  rankValue: { fontSize: 18, fontWeight: typography.weight.black, color: colors.textPrimary },
  rankLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, letterSpacing: 0.5, textTransform: 'uppercase' },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.gold,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    marginTop: spacing.xs,
    shadowColor: colors.gold, shadowOpacity: 0.35, shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  ctaPressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
  ctaIcon: { fontSize: 16 },
  ctaText: { fontSize: 15, fontWeight: typography.weight.black, color: '#1a1208', letterSpacing: 0.3 },

  homeBtn: {
    paddingVertical: spacing.md, alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  homeBtnText: { fontSize: 14, fontWeight: typography.weight.semibold, color: colors.textSecondary },
})
