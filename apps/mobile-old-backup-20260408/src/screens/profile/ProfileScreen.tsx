import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { useAuthStore } from '../../stores/authStore'
import { Avatar } from '../../components/Avatar'
import { TierBadge } from '../../components/TierBadge'
import { GlassCard } from '../../components/GlassCard'

export const ProfileScreen = () => {
  const navigation = useNavigation<any>()
  const { user } = useAuthStore()

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/me').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const profile = meQuery.data
  const totalPoints = profile?.totalPoints ?? 0
  const currentStreak = profile?.currentStreak ?? 0

  const stats = [
    { label: 'Tổng điểm', value: totalPoints.toLocaleString(), icon: 'star' as const },
    { label: 'Streak', value: `${currentStreak} ngày`, icon: 'fire' as const },
    { label: 'Chuỗi dài nhất', value: `${profile?.longestStreak ?? 0}`, icon: 'trophy' as const },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Cá Nhân</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <MaterialCommunityIcons name="cog" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <GlassCard style={styles.profileCard}>
          <Avatar uri={user?.avatar ?? profile?.avatarUrl} name={user?.name ?? 'User'} size={64} />
          <Text style={styles.name}>{user?.name ?? profile?.name ?? 'User'}</Text>
          <Text style={styles.email}>{user?.email ?? profile?.email ?? ''}</Text>
          <TierBadge points={totalPoints} size="md" />
        </GlassCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <GlassCard key={s.label} style={styles.statCard}>
              <MaterialCommunityIcons name={s.icon} size={20} color={colors.gold} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Quick links */}
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('HomeTab', { screen: 'Achievements' })}
        >
          <MaterialCommunityIcons name="medal" size={20} color={colors.gold} />
          <Text style={styles.linkText}>Thành tích</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('HomeTab', { screen: 'Leaderboard' })}
        >
          <MaterialCommunityIcons name="podium" size={20} color={colors.gold} />
          <Text style={styles.linkText}>Bảng xếp hạng</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.muted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { padding: spacing.xl, paddingBottom: spacing['4xl'] },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text.primary },

  profileCard: { alignItems: 'center', paddingVertical: spacing['2xl'], marginBottom: spacing.xl, gap: spacing.sm },
  name: { fontSize: 20, fontWeight: '700', color: colors.text.primary },
  email: { fontSize: 13, color: colors.text.secondary },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.xs },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  statLabel: { fontSize: 11, color: colors.text.secondary },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg.card, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing.lg, marginBottom: spacing.sm,
  },
  linkText: { flex: 1, fontSize: 15, color: colors.text.primary, fontWeight: '500' },
})
