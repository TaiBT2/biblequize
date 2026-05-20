import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'
import { apiClient } from '../../api/client'
import type { DailyMission } from '../../types/models'
import { colors, typography, spacing } from '../../theme'
import SectionHeader from './SectionHeader'

/**
 * Daily missions tracker — port từ web DailyMissionsCard.
 * Self-fetches /api/me/daily-missions every 30s. Render 3 mission rows với
 * filled circle (completed) + description + inline progress bar (X/Y).
 */
export default function DailyMissionsCard() {
  const { data } = useQuery<DailyMission[] | { missions?: DailyMission[] } | null>({
    queryKey: ['daily-missions'],
    queryFn: () => apiClient.get('/api/me/daily-missions').then(r => r.data?.missions ?? r.data ?? []),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  // Defensive: TanStack cache có thể bị pollute bởi component khác (queryKey
  // collision) hoặc BE shape khác. Always normalize sang array.
  const missions: DailyMission[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { missions?: DailyMission[] })?.missions)
      ? (data as { missions?: DailyMission[] }).missions!
      : []

  if (missions.length === 0) return null

  return (
    <View>
      <SectionHeader title="Nhiệm vụ hôm nay" meta={`${missions.filter(m => m.completed).length}/${missions.length}`} />
      <Card style={s.card}>
        {missions.map((m, i) => {
          const pct = m.target > 0 ? Math.min(100, (m.progress / m.target) * 100) : 0
          return (
            <View key={m.slot ?? i} style={[s.row, i < missions.length - 1 && s.rowBorder]}>
              <View style={[s.circle, m.completed && s.circleFilled]}>
                {m.completed && <Text style={s.checkIcon}>✓</Text>}
              </View>
              <View style={s.info}>
                <Text style={s.description} numberOfLines={1}>{m.description}</Text>
                <View style={s.progressRow}>
                  <View style={{ flex: 1 }}>
                    <ProgressBar progress={pct} height={4} />
                  </View>
                  <Text style={s.counter}>{m.progress}/{m.target}</Text>
                </View>
              </View>
            </View>
          )
        })}
      </Card>
    </View>
  )
}

const s = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderDefault },
  circle: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  circleFilled: { backgroundColor: colors.gold },
  checkIcon: { fontSize: 14, color: colors.onSecondary, fontWeight: typography.weight.bold },
  info: { flex: 1, gap: 4 },
  description: { fontSize: typography.size.sm, color: colors.textPrimary, fontWeight: typography.weight.medium },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  counter: { fontSize: 11, color: colors.textMuted, fontVariant: ['tabular-nums'], minWidth: 32, textAlign: 'right' },
})
