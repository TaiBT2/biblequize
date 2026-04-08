import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { colors, typography, spacing, borderRadius } from '../../theme'

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
]

export default function LanguageSelectionScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const { preferredLanguage, setPreferredLanguage } = useOnboardingStore()
  const [selected, setSelected] = useState(preferredLanguage)

  const handleContinue = () => {
    setPreferredLanguage(selected)
    navigation.navigate('WelcomeSlides')
  }

  return (
    <SafeScreen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcome}>Chào mừng / Welcome</Text>
          <Text style={styles.subtitle}>Chọn ngôn ngữ để bắt đầu</Text>
        </View>

        <View style={styles.cards}>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => setSelected(lang.code)}
              style={[styles.card, selected === lang.code && styles.cardSelected]}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[styles.langName, selected === lang.code && styles.langNameSelected]}>
                {lang.name}
              </Text>
              <View style={[styles.radio, selected === lang.code && styles.radioSelected]}>
                {selected === lang.code && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Button title="Tiếp tục" onPress={handleContinue} fullWidth />
        </View>
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  header: { alignItems: 'center', paddingTop: spacing['3xl'] },
  welcome: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.gold, textAlign: 'center' },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  cards: { gap: spacing.lg },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.xl,
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl,
    borderWidth: 2, borderColor: 'transparent',
  },
  cardSelected: { borderColor: colors.gold, backgroundColor: 'rgba(248, 189, 69, 0.08)' },
  flag: { fontSize: 32, marginRight: spacing.lg },
  langName: { flex: 1, fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  langNameSelected: { color: colors.gold },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.gold },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.gold },
  footer: { paddingBottom: spacing.lg },
})
