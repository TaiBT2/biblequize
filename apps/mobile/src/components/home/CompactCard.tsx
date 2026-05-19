import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  icon: string
  themeColor?: string
  title: string
  subtitle?: string
  onPress: () => void
  locked?: boolean
  matchmakingHint?: string
}

/**
 * Reusable game mode card (port từ web CompactCard).
 * Dùng trong 2-col/3-col grids cho Practice / Variety / Community modes.
 */
export default function CompactCard({
  icon, themeColor = colors.gold, title, subtitle, onPress, locked, matchmakingHint,
}: Props) {
  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      disabled={locked}
      accessibilityLabel={`${title}${locked ? ' — chưa mở khoá' : ''}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      style={({ pressed }) => [s.card, locked && s.locked, pressed && !locked && s.pressed]}
    >
      <View style={[s.iconBox, { backgroundColor: `${themeColor}22`, borderColor: themeColor }]}>
        <Text style={s.icon}>{icon}</Text>
      </View>
      <Text style={[s.title, { color: themeColor }]} numberOfLines={1}>{title}</Text>
      {subtitle && <Text style={s.subtitle} numberOfLines={2}>{subtitle}</Text>}
      {matchmakingHint && <Text style={s.hint}>{matchmakingHint}</Text>}
      {locked && <Text style={s.lockChip}>🔒 Chưa mở</Text>}
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 110,
  },
  locked: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  icon: { fontSize: 18 },
  title: { fontSize: typography.size.base, fontWeight: typography.weight.bold, marginTop: spacing.xs },
  subtitle: { fontSize: typography.size.xs, color: colors.textMuted },
  hint: { fontSize: 10, color: colors.gold, fontStyle: 'italic', marginTop: 2 },
  lockChip: { fontSize: 10, color: colors.textMuted, marginTop: 2, fontWeight: typography.weight.bold },
})
