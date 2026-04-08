import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { colors } from '../theme/colors'

interface CircularTimerProps {
  timeLeft: number
  totalTime?: number
  size?: number
}

export const CircularTimer = ({
  timeLeft,
  totalTime = 30,
  size = 72,
}: CircularTimerProps) => {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = timeLeft / totalTime
  const strokeDashoffset = circumference * (1 - progress)
  const isCritical = timeLeft <= 5

  const strokeColor = isCritical ? '#ef4444' : colors.gold

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.bg.surfaceContainerHighest}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={[styles.text, isCritical && styles.critical]}>
        {timeLeft}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  text: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  critical: {
    color: '#ef4444',
  },
})
