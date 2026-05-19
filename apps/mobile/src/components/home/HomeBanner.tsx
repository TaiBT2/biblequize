import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Avatar from '../ui/Avatar'
import ProgressBar from '../ui/ProgressBar'
import { useAuthStore } from '../../stores/authStore'
import { getTierProgress } from '../../logic/tierProgression'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  totalPoints: number
  streak: number
  energyRemaining?: number
  energyMax?: number
  seasonPoints?: number
}

/**
 * Mobile port của web HomeBanner (HR-2 Modern Spiritual).
 * Sport-app header: gold-border avatar 64px + greeting + name + tier progress + 3-stat row.
 */
export default function HomeBanner({
  totalPoints, streak, energyRemaining, energyMax, seasonPoints,
}: Props) {
  const navigation = useNavigation<any>()
  const { user } = useAuthStore()
  const tier = getTierProgress(totalPoints)

  const greeting = (() => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Chào buổi sáng'
    if (hr < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  })()

  return (
    <View style={s.container}>
      <View style={s.topRow}>
        <Pressable
          onPress={() => navigation.navigate('ProfileTab')}
          accessibilityLabel="Mở hồ sơ"
          accessibilityRole="button"
        >
          <Avatar uri={user?.avatarUrl} name={user?.name} size={64} borderColor={colors.gold} />
        </Pressable>
        <View style={s.info}>
          <Text style={s.greeting}>{greeting},</Text>
          <Text style={s.name} numberOfLines={1}>{user?.name ?? 'Bạn'}</Text>
          <View style={s.tierRow}>
            <Text style={s.tierIcon}>{tier.current.icon}</Text>
            <Text style={s.tierName}>{tier.current.name}</Text>
          </View>
        </View>
      </View>

      <ProgressBar progress={tier.percent} height={6} />

      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statIcon}>🔥</Text>
          <Text style={s.statValue}>{streak}</Text>
          <Text style={s.statLabel}>chuỗi</Text>
        </View>
        {typeof energyRemaining === 'number' && (
          <View style={s.statItem}>
            <Text style={s.statIcon}>⚡</Text>
            <Text style={s.statValue}>{energyRemaining}{energyMax ? `/${energyMax}` : ''}</Text>
            <Text style={s.statLabel}>năng lượng</Text>
          </View>
        )}
        <View style={s.statItem}>
          <Text style={s.statIcon}>🏆</Text>
          <Text style={s.statValue}>{(seasonPoints ?? totalPoints).toLocaleString()}</Text>
          <Text style={s.statLabel}>{seasonPoints != null ? 'mùa' : 'XP'}</Text>
        </View>
      </View>

      {tier.next && (
        <Text style={s.tierNext}>
          Còn {tier.pointsToNext.toLocaleString()} XP đến {tier.next.name}
        </Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { gap: spacing.md, paddingVertical: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, gap: 2 },
  greeting: { fontSize: typography.size.xs, color: colors.textMuted },
  name: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  tierIcon: { fontSize: typography.size.base },
  tierName: { fontSize: typography.size.sm, color: colors.gold, fontWeight: typography.weight.semibold },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing.xs },
  statItem: { alignItems: 'center', gap: 2 },
  statIcon: { fontSize: 16 },
  statValue: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'lowercase' },
  tierNext: { fontSize: typography.size.xs, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
})
