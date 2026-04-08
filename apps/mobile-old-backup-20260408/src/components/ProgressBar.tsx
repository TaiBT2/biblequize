import { View, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { borderRadius } from '../theme/spacing'

interface ProgressBarProps {
  progress: number // 0-1
  height?: number
  color?: string
}

export const ProgressBar = ({
  progress,
  height = 6,
  color = colors.gold,
}: ProgressBarProps) => {
  const clampedProgress = Math.max(0, Math.min(1, progress))

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            height,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.bg.surfaceContainerHighest,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
})
