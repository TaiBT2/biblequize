import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

export interface DailyLbEntry {
  rank: number
  name: string
  tier?: string
  score: number
  correctCount?: number
  totalQuestions?: number
  isMe?: boolean
}

interface Props {
  myEntry?: DailyLbEntry | null
  myCompleted: boolean
}

/**
 * DC-PARITY-M2: mirror web `pages/daily/DailyLeaderboard.tsx` — top 5 rows
 * + separator + user row. Endpoint shared với web: GET /api/leaderboard/daily.
 * Group tab defer (Sprint 5 group leaderboard chưa wire — web cũng chưa scope).
 */
export function DailyLeaderboardCard({ myEntry, myCompleted }: Props) {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery<unknown>({
    queryKey: ['daily-leaderboard'],
    queryFn: () => apiClient.get('/api/leaderboard/daily?size=10').then(r => r.data),
    staleTime: 60_000,
  })

  const entries: DailyLbEntry[] = React.useMemo(() => {
    if (!data) return []
    const raw = Array.isArray(data) ? data
      : Array.isArray((data as { entries?: unknown[] }).entries)
        ? (data as { entries?: unknown[] }).entries!
        : []
    return (raw as Array<Record<string, unknown>>).map((e, i) => ({
      rank: (e.rank as number) ?? i + 1,
      name: (e.name as string) ?? (e.userName as string) ?? '—',
      tier: e.tier as string | undefined,
      score: (e.score as number) ?? (e.points as number) ?? 0,
      correctCount: e.correctCount as number | undefined,
      totalQuestions: e.totalQuestions as number | undefined,
    }))
  }, [data])

  const top = entries.slice(0, 5)

  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.headerIcon}>🏆</Text>
        <Text style={s.headerTitle}>{t('daily.lb.title')}</Text>
      </View>

      {isLoading ? (
        <Text style={s.empty}>{t('daily.lb.loading')}</Text>
      ) : top.length === 0 ? (
        <Text style={s.empty}>{t('daily.lb.empty')}</Text>
      ) : (
        top.map(e => <Row key={e.rank} entry={e} />)
      )}

      <Text style={s.separator}>···</Text>

      {myEntry ? (
        <Row entry={{ ...myEntry, isMe: true }} />
      ) : (
        <View style={[s.row, s.rowMe]}>
          <Text style={s.rank}>—</Text>
          <View style={[s.avatar, s.avatarMe]}>
            <Text style={s.avatarText}>?</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{t('daily.lb.youLine')}</Text>
            <Text style={s.nameSub}>{myCompleted ? t('daily.lb.loadingMyRank') : t('daily.lb.notCompleted')}</Text>
          </View>
          <Text style={s.score}>—</Text>
        </View>
      )}
    </View>
  )
}

function Row({ entry }: { entry: DailyLbEntry }) {
  const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null
  const initial = entry.name.charAt(0).toUpperCase()
  return (
    <View style={[s.row, entry.isMe && s.rowMe]}>
      <Text style={[s.rank, entry.rank === 1 && s.rankGold]}>{medal ?? entry.rank}</Text>
      <View style={[s.avatar, entry.isMe && s.avatarMe]}>
        <Text style={s.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>{entry.name}</Text>
        {entry.tier && <Text style={s.nameSub} numberOfLines={1}>{entry.tier}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.score}>{entry.score} đ</Text>
        {entry.correctCount != null && entry.totalQuestions != null && (
          <Text style={s.scoreSub}>
            {entry.correctCount}/{entry.totalQuestions}
            {entry.correctCount === entry.totalQuestions ? ' · perfect' : ''}
          </Text>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: 'rgba(50,52,64,0.4)',
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.1)',
    padding: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  headerIcon: { fontSize: 16 },
  headerTitle: { fontSize: 14, fontWeight: typography.weight.bold, color: colors.textPrimary },
  empty: { textAlign: 'center', fontSize: 12, color: colors.textMuted, paddingVertical: spacing.lg },
  separator: { textAlign: 'center', fontSize: 10, color: colors.textMuted, letterSpacing: 2, marginVertical: spacing.xs },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 8, paddingVertical: 8,
    borderRadius: borderRadius.md,
    marginBottom: 2,
  },
  rowMe: {
    backgroundColor: 'rgba(232,168,50,0.08)',
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.25)',
  },
  rank: { width: 24, fontSize: 13, fontWeight: typography.weight.bold, color: colors.textMuted, textAlign: 'center' },
  rankGold: { color: colors.gold, fontSize: 16 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(107,114,128,0.4)',
  },
  avatarMe: { backgroundColor: colors.gold },
  avatarText: { fontSize: 12, fontWeight: typography.weight.bold, color: colors.textPrimary },
  name: { fontSize: 13, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  nameSub: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  score: { fontSize: 13, fontWeight: typography.weight.bold, color: colors.gold, fontVariant: ['tabular-nums'] },
  scoreSub: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
})
