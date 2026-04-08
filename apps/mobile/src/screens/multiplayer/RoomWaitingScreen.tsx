import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRoute } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { colors, typography, spacing } from '../../theme'

export default function RoomWaitingScreen() {
  const { t } = useTranslation()
  const route = useRoute<any>()
  const isHost = route.params?.isHost ?? false

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Phòng Chờ</Text>
        <Text style={s.subtitle}>{isHost ? 'Bạn là chủ phòng' : 'Đang chờ chủ phòng bắt đầu...'}</Text>

        <Card style={s.infoCard}>
          <Text style={s.infoLabel}>Mã phòng</Text>
          <Text style={s.roomCode}>{route.params?.roomId ?? '------'}</Text>
        </Card>

        <Text style={s.section}>Người chơi (0/8)</Text>
        <View style={s.playersList}>
          <Card style={s.playerRow}>
            <Avatar name="Bạn" size={40} borderColor={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={s.playerName}>Bạn</Text>
              <Text style={s.playerRole}>{isHost ? '👑 Chủ phòng' : 'Người chơi'}</Text>
            </View>
            <Text style={s.readyBadge}>Sẵn sàng</Text>
          </Card>
        </View>

        {isHost && <Button title="Bắt đầu" onPress={() => {}} fullWidth />}
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted },
  infoCard: { alignItems: 'center', paddingVertical: spacing.xl },
  infoLabel: { fontSize: typography.size.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  roomCode: { fontSize: typography.size['3xl'], fontWeight: typography.weight.black, color: colors.gold, letterSpacing: 4, marginTop: spacing.sm },
  section: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  playersList: { gap: spacing.sm },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playerName: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  playerRole: { fontSize: typography.size.xs, color: colors.textMuted },
  readyBadge: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.success },
})
