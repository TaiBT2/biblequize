import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'
import { GoldButton } from '../../components/GoldButton'

function msUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return midnight.getTime() - now.getTime()
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const DailyChallengeScreen = () => {
  const navigation = useNavigation<any>()
  const [countdown, setCountdown] = useState(msUntilMidnight())
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCountdown(msUntilMidnight()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dailyQuery = useQuery({
    queryKey: ['daily-challenge'],
    queryFn: () => api.get('/api/daily-challenge').then((r) => r.data),
    staleTime: 60 * 1000,
  })

  const resultQuery = useQuery({
    queryKey: ['daily-result'],
    queryFn: () => api.get('/api/daily-challenge/result').then((r) => r.data),
    retry: false,
  })

  const isCompleted = !!resultQuery.data
  const result = resultQuery.data

  const handleStart = async () => {
    setStarting(true)
    try {
      const res = await api.post('/api/daily-challenge/start')
      const sessionId = res.data?.id ?? res.data?.sessionId
      if (sessionId) {
        navigation.navigate('RankedTab', {
          screen: 'Quiz',
          params: { sessionId, mode: 'daily' },
        })
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message ?? 'Không bắt đầu được thử thách')
    } finally {
      setStarting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Thử Thách Hàng Ngày</Text>
        <Text style={styles.subtitle}>Hoàn thành mỗi ngày để giữ streak!</Text>

        {/* Countdown */}
        <GlassCard style={styles.countdownCard}>
          <MaterialCommunityIcons name="clock-outline" size={24} color={colors.gameMode.daily} />
          <View style={styles.countdownInfo}>
            <Text style={styles.countdownLabel}>Thử thách mới sau</Text>
            <Text style={styles.countdownTime}>{formatCountdown(countdown)}</Text>
          </View>
        </GlassCard>

        {isCompleted ? (
          /* Completed state */
          <GlassCard style={styles.completedCard}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#22c55e" />
            <Text style={styles.completedTitle}>Đã hoàn thành!</Text>
            <View style={styles.resultRow}>
              <View style={styles.resultItem}>
                <Text style={styles.resultValue}>{result?.score ?? 0}</Text>
                <Text style={styles.resultLabel}>Điểm</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultValue}>{result?.correctAnswers ?? 0}/{result?.totalQuestions ?? 0}</Text>
                <Text style={styles.resultLabel}>Đúng</Text>
              </View>
            </View>
          </GlassCard>
        ) : (
          /* Ready to play */
          <GlassCard style={styles.readyCard}>
            <MaterialCommunityIcons name="calendar-star" size={48} color={colors.gameMode.daily} />
            <Text style={styles.readyTitle}>Sẵn sàng!</Text>
            <Text style={styles.readyDesc}>
              Hoàn thành thử thách hàng ngày để nhận điểm bonus và giữ streak.
            </Text>
            <GoldButton title="Bắt đầu thử thách" onPress={handleStart} loading={starting} />
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { padding: spacing.xl, paddingBottom: spacing['4xl'] },

  title: { fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.text.secondary, marginBottom: spacing['2xl'] },

  countdownCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  countdownInfo: { flex: 1 },
  countdownLabel: { fontSize: 13, color: colors.text.secondary },
  countdownTime: { fontSize: 28, fontWeight: '700', color: colors.gameMode.daily },

  completedCard: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  completedTitle: { fontSize: 20, fontWeight: '700', color: '#22c55e', marginTop: spacing.md, marginBottom: spacing.xl },
  resultRow: { flexDirection: 'row', gap: spacing['3xl'] },
  resultItem: { alignItems: 'center' },
  resultValue: { fontSize: 24, fontWeight: '700', color: colors.text.primary },
  resultLabel: { fontSize: 13, color: colors.text.secondary, marginTop: spacing.xs },

  readyCard: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.lg },
  readyTitle: { fontSize: 20, fontWeight: '700', color: colors.gameMode.daily },
  readyDesc: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.xl },
})
