import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import ProgressBar from '../ui/ProgressBar'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  energyRemaining: number
  energyMax: number
  rankedAnswered: number
  rankedCap: number
  onEnter: () => void
  /** Khi locked + onLockedPress → tap navigates đến screen unlock (catechism).
   *  Nếu omit khi locked → card disabled như cũ. */
  onLockedPress?: () => void
  lockedHint?: string
  locked?: boolean
}

/**
 * State A ranked compact card (port từ web HR-5).
 * Khi locked: subtitle hiển thị lockedHint + tap → onLockedPress (thường
 * navigate đến BasicQuizScreen để pass catechism).
 */
export default function RankedStandardCard({
  energyRemaining, energyMax, rankedAnswered, rankedCap,
  onEnter, onLockedPress, lockedHint, locked,
}: Props) {
  const tapHandler = locked ? onLockedPress : onEnter
  const isTappable = !!tapHandler

  return (
    <Pressable
      onPress={tapHandler}
      disabled={!isTappable}
      style={[s.card, locked && !onLockedPress && s.locked]}
      accessibilityLabel={locked ? 'Đấu Hạng — chưa mở khoá' : 'Vào Đấu Hạng'}
      accessibilityRole="button"
    >
      <View style={s.header}>
        <Text style={s.icon}>⚡</Text>
        <Text style={s.title}>Đấu Hạng</Text>
        {locked && <Text style={s.lockBadge}>🔒</Text>}
      </View>

      <Text style={s.subtitle} numberOfLines={2}>
        {locked && lockedHint ? lockedHint : 'Tranh tài xếp hạng'}
      </Text>

      {!locked && (
        <>
          <View style={s.metaRow}>
            <Text style={s.metaItem}>⚡ {energyRemaining}/{energyMax}</Text>
            <Text style={s.metaItem}>📊 {rankedAnswered}/{rankedCap}</Text>
          </View>
          <ProgressBar progress={energyMax > 0 ? (energyRemaining / energyMax) * 100 : 0} height={4} />
        </>
      )}
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(232,168,50,0.3)',
    gap: spacing.xs,
  },
  locked: { opacity: 0.5 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  icon: { fontSize: 18 },
  title: { flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.gold },
  lockBadge: { fontSize: 14 },
  subtitle: { fontSize: typography.size.xs, color: colors.textMuted },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  metaItem: { fontSize: 11, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
})
