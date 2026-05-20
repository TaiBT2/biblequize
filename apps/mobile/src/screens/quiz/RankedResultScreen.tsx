import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import { apiClient } from '../../api/client'
import { getTierByPoints, getTierProgress } from '../../logic/tierProgression'
import { colors, typography, spacing, borderRadius } from '../../theme'

const LETTERS = ['A', 'B', 'C', 'D']

interface Question {
  id: string
  book: string
  chapter: number
  verseStart?: number
  verseEnd?: number
  content: string
  options: string[]
  correctAnswer: number[]
  explanation?: string
}

interface TierProgressData {
  tierLevel: number
  tierName: string
  totalPoints: number
  nextTierPoints: number
  tierProgressPercent: number
}

interface RankedStatusData {
  livesRemaining?: number
  energy?: number
  seasonRank?: number | null
  seasonPoints?: number | null
}

interface ActiveSeasonResponse { active?: boolean; id?: string; name?: string }

function formatVerseRef(q: Question): string {
  let ref = `${q.book} ${q.chapter}`
  if (q.verseStart) {
    ref += `:${q.verseStart}`
    if (q.verseEnd && q.verseEnd !== q.verseStart) ref += `–${q.verseEnd}`
  }
  return ref
}

/**
 * Mobile ranked result screen — port từ `docs/mockups/mockup_ranked_result.html`
 * + `apps/web/src/pages/RankedQuizResults.tsx`. 3 state variants:
 *
 *   A · Normal      — default outcome
 *   B · Promo       — tier-up (newTier.level > previousTier.level)
 *   C · OOE         — livesRemaining <= 0 (energy depleted)
 *
 * Priority: B > C > A (tier-up beats OOE — celebratory event win).
 *
 * Body (XP hero / tier-row / 3-stat grid / season rank / review wrong) giữ
 * consistent giữa 3 states để user luôn thấy cùng scoring breakdown — chỉ
 * header + sticky CTAs swap theo context.
 */
