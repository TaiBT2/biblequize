import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  title: string
  meta?: string
}

/**
 * Gold accent bar + title + optional right meta (port từ web SectionHeader).
 */
export default function SectionHeader({ title, meta }: Props) {
  return (
    <View style={s.row}>
      <View style={s.bar} />
      <Text style={s.title}>{title}</Text>
      {meta && <Text style={s.meta}>{meta}</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm },
  bar: { width: 4, height: 18, backgroundColor: colors.gold, borderRadius: 2 },
  title: { flex: 1, fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  meta: { fontSize: typography.size.xs, color: colors.textMuted },
})
