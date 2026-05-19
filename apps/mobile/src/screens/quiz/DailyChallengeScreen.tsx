import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

export default function DailyChallengeScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const [starting, setStarting] = useState(false)

  const { data } = useQuery({
    queryKey: ['daily-challenge'],
    queryFn: () => apiClient.get('/api/daily-challenge').then(r => r.data),
    staleTime: 60_000,
  })

  const questions = data?.questions ?? []

  /**
   * Match web flow (apps/web/src/pages/DailyChallenge.tsx:335 handleStart):
   * POST /api/daily-challenge/start → returns sessionId → quiz tracked BE-side.
   *
   * Graceful degradation: nếu /start fail (network/timeout/auth), vẫn proceed
   * navigate Quiz với sessionId=undefined. BE /api/daily-challenge/answer là
   * stateless lookup by questionId — không strict require sessionId. UX tốt
   * hơn block user khi network flaky.
   */
  const handleStart = async () => {
    if (questions.length === 0) {
      Alert.alert('Chưa sẵn sàng', 'Câu hỏi đang tải, vui lòng đợi giây lát.')
      return
    }
    setStarting(true)
    let sessionId: string | undefined
    try {
      // 5s timeout — short hơn axios default 10s vì user already waited cho
      // GET /api/daily-challenge questions. Tránh button stuck spinner > 10s.
      const startRes = await apiClient.post('/api/daily-challenge/start', {}, { timeout: 5000 })
      sessionId = startRes.data?.sessionId
    } catch (e: any) {
      // Log but không block — vẫn proceed quiz. Sentry mobile sẽ capture
      // nếu cần debug tại sao /start fail (network, 5xx, timeout).
      console.warn('[DailyChallenge] /start failed, proceeding without sessionId:', e?.message ?? e)
    }
    navigation.navigate('Quiz', {
      sessionId,
      questions,
      mode: 'daily',
      showExplanation: true,
    })
    // Reset starting trong case nav fail hoặc user back về screen.
    setStarting(false)
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Thử Thách Hàng Ngày</Text>

        {/* Challenge info card */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroNumber}>5</Text>
          <Text style={styles.heroLabel}>câu hỏi hôm nay</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statText}>5 phút</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statText}>+50 XP</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statText}>Streak</Text>
            </View>
          </View>
        </Card>

        <Button
          title="Bắt đầu"
          onPress={handleStart}
          loading={starting}
          disabled={questions.length === 0}
          fullWidth
        />

        {questions.length === 0 && (
          <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
        )}
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  heroCard: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  heroNumber: { fontSize: 64, fontWeight: typography.weight.black, color: colors.gold },
  heroLabel: { fontSize: typography.size.base, color: colors.textSecondary, marginTop: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing['2xl'], marginTop: spacing.xl },
  stat: { alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: spacing.xs },
  statText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary },
  loadingText: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center' },
})
