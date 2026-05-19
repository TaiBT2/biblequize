import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import { colors, typography, spacing, borderRadius } from '../../theme'

type FaqCategory = 'gettingStarted' | 'tiers' | 'modes' | 'gameplay' | 'account'

interface FaqItem {
  id: string
  category: FaqCategory
}

const FAQ_CATEGORIES: FaqCategory[] = ['gettingStarted', 'tiers', 'modes', 'gameplay', 'account']

const FAQ_ITEMS: FaqItem[] = [
  { id: 'howToPlay', category: 'gettingStarted' },
  { id: 'bibleTranslation', category: 'gettingStarted' },
  { id: 'changeLanguage', category: 'gettingStarted' },
  { id: 'tierSystem', category: 'tiers' },
  { id: 'streakVsXp', category: 'tiers' },
  { id: 'howUnlockRanked', category: 'tiers' },
  { id: 'howEarnXp', category: 'tiers' },
  { id: 'practiceVsRanked', category: 'modes' },
  { id: 'dailyStreak', category: 'modes' },
  { id: 'groupsTournament', category: 'modes' },
  { id: 'energySystem', category: 'gameplay' },
  { id: 'lifelines', category: 'gameplay' },
  { id: 'dataPrivacy', category: 'account' },
  { id: 'deleteAccount', category: 'account' },
]

const CATEGORY_ICON: Record<FaqCategory, string> = {
  gettingStarted: '🚀',
  tiers: '🏆',
  modes: '🎮',
  gameplay: '⚡',
  account: '👤',
}

export default function HelpScreen() {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>❓ Trợ giúp</Text>
        <Text style={s.subtitle}>Câu hỏi thường gặp</Text>

        {FAQ_CATEGORIES.map(cat => {
          const items = FAQ_ITEMS.filter(i => i.category === cat)
          if (items.length === 0) return null
          return (
            <View key={cat}>
              <Text style={s.categoryLabel}>{CATEGORY_ICON[cat]} {t(`help.categories.${cat}`, { defaultValue: cat })}</Text>
              {items.map(item => {
                const isOpen = expanded.has(item.id)
                return (
                  <Card key={item.id} style={s.faqCard}>
                    <Pressable
                      onPress={() => toggle(item.id)}
                      style={s.faqHeader}
                      accessibilityLabel={t(`help.items.${item.id}.q`, { defaultValue: item.id })}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: isOpen }}
                    >
                      <Text style={s.faqQuestion}>{t(`help.items.${item.id}.q`, { defaultValue: item.id })}</Text>
                      <Text style={s.chevron}>{isOpen ? '▼' : '▶'}</Text>
                    </Pressable>
                    {isOpen && (
                      <Text style={s.faqAnswer}>
                        {t(`help.items.${item.id}.a`, { defaultValue: 'Nội dung đang được cập nhật.' })}
                      </Text>
                    )}
                  </Card>
                )
              })}
            </View>
          )
        })}

        <Text style={s.footer}>Cần hỗ trợ thêm? Liên hệ support@forbible.org</Text>
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing['2xl'] },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted },
  categoryLabel: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.gold, marginBottom: spacing.sm, marginTop: spacing.md },
  faqCard: { marginBottom: spacing.sm, padding: 0 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, minHeight: 44 },
  faqQuestion: { flex: 1, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textPrimary, paddingRight: spacing.sm },
  chevron: { fontSize: typography.size.xs, color: colors.textMuted },
  faqAnswer: { fontSize: typography.size.sm, color: colors.textSecondary, paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: 0, lineHeight: 20 },
  footer: { fontSize: typography.size.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontStyle: 'italic' },
})
