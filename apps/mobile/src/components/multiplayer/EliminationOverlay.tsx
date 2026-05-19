import React from 'react'
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  visible: boolean
  rank: number
  totalPlayers: number
  onContinueSpectate: () => void
}

/**
 * BATTLE_ROYALE elimination modal — shown khi user bị eliminate.
 * Mirror web `EliminationScreen` UX: skull icon, error-red theme,
 * rank #N / total, CTA "Xem tiếp (Spectator)" để continue watching.
 */
export default function EliminationOverlay({ visible, rank, totalPlayers, onContinueSpectate }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={s.backdrop}>
        <View style={s.card}>
          <Text style={s.icon}>💀</Text>
          <Text style={s.title}>Bạn đã bị loại</Text>
          <Text style={s.rank}>Hạng #{rank} / {totalPlayers}</Text>
          <Pressable onPress={onContinueSpectate} style={s.btn}>
            <Text style={s.btnText}>Xem tiếp (Khán giả)</Text>
          </Pressable>
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
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.error,
    minWidth: '70%',
  },
  icon: { fontSize: 64 },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.error },
  rank: { fontSize: typography.size.lg, color: colors.textPrimary, marginBottom: spacing.md },
  btn: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  btnText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
})
