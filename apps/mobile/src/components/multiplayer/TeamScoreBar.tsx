import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  scoreA: number
  scoreB: number
  /** Team A all-correct this round → show "Perfect!" badge above bar. */
  perfectA?: boolean
  perfectB?: boolean
  labelA?: string
  labelB?: string
}

const TEAM_A_COLOR = '#4a9eff' // Blue
const TEAM_B_COLOR = '#ef4444' // Red

/**
 * TEAM_VS_TEAM horizontal score bar — Team A (blue) vs Team B (red)
 * proportional fill. "Perfect!" badges when team gets all-correct round.
 */
export default function TeamScoreBar({ scoreA, scoreB, perfectA, perfectB, labelA = 'Đội A', labelB = 'Đội B' }: Props) {
  const total = scoreA + scoreB
  // Default 50/50 split khi total = 0 (start of game).
  const ratioA = total > 0 ? scoreA / total : 0.5
  const pctA = Math.round(ratioA * 100)

  return (
    <View style={s.container}>
      <View style={s.labelsRow}>
        <View style={s.labelGroup}>
          <Text style={[s.teamLabel, { color: TEAM_A_COLOR }]}>{labelA}</Text>
          {perfectA && <Text style={s.perfect}>★ Perfect!</Text>}
        </View>
        <View style={s.labelGroup}>
          {perfectB && <Text style={s.perfect}>★ Perfect!</Text>}
          <Text style={[s.teamLabel, { color: TEAM_B_COLOR }]}>{labelB}</Text>
        </View>
      </View>

      <View style={s.bar}>
        <View style={[s.fillA, { flex: ratioA, backgroundColor: TEAM_A_COLOR }]} />
        <View style={[s.fillB, { flex: 1 - ratioA, backgroundColor: TEAM_B_COLOR }]} />
        <Text style={s.midScore}>{scoreA} : {scoreB}</Text>
      </View>

      <Text style={s.pctHint}>{pctA}% — {100 - pctA}%</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { gap: spacing.xs },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  teamLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  perfect: { fontSize: typography.size.xs, color: colors.gold, fontWeight: typography.weight.bold },
  bar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
    position: 'relative',
    alignItems: 'center',
  },
  fillA: { height: '100%' },
  fillB: { height: '100%' },
  midScore: {
    position: 'absolute',
    alignSelf: 'center',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pctHint: { fontSize: typography.size.xs, color: colors.textMuted, textAlign: 'center' },
})
