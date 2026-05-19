import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface HistoryDay {
  date: string
  completed: boolean
}

interface Props {
  currentStreak: number
  longestStreak?: number
}

function getDayLabelKeys() {
  return ['daily.daySun', 'daily.dayMon', 'daily.dayTue', 'daily.dayWed', 'daily.dayThu', 'daily.dayFri', 'daily.daySat']
}

/**
 * DC-PARITY-M3: 7-day streak heatmap — port web pages/daily/StreakCard.tsx
 * (last-7-days strip portion only; flame celebration kept simple). Cell states:
 * `today+completed` (gold solid), `today` (gold dashed), `completed` (red→orange),
 * `empty` (faded).
 */
export function DailyStreakHeatmap({ currentStreak, longestStreak }: Props) {
  const { t } = useTranslation()
  const labelKeys = getDayLabelKeys()

  const { data } = useQuery<HistoryDay[]>({
    queryKey: ['daily-history', 7],
    queryFn: () => apiClient.get('/api/daily-challenge/history?days=7').then(r => r.data),
    staleTime: 60_000,
  })

  const completedDates = React.useMemo(() => {
    const set = new Set<string>()
    ;(data ?? []).forEach(d => { if (d.completed) set.add(d.date) })
    return set
  }, [data])

  const last7 = React.useMemo(() => {
    const out: { label: string; date: string; isToday: boolean; completed: boolean }[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      out.push({
        label: t(labelKeys[d.getDay()]),
        date: iso,
        isToday: i === 0,
        completed: completedDates.has(iso),
      })
    }
    return out
  }, [completedDates, t, labelKeys])

  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.headerIcon}>🔥</Text>
        <Text style={s.headerTitle}>{t('daily.streak.title')}</Text>
      </View>

      <View style={s.streakBlock}>
        <Text style={s.streakNumber}>{currentStreak}</Text>
        <Text style={s.streakLabel}>{t('daily.streak.daysLine')}</Text>
        {longestStreak != null && longestStreak > currentStreak && (
          <Text style={s.streakMeta}>{t('daily.streak.longest', { count: longestStreak })}</Text>
        )}
      </View>

      <View style={s.grid}>
        {last7.map(d => {
          const cellStyle = d.completed && d.isToday
            ? s.cellTodayDone
            : d.isToday
              ? s.cellToday
              : d.completed
                ? s.cellDone
                : s.cellEmpty
          const textStyle = d.completed && d.isToday
            ? s.cellTextTodayDone
            : d.isToday
              ? s.cellTextToday
              : d.completed
                ? s.cellTextDone
                : s.cellTextEmpty
          return (
            <View key={d.date} style={[s.cell, cellStyle]}>
              <Text style={[s.cellText, textStyle]}>{d.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: 'rgba(50,52,64,0.4)',
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
    padding: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  headerIcon: { fontSize: 16 },
  headerTitle: { fontSize: 14, fontWeight: typography.weight.bold, color: colors.textPrimary },

  streakBlock: { alignItems: 'center', paddingVertical: spacing.sm },
  streakNumber: { fontSize: 32, fontWeight: typography.weight.black, color: '#f97316', lineHeight: 36 },
  streakLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  streakMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },

  grid: { flexDirection: 'row', gap: 6, marginTop: spacing.md },
  cell: {
    flex: 1, aspectRatio: 1, borderRadius: borderRadius.full,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  cellText: { fontSize: 10, fontWeight: typography.weight.bold },
  cellTodayDone: { backgroundColor: colors.gold, borderColor: '#fbbf24', borderWidth: 2 },
  cellTextTodayDone: { color: '#1a1208' },
  cellToday: { backgroundColor: 'rgba(232,168,50,0.15)', borderColor: 'rgba(232,168,50,0.5)', borderStyle: 'dashed', borderWidth: 2 },
  cellTextToday: { color: colors.gold },
  cellDone: { backgroundColor: '#ef4444', borderColor: 'transparent' },
  cellTextDone: { color: '#fff' },
  cellEmpty: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' },
  cellTextEmpty: { color: colors.textMuted },
})
