import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
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
  const navigation = useNavigation<any>()
  const [starting, setStarting] = useState(false)

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.get('/api/me').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  const totalPoints = meData?.totalPoints ?? 0
  const tier = getTierProgress(totalPoints)

  const handleStart = async () => {
    setStarting(true)
    try {
      const res = await apiClient.post('/api/sessions', {
        mode: 'ranked',
        questionCount: 10,
        difficulty: 'all',
      })
      navigation.navigate('Quiz', {
        sessionId: res.data.sessionId,
        questions: res.data.questions,
        mode: 'ranked',
        isRanked: true,
      })
    } catch {
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
