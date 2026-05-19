import { useTranslation } from 'react-i18next'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { Question } from '../../types/models'
import SafeScreen from '../../components/layout/SafeScreen'
import CountdownTimer from '../../components/quiz/CountdownTimer'
import ChatOverlay, { ChatMessage } from '../../components/multiplayer/ChatOverlay'
import ReactionBar, { IncomingReaction, ReactionEmoji } from '../../components/multiplayer/ReactionBar'
import EliminationOverlay from '../../components/multiplayer/EliminationOverlay'
import TeamScoreBar from '../../components/multiplayer/TeamScoreBar'
import MatchResultOverlay from '../../components/multiplayer/MatchResultOverlay'
import { useStomp } from '../../hooks/useStomp'
import { useHaptic } from '../../hooks/useHaptic'
import { colors, typography, spacing, borderRadius } from '../../theme'
import { ANSWER_COLORS } from '@biblequize/shared/constants'

interface PlayerScore {
  userId?: string
  username: string
  score: number
}

const LETTERS = ['A', 'B', 'C', 'D']
const ANSWER_TINTS = [ANSWER_COLORS.A, ANSWER_COLORS.B, ANSWER_COLORS.C, ANSWER_COLORS.D]

/**
 * Minimal SPEED_RACE multiplayer quiz flow:
 *   - Subscribe /topic/room/{id}, listen QUESTION_START, ROUND_END, QUIZ_END
 *   - Tap answer → send /app/room/{id}/answer { questionIndex, answerIndex, reactionTimeMs }
 *   - QUIZ_END → navigate to Results với leaderboard payload
 *
 * Defer S3: countdown timer animation, mode-specific overlays (BR eliminate,
 * TVT team scores, SD match), sound/haptic, combo banner, perfect detection.
 */
