import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, typography, spacing } from '../../theme'
import Button from '../ui/Button'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionTitle?: string
  onAction?: () => void
}

export default function EmptyState({ icon = '📭', title, description, actionTitle, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionTitle && onAction && (
        <View style={styles.actionWrap}>
          <Button title={actionTitle} onPress={onAction} variant="outline" size="sm" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing['2xl'] },
  icon: { fontSize: 48, marginBottom: spacing.lg },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center' },
  description: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  actionWrap: { marginTop: spacing.xl },
})
