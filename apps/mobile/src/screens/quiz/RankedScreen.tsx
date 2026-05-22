import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import CoverageHint from '../../components/ranked/CoverageHint'
import { apiClient } from '../../api/client'
import { useCoverageStatus } from '../../hooks/useCoverageStatus'
import { getTierProgress, getStarInfo } from '../../logic/tierProgression'
import { colors, typography, spacing, borderRadius } from '../../theme'

// SPEC-v2 RankedController constants
const ENERGY_MAX_DEFAULT = 100
const ENERGY_COST_PER_WRONG = 5
const CAP_DEFAULT = 30

interface RankedStatus {
  livesRemaining?: number
  energy?: number
  questionsCounted?: number
  pointsToday?: number
  cap?: number
  dailyLives?: number
  resetAt?: string
  askedQuestionIdsToday?: string[]
  currentBook?: string
  currentDifficulty?: string
  seasonRank?: number | null
  seasonPoints?: number | null
  seasonTotalPlayers?: number | null
}

interface SeasonInfo {
  active?: boolean
  name?: string
  endAt?: string
}

/**
 * Mobile Ranked intro — port từ web `apps/web/src/pages/Ranked.tsx`. Layout:
 *   1. Header (2-tone title + subtitle)
 *   2. Tier card (badge + 5-star sub-tier + next tier + linear bar + XP footer)
 *   3. Stats card (energy primary + thin bar + status chip + 3 mini stats:
 *      streak / questions today / points today)
 *   4. Season card (active season name + chips + season rank + points)
 *   5. Fixed bottom CTA footer (button + caption state)
 *
 * Caption states (web parity RankedActionFooter.tsx:48-132):
 * - canPlay → "{N} câu" (N = floor(energy / ENERGY_COST_PER_WRONG))
 * - isOutOfEnergy → "Hết năng lượng — chờ phục hồi"
 * - capReached → "Đã đạt giới hạn hôm nay"
 */
