import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import ProgressBar from '../../components/ui/ProgressBar'
import { useAuthStore } from '../../stores/authStore'
import { apiClient } from '../../api/client'
import { getTierProgress } from '../../logic/tierProgression'
import { colors, typography, spacing, borderRadius } from '../../theme'

export default function ProfileScreen() {
  const navigation = useNavigation<any>()
  const { user } = useAuthStore()

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => apiClient.get('/api/me').then(r => r.data), staleTime: 5 * 60_000 })

  const totalPoints = me?.totalPoints ?? 0
  const tier = getTierProgress(totalPoints)

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        {/* Avatar + Name */}
        <View style={s.profileHeader}>
          <Avatar uri={user?.avatarUrl} name={user?.name} size={80} borderColor={colors.gold} />
          <Text style={s.name}>{user?.name ?? 'User'}</Text>
          <Text style={s.email}>{user?.email ?? ''}</Text>
        </View>

        {/* Tier */}
        <Card style={s.tierCard}>
          <View style={s.tierRow}>
            <Text style={s.tierIcon}>{tier.current.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.tierName}>{tier.current.name}</Text>
              <Text style={s.tierPts}>{totalPoints.toLocaleString()} XP</Text>
            </View>
          </View>
          <ProgressBar progress={tier.percent} height={6} />
        </Card>

        {/* Stats */}
        <View style={s.statsGrid}>
          <Card style={s.statBox}>
            <Text style={s.statValue}>{totalPoints.toLocaleString()}</Text>
            <Text style={s.statLabel}>Tổng điểm</Text>
          </Card>
          <Card style={s.statBox}>
            <Text style={s.statValue}>{me?.currentStreak ?? 0}</Text>
            <Text style={s.statLabel}>Chuỗi ngày</Text>
          </Card>
          <Card style={s.statBox}>
            <Text style={s.statValue}>{me?.longestStreak ?? 0}</Text>
            <Text style={s.statLabel}>Kỷ lục</Text>
          </Card>
        </View>

        {/* Menu items */}
        {[
          { icon: '🏆', label: 'Thành tích', screen: 'Achievements' },
          { icon: '⚙️', label: 'Cài đặt', screen: 'Settings' },
        ].map(item => (
          <Pressable key={item.screen} onPress={() => navigation.navigate(item.screen)} style={s.menuItem}>
            <Text style={s.menuIcon}>{item.icon}</Text>
            <Text style={s.menuLabel}>{item.label}</Text>
            <Text style={s.menuArrow}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  profileHeader: { alignItems: 'center', paddingVertical: spacing.xl },
  name: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, marginTop: spacing.md },
  email: { fontSize: typography.size.sm, color: colors.textMuted },
  tierCard: { gap: spacing.md },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tierIcon: { fontSize: 32 },
  tierName: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.gold },
  tierPts: { fontSize: typography.size.xs, color: colors.textMuted },
  statsGrid: { flexDirection: 'row', gap: spacing.md },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  statValue: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.gold },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: spacing.xs, textTransform: 'uppercase' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, padding: spacing.lg },
  menuIcon: { fontSize: 20, marginRight: spacing.md },
  menuLabel: { flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.textPrimary },
  menuArrow: { fontSize: 20, color: colors.textMuted },
})
