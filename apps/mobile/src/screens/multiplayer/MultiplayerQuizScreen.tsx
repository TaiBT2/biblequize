import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import SafeScreen from '../../components/layout/SafeScreen'
import { colors, typography, spacing } from '../../theme'

export default function MultiplayerQuizScreen() {
  return (
    <SafeScreen>
      <View style={s.container}>
        <Text style={s.icon}>⚔️</Text>
        <Text style={s.title}>Multiplayer Quiz</Text>
        <Text style={s.subtitle}>Tính năng quiz multiplayer realtime sẽ được tích hợp với WebSocket STOMP</Text>
      </View>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  icon: { fontSize: 64, marginBottom: spacing.lg },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
})
