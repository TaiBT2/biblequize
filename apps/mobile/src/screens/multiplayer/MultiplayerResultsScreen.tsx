import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { colors, typography, spacing } from '../../theme'

export default function MultiplayerResultsScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Kết quả</Text>

        {/* Podium */}
        <View style={s.podium}>
          <View style={s.podiumSlot}>
            <Text style={s.podiumRank}>🥈</Text>
            <Avatar name="Player 2" size={48} />
            <Text style={s.podiumName}>Player 2</Text>
            <Text style={s.podiumScore}>420</Text>
          </View>
          <View style={[s.podiumSlot, s.podiumFirst]}>
            <Text style={s.podiumRank}>🥇</Text>
            <Avatar name="Player 1" size={56} borderColor={colors.gold} />
            <Text style={[s.podiumName, { color: colors.gold }]}>Player 1</Text>
            <Text style={[s.podiumScore, { color: colors.gold }]}>520</Text>
          </View>
          <View style={s.podiumSlot}>
            <Text style={s.podiumRank}>🥉</Text>
            <Avatar name="Player 3" size={48} />
            <Text style={s.podiumName}>Player 3</Text>
            <Text style={s.podiumScore}>380</Text>
          </View>
        </View>

        <Button title="Về trang chủ" onPress={() => navigation.popToTop()} fullWidth />
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center' },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: spacing.md, paddingTop: spacing.xl },
  podiumSlot: { alignItems: 'center', gap: spacing.sm },
  podiumFirst: { marginBottom: spacing.xl },
  podiumRank: { fontSize: 24 },
  podiumName: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary },
  podiumScore: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textSecondary },
})
