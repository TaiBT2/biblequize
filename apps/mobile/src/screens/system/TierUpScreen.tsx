import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { colors, typography, spacing } from '../../theme'

export default function TierUpScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()

  return (
    <View style={s.container}>
      <View style={s.glow} />
      <Text style={s.emoji}>🏆</Text>
      <Text style={s.title}>Chúc mừng!</Text>
      <Text style={s.subtitle}>Bạn đã thăng hạng!</Text>
      <View style={s.rewards}>
        <Text style={s.reward}>🎁 XP nhân đôi</Text>
        <Text style={s.reward}>⚡ Thêm năng lượng/giờ</Text>
        <Text style={s.reward}>🔓 Mở khóa chế độ mới</Text>
      </View>
      <Pressable onPress={() => navigation.goBack()} style={s.btn}>
        <Text style={s.btnText}>Tiếp tục hành trình</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  glow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(248,189,69,0.1)' },
  emoji: { fontSize: 72, marginBottom: spacing.lg },
  title: { fontSize: typography.size['3xl'], fontWeight: typography.weight.bold, color: colors.gold },
  subtitle: { fontSize: typography.size.xl, color: colors.textPrimary, marginTop: spacing.sm },
  rewards: { marginTop: spacing['2xl'], gap: spacing.md },
  reward: { fontSize: typography.size.base, color: colors.success, fontWeight: typography.weight.medium },
  btn: { marginTop: spacing['3xl'], backgroundColor: colors.gold, borderRadius: 12, paddingHorizontal: spacing['2xl'], paddingVertical: spacing.lg },
  btnText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.onSecondary },
})
