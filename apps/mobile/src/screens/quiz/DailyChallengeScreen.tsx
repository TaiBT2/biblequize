import { useTranslation } from 'react-i18next'
import React, { useState, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, Animated } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface SeasonInfo { active?: boolean; name?: string }
interface YesterdaySummary {
  completed: boolean
  correctCount?: number
  totalQuestions?: number
  timeSeconds?: number
}

const DAY_NAME_KEYS = [
  'daily.dayNameSunday', 'daily.dayNameMonday', 'daily.dayNameTuesday',
  'daily.dayNameWednesday', 'daily.dayNameThursday', 'daily.dayNameFriday', 'daily.dayNameSaturday',
]

function formatTime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Daily challenge intro — port web `pages/daily/HeroCard.tsx` ReadyLeft +
 * `PageHeader.tsx`. Status badge pulse + heading w/count + subline + 4 meta
 * chips + reward breakdown card + yesterday block + gradient CTA.
 */
export default function DailyChallengeScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const qc = useQueryClient()
  const [starting, setStarting] = useState(false)
  const pulse = React.useRef(new Animated.Value(0.5)).current

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      ]),
    ).start()
  }, [pulse])

  const { data: challenge } = useQuery({
    queryKey: ['daily-challenge'],
    queryFn: () => apiClient.get('/api/daily-challenge').then(r => r.data),
    staleTime: 10_000,
    refetchOnMount: 'always',
  })

  const { data: season } = useQuery<SeasonInfo | null>({
    queryKey: ['season', 'active'],
    queryFn: () => apiClient.get('/api/seasons/active').then(r => r.data).catch(() => null),
    staleTime: 5 * 60_000,
  })

  const { data: yesterday } = useQuery<YesterdaySummary>({
    queryKey: ['daily-yesterday'],
    queryFn: () => apiClient.get('/api/daily-challenge/yesterday-summary').then(r => r.data).catch(() => ({ completed: false })),
    staleTime: 60_000,
  })

  const questions = challenge?.questions ?? []
  const questionCount = challenge?.totalQuestions ?? challenge?.questionCount ?? 5
  const timeLimit = 5

  const todayLabel = useMemo(() => {
    const d = new Date()
    return `${t(DAY_NAME_KEYS[d.getDay()])}, ${d.toLocaleDateString('vi-VN')}`
  }, [t])
  const seasonName = season?.active && season.name ? season.name : null

  const handleStart = async () => {
    if (questions.length === 0) {
      Alert.alert('Chưa sẵn sàng', 'Câu hỏi đang tải, vui lòng đợi giây lát.')
      return
    }
    setStarting(true)
    let sessionId: string | undefined
    try {
      const startRes = await apiClient.post('/api/daily-challenge/start', {}, { timeout: 5000 })
      sessionId = startRes.data?.sessionId
    } catch (e: any) {
      if (e?.response?.status === 409) {
        await qc.invalidateQueries({ queryKey: ['daily-challenge'] })
        setStarting(false)
        Alert.alert(t('daily.title'), t('daily.alreadyCompletedToast'), [{ text: 'OK', onPress: () => navigation.goBack() }])
        return
      }
      console.warn('[DailyChallenge] /start failed:', e?.message ?? e)
    }
    navigation.navigate('Quiz', { sessionId, questions, mode: 'daily', showExplanation: true })
    setStarting(false)
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        {/* PageHeader */}
        <View style={s.header}>
          <View style={s.headerTitleRow}>
            <View style={s.headerIcon}>
              <Text style={s.headerIconEmoji}>🔥</Text>
            </View>
            <Text style={s.headerTitle}>{t('daily.title')}</Text>
          </View>
          <View style={s.headerMeta}>
            <View style={s.todayChip}>
              <Text style={s.todayChipIcon}>📅</Text>
              <Text style={s.todayChipText}>{todayLabel}</Text>
            </View>
            {seasonName && (
              <View style={s.seasonChip}>
                <Text style={s.seasonChipIcon}>✦</Text>
                <Text style={s.seasonChipText}>{seasonName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Hero card — ReadyLeft port */}
        <View style={s.hero}>
          {/* Status badge */}
          <View style={s.statusBadge}>
            <Animated.View style={[s.statusDot, { opacity: pulse }]} />
            <Text style={s.statusText}>{t('daily.ready.statusBadge')}</Text>
          </View>

          {/* Heading + subline */}
          <Text style={s.heading}>{t('daily.ready.title', { count: questionCount })}</Text>
          <Text style={s.subline}>{t('daily.ready.desc')}</Text>

          {/* Meta chips */}
          <View style={s.metaRow}>
            <MetaChip icon="📖" text={t('daily.ready.metaQuestions', { count: questionCount })} />
            <MetaChip icon="⏱" text={t('daily.ready.metaTime', { minutes: timeLimit })} />
            <MetaChip icon="🌍" text={t('daily.ready.metaGlobal')} />
            <MetaChip icon="🛡" text={t('daily.ready.metaNoEnergy')} />
          </View>

          {/* Reward breakdown card */}
          <View style={s.rewardCard}>
            <View style={s.rewardIconBox}>
              <Text style={s.rewardIconEmoji}>⭐</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rewardLabel}>{t('daily.ready.rewardLabel')}</Text>
              <Text style={s.rewardBody}>
                <Text style={s.rewardXp}>+50 XP</Text>
                <Text style={s.rewardNorm}> {t('daily.ready.rewardBase')} · </Text>
                <Text style={s.rewardXp}>+25 XP</Text>
                <Text style={s.rewardNorm}> {t('daily.ready.rewardPerfect')}</Text>
              </Text>
            </View>
          </View>

          {/* CTA */}
          <Pressable
            onPress={handleStart}
            disabled={starting || questions.length === 0}
            style={({ pressed }) => [s.cta, pressed && s.ctaPressed, (starting || questions.length === 0) && s.ctaDisabled]}
          >
            <Text style={s.ctaIcon}>▶</Text>
            <Text style={s.ctaText}>{starting ? t('daily.loadingQuestions') : t('daily.ready.cta')}</Text>
          </Pressable>

          {/* Yesterday recap */}
          {yesterday?.completed && (
            <View style={s.yesterday}>
              <Text style={s.yesterdayIcon}>📊</Text>
              <Text style={s.yesterdayText}>
                <Text style={s.yesterdayPrefix}>{t('daily.ready.yesterdayPrefix')}</Text>
                {' '}
                {yesterday.timeSeconds && yesterday.timeSeconds > 0
                  ? t('daily.ready.yesterdayBody', {
                      correct: yesterday.correctCount ?? 0,
                      total: yesterday.totalQuestions ?? 5,
                      time: formatTime(yesterday.timeSeconds),
                    })
                  : t('daily.ready.yesterdayBodyNoTime', {
                      correct: yesterday.correctCount ?? 0,
                      total: yesterday.totalQuestions ?? 5,
                    })}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

function MetaChip({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={s.metaChip}>
      <Text style={s.metaChipIcon}>{icon}</Text>
      <Text style={s.metaChipText}>{text}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['2xl'] },

  // PageHeader
  header: { gap: spacing.sm },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ef4444', shadowOpacity: 0.3, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  headerIconEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 24, fontWeight: typography.weight.black, color: colors.textPrimary, letterSpacing: -0.5 },
  headerMeta: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  todayChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(50,52,64,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  todayChipIcon: { fontSize: 12 },
  todayChipText: { fontSize: 11, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  seasonChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.30)',
  },
  seasonChipIcon: { fontSize: 12, color: '#f87171' },
  seasonChipText: { fontSize: 11, fontWeight: typography.weight.bold, color: '#fca5a5' },

  // Hero card
  hero: {
    backgroundColor: 'rgba(50,52,64,0.4)',
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.15)',
    padding: spacing.xl,
    gap: spacing.md,
    overflow: 'hidden',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.30)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  statusText: { fontSize: 10, fontWeight: typography.weight.bold, color: '#fca5a5', letterSpacing: 0.5 },

  heading: { fontSize: 24, fontWeight: typography.weight.black, color: colors.textPrimary, letterSpacing: -0.5, lineHeight: 30 },
  subline: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: spacing.xs },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(17,19,30,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  metaChipIcon: { fontSize: 14, color: colors.gold },
  metaChipText: { fontSize: 11, fontWeight: typography.weight.semibold, color: colors.textPrimary },

  rewardCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: 'rgba(17,19,30,0.4)',
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.12)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  rewardIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(232,168,50,0.18)',
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  rewardIconEmoji: { fontSize: 20 },
  rewardLabel: { fontSize: 10, fontWeight: typography.weight.semibold, color: colors.textMuted, letterSpacing: 0.5 },
  rewardBody: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  rewardXp: { color: colors.gold, fontWeight: typography.weight.bold },
  rewardNorm: { color: colors.textPrimary, fontWeight: typography.weight.medium },

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
  ctaDisabled: { opacity: 0.5 },
  ctaIcon: { fontSize: 14, color: '#1a1208', fontWeight: typography.weight.black },
  ctaText: { fontSize: 15, fontWeight: typography.weight.black, color: '#1a1208', letterSpacing: 0.3 },

  yesterday: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(17,19,30,0.4)',
    borderLeftWidth: 3, borderLeftColor: 'rgba(96,165,250,0.5)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  yesterdayIcon: { fontSize: 13 },
  yesterdayText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  yesterdayPrefix: { color: '#93c5fd', fontWeight: typography.weight.bold },
})
