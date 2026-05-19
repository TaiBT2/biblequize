import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import {
  getScheduledQuizDetail, getScheduledQuizLeaderboard,
  ScheduledQuizDetail, LeaderboardRow,
} from '../../api/scheduledQuiz'
import { colors, typography, spacing, borderRadius } from '../../theme'

function formatDeadline(iso: string): string {
  const ts = new Date(iso).getTime()
  if (!Number.isFinite(ts)) return iso
  const diff = ts - Date.now()
  if (diff < 0) return 'Đã hết hạn'
  const days = Math.floor(diff / 86400000)
  if (days > 1) return `Còn ${days} ngày`
  const hrs = Math.floor(diff / 3600000)
  if (hrs > 1) return `Còn ${hrs} giờ`
  return `Còn ${Math.max(1, Math.floor(diff / 60000))} phút`
}

export default function ScheduledQuizDetailScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const groupId: string = route.params?.groupId ?? ''
  const quizId: string = route.params?.quizId ?? ''

  const { data: detail, isLoading } = useQuery<ScheduledQuizDetail>({
    queryKey: ['scheduled-quiz', groupId, quizId],
    queryFn: () => getScheduledQuizDetail(groupId, quizId),
    enabled: !!groupId && !!quizId,
    refetchInterval: 30_000, // Poll detail every 30s
  })

  const { data: leaderboard = [] } = useQuery<LeaderboardRow[]>({
    queryKey: ['scheduled-quiz-leaderboard', groupId, quizId],
    queryFn: () => getScheduledQuizLeaderboard(groupId, quizId),
    enabled: !!groupId && !!quizId && detail?.isLeaderboardPublic !== false,
    refetchInterval: 30_000,
  })

  if (isLoading) return <SafeScreen><View style={s.center}><Text style={s.muted}>Đang tải...</Text></View></SafeScreen>
  if (!detail) return <SafeScreen><View style={s.center}><Text style={s.error}>Không tải được</Text></View></SafeScreen>

  const isActive = detail.status === 'ACTIVE'
  const canPlay = isActive && detail.myStatus.attemptsRemaining > 0

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{detail.name}</Text>
        {detail.description && <Text style={s.description}>{detail.description}</Text>}

        <Card style={[s.banner, isActive ? s.bannerActive : s.bannerEnded]}>
          <Text style={[s.bannerLabel, isActive ? s.bannerLabelActive : s.bannerLabelEnded]}>
            {isActive ? '⏰ Đang mở' : '✓ Đã kết thúc'}
          </Text>
          <Text style={s.bannerValue}>{isActive ? formatDeadline(detail.deadline) : (detail.winnerScore != null ? `Quán quân: ${detail.winnerScore} điểm` : 'Không có người tham gia')}</Text>
        </Card>

        <Card style={s.myStatsCard}>
          <Text style={s.sectionLabel}>Kết quả của bạn</Text>
          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{detail.myStatus.attemptsUsed} / {detail.maxAttempts}</Text>
              <Text style={s.statLabel}>Lần thử</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{detail.myStatus.bestScore ?? '-'}</Text>
              <Text style={s.statLabel}>Điểm cao nhất</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>
                {detail.myStatus.bestCorrectCount != null ? `${detail.myStatus.bestCorrectCount}/${detail.questionCount}` : '-'}
              </Text>
              <Text style={s.statLabel}>Đúng nhất</Text>
            </View>
          </View>
        </Card>

        {canPlay && (
          <Button
            title={detail.myStatus.attemptsUsed === 0 ? 'Bắt đầu thi' : 'Thử lại'}
            onPress={() => navigation.navigate('ScheduledQuizPlay', { groupId, quizId })}
            fullWidth
          />
        )}
        {!isActive && (
          <Text style={s.endedHint}>Lịch đã kết thúc, không thể thử thêm.</Text>
        )}
        {isActive && detail.myStatus.attemptsRemaining === 0 && (
          <Text style={s.endedHint}>Bạn đã dùng hết {detail.maxAttempts} lần thử.</Text>
        )}

        {detail.isLeaderboardPublic && (
          <View>
            <Text style={s.sectionLabel}>Bảng xếp hạng</Text>
            {leaderboard.length === 0 ? (
              <Text style={s.muted}>Chưa có ai tham gia</Text>
            ) : leaderboard.map(row => (
              <Card key={row.userId} style={[s.lbRow, row.isMe && s.lbRowMe]}>
                <Text style={s.lbRank}>#{row.rank}</Text>
                <Avatar uri={row.avatarUrl} name={row.name} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.lbName, row.isMe && s.lbNameMe]}>{row.name}{row.isMe ? ' (Bạn)' : ''}</Text>
                  <Text style={s.lbSubmeta}>{row.correctCount}/{row.totalQuestions} câu · {row.timeSeconds}s</Text>
                </View>
                <Text style={s.lbScore}>{row.score}</Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing['2xl'] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center' },
  error: { fontSize: typography.size.sm, color: colors.error },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  description: { fontSize: typography.size.sm, color: colors.textSecondary },
  banner: { alignItems: 'center', paddingVertical: spacing.lg, borderWidth: 2 },
  bannerActive: { borderColor: colors.success, backgroundColor: 'rgba(34,197,94,0.05)' },
  bannerEnded: { borderColor: colors.borderDefault },
  bannerLabel: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  bannerLabelActive: { color: colors.success },
  bannerLabelEnded: { color: colors.textMuted },
  bannerValue: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary, marginTop: spacing.xs },
  myStatsCard: { gap: spacing.sm },
  sectionLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.gold },
  statLabel: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 },
  endedHint: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  lbRowMe: { borderWidth: 2, borderColor: colors.gold },
  lbRank: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted, width: 36 },
  lbName: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  lbNameMe: { color: colors.gold },
  lbSubmeta: { fontSize: typography.size.xs, color: colors.textMuted },
  lbScore: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.gold },
})