export default function MultiplayerQuizScreen() {
  const { t } = useTranslation()
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const roomId: string = route.params?.roomId ?? ''
  const viewerUserId: string | undefined = route.params?.userId

  const [question, setQuestion] = useState<Question | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timeLimit, setTimeLimit] = useState(0)
  const [combo, setCombo] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [reactions, setReactions] = useState<IncomingReaction[]>([])
  const [eliminated, setEliminated] = useState<{ rank: number; total: number } | null>(null)
  const [activeCount, setActiveCount] = useState<number | null>(null)
  const [teamScores, setTeamScores] = useState<{ a: number; b: number; perfectA?: boolean; perfectB?: boolean } | null>(null)
  const [matchResult, setMatchResult] = useState<{ winnerName: string; loserName: string; iWon: boolean } | null>(null)
  const questionStartedAt = useRef<number>(0)
  const selectedRef = useRef<number | null>(null)
  const { trigger: haptic } = useHaptic()

  // Sync selected → ref for use trong ROUND_END callback (avoid stale closure).
  useEffect(() => { selectedRef.current = selected }, [selected])

  // Countdown tick — derived from server startedAtMs so all players stay in sync.
  useEffect(() => {
    if (!question || correctIndex !== null) return
    const tick = () => {
      const elapsedSec = (Date.now() - questionStartedAt.current) / 1000
      const left = Math.max(0, Math.ceil(timeLimit - elapsedSec))
      setTimeLeft(left)
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [question, timeLimit, correctIndex])

  const handleMessage = useCallback((msg: any) => {
    switch (msg?.type) {
      case 'QUESTION_START': {
        const d = msg.data
        questionStartedAt.current = d.startedAtMs ?? Date.now()
        setQuestion(d.question)
        setQuestionIndex(d.questionIndex)
        setTotalQuestions(d.totalQuestions)
        setTimeLimit(d.timeLimit ?? 0)
        setTimeLeft(d.timeLimit ?? 0)
        setSelected(null)
        setCorrectIndex(null)
        break
      }
      case 'ROUND_END': {
        const correct = msg.data?.correctIndex ?? null
        setCorrectIndex(correct)
        if (selectedRef.current !== null && correct !== null) {
          const wasCorrect = selectedRef.current === correct
          haptic(wasCorrect ? 'success' : 'error')
          if (wasCorrect) {
            setCombo(c => c + 1)
          } else {
            setCombo(0)
          }
        }
        break
      }
      case 'QUIZ_END': {
        const leaderboard: PlayerScore[] = msg.data?.leaderboard ?? []
        navigation.replace('MultiplayerResults', { roomId, leaderboard })
        break
      }
      case 'CHAT_MESSAGE': {
        const d = msg.data ?? {}
        setChatMessages(prev => [...prev, {
          senderId: d.senderId,
          sender: d.sender ?? d.senderName ?? 'Người chơi',
          text: String(d.text ?? ''),
          receivedAt: Date.now(),
        }])
        break
      }
      case 'REACTION': {
        const d = msg.data ?? {}
        setReactions(prev => [...prev, {
          id: `${d.senderId ?? 'anon'}-${Date.now()}-${Math.random()}`,
          senderName: d.senderName ?? d.sender ?? 'Người chơi',
          reaction: String(d.reaction ?? '👏'),
        }])
        break
      }
      case 'PLAYER_ELIMINATED': {
        const d = msg.data ?? {}
        if (typeof d.activeCount === 'number') setActiveCount(d.activeCount)
        if (viewerUserId && d.userId === viewerUserId) {
          setEliminated({ rank: d.rank ?? 0, total: d.totalPlayers ?? 0 })
        }
        break
      }
      case 'TEAM_SCORE_UPDATE': {
        const d = msg.data ?? {}
        setTeamScores({
          a: Number(d.scoreA ?? d.teamA ?? 0),
          b: Number(d.scoreB ?? d.teamB ?? 0),
          perfectA: !!d.perfectA,
          perfectB: !!d.perfectB,
        })
        break
      }
      case 'MATCH_RESULT': {
        const d = msg.data ?? {}
        setMatchResult({
          winnerName: d.winnerName ?? 'Người chơi',
          loserName: d.loserName ?? 'Người chơi',
          iWon: !!viewerUserId && d.winnerId === viewerUserId,
        })
        break
      }
    }
  }, [navigation, roomId, haptic, viewerUserId])

  const { connected, send } = useStomp({ roomId, onMessage: handleMessage })

  const handleAnswer = (idx: number) => {
    if (selected !== null || correctIndex !== null) return
    setSelected(idx)
    const reactionTimeMs = Date.now() - questionStartedAt.current
    if (!send(`/app/room/${roomId}/answer`, { questionIndex, answerIndex: idx, reactionTimeMs })) {
      setSelected(null)
      Alert.alert('Mất kết nối', 'Đang kết nối lại...')
    }
  }

  if (!question) {
    return (
      <SafeScreen>
        <View style={s.center}>
          <Text style={s.waiting}>
            {connected ? 'Đang chờ câu hỏi...' : 'Đang kết nối...'}
          </Text>
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.questionMeta}>
            Câu {questionIndex + 1} / {totalQuestions} · {question.book}
            {activeCount !== null && ` · ${activeCount} còn lại`}
          </Text>
          {combo > 0 && (
            <View style={s.comboBadge}>
              <Text style={s.comboText}>🔥 {combo}</Text>
            </View>
          )}
        </View>

        {teamScores && (
          <TeamScoreBar
            scoreA={teamScores.a}
            scoreB={teamScores.b}
            perfectA={teamScores.perfectA}
            perfectB={teamScores.perfectB}
          />
        )}

        <View style={s.timerRow}>
          <CountdownTimer timeLeft={timeLeft} timeLimit={timeLimit} size={56} />
        </View>

        <View style={s.questionCard}>
          <Text style={s.questionText}>{question.content}</Text>
        </View>

        <View style={s.answers}>
          {/* eslint-disable-next-line react/no-array-index-key */}
          {question.options.map((opt, idx) => {
            const isSelected = selected === idx
            const isCorrect = correctIndex === idx
            const isWrong = correctIndex !== null && isSelected && !isCorrect
            const tint = ANSWER_TINTS[idx]

            return (
              <Pressable
                key={idx}
                onPress={() => handleAnswer(idx)}
                disabled={selected !== null}
                style={[
                  s.answerBtn,
                  { borderColor: tint },
                  isCorrect && s.answerCorrect,
                  isWrong && s.answerWrong,
                  isSelected && correctIndex === null && { backgroundColor: `${tint}22` },
                ]}
              >
                <View style={[s.letterBadge, { backgroundColor: tint }]}>
                  <Text style={s.letterText}>{LETTERS[idx]}</Text>
                </View>
                <Text style={s.answerText}>{opt}</Text>
              </Pressable>
            )
          })}
        </View>

        <ReactionBar
          onSend={(r: ReactionEmoji) => send(`/app/room/${roomId}/reaction`, { reaction: r })}
          incoming={reactions}
          onClear={(id) => setReactions(prev => prev.filter(r => r.id !== id))}
        />

        <Pressable style={s.chatFab} onPress={() => setChatOpen(true)}>
          <Text style={s.chatFabIcon}>💬</Text>
        </Pressable>

        <ChatOverlay
          visible={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={chatMessages}
          onSend={(text) => send(`/app/room/${roomId}/chat`, { text })}
        />

        <EliminationOverlay
          visible={!!eliminated}
          rank={eliminated?.rank ?? 0}
          totalPlayers={eliminated?.total ?? 0}
          onContinueSpectate={() => setEliminated(null)}
        />

        <MatchResultOverlay
          visible={!!matchResult}
          winnerName={matchResult?.winnerName ?? ''}
          loserName={matchResult?.loserName ?? ''}
          iWon={matchResult?.iWon ?? false}
          onDismiss={() => setMatchResult(null)}
        />
      </View>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waiting: { fontSize: typography.size.base, color: colors.textMuted },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionMeta: { fontSize: typography.size.sm, color: colors.textMuted, fontWeight: typography.weight.bold },
  comboBadge: { backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  comboText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold },
  timerRow: { alignItems: 'center' },
  questionCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
  },
  answers: { gap: spacing.md },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
  },
  answerCorrect: { backgroundColor: 'rgba(34, 197, 94, 0.18)', borderColor: colors.success },
  answerWrong: { backgroundColor: 'rgba(239, 68, 68, 0.18)', borderColor: colors.error },
  letterBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  letterText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  answerText: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.textPrimary, flex: 1 },
  chatFab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatFabIcon: { fontSize: 22 },
})
