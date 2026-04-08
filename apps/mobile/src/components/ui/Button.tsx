import React from 'react'
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

export default function Button({
  title, onPress, variant = 'primary', size = 'md',
  disabled, loading, icon, fullWidth,
}: ButtonProps) {
  const sizeStyle = SIZE[size]
  const variantStyle = VARIANT[variant]

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        variantStyle.container,
        pressed && styles.pressed,
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.textColor} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.text, { color: variantStyle.textColor, fontSize: sizeStyle.fontSize }]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const SIZE = {
  sm: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, fontSize: typography.size.sm },
  md: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, fontSize: typography.size.base },
  lg: { paddingHorizontal: spacing['2xl'], paddingVertical: spacing.lg, fontSize: typography.size.lg },
} as const

const VARIANT = {
  primary: {
    container: { backgroundColor: colors.gold },
    textColor: colors.onSecondary,
  },
  secondary: {
    container: { backgroundColor: colors.surfaceContainerHighest },
    textColor: colors.textPrimary,
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.gold },
    textColor: colors.gold,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    textColor: colors.gold,
  },
} as const

const styles = StyleSheet.create({
  base: { borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5 },
  fullWidth: { width: '100%' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: { marginRight: spacing.xs },
  text: { fontWeight: typography.weight.bold },
})