export default function RankedScreen() {
  const { t, i18n } = useTranslation()
  const navigation = useNavigation<any>()
  const [starting, setStarting] = useState(false)
  const { data: coverage } = useCoverageStatus()

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  // totalPoints sống ở /api/me/tier-progress — UserResponse DTO không có
  // field totalPoints, đọc trực tiếp `meData?.totalPoints` luôn undefined.
  const { data: tierProgress } = useQuery<{ totalPoints?: number }>({
    queryKey: ['tier-progress'],
    queryFn: () => apiClient.get('/api/me/tier-progress').then(r => r.data),
    staleTime: 30_000,
  })

  const { data: rankedStatus } = useQuery<RankedStatus>({
    queryKey: ['ranked-status'],
    queryFn: () => apiClient.get('/api/me/ranked-status').then(r => r.data).catch(() => ({})),
    staleTime: 60_000,
  })

  const { data: season } = useQuery<SeasonInfo | null>({
    queryKey: ['season', 'active'],
    queryFn: () => apiClient.get('/api/seasons/active').then(r => r.data).catch(() => null),
    staleTime: 5 * 60_000,
  })

  const totalPoints = tierProgress?.totalPoints ?? meData?.totalPoints ?? 0
  const tier = getTierProgress(totalPoints)
  const starInfo = getStarInfo(totalPoints)
  const streak = meData?.currentStreak ?? 0

  const energy = rankedStatus?.livesRemaining ?? rankedStatus?.energy ?? ENERGY_MAX_DEFAULT
  const energyMax = rankedStatus?.dailyLives ?? ENERGY_MAX_DEFAULT
  const energyPct = energyMax > 0 ? Math.max(0, Math.min(100, (energy / energyMax) * 100)) : 0
  const questionsCounted = rankedStatus?.questionsCounted ?? 0
  const cap = rankedStatus?.cap ?? CAP_DEFAULT
  const pointsToday = rankedStatus?.pointsToday ?? 0
  const seasonRank = rankedStatus?.seasonRank ?? null
  const seasonPoints = rankedStatus?.seasonPoints ?? null

  const isOutOfEnergy = energy <= 0
  const capReached = questionsCounted >= cap
  const canPlay = !isOutOfEnergy && !capReached
  const questionsLeftFromEnergy = Math.floor(energy / ENERGY_COST_PER_WRONG)

  // Start flow (web parity Ranked.tsx): POST /api/ranked/sessions →
  // GET /api/me/ranked-status (for excludeIds) → POST /api/ranked/questions/select.
  // The select endpoint runs SmartQuestionSelector server-side so tier-aware
  // Easy/Medium/Hard distribution applies (SPEC §7.2). Replaces the legacy
  // 3× GET /api/questions which returned uniform-random (mobile P0 bug).
  let step = 'init'
  const handleStart = async () => {
    if (starting || !canPlay) return
    setStarting(true)
    try {
      step = 'POST /api/ranked/sessions'
      const sessRes = await apiClient.post('/api/ranked/sessions', {})
      const sessionId: string | undefined = sessRes.data?.sessionId
      if (!sessionId) throw new Error('BE returned no sessionId')

      step = 'GET /api/me/ranked-status'
      const statusRes = await apiClient.get('/api/me/ranked-status')
      const status = statusRes.data ?? {}
      const askedIds: string[] = Array.isArray(status.askedQuestionIdsToday)
        ? status.askedQuestionIdsToday : []

      // Single tier-aware pick. No `book` field — BE derives the pool from
      // Liturgical Coverage state (flag ON) or tier distribution (flag OFF).
      step = 'POST /api/ranked/questions/select'
      const pickRes = await apiClient.post('/api/ranked/questions/select', {
        limit: 10,
        language: i18n.language,
        excludeIds: askedIds,
      })
      const questions: any[] = pickRes.data?.questions ?? []
      const poolExhausted: boolean = pickRes.data?.poolExhausted === true

      if (poolExhausted) {
        Alert.alert(t('ranked.title'), t('ranked.pool_exhausted'))
        setStarting(false)
        return
      }

      if (questions.length === 0) {
        Alert.alert(t('ranked.no_questions_title'), t('ranked.no_questions_body'))
        setStarting(false)
        return
      }

      navigation.navigate('Quiz', {
        sessionId, questions, mode: 'ranked', isRanked: true,
        timePerQuestion: 90, showExplanation: false,
        // Snapshot totalPoints trước quiz để RankedResultScreen diff vs
        // currentTotalPoints sau quiz → detect tier-up (state B) (web parity
        // RankedQuizResults state-B trigger).
        previousTotalPoints: totalPoints,
      })
    } catch (err) {
      const e = err as { response?: { status?: number; data?: any }; message?: string }
      const detail = e?.response?.status
        ? `HTTP ${e.response.status} · ${JSON.stringify(e.response.data ?? {}).slice(0, 200)}`
        : (e?.message ?? String(err))
      Alert.alert(t('ranked.start_error_title'), `[${step}] ${detail}`)
      setStarting(false)
    }
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* 1. Header — canonical "Đấu Hạng" (C2) */}
        <View style={s.header}>
          <Text style={s.title}>{t('ranked.title')}</Text>
          <Text style={s.subtitle}>{t('ranked.subtitle')}</Text>
        </View>

        {/* Liturgical Coverage hint — renders only when user is in rollout */}
        {coverage && <CoverageHint coverage={coverage} />}

        {/* 2. Tier Progress Card */}
        <View style={s.card}>
          <View style={s.tierTopRow}>
            <View style={s.tierBadge}>
              <Text style={s.tierIcon}>{tier.current.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.tierName}>{tier.current.name}</Text>
              {/* 5-star sub-tier indicator (skip cho max tier 6) */}
              {tier.current.level < 6 && (
                <View style={s.starRow}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <Text key={i} style={[
                      s.star,
                      i < starInfo.starIndex ? s.starFilled : s.starEmpty,
                    ]}>★</Text>
                  ))}
                </View>
              )}
            </View>
          </View>

          {tier.next && (
            <View style={s.tierNextBox}>
              <Text style={s.tierNextLabel}>ĐÍCH TIẾP THEO</Text>
              <Text style={s.tierNextName}>{tier.next.name}</Text>
              <Text style={s.tierNextCaption}>
                Còn {tier.pointsToNext.toLocaleString()} XP
              </Text>
            </View>
          )}

          {/* Linear progress bar */}
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${tier.percent}%` }]} />
          </View>
          {tier.next && (
            <Text style={s.progressFooter}>
              {totalPoints.toLocaleString()} XP / {tier.next.minPoints.toLocaleString()} XP
            </Text>
          )}
        </View>

        {/* 3. Stats Card — Energy primary + 3 mini stats */}
        <View style={s.card}>
          {/* Energy section */}
          <View style={s.energyHeader}>
            <Text style={s.energyIcon}>⚡</Text>
            <Text style={s.energyLabel}>NĂNG LƯỢNG</Text>
          </View>
          <View style={s.energyNumberRow}>
            <Text style={s.energyNumber}>{energy}</Text>
            <Text style={s.energyMax}> / {energyMax}</Text>
          </View>
          <View style={s.energyTrack}>
            <View style={[s.energyFill, { width: `${energyPct}%` }]} />
          </View>
          <View style={[s.statusChip, canPlay ? s.statusChipOk : s.statusChipWarn]}>
            <Text style={[s.statusChipText, canPlay ? s.statusChipTextOk : s.statusChipTextWarn]}>
              {canPlay
                ? `✓ ${questionsLeftFromEnergy} câu từ năng lượng`
                : isOutOfEnergy ? '⚠ Hết năng lượng' : '⚠ Đã đạt giới hạn hôm nay'}
            </Text>
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* 3 mini stats row */}
          <View style={s.miniStatsRow}>
            <View style={s.miniStat}>
              <Text style={s.miniStatIcon}>🔥</Text>
              <Text style={s.miniStatNumber}>{streak}</Text>
              <Text style={s.miniStatLabel}>Streak</Text>
            </View>
            <View style={s.miniStat}>
              <Text style={s.miniStatIcon}>📝</Text>
              <Text style={s.miniStatNumber}>{questionsCounted}<Text style={s.miniStatDenom}> / {cap}</Text></Text>
              <Text style={s.miniStatLabel}>Câu hôm nay</Text>
            </View>
            <View style={s.miniStat}>
              <Text style={s.miniStatIcon}>🏆</Text>
              <Text style={s.miniStatNumber}>{pointsToday.toLocaleString()}</Text>
              <Text style={s.miniStatLabel}>Điểm hôm nay</Text>
            </View>
          </View>
        </View>

        {/* 4. Season Card — chỉ render khi có active season */}
        {season?.active && (
          <View style={[s.card, s.seasonCard]}>
            <View style={s.seasonHeader}>
              <Text style={s.seasonIcon}>🏆</Text>
              <Text style={s.seasonName}>{season.name ?? 'Mùa hiện tại'}</Text>
            </View>
            <View style={s.seasonChipsRow}>
              <View style={s.seasonChip}>
                <Text style={s.seasonChipText}>×1.5 XP bonus</Text>
              </View>
            </View>
            <Text style={s.seasonQuote}>
              Top 3 mỗi tier nhận <Text style={s.seasonQuoteAccent}>Vinh Quang {season.name ?? ''}</Text>
            </Text>
            {(seasonRank != null || seasonPoints != null) && (
              <View style={s.seasonSubStats}>
                <View style={s.seasonSubStat}>
                  <Text style={s.seasonSubStatValue}>
                    {seasonRank != null ? `#${seasonRank}` : '—'}
                  </Text>
                  <Text style={s.seasonSubStatLabel}>HẠNG MÙA</Text>
                </View>
                <View style={s.seasonSubStat}>
                  <Text style={s.seasonSubStatValue}>
                    {seasonPoints != null ? seasonPoints.toLocaleString() : '—'}
                  </Text>
                  <Text style={s.seasonSubStatLabel}>ĐIỂM MÙA</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Spacer cho fixed footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 5. Fixed bottom CTA */}
      <View style={s.footer}>
        <Pressable
          onPress={handleStart}
          disabled={starting || !canPlay}
          style={({ pressed }) => [
            s.cta,
            (!canPlay || starting) && s.ctaDisabled,
            pressed && canPlay && s.ctaPressed,
          ]}
        >
          <Text style={[s.ctaText, !canPlay && s.ctaTextDisabled]}>
            {starting ? t('ranked.cta_loading')
              : capReached ? t('ranked.cta_cap_reached')
              : isOutOfEnergy ? t('ranked.cta_out_of_energy')
              : t('ranked.start')}
          </Text>
        </Pressable>
        <Text style={s.ctaCaption}>
          {canPlay
            ? `10 câu · trừ ${ENERGY_COST_PER_WRONG} năng lượng / sai`
            : isOutOfEnergy ? 'Chờ năng lượng phục hồi (+20/giờ)'
            : 'Quay lại ngày mai để chơi tiếp'}
        </Text>
      </View>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  // Header
  header: { gap: 4, paddingHorizontal: spacing.xs },
  title: {
    fontSize: 28, fontWeight: typography.weight.black,
    color: colors.textPrimary, letterSpacing: -0.5,
  },
  titleAccent: { color: colors.gold },
  subtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  // Generic card
  card: {
    backgroundColor: 'rgba(50,52,64,0.4)',
    borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.12)',
    padding: spacing.lg,
    gap: spacing.md,
  },

  // Tier card
  tierTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tierBadge: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: 'rgba(232,168,50,0.15)',
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  tierIcon: { fontSize: 28 },
  tierName: {
    fontSize: 19, fontWeight: typography.weight.black,
    color: colors.textPrimary, letterSpacing: -0.3,
  },
  starRow: { flexDirection: 'row', gap: 3, marginTop: 4 },
  star: { fontSize: 14 },
  starFilled: { color: colors.gold },
  starEmpty: { color: 'rgba(255,255,255,0.15)' },

  tierNextBox: {
    backgroundColor: 'rgba(17,19,30,0.4)',
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
    gap: 2,
  },
  tierNextLabel: {
    fontSize: 10, fontWeight: typography.weight.bold,
    color: colors.textMuted, letterSpacing: 1.5,
  },
  tierNextName: {
    fontSize: 17, fontWeight: typography.weight.bold,
    color: colors.gold, fontStyle: 'italic',
  },
  tierNextCaption: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  progressTrack: {
    height: 9, borderRadius: 4.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 4.5,
    backgroundColor: colors.gold,
    shadowColor: colors.gold, shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }, elevation: 2,
  },
  progressFooter: {
    fontSize: 11, color: colors.textMuted,
    textAlign: 'right', fontWeight: typography.weight.semibold,
  },

  // Stats card — Energy
  energyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  energyIcon: { fontSize: 14 },
  energyLabel: {
    fontSize: 10, fontWeight: typography.weight.bold,
    color: colors.textMuted, letterSpacing: 1.5,
  },
  energyNumberRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  energyNumber: {
    fontSize: 36, fontWeight: typography.weight.black,
    color: colors.gold, letterSpacing: -1,
  },
  energyMax: { fontSize: 18, fontWeight: typography.weight.bold, color: colors.textMuted },
  energyTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  energyFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 2 },
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusChipOk: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.30)',
  },
  statusChipWarn: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.30)',
  },
  statusChipText: { fontSize: 11, fontWeight: typography.weight.bold, letterSpacing: 0.3 },
  statusChipTextOk: { color: '#86efac' },
  statusChipTextWarn: { color: '#fca5a5' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 2 },

  // Mini stats
  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  miniStat: { flex: 1, alignItems: 'center', gap: 2 },
  miniStatIcon: { fontSize: 16 },
  miniStatNumber: {
    fontSize: 20, fontWeight: typography.weight.black,
    color: colors.textPrimary, letterSpacing: -0.3,
  },
  miniStatDenom: { fontSize: 13, fontWeight: typography.weight.medium, color: colors.textMuted },
  miniStatLabel: {
    fontSize: 10, color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Season card
  seasonCard: { borderColor: 'rgba(74,158,255,0.20)' },
  seasonHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  seasonIcon: { fontSize: 20 },
  seasonName: {
    fontSize: 18, fontWeight: typography.weight.black,
    color: colors.textPrimary, flex: 1,
  },
  seasonChipsRow: { flexDirection: 'row', gap: 6 },
  seasonChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(232,168,50,0.15)',
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.30)',
  },
  seasonChipText: { fontSize: 11, fontWeight: typography.weight.bold, color: colors.gold },
  seasonQuote: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 19 },
  seasonQuoteAccent: { color: colors.gold, fontWeight: typography.weight.bold },
  seasonSubStats: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  seasonSubStat: {
    flex: 1, alignItems: 'center',
    backgroundColor: 'rgba(17,19,30,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.md,
    paddingVertical: 10, paddingHorizontal: spacing.md,
  },
  seasonSubStatValue: {
    fontSize: 20, fontWeight: typography.weight.black,
    color: colors.gold, letterSpacing: -0.5,
  },
  seasonSubStatLabel: {
    fontSize: 10, fontWeight: typography.weight.bold,
    color: colors.textMuted, letterSpacing: 0.8, marginTop: 2,
  },

  // Footer CTA
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(17,19,30,0.96)',
    borderTopWidth: 1, borderTopColor: 'rgba(232,168,50,0.15)',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.lg,
    gap: 4,
  },
  cta: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    shadowColor: colors.gold, shadowOpacity: 0.4, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  ctaPressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
  ctaDisabled: {
    backgroundColor: colors.surfaceContainerHigh,
    shadowOpacity: 0,
  },
  ctaText: {
    fontSize: 16, fontWeight: typography.weight.black,
    color: '#1a1208', letterSpacing: 0.3,
  },
  ctaTextDisabled: { color: colors.textMuted },
  ctaCaption: {
    fontSize: 11, color: colors.textMuted,
    textAlign: 'center', marginTop: 2,
  },
})
