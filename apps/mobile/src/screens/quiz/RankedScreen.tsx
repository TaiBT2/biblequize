import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'
import { apiClient } from '../../api/client'
import { getTierProgress } from '../../logic/tierProgression'
import { colors, typography, spacing, borderRadius } from '../../theme'

export default function RankedScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const [starting, setStarting] = useState(false)

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  // Web parity HomeBanner.tsx:56-68: totalPoints sống ở /api/me/tier-progress,
  // KHÔNG ở /api/me. UserResponse DTO không có field totalPoints → đọc trực
  // tiếp `meData?.totalPoints` luôn undefined → tier card mãi mãi hiển thị
  // Tân Tín Hữu 0 XP dù user đã credit XP thực qua Ranked/Daily.
  const { data: tierProgress } = useQuery<{ totalPoints?: number }>({
    queryKey: ['tier-progress'],
    queryFn: () => apiClient.get('/api/me/tier-progress').then(r => r.data),
    staleTime: 30_000,
  })

  const totalPoints = tierProgress?.totalPoints ?? meData?.totalPoints ?? 0
  const tier = getTierProgress(totalPoints)

  // Web parity (apps/web/src/pages/Ranked.tsx:30-83): 2-step ranked start.
  // 1. POST /api/ranked/sessions → sessionId + currentBook (RankedController,
  //    no basicQuizPassed gate — gate handled upstream by HomeScreen via
  //    ['basic-quiz-status']).
  // 2. GET /api/questions filtered by askedQuestionIdsToday + book + difficulty.
  // Generic POST /api/sessions { mode: 'ranked' } (previous mobile call) routes
  // through SessionService which (a) enforces a stale basicQuizPassed gate that
  // throws for users who passed catechism on web before the field existed,
  // (b) skips ranked-specific scoring pipeline → energy/leaderboard/XP not
  // updated. That's the prior "XP không cộng" bug too.
  let step = 'init'
  const handleStart = async () => {
    if (starting) return
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
      const currentBook: string | undefined = status.currentBook
      const currentDifficulty: string | undefined = status.currentDifficulty

      const exclude = new Set<string>(askedIds)
      const questions: any[] = []
      const addUnique = (items: any[]) => {
        for (const q of items ?? []) {
          if (!q?.id || exclude.has(q.id) || questions.find((x: any) => x.id === q.id)) continue
          questions.push(q)
          exclude.add(q.id)
          if (questions.length >= 10) break
        }
      }

      step = 'GET /api/questions (filtered)'
      if (questions.length < 10) {
        const params: any = { limit: 10 - questions.length, excludeIds: Array.from(exclude) }
        if (currentBook) params.book = currentBook
        if (currentDifficulty && currentDifficulty !== 'all') params.difficulty = currentDifficulty
        addUnique((await apiClient.get('/api/questions', { params })).data ?? [])
      }
      step = 'GET /api/questions (book-only fallback)'
      if (questions.length < 10 && currentBook) {
        addUnique((await apiClient.get('/api/questions', {
          params: { limit: 10 - questions.length, book: currentBook, excludeIds: Array.from(exclude) }
        })).data ?? [])
      }
      step = 'GET /api/questions (any-book fallback)'
      if (questions.length < 10) {
        addUnique((await apiClient.get('/api/questions', {
          params: { limit: 10 - questions.length, excludeIds: Array.from(exclude) }
        })).data ?? [])
      }

      if (questions.length === 0) {
        Alert.alert(
          'Hết câu hỏi hôm nay',
          'Bạn đã trả lời hết câu hỏi có sẵn hôm nay. Quay lại sau khi thêm câu mới.',
        )
        setStarting(false)
        return
      }

      navigation.navigate('Quiz', {
        sessionId,
        questions,
        mode: 'ranked',
        isRanked: true,
        timePerQuestion: 90,
        showExplanation: false,
      })
    } catch (err) {
      const e = err as { response?: { status?: number; data?: any }; message?: string }
      const detail = e?.response?.status
        ? `HTTP ${e.response.status} · ${JSON.stringify(e.response.data ?? {}).slice(0, 200)}`
        : (e?.message ?? String(err))
      Alert.alert('Không vào được Đấu Hạng', `[${step}] ${detail}`)
      setStarting(false)
    }
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Thi Đấu Xếp Hạng</Text>

        {/* Tier card */}
        <Card style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierIcon}>{tier.current.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tierName}>{tier.current.name}</Text>
              <Text style={styles.tierPoints}>{totalPoints.toLocaleString()} XP</Text>
            </View>
          </View>
          <ProgressBar progress={tier.percent} height={8} />
          {tier.next && (
            <Text style={styles.tierNext}>Còn {tier.pointsToNext.toLocaleString()} XP đến {tier.next.name}</Text>
          )}
        </Card>

        {/* Info */}
        <Card>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Năng lượng</Text>
              <Text style={styles.infoDesc}>Sai -5 năng lượng/câu</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Độ khó tự động</Text>
              <Text style={styles.infoDesc}>Theo tier level của bạn</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>XP nhân tier</Text>
              <Text style={styles.infoDesc}>Tier cao hơn = XP nhiều hơn</Text>
            </View>
          </View>
        </Card>

        <Button title="Vào Thi Đấu" onPress={handleStart} loading={starting} fullWidth />
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  tierCard: { gap: spacing.md },
  tierHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tierIcon: { fontSize: 40 },
  tierName: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.gold },
  tierPoints: { fontSize: typography.size.xs, color: colors.textMuted },
  tierNext: { fontSize: typography.size.xs, color: colors.textMuted, textAlign: 'right' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  infoIcon: { fontSize: 20 },
  infoTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary },
  infoDesc: { fontSize: typography.size.xs, color: colors.textMuted },
})
