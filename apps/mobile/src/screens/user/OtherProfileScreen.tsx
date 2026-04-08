import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { apiClient } from '../../api/client'
import { getTierProgress } from '../../logic/tierProgression'
import { colors, typography, spacing } from '../../theme'

export default function OtherProfileScreen() {
  const { t } = useTranslation()
  const route = useRoute<any>()
  const { data } = useQuery({
    queryKey: ['user-profile', route.params?.userId],
    queryFn: () => apiClient.get('/api/users/' + route.params?.userId).then(r => r.data),
    enabled: !!route.params?.userId,
  })
  const profile = data ?? {}
  const tier = getTierProgress(profile.totalPoints ?? 0)

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Avatar uri={profile.avatarUrl} name={profile.name} size={80} borderColor={tier.current.color} />
          <Text style={s.name}>{profile.name ?? 'User'}</Text>
          <View style={s.tierBadge}>
            <Text style={s.tierIcon}>{tier.current.icon}</Text>
            <Text style={s.tierName}>{tier.current.name}</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <Card style={s.stat}><Text style={s.statVal}>{(profile.totalPoints ?? 0).toLocaleString()}</Text><Text style={s.statLbl}>XP</Text></Card>
          <Card style={s.stat}><Text style={s.statVal}>{profile.currentStreak ?? 0}</Text><Text style={s.statLbl}>Streak</Text></Card>
        </View>

        <Button title="Thách đấu" onPress={() => {}} fullWidth />
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  name: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, marginTop: spacing.md },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  tierIcon: { fontSize: 16 }, tierName: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  statVal: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.gold },
  statLbl: { fontSize: 10, color: colors.textMuted, marginTop: spacing.xs },
})
