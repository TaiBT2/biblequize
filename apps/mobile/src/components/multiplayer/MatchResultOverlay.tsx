import React, { useEffect } from 'react'
import { Modal, View, Text, StyleSheet } from 'react-native'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  visible: boolean
  winnerName: string
  loserName: string
  iWon: boolean
  onDismiss: () => void
  /** Auto-dismiss timeout in ms (default 3000). Set 0 to disable auto-dismiss. */
  autoDismissMs?: number
}

/**
 * SUDDEN_DEATH match result modal — auto-dismiss 3s.
 * Mirror web `MatchResultOverlay`: gold celebration cho winner, red defeat cho loser.
 */
export default function MatchResultOverlay({ visible, winnerName, loserName, iWon, onDismiss, autoDismissMs = 3000 }: Props) {
  useEffect(() => {
    if (!visible || autoDismissMs <= 0) return
    const t = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(t)
  }, [visible, autoDismissMs, onDismiss])

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={s.backdrop}>
        <View style={[s.card, iWon ? s.cardWin : s.cardLose]}>
          <Text style={s.icon}>{iWon ? '🏆' : '💔'}</Text>
          <Text style={[s.title, iWon && s.titleWin]}>{iWon ? 'Chiến thắng!' : 'Thua trận'}</Text>
          <View style={s.row}>
            <Text style={s.label}>Người thắng:</Text>
            <Text style={[s.name, iWon && s.titleWin]}>{winnerName}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Người thua:</Text>
            <Text style={s.name}>{loserName}</Text>
          </View>
          <Text style={s.hint}>Trận kế tiếp sẽ bắt đầu...</Text>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    minWidth: '70%',
  },
  cardWin: { borderColor: colors.gold },
  cardLose: { borderColor: colors.error },
  icon: { fontSize: 56, marginBottom: spacing.sm },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.error },
  titleWin: { color: colors.gold },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  label: { fontSize: typography.size.sm, color: colors.textMuted },
  name: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  hint: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing.md, fontStyle: 'italic' },
})
