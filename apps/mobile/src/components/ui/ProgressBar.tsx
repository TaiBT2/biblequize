import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, borderRadius } from '../../theme'

interface ProgressBarProps {
  progress: number // 0-100
  height?: number
  color?: string
  trackColor?: string
}

export default function ProgressBar({
  progress, height = 6, color = colors.gold, trackColor = colors.surfaceContainerHigh,
}: ProgressBarProps) {
  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }]}>
      <View
        style={[
          styles.fill,
          { width: `${Math.min(100, Math.max(0, progress))}%`, height, backgroundColor: color },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: { borderRadius: borderRadius.full, overflow: 'hidden', width: '100%' },
  fill: { borderRadius: borderRadius.full },
})
