import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { colors, typography, spacing } from '../../theme'

export default function OfflineBanner() {
  const { t } = useTranslation()
  const { isOnline } = useOnlineStatus()
  const insets = useSafeAreaInsets()

  if (isOnline) return null

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.text}>⚠️ {t('errors.offline')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: colors.warning, paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg, zIndex: 1000,
  },
  text: { color: '#000', fontSize: typography.size.sm, fontWeight: typography.weight.semibold, textAlign: 'center' },
})
