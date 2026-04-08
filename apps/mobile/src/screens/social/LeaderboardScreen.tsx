import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Avatar from '../../components/ui/Avatar'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

const TABS = [
  { key: 'daily', label: 'Ngày' },
  { key: 'weekly', label: 'Tuần' },
  { key: 'all-time', label: 'Tất cả' },
]

export default function LeaderboardScreen() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState('weekly')

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => apiClient.get(`/api/leaderboard/${period}?size=20`).then(r => r.data),
    staleTime: 30_000,
  })

  const entries: any[] = Array.isArray(data) ? data : []

  return (
    <SafeScreen>
      <Text style={styles.title}>Bảng Xếp Hạng</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <Pressable key={t.key} onPress={() => setPeriod(t.key)}
            style={[styles.tab, period === t.key && styles.tabActive]}>
            <Text style={[styles.tabText, period === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {entries.map((e, i) => (
          <View key={e.userId ?? i} style={[styles.row, i < 3 && styles.rowTop]}>
            <Text style={[styles.rank, i < 3 && { color: colors.gold }]}>#{i + 1}</Text>
            <Avatar uri={e.avatarUrl} name={e.name} size={36} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{e.name}</Text>
              <Text style={styles.questions}>{e.questions ?? 0} câu</Text>
            </View>
            <Text style={styles.points}>{e.points?.toLocaleString()}</Text>
          </View>
        ))}
        {entries.length === 0 && !isLoading && (
          <Text style={styles.empty}>Chưa có dữ liệu</Text>
        )}
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, padding: spacing.lg, paddingBottom: spacing.sm },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, padding: 3 },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
  tabActive: { backgroundColor: colors.gold },
  tabText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted },
  tabTextActive: { color: colors.onSecondary },
  list: { padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.md },
  rowTop: { borderWidth: 1, borderColor: 'rgba(248,189,69,0.2)' },
  rank: { width: 30, fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted },
  info: { flex: 1 },
  name: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  questions: { fontSize: 10, color: colors.textMuted },
  points: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing['3xl'] },
})
