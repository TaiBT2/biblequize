import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'
import { ANSWER_COLORS } from '@biblequize/shared/constants'

interface PlayerAnalytics {
  userId: string
  answerIndex: number | null
  isCorrect: boolean
  responseMs: number
  pointsEarned: number
}

interface RoundAnalytics {
  roundNo: number
  questionId: string
  questionContent: string
  options: string[]
  correctIndex: number
  totalAnswers: number
  correctCount: number
  avgResponseMs: number
  distribution: number[]
  players: PlayerAnalytics[]
}

interface AnalyticsResponse {
  success: boolean
  rounds: RoundAnalytics[]
}

const LETTERS = ['A', 'B', 'C', 'D']
const ANSWER_TINTS = [ANSWER_COLORS.A, ANSWER_COLORS.B, ANSWER_COLORS.C, ANSWER_COLORS.D]

export default function RoomAnalyticsScreen() {
  const route = useRoute<any>()
  const roomId: string | undefined = route.params?.roomId

  const { data, isLoading, error } = useQuery<AnalyticsResponse>({
    queryKey: ['room-analytics', roomId],
    queryFn: () => apiClient.get(`/api/rooms/${roomId}/analytics`).then(r => r.data),
    enabled: !!roomId,
  })

  if (isLoading) {
    return <SafeScreen><View style={s.center}><Text style={s.muted}>Đang tải...</Text></View></SafeScreen>
  }
  if (error || !data?.success) {
    return <SafeScreen><View style={s.center}><Text style={s.error}>Không tải được analytics</Text></View></SafeScreen>
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Phân tích trận đấu</Text>
        <Text style={s.subtitle}>{data.rounds.length} câu hỏi</Text>

        {data.rounds.map(round => {
          const accuracyPct = round.totalAnswers > 0
            ? Math.round((round.correctCount / round.totalAnswers) * 100)
            : 0
          const maxDistribution = Math.max(1, ...round.distribution)

          return (
            <Card key={round.questionId} style={s.roundCard}>
              <View style={s.roundHeader}>
                <Text style={s.roundNo}>Câu {round.roundNo + 1}</Text>
                <Text style={s.accuracy}>{accuracyPct}% đúng</Text>
              </View>

              <Text style={s.questionContent}>{round.questionContent}</Text>

              <View style={s.optionsList}>
                {round.options.map((opt, idx) => {
                  const count = round.distribution[idx] ?? 0
                  const widthPct = (count / maxDistribution) * 100
                  const isCorrect = idx === round.correctIndex
                  const tint = ANSWER_TINTS[idx]

                  return (
                    <View key={idx} style={s.optionRow}>
                      <View style={[s.optionLetter, { backgroundColor: tint }]}>
                        <Text style={s.optionLetterText}>{LETTERS[idx]}</Text>
                      </View>
                      <View style={s.optionMain}>
                        <Text style={[s.optionText, isCorrect && s.optionCorrect]} numberOfLines={2}>
                          {opt}{isCorrect && ' ✓'}
                        </Text>
                        <View style={s.barTrack}>
                          <View style={[s.barFill, { width: `${widthPct}%`, backgroundColor: isCorrect ? colors.success : tint }]} />
                        </View>
                      </View>
                      <Text style={s.optionCount}>{count}</Text>
                    </View>
                  )
                })}
              </View>

              <View style={s.statsRow}>
                <Text style={s.statItem}>⏱ {Math.round(round.avgResponseMs / 100) / 10}s</Text>
                <Text style={s.statItem}>📊 {round.totalAnswers} trả lời</Text>
              </View>
            </Card>
          )
        })}
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted },
  muted: { fontSize: typography.size.sm, color: colors.textMuted },
  error: { fontSize: typography.size.sm, color: colors.error },
  roundCard: { gap: spacing.md },
  roundHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roundNo: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold, textTransform: 'uppercase' },
  accuracy: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.success },
  questionContent: { fontSize: typography.size.base, color: colors.textPrimary, lineHeight: 22 },
  optionsList: { gap: spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optionLetter: {
    width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
  },
  optionLetterText: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.textPrimary },
  optionMain: { flex: 1, gap: 4 },
  optionText: { fontSize: typography.size.sm, color: colors.textPrimary },
  optionCorrect: { fontWeight: typography.weight.bold, color: colors.success },
  barTrack: { height: 6, backgroundColor: colors.surfaceContainer, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  optionCount: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted, minWidth: 24, textAlign: 'right' },
  statsRow: { flexDirection: 'row', gap: spacing.xl, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderDefault },
  statItem: { fontSize: typography.size.xs, color: colors.textMuted },
})
