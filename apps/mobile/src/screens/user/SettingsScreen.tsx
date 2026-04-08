import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { colors, typography, spacing, borderRadius } from '../../theme'

export default function SettingsScreen() {
  const navigation = useNavigation<any>()
  const { logout } = useAuthStore()
  const { soundEnabled, setSoundEnabled, hapticsEnabled, setHapticsEnabled } = useSettingsStore()
  const { preferredLanguage, setPreferredLanguage } = useOnboardingStore()

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Cài đặt</Text>

        <Text style={s.section}>Âm thanh & Rung</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Âm thanh</Text>
          <Switch value={soundEnabled} onValueChange={setSoundEnabled} trackColor={{ true: colors.gold }} />
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Rung phản hồi</Text>
          <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} trackColor={{ true: colors.gold }} />
        </View>

        <Text style={s.section}>Ngôn ngữ</Text>
        <View style={s.langRow}>
          {['vi', 'en'].map(lang => (
            <Pressable key={lang} onPress={() => setPreferredLanguage(lang)}
              style={[s.langBtn, preferredLanguage === lang && s.langBtnActive]}>
              <Text style={[s.langText, preferredLanguage === lang && s.langTextActive]}>
                {lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.section}>Tài khoản</Text>
        <Pressable onPress={handleLogout} style={s.row}>
          <Text style={[s.rowLabel, { color: colors.error }]}>Đăng xuất</Text>
        </Pressable>

        <Text style={s.section}>Thông tin</Text>
        <Pressable style={s.row}><Text style={s.rowLabel}>Chính sách bảo mật</Text></Pressable>
        <Pressable style={s.row}><Text style={s.rowLabel}>Điều khoản sử dụng</Text></Pressable>
        <Text style={s.version}>BibleQuiz v2.0.0</Text>
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing['4xl'] },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: spacing.lg },
  section: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.xl, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, padding: spacing.lg },
  rowLabel: { fontSize: typography.size.base, color: colors.textPrimary },
  langRow: { flexDirection: 'row', gap: spacing.md },
  langBtn: { flex: 1, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  langBtnActive: { borderColor: colors.gold, backgroundColor: 'rgba(248,189,69,0.08)' },
  langText: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  langTextActive: { color: colors.gold },
  version: { textAlign: 'center', fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing['2xl'] },
})
