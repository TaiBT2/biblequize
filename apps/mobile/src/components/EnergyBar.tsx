import { View, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'

interface EnergyBarProps {
  lives: number
  maxLives?: number
  barWidth?: number
  barHeight?: number
}

export const EnergyBar = ({
  lives,
  maxLives = 5,
  barWidth = 6,
  barHeight = 20,
}: EnergyBarProps) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxLives }, (_, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              width: barWidth,
              height: barHeight,
              backgroundColor:
                i < lives ? colors.gold : colors.bg.surfaceContainerHighest,
            },
            i < lives && styles.filledBar,
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  bar: {
    borderRadius: 2,
  },
  filledBar: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
})
