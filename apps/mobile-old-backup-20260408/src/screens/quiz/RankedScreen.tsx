import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'
import { GoldButton } from '../../components/GoldButton'
import { ProgressBar } from '../../components/ProgressBar'
import { TierBadge } from '../../components/TierBadge'
import { getTierByPoints, getNextTier } from '../../data/tiers'

export const RankedScreen = () => {
  const navigation = useNavigation<any>()

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/me').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const rankedQuery = useQuery({
    queryKey: ['ranked-status'],
    queryFn: () => api.get('/api/me/ranked-status').then((r) => r.data),
    staleTime: 30 * 1000,
  })

  const seasonQuery = useQuery({
    queryKey: ['active-season'],
    queryFn: () => api.get('/api/seasons/active').then((r) => r.data),
  })

  const totalPoints = meQuery.data?.totalPoints ?? 0
  const energy = rankedQuery.data?.livesRemaining ?? 0
  const maxEnergy = rankedQuery.data?.dailyLives ?? 100
  const questionsToday = rankedQuery.data?.questionsToday ?? 0
  const currentBook = rankedQuery.data?.currentBook ?? ''
  const tier = getTierByPoints(totalPoints)
  const nextTier = getNextTier(totalPoints)
  const tierProgress = nextTier
    ? (totalPoints - tier.minPoints) / (nextTier.minPoints - tier.minPoints)
    : 1
  const noEnergy = energy <= 0 && !rankedQuery.isLoading

  const handleStart = async () => {
    let rankedSessionId: string | undefined
    try {
      // 1. Create ranked session (gets sessionId + currentBook)
      const rankedRes = await api.post('/api/ranked/sessions')
      rankedSessionId = rankedRes.data?.sessionId

      // 2. Create a quiz session with questions from the ranked book
      const sessionRes = await api.post('/api/sessions', {
        mode: 'RANKED',
        book: rankedRes.data?.currentBook,
        questionCount: 10,
      })
      const sessionId = sessionRes.data?.sessionId ?? sessionRes.data?.id ?? rankedSessionId
      if (sessionId) {
        navigation.navigate('Quiz', { sessionId, mode: 'ranked' })
      }
    } catch (err: any) {
      // Cleanup orphan ranked session if quiz session creation failed
      if (rankedSessionId) {
        api.delete(`/api/ranked/sessions/${rankedSessionId}`).catch(() => {})
      }
      Alert.alert('Lỗi', err.response?.data?.message ?? 'Không tạo được phiên ranked')
    }
  }

  if (meQuery.isLoading || rankedQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Thi Đấu Xếp Hạng</Text>

        {/* Tier */}
        <GlassCard style={styles.tierCard}>
          <TierBadge points={totalPoints} size="lg" />
          <View style={styles.tierInfo}>
            <Text style={styles.pointsText}>{totalPoints.toLocaleString()} điểm</Text>
            {nextTier && (
              <>
                <ProgressBar progress={tierProgress} height={8} />
                <Text style={styles.nextTierLabel}>
                  Cần {(nextTier.minPoints - totalPoints).toLocaleString()} điểm → {nextTier.icon} {nextTier.name}
                </Text>
              </>
            )}
          </View>
        </GlassCard>

        {/* Energy */}
        <GlassCard style={styles.energyCard}>
          <View style={styles.energyHeader}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.gold} />
            <Text style={styles.energyTitle}>Năng lượng</Text>
          </View>
          <View style={styles.energyBarContainer}>
            <ProgressBar progress={energy / maxEnergy} height={12} />
          </View>
          <Text style={styles.energyText}>{energy} / {maxEnergy}</Text>
          <Text style={styles.energySub}>Sai -5/câu • Reset mỗi ngày</Text>
        </GlassCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statMini}>
            <Text style={styles.statValue}>{questionsToday}</Text>
            <Text style={styles.statLabel}>Câu hôm nay</Text>
          </GlassCard>
          <GlassCard style={styles.statMini}>
            <Text style={styles.statValue}>{currentBook || '—'}</Text>
            <Text style={styles.statLabel}>Sách hiện tại</Text>
          </GlassCard>
        </View>

        {/* Season */}
        {seasonQuery.data && (
          <GlassCard style={styles.seasonCard}>
            <MaterialCommunityIcons name="calendar-star" size={20} color={colors.gold} />
            <Text style={styles.seasonText}>{seasonQuery.data.name ?? 'Mùa hiện tại'}</Text>
          </GlassCard>
        )}

        {/* Start */}
        <GoldButton
          title={noEnergy ? 'Hết Năng Lượng' : 'Bắt Đầu Ranked'}
          onPress={handleStart}
          disabled={noEnergy}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.xl, paddingBottom: spacing['4xl'] },

  title: { fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xl },

  tierCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.lg },
  tierInfo: { flex: 1, gap: spacing.xs },
  pointsText: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  nextTierLabel: { fontSize: 12, color: colors.text.muted },

  energyCard: { marginBottom: spacing.lg },
  energyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  energyTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  energyBarContainer: { marginBottom: spacing.sm },
  energyText: { fontSize: 20, fontWeight: '700', color: colors.gold, textAlign: 'center' },
  energySub: { fontSize: 12, color: colors.text.muted, textAlign: 'center', marginTop: spacing.xs },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statMini: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  statLabel: { fontSize: 12, color: colors.text.secondary },

  seasonCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  seasonText: { fontSize: 14, color: colors.text.primary, fontWeight: '500' },
})
