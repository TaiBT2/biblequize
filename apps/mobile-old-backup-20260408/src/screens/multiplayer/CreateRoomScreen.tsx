import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { GoldButton } from '../../components/GoldButton'

const GAME_MODES = [
  { id: 'SPEED_RACE', label: 'Speed Race', icon: 'speedometer' as const, desc: 'Ai nhanh nhất thắng' },
  { id: 'BATTLE_ROYALE', label: 'Battle Royale', icon: 'sword-cross' as const, desc: 'Sai là loại' },
  { id: 'TEAM_VS_TEAM', label: 'Team vs Team', icon: 'account-group' as const, desc: '2 đội thi đấu' },
  { id: 'SUDDEN_DEATH', label: 'Sudden Death', icon: 'skull' as const, desc: '1v1 liên tiếp' },
]

export const CreateRoomScreen = () => {
  const navigation = useNavigation<any>()
  const [gameMode, setGameMode] = useState('SPEED_RACE')
  const [isPublic, setIsPublic] = useState(true)
  const [maxPlayers, setMaxPlayers] = useState(10)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await api.post('/api/rooms', { gameMode, isPublic, maxPlayers })
      const room = res.data
      navigation.replace('RoomLobby', { roomId: room.id, roomCode: room.code })
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message ?? 'Không tạo được phòng')
    } finally {
      setCreating(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Tạo Phòng</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Game mode */}
        <Text style={styles.sectionLabel}>Chế độ</Text>
        {GAME_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[styles.modeCard, gameMode === mode.id && styles.modeCardActive]}
            onPress={() => setGameMode(mode.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={mode.icon}
              size={24}
              color={gameMode === mode.id ? colors.gold : colors.text.muted}
            />
            <View style={styles.modeInfo}>
              <Text style={[styles.modeLabel, gameMode === mode.id && styles.modeLabelActive]}>
                {mode.label}
              </Text>
              <Text style={styles.modeDesc}>{mode.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Max players */}
        <Text style={styles.sectionLabel}>Số người tối đa</Text>
        <View style={styles.playerRow}>
          {[4, 8, 10, 16, 20].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, maxPlayers === n && styles.chipActive]}
              onPress={() => setMaxPlayers(n)}
            >
              <Text style={[styles.chipText, maxPlayers === n && styles.chipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Public */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Phòng công khai</Text>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ true: colors.gold, false: colors.bg.surfaceContainerHighest }}
            thumbColor="#fff"
          />
        </View>

        <GoldButton title="Tạo Phòng" onPress={handleCreate} loading={creating} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { padding: spacing.xl, paddingBottom: spacing['4xl'] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text.primary },

  sectionLabel: {
    fontSize: 14, fontWeight: '600', color: colors.text.primary,
    marginBottom: spacing.md, marginTop: spacing.xl,
  },

  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    backgroundColor: colors.bg.card, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing.lg, marginBottom: spacing.sm,
  },
  modeCardActive: { borderColor: colors.gold, backgroundColor: colors.goldLight },
  modeInfo: { flex: 1 },
  modeLabel: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  modeLabelActive: { color: colors.gold },
  modeDesc: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },

  playerRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.outlineVariant,
  },
  chipActive: { backgroundColor: colors.goldLight, borderColor: colors.gold },
  chipText: { fontSize: 14, color: colors.text.muted, fontWeight: '500' },
  chipTextActive: { color: colors.gold },

  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginVertical: spacing['2xl'],
  },
  switchLabel: { fontSize: 15, color: colors.text.primary },
})