export default function RankedResultScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const [showReviewModal, setShowReviewModal] = useState(false)

  const stats = (route.params?.stats ?? {}) as {
    totalScore?: number
    correctAnswers?: number
    totalQuestions?: number
    questions?: Question[]
    userAnswers?: (number | null)[]
    totalTime?: number
    previousTotalPoints?: number
  }

  // Fresh tier-progress after quiz invalidate. previousTotalPoints captured
  // tại RankedScreen.handleStart → diff để detect tier-up.
  const { data: tierData } = useQuery<TierProgressData>({
    queryKey: ['tier-progress'],
    queryFn: () => apiClient.get('/api/me/tier-progress').then(r => r.data),
    staleTime: 60_000,
  })

  const { data: rankedStatus } = useQuery<RankedStatusData>({
    queryKey: ['ranked-status'],
    queryFn: () => apiClient.get('/api/me/ranked-status').then(r => r.data).catch(() => ({})),
    staleTime: 30_000,
  })

  const { data: activeSeason } = useQuery<ActiveSeasonResponse>({
    queryKey: ['season', 'active'],
    queryFn: () => apiClient.get('/api/seasons/active').then(r => r.data).catch(() => ({ active: false })),
    staleTime: 5 * 60_000,
  })

  const earnedXp = stats.totalScore ?? 0
  const correctCount = stats.correctAnswers ?? 0
  const totalQ = stats.totalQuestions ?? 0
  const accuracyPct = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0
  const totalSeconds = Math.floor((stats.totalTime ?? 0) / 1000)
  const mm = Math.floor(totalSeconds / 60)
  const ss = totalSeconds % 60

  // Tier-up detection: compare tier level computed từ previousTotalPoints
  // vs current totalPoints (post-quiz fresh).
  const previousTotalPoints = stats.previousTotalPoints ?? 0
  const currentTotalPoints = tierData?.totalPoints ?? (previousTotalPoints + earnedXp)
  const previousTier = getTierByPoints(previousTotalPoints)
  const currentTier = getTierByPoints(currentTotalPoints)
  const tieredUp = currentTier.level > previousTier.level

  const livesRemaining = rankedStatus?.livesRemaining ?? rankedStatus?.energy ?? 0
  const outOfEnergy = livesRemaining <= 0

  const variant: 'A' | 'B' | 'C' = tieredUp ? 'B' : outOfEnergy ? 'C' : 'A'

  const currentTierName = tierData?.tierName ?? currentTier.name
  const currentTierProg = getTierProgress(currentTotalPoints)
  const tierTarget = tierData?.nextTierPoints ?? currentTierProg.next?.minPoints ?? currentTotalPoints
  const tierProgressPct = tierData?.tierProgressPercent ?? currentTierProg.percent
  const ptsToNext = tierData?.nextTierPoints
    ? Math.max(0, tierTarget - currentTotalPoints)
    : currentTierProg.pointsToNext

  const seasonRank = rankedStatus?.seasonRank ?? null
  const seasonPoints = rankedStatus?.seasonPoints ?? 0

  // Wrong-question derivation từ passed stats — không cần fetch thêm.
  const questions = stats.questions ?? []
  const userAnswers = stats.userAnswers ?? []
  const wrongList = useMemo(() => {
    return questions
      .map((q, idx) => ({ q, picked: userAnswers[idx], orderNum: idx + 1 }))
      .filter(({ q, picked }) => {
        if (picked == null || picked < 0) return true
        return !q.correctAnswer.includes(picked)
      })
  }, [questions, userAnswers])
  const wrongCount = wrongList.length

  const onBackToHome = () => navigation.popToTop()
  const onPlayAgain = () => navigation.navigate('Ranked')

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Top context bar */}
        <View style={s.topctx}>
          <View style={s.topctxLeft}>
            <Text style={s.topctxIcon}>🏅</Text>
            <Text style={s.topctxText}>Kết quả Đấu Hạng</Text>
          </View>
          <Pressable onPress={onBackToHome} style={s.closeBtn} accessibilityLabel="Đóng">
            <Text style={s.closeText}>✕</Text>
          </Pressable>
        </View>

        {/* HEADER — variant A */}
        {variant === 'A' && (
          <View style={s.headerA}>
            <Text style={s.eyebrow}>TRẬN ĐÃ XONG</Text>
            <Text style={s.titleItalic}>
              {accuracyPct >= 80 ? 'Vững vàng!' : accuracyPct >= 50 ? 'Đang tiến bộ' : 'Tiếp tục bền bỉ'}
            </Text>
            <Text style={s.subtitle}>
              Bạn đúng <Text style={s.subtitleBold}>{correctCount}/{totalQ} câu</Text>
              {totalSeconds > 0 && <> trong <Text style={s.subtitleBold}>{mm} phút {ss} giây</Text></>}
              . Mỗi lần học là một bước.
            </Text>
          </View>
        )}

        {/* HEADER — variant B (Promo: tier-up) */}
        {variant === 'B' && (
          <View style={s.promoBanner}>
            <Text style={s.promoEyebrow}>LÊN HẠNG</Text>
            <View style={s.promoIcon}>
              <Text style={s.promoIconText}>🏆</Text>
            </View>
            <Text style={s.promoTitle}>{currentTierName}</Text>
            <Text style={s.promoSub}>
              Bạn vừa lên hạng từ <Text style={s.promoSubBold}>{previousTier.name}</Text>
              {'\n'}Tiếp tục để mở khoá đặc quyền mới
            </Text>
          </View>
        )}

        {/* HEADER — variant C (Out of Energy) */}
        {variant === 'C' && (
          <View style={s.ooeBanner}>
            <View style={s.ooeIcon}>
              <Text style={s.ooeIconText}>⚡</Text>
            </View>
            <Text style={s.ooeTitle}>Hết năng lượng hôm nay</Text>
            <Text style={s.ooeSub}>
              Bạn đã dùng hết 100 năng lượng. Quay lại sau khi phục hồi để tiếp tục leo hạng.
            </Text>
            <View style={s.ooeTimer}>
              <Text style={s.ooeTimerIcon}>⏰</Text>
              <Text style={s.ooeTimerText}>Phục hồi sau khi reset</Text>
            </View>
          </View>
        )}

        {/* MAIN RESULT CARD */}
        <View style={s.resultcard}>
          {/* XP hero */}
          <View style={s.xpHero}>
            <Text style={s.xpLbl}>BẠN NHẬN ĐƯỢC</Text>
            <View style={s.xpValRow}>
              <Text style={s.xpPlus}>+</Text>
              <Text style={s.xpNum}>{earnedXp}</Text>
              <Text style={s.xpUnit}>XP</Text>
            </View>
            <Text style={s.xpDetail}>
              {variant === 'B'
                ? 'Vượt ngưỡng — chính thức lên hạng!'
                : 'Tính theo thời gian & độ khó mỗi câu đúng'}
            </Text>
          </View>

          {/* Tier progress row */}
          <View style={s.tierRow}>
            <View style={s.tierIcCircle}>
              <Text style={s.tierIcText}>🛡️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.tierNameRow}>
                <Text style={[s.tierName, variant === 'B' && s.tierNameGold]}>{currentTierName}</Text>
                <Text style={s.tierDelta}>
                  {currentTotalPoints.toLocaleString('vi-VN')} / {tierTarget.toLocaleString('vi-VN')} XP
                  <Text style={s.tierDeltaBold}> · còn {ptsToNext.toLocaleString('vi-VN')}</Text>
                </Text>
              </View>
              <View style={s.tierBar}>
                <View style={[s.tierBarFill, { width: `${Math.min(100, tierProgressPct)}%` }]} />
              </View>
            </View>
          </View>

          {/* 3-stat grid */}
          <View style={s.grid3}>
            <View style={s.gStat}>
              <Text style={s.gLbl}>CÂU ĐÚNG</Text>
              <View style={s.gValRow}>
                <Text style={s.gVal}>{correctCount}</Text>
                <Text style={s.gValSub}>/{totalQ}</Text>
              </View>
              <Text style={s.gDeltaNeutral}>{accuracyPct}% chính xác</Text>
            </View>
            <View style={[s.gStat, s.gStatBordered]}>
              <Text style={s.gLbl}>ĐIỂM MÙA</Text>
              <Text style={[s.gVal, s.gValGold]}>+{earnedXp}</Text>
              <Text style={s.gDelta}>Tổng: {seasonPoints.toLocaleString('vi-VN')}</Text>
            </View>
            <View style={s.gStat}>
              <Text style={s.gLbl}>NĂNG LƯỢNG</Text>
              <Text style={s.gVal}>{livesRemaining}</Text>
              <Text style={s.gDeltaNeutral}>Còn {livesRemaining}/100</Text>
            </View>
          </View>
        </View>

        {/* SEASON RANK card (chỉ render khi có active season) */}
        {activeSeason?.active && (
          <View style={s.seasonrank}>
            <View style={s.seasonrankLeft}>
              <View style={s.seasonrankIcCircle}>
                <Text style={s.seasonrankIc}>🏆</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.seasonrankName} numberOfLines={1}>{activeSeason.name ?? 'Mùa hiện tại'}</Text>
                <Text style={s.seasonrankSub}>Hạng mùa không đổi</Text>
              </View>
            </View>
            <View style={s.seasonrankRight}>
              <Text style={s.seasonrankRank}>
                {seasonRank != null ? `#${seasonRank}` : '—'}
              </Text>
              <Text style={s.seasonrankPts}>{seasonPoints.toLocaleString('vi-VN')} điểm</Text>
            </View>
          </View>
        )}

        {/* REVIEW WRONG (variant A & C) */}
        {variant !== 'B' && wrongCount > 0 && (
          <View style={s.review}>
            <View style={s.reviewHead}>
              <View style={s.reviewHeadLeft}>
                <Text style={s.reviewHeadIcon}>📚</Text>
                <Text style={s.reviewTitle}>
                  {variant === 'C' ? 'Trong khi chờ' : 'Câu bạn đã sai'}
                </Text>
              </View>
              <Text style={s.reviewCount}>{wrongCount} câu</Text>
            </View>
            {wrongList.slice(0, 2).map(({ q, orderNum }, i) => (
              <View key={q.id} style={[s.wrongItem, i > 0 && s.wrongItemBorder]}>
                <View style={s.wrongNum}>
                  <Text style={s.wrongNumText}>{orderNum}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.wrongQ} numberOfLines={2}>{q.content}</Text>
                  <Text style={s.wrongRef}>{formatVerseRef(q)}</Text>
                </View>
              </View>
            ))}
            <Pressable onPress={() => setShowReviewModal(true)} style={s.reviewCta}>
              <Text style={s.reviewCtaText}>
                {variant === 'C' ? `Xem chi tiết & học lại ${wrongCount} câu sai` : `Xem chi tiết ${wrongCount} câu`}
              </Text>
              <Text style={s.reviewCtaArrow}>→</Text>
            </Pressable>
          </View>
        )}

        {/* INLINE VERSE (variant B only) */}
        {variant === 'B' && (
          <View style={s.verseInline}>
            <Text style={s.verseQuote}>
              "Hãy vui mừng trong sự trông cậy, nhịn nhục trong cơn hoạn nạn, bền lòng mà cầu nguyện."
            </Text>
            <Text style={s.verseRef}>— Rô-ma 12:12</Text>
          </View>
        )}

        {/* Spacer for sticky CTAs */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* STICKY CTAs */}
      <View style={s.stickywrap}>
        {variant === 'A' && (
          <>
            <Pressable onPress={onPlayAgain} style={s.ctaPrimary}>
              <Text style={s.ctaPrimaryIcon}>↻</Text>
              <Text style={s.ctaPrimaryText}>Chơi trận khác</Text>
            </Pressable>
            <View style={s.ctaRow}>
              <Pressable onPress={onBackToHome} style={s.ctaSecondary}>
                <Text style={s.ctaSecondaryIcon}>🏠</Text>
                <Text style={s.ctaSecondaryText}>Trang chủ</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('MultiplayerTab', { screen: 'Leaderboard' })}
                style={s.ctaSecondary}
              >
                <Text style={s.ctaSecondaryIcon}>📊</Text>
                <Text style={s.ctaSecondaryText}>Bảng xếp hạng</Text>
              </Pressable>
            </View>
          </>
        )}

        {variant === 'B' && (
          <>
            <Pressable
              onPress={() => navigation.navigate('SystemStack' as never, { screen: 'Help' } as never)}
              style={s.ctaPrimary}
            >
              <Text style={s.ctaPrimaryIcon}>🏅</Text>
              <Text style={s.ctaPrimaryText}>Xem đặc quyền hạng mới</Text>
            </Pressable>
            <View style={s.ctaRow}>
              <Pressable onPress={onPlayAgain} style={s.ctaSecondary}>
                <Text style={s.ctaSecondaryIcon}>↻</Text>
                <Text style={s.ctaSecondaryText}>Chơi tiếp</Text>
              </Pressable>
              <Pressable onPress={onBackToHome} style={s.ctaSecondary}>
                <Text style={s.ctaSecondaryIcon}>🏠</Text>
                <Text style={s.ctaSecondaryText}>Trang chủ</Text>
              </Pressable>
            </View>
          </>
        )}

        {variant === 'C' && (
          <>
            <View style={[s.ctaPrimary, s.ctaPrimaryDisabled]}>
              <Text style={s.ctaPrimaryIconDisabled}>⚡</Text>
              <Text style={s.ctaPrimaryTextDisabled}>Hết năng lượng — chờ reset</Text>
            </View>
            <View style={s.ctaRow}>
              <Pressable
                onPress={() => navigation.navigate('QuizTab' as never, { screen: 'PracticeSelect' } as never)}
                style={s.ctaSecondary}
              >
                <Text style={s.ctaSecondaryIcon}>📚</Text>
                <Text style={s.ctaSecondaryText}>Luyện tập</Text>
              </Pressable>
              <Pressable onPress={onBackToHome} style={s.ctaSecondary}>
                <Text style={s.ctaSecondaryIcon}>🏠</Text>
                <Text style={s.ctaSecondaryText}>Trang chủ</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* REVIEW MODAL */}
      <Modal
        visible={showReviewModal && wrongList.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{wrongList.length} câu bạn đã sai</Text>
              <Pressable onPress={() => setShowReviewModal(false)} style={s.modalCloseBtn}>
                <Text style={s.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={s.modalBody} contentContainerStyle={s.modalBodyContent}>
              {wrongList.map(({ q, picked, orderNum }) => {
                const correctIdx = q.correctAnswer?.[0] ?? -1
                return (
                  <View key={q.id} style={s.modalItem}>
                    <View style={s.modalItemHead}>
                      <View style={s.modalItemNum}>
                        <Text style={s.modalItemNumText}>{orderNum}</Text>
                      </View>
                      <Text style={s.modalItemQ}>{q.content}</Text>
                    </View>
                    <Text style={s.modalItemRef}>{formatVerseRef(q)}</Text>
                    <View style={s.modalOptions}>
                      {q.options.map((opt, i) => {
                        const isCorrect = i === correctIdx
                        const isPicked = picked === i
                        return (
                          <View
                            key={i}
                            style={[
                              s.modalOption,
                              isCorrect && s.modalOptionCorrect,
                              !isCorrect && isPicked && s.modalOptionWrong,
                            ]}
                          >
                            <Text style={[
                              s.modalOptionLetter,
                              isCorrect && s.modalOptionLetterCorrect,
                              !isCorrect && isPicked && s.modalOptionLetterWrong,
                            ]}>{LETTERS[i] ?? String.fromCharCode(65 + i)}.</Text>
                            <Text style={[
                              s.modalOptionText,
                              isCorrect && s.modalOptionTextCorrect,
                              !isCorrect && isPicked && s.modalOptionTextWrong,
                            ]}>{opt}</Text>
                            {isCorrect && <Text style={s.modalOptionBadge}>✓</Text>}
                            {!isCorrect && isPicked && <Text style={s.modalOptionBadgeWrong}>✗</Text>}
                          </View>
                        )
                      })}
                    </View>
                    {q.explanation && (
                      <View style={s.modalExplanation}>
                        <Text style={s.modalExplanationIcon}>💡</Text>
                        <Text style={s.modalExplanationText}>{q.explanation}</Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },

  // Top context bar
  topctx: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.sm + 2, paddingHorizontal: 2 },
  topctxLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topctxIcon: { fontSize: 14 },
  topctxText: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(50,52,64,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { fontSize: 16, color: 'rgba(255,255,255,0.85)' },

  // Header A
  headerA: { alignItems: 'center', marginBottom: spacing.lg, paddingHorizontal: spacing.md },
  eyebrow: { fontSize: 10, fontWeight: typography.weight.bold, letterSpacing: 2, color: 'rgba(255,255,255,0.55)' },
  titleItalic: {
    fontSize: 30, fontStyle: 'italic', fontWeight: typography.weight.bold,
    color: colors.gold, lineHeight: 36, marginTop: 8, letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 8, lineHeight: 19, textAlign: 'center' },
  subtitleBold: { color: colors.textPrimary, fontWeight: typography.weight.semibold },

  // Promo banner B
  promoBanner: {
    alignItems: 'center', marginBottom: spacing.lg, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg,
    borderRadius: 22, borderWidth: 1, borderColor: 'rgba(232,168,50,0.30)',
    backgroundColor: 'rgba(232,168,50,0.10)',
  },
  promoEyebrow: { fontSize: 10, fontWeight: typography.weight.black, letterSpacing: 2.5, color: colors.gold },
  promoIcon: {
    width: 60, height: 60, borderRadius: 30, marginTop: 14, marginBottom: 10,
    backgroundColor: 'rgba(232,168,50,0.18)',
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.40)',
    alignItems: 'center', justifyContent: 'center',
  },
  promoIconText: { fontSize: 30 },
  promoTitle: {
    fontSize: 28, fontStyle: 'italic', fontWeight: typography.weight.bold,
    color: colors.gold, lineHeight: 32,
  },
  promoSub: { fontSize: 13, color: colors.textPrimary, marginTop: 8, lineHeight: 19, textAlign: 'center' },
  promoSubBold: { color: colors.gold, fontWeight: typography.weight.bold },

  // OOE banner C
  ooeBanner: {
    alignItems: 'center', marginBottom: spacing.lg, paddingVertical: spacing.lg + 2, paddingHorizontal: spacing.lg,
    borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(50,52,64,0.4)',
  },
  ooeIcon: {
    width: 54, height: 54, borderRadius: 27, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  ooeIconText: { fontSize: 28 },
  ooeTitle: { fontSize: 19, fontWeight: typography.weight.bold, color: colors.textPrimary, letterSpacing: -0.3 },
  ooeSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 8, lineHeight: 19, textAlign: 'center' },
  ooeTimer: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  ooeTimerIcon: { fontSize: 13 },
  ooeTimerText: { fontSize: 13, color: colors.gold, fontWeight: typography.weight.bold },

  // Result card
  resultcard: {
    backgroundColor: 'rgba(50,52,64,0.4)',
    borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: spacing.sm + 6,
  },

  // XP hero
  xpHero: {
    paddingVertical: spacing.lg + 4, paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  xpLbl: { fontSize: 10, fontWeight: typography.weight.bold, letterSpacing: 1.8, color: 'rgba(255,255,255,0.55)' },
  xpValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 10 },
  xpPlus: { fontSize: 28, color: colors.gold, fontWeight: typography.weight.bold, lineHeight: 28 },
  xpNum: {
    fontSize: 56, color: colors.gold, fontWeight: typography.weight.black,
    lineHeight: 50, letterSpacing: -2,
  },
  xpUnit: { fontSize: 18, color: 'rgba(255,255,255,0.55)', fontWeight: typography.weight.semibold, marginLeft: 6 },
  xpDetail: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 8, textAlign: 'center' },

  // Tier row
  tierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tierIcCircle: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(232,168,50,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  tierIcText: { fontSize: 20 },
  tierNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  tierName: { fontSize: 13, fontWeight: typography.weight.bold, color: colors.textPrimary, flexShrink: 1 },
  tierNameGold: { color: colors.gold },
  tierDelta: { fontSize: 10, color: 'rgba(255,255,255,0.55)', flexShrink: 0 },
  tierDeltaBold: { color: colors.textPrimary, fontWeight: typography.weight.semibold },
  tierBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' },
  tierBarFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 99 },

  // 3-stat grid
  grid3: { flexDirection: 'row' },
  gStat: {
    flex: 1, alignItems: 'center',
    paddingVertical: spacing.md + 2, paddingHorizontal: 8,
  },
  gStatBordered: {
    borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  gLbl: { fontSize: 9, fontWeight: typography.weight.bold, letterSpacing: 1.2, color: 'rgba(255,255,255,0.55)', marginBottom: 8 },
  gValRow: { flexDirection: 'row', alignItems: 'baseline' },
  gVal: { fontSize: 20, fontWeight: typography.weight.black, color: colors.textPrimary, letterSpacing: -0.4, lineHeight: 22 },
  gValGold: { color: colors.gold },
  gValSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: typography.weight.semibold, marginLeft: 1 },
  gDelta: { fontSize: 10, color: '#6dd0a0', marginTop: 4, fontWeight: typography.weight.semibold },
  gDeltaNeutral: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 4, fontWeight: typography.weight.semibold },

  // Season rank card
  seasonrank: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md,
    backgroundColor: 'rgba(50,52,64,0.3)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    paddingHorizontal: spacing.lg - 2, paddingVertical: spacing.md - 2,
    marginBottom: spacing.sm + 6,
  },
  seasonrankLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  seasonrankIcCircle: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(232,168,50,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  seasonrankIc: { fontSize: 18 },
  seasonrankName: { fontSize: 13, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  seasonrankSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  seasonrankRight: { alignItems: 'flex-end' },
  seasonrankRank: { fontSize: 22, fontWeight: typography.weight.black, color: colors.gold, lineHeight: 22 },
  seasonrankPts: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 },

  // Review wrong card
  review: {
    backgroundColor: 'rgba(50,52,64,0.3)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    paddingHorizontal: spacing.lg - 2, paddingVertical: spacing.md,
    marginBottom: spacing.sm + 6,
  },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reviewHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reviewHeadIcon: { fontSize: 16, color: colors.gold },
  reviewTitle: { fontSize: 13, fontWeight: typography.weight.bold, color: colors.textPrimary },
  reviewCount: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  wrongItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 10, paddingBottom: 10 },
  wrongItemBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  wrongNum: {
    width: 22, height: 22, borderRadius: 7,
    backgroundColor: 'rgba(255,107,107,0.10)',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  wrongNumText: { fontSize: 11, fontWeight: typography.weight.bold, color: '#ff8a8a' },
  wrongQ: { fontSize: 12, lineHeight: 18, color: colors.textPrimary },
  wrongRef: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  reviewCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 8, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  reviewCtaText: { fontSize: 13, color: colors.gold, fontWeight: typography.weight.semibold },
  reviewCtaArrow: { fontSize: 15, color: colors.gold, fontWeight: typography.weight.semibold },

  // Inline verse B
  verseInline: { alignItems: 'center', paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  verseQuote: {
    fontSize: 15, fontStyle: 'italic', fontWeight: typography.weight.medium,
    color: '#c8b07e', lineHeight: 22, textAlign: 'center',
  },
  verseRef: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 8 },

  // Sticky CTAs
  stickywrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(17,19,30,0.96)',
    borderTopWidth: 1, borderTopColor: 'rgba(232,168,50,0.10)',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg,
  },
  ctaPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%',
    backgroundColor: colors.gold,
    paddingVertical: 16, paddingHorizontal: spacing.md,
    borderRadius: 14,
    shadowColor: colors.gold, shadowOpacity: 0.4, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  ctaPrimaryDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    shadowOpacity: 0, elevation: 0,
  },
  ctaPrimaryIcon: { fontSize: 18, color: '#1a1206' },
  ctaPrimaryIconDisabled: { fontSize: 18, color: 'rgba(255,255,255,0.55)' },
  ctaPrimaryText: { fontSize: 15, fontWeight: typography.weight.bold, color: '#1a1206' },
  ctaPrimaryTextDisabled: { fontSize: 15, fontWeight: typography.weight.bold, color: 'rgba(255,255,255,0.55)' },
  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  ctaSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(50,52,64,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 13, paddingHorizontal: spacing.sm,
    borderRadius: 13,
  },
  ctaSecondaryIcon: { fontSize: 14 },
  ctaSecondaryText: { fontSize: 13, fontWeight: typography.weight.semibold, color: colors.textPrimary },

  // Modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', padding: spacing.md,
  },
  modalCard: {
    backgroundColor: 'rgba(50,52,64,0.98)',
    borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.20)',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: { fontSize: 16, fontWeight: typography.weight.black, color: colors.textPrimary, flex: 1 },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCloseText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  modalBody: { flexGrow: 0 },
  modalBodyContent: { padding: spacing.lg, gap: spacing.md },
  modalItem: {
    backgroundColor: 'rgba(17,19,30,0.6)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: spacing.md,
  },
  modalItemHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  modalItemNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalItemNumText: { fontSize: 11, fontWeight: typography.weight.bold, color: colors.error },
  modalItemQ: { flex: 1, fontSize: 13, fontWeight: typography.weight.bold, color: colors.textPrimary, lineHeight: 18 },
  modalItemRef: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginBottom: spacing.sm, marginLeft: 32 },
  modalOptions: { gap: 6, marginBottom: spacing.sm },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.sm + 2, paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  modalOptionCorrect: {
    backgroundColor: 'rgba(74,222,128,0.10)',
    borderColor: 'rgba(74,222,128,0.30)',
  },
  modalOptionWrong: {
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.30)',
  },
  modalOptionLetter: { fontSize: 12, fontWeight: typography.weight.bold, color: 'rgba(255,255,255,0.7)' },
  modalOptionLetterCorrect: { color: '#4ade80' },
  modalOptionLetterWrong: { color: colors.error },
  modalOptionText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  modalOptionTextCorrect: { color: '#4ade80' },
  modalOptionTextWrong: { color: colors.error },
  modalOptionBadge: { fontSize: 13, color: '#4ade80' },
  modalOptionBadgeWrong: { fontSize: 13, color: colors.error },
  modalExplanation: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: 'rgba(232,168,50,0.05)',
    borderLeftWidth: 2, borderLeftColor: 'rgba(232,168,50,0.40)',
    paddingHorizontal: spacing.sm + 2, paddingVertical: 8,
    borderRadius: 6,
  },
  modalExplanationIcon: { fontSize: 12 },
  modalExplanationText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
})
