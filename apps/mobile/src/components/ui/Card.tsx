import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors, spacing, borderRadius } from '../../theme'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'default' | 'elevated' | 'glass'
}

export default function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.base, VARIANTS[variant], style]}>
      {children}
    </View>
  )
}

const VARIANTS = {
  default: { backgroundColor: colors.surfaceContainer },
  elevated: { backgroundColor: colors.surfaceContainerHigh },
  glass: { backgroundColor: 'rgba(50, 52, 64, 0.6)' },
} as const

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
})
