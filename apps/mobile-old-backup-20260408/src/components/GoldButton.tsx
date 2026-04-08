import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import * as Haptics from 'expo-haptics'
import { colors } from '../theme/colors'
import { borderRadius } from '../theme/spacing'

interface GoldButtonProps {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline'
}

export const GoldButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: GoldButtonProps) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  const isPrimary = variant === 'primary'

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.outline,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.bg.primary : colors.gold} />
      ) : (
        <Text style={[styles.text, !isPrimary && styles.outlineText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // Touch target 48dp
  },
  primary: {
    backgroundColor: colors.gold,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bg.primary,
  },
  outlineText: {
    color: colors.gold,
  },
})
