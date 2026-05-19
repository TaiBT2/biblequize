import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { apiClient } from '../../api/client'
import { useStomp } from '../../hooks/useStomp'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface LiveScore {
  userId?: string
  username: string
  score: number
}

const HOST_ACTIONS = [
  { key: 'pause', label: '⏸️ Tạm dừng', color: '#eab308' },
  { key: 'resume', label: '▶️ Tiếp tục', color: '#22c55e' },
  { key: 'skip-question', label: '⏭️ Bỏ câu', color: '#3b82f6' },
  { key: 'end-early', label: '⏹️ Kết thúc sớm', color: '#ef4444' },
] as const

/**
 * Quản trò (RoomQuizHost) screen — render khi user is host AND room.hostPlaysGame === false.
 * Host orchestrate game không tham gia chơi: pause/resume/skip/end + real-time leaderboard.
 *
 * SPEC_MULTIPLAYER §4 Host-Organizer separation (Sprint 4).
 */
export default function RoomQuizHostScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const roomId: string = route.params?.roomId ?? ''

  const [scores, setScores] = useState<LiveScore[]>([])
  const [questionInfo, setQuestionInfo] = useState<{ index: number; total: number } | null>(null)
  const [paused, setPaused] = useState(false)
  const [broadcast, setBroadcast] = useState('')

  const handleMessage = useCallback((msg: any) => {
    switch (msg?.type) {
      case 'QUESTION_START':
        setQuestionInfo({ index: msg.data?.questionIndex ?? 0, total: msg.data?.totalQuestions ?? 0 })
        break
      case 'ROUND_END':
        if (Array.isArray(msg.data?.leaderboard)) {
          setScores(msg.data.leaderboard.slice().sort((a: LiveScore, b: LiveScore) => b.score - a.score))
        }
        break
      case 'ANSWER_SUBMITTED':
        if (Array.isArray(msg.data?.leaderboard)) {
          setScores(msg.data.leaderboard.slice().sort((a: LiveScore, b: LiveScore) => b.score - a.score))
        }
        break
      case 'GAME_PAUSED':
        setPaused(true)
        break
      case 'GAME_RESUMED':
        setPaused(false)
        break
      case 'QUIZ_END':
        navigation.replace('MultiplayerResults', { roomId, leaderboard: msg.data?.leaderboard ?? [] })
        break
    }
  }, [navigation, roomId])

  useStomp({ roomId, onMessage: handleMessage })

  const callHostAction = async (action: string, body?: any) => {
    try {
      await apiClient.post(`/api/rooms/${roomId}/host/${action}`, body ?? {})
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message ?? `Không gọi được ${action}`)
    }
  }

  const handleBroadcast = () => {
    const text = broadcast.trim()
    if (!text) return
    callHostAction('broadcast', { message: text })
    setBroadcast('')
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.headerRow}>
          <Text style={s.title}>👑 Quản trò</Text>
          {paused && <Text style={s.pausedBadge}>ĐANG TẠM DỪNG</Text>}
        </View>

        {questionInfo && (
          <Card style={s.infoCard}>
            <Text style={s.infoLabel}>Câu hỏi hiện tại</Text>
            <Text style={s.infoValue}>{questionInfo.index + 1} / {questionInfo.total}</Text>
          </Card>
        )}

        <Text style={s.section}>Bảng xếp hạng trực tiếp</Text>
        <View style={s.list}>
          {scores.length === 0 ? (
            <Text style={s.empty}>Chưa có điểm</Text>
          ) : scores.map((p, i) => (
            <Card key={p.userId ?? p.username} style={s.scoreRow}>
              <Text style={s.rank}>#{i + 1}</Text>
              <Text style={s.name}>{p.username}</Text>
              <Text style={s.score}>{p.score}</Text>
            </Card>
          ))}
        </View>

        <Text style={s.section}>Điều khiển</Text>
        <View style={s.actionsGrid}>
          {HOST_ACTIONS.map(a => (
            <Pressable
              key={a.key}
              onPress={() => callHostAction(a.key)}
              style={[s.actionBtn, { borderColor: a.color }]}
            >
              <Text style={[s.actionLabel, { color: a.color }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.section}>Broadcast tin nhắn</Text>
        <View style={s.broadcastRow}>
          <Pressable
            onPress={handleBroadcast}
            style={s.broadcastBtn}
            disabled={!broadcast.trim()}
          >
            <Text style={s.broadcastBtnText}>📢 Gửi</Text>
          </Pressable>
        </View>

        <Button title="Rời phòng" onPress={() => navigation.popToTop()} variant="outline" fullWidth />
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.gold },
  pausedBadge: {
    backgroundColor: colors.warning,
    color: colors.onSecondary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  infoCard: { alignItems: 'center', paddingVertical: spacing.lg },
  infoLabel: { fontSize: typography.size.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.gold, marginTop: spacing.xs },
  section: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  list: { gap: spacing.sm },
  empty: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rank: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold, width: 36 },
  name: { flex: 1, fontSize: typography.size.base, color: colors.textPrimary },
  score: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.gold },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
  },
  actionLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  broadcastRow: { flexDirection: 'row', gap: spacing.sm },
  broadcastBtn: {
    flex: 1,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  broadcastBtnText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.onSecondary },
})
