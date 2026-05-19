import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { typography } from '../../theme'

interface Props {
  /** Seconds remaining (counts down from `timeLimit`). */
  timeLeft: number
  /** Original time limit in seconds (used để compute arc fill ratio). */
  timeLimit: number
  /** Outer diameter in px. Stroke + radius scale proportionally. Default 64. */
  size?: number
}

/**
 * Circular countdown ring with 4 colour bands (QZ-P0-3 mobile parity).
 * Extracted from QuizScreen for reuse in MultiplayerQuizScreen + other game modes.
 *
 * Pulse animations from web intentionally omitted — shrinking arc + colour shift
 * are sufficient on a small mobile screen; animations would need separate Animated loop.
 */
function colorForSeconds(s: number): string {
  if (s > 10) return '#e8a832' // gold
  if (s > 5) return '#eab308'  // yellow
  if (s > 3) return '#ff8c42'  // orange
  return '#ef4444'             // red — critical
}

export default function CountdownTimer({ timeLeft, timeLimit, size = 64 }: Props) {
  const stroke = Math.max(2, Math.round(size / 16))
  const radius = size / 2 - stroke - 1
  const circumference = 2 * Math.PI * radius
  const ratio = timeLimit > 0 ? Math.max(0, Math.min(1, timeLeft / timeLimit)) : 1
  const offset = circumference * (1 - ratio)
  const colour = colorForSeconds(timeLeft)

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colour}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <Text style={[styles.number, { color: colour, fontSize: size * 0.32 }]}>
        {timeLeft}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  number: { position: 'absolute', fontWeight: typography.weight.medium },
})
