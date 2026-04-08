import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

export default function AchievementsScreen() {
  const { t } = useTranslation()
  const { data } = useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => apiClient.get('/api/achievements/me').then(r => r.data).catch(() => []),
  })
  const badges: any[] = Array.isArray(data) ? data : []
  const unlocked = badges.filter((b: any) => b.unlockedAt)
  const locked = badges.filter((b: any) => !b.unlockedAt)

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Thành tích</Text>
        <Text style={s.subtitle}>{unlocked.length}/{badges.length} đã mở khóa</Text>

        <View style={s.grid}>
          {badges.map((b: any) => (
            <View key={b.id} style={[s.badge, !b.unlockedAt && s.badgeLocked]}>
              <Text style={[s.badgeIcon, !b.unlockedAt && { opacity: 0.3 }]}>{b.icon ?? '🏅'}</Text>
              <Text style={s.badgeName} numberOfLines={1}>{b.name}</Text>
              <Text style={s.badgeDesc} numberOfLines={2}>{b.description}</Text>
              {!b.unlockedAt && <Text style={s.lockText}>🔒</Text>}
            </View>
          ))}
        </View>

        {badges.length === 0 && <Text style={s.empty}>Đang tải thành tích...</Text>}
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, color: colors.gold, fontWeight: typography.weight.bold, marginTop: spacing.xs, marginBottom: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  badge: {
    width: '47%', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl,
    padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.borderDefault,
  },
  badgeLocked: { opacity: 0.5 },
  badgeIcon: { fontSize: 32, marginBottom: spacing.sm },
  badgeName: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center' },
  badgeDesc: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  lockText: { position: 'absolute', top: spacing.sm, right: spacing.sm, fontSize: 12 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing['3xl'] },
})
