import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
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

  const handleStart = async () => {
    setStarting(true)
    try {
      navigation.navigate('Quiz', {
        questions,
        mode: 'daily',
        showExplanation: true,
      })
    } catch {
      setStarting(false)
    }
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
