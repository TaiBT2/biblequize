import { useState } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'
import { GoldButton } from '../../components/GoldButton'

const MODE_LABELS: Record<string, string> = {
  SPEED_RACE: 'Speed Race',
  BATTLE_ROYALE: 'Battle Royale',
  TEAM_VS_TEAM: 'Team vs Team',
  SUDDEN_DEATH: 'Sudden Death',
}

export const MultiplayerScreen = () => {
  const navigation = useNavigation<any>()
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  const roomsQuery = useQuery({
    queryKey: ['public-rooms'],
    queryFn: () => api.get('/api/rooms/public').then((r) => r.data),
    staleTime: 10 * 1000,
  })

  const rooms = roomsQuery.data?.content ?? roomsQuery.data ?? []

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return
    setJoining(true)
    try {
      const res = await api.post('/api/rooms/join', { code: joinCode.trim().toUpperCase() })
      const roomId = res.data?.id ?? res.data?.roomId
      navigation.navigate('RoomLobby', { roomId, roomCode: joinCode.trim() })
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message ?? 'Mã phòng không hợp lệ')
    } finally {
      setJoining(false)
    }
  }

  const handleJoinRoom = async (room: any) => {
    try {
      await api.post('/api/rooms/join', { code: room.code })
      navigation.navigate('RoomLobby', { roomId: room.id, roomCode: room.code })
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message ?? 'Không vào được phòng')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Phòng Chơi</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateRoom')}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.bg.primary} />
          <Text style={styles.createText}>Tạo phòng</Text>
        </TouchableOpacity>
      </View>

      {/* Join by code */}
      <View style={styles.joinRow}>
        <TextInput
          style={styles.joinInput}
          placeholder="Nhập mã phòng"
          placeholderTextColor={colors.text.muted}
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="characters"
          maxLength={8}
        />
        <GoldButton title="Vào" onPress={handleJoinByCode} loading={joining} />
      </View>

      {/* Room list */}
      <Text style={styles.sectionLabel}>Phòng đang mở ({rooms.length})</Text>
      <FlatList
        data={rooms}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={roomsQuery.isFetching}
            onRefresh={() => roomsQuery.refetch()}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có phòng nào đang mở</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleJoinRoom(item)} activeOpacity={0.7}>
            <GlassCard style={styles.roomCard}>
              <View style={styles.roomHeader}>
                <Text style={styles.roomHost}>{item.hostName ?? 'Host'}</Text>
                <Text style={styles.roomCode}>{item.code}</Text>
              </View>
              <View style={styles.roomMeta}>
                <Text style={styles.roomMode}>
                  {MODE_LABELS[item.gameMode] ?? item.gameMode}
                </Text>
                <Text style={styles.roomPlayers}>
                  {item.currentPlayers}/{item.maxPlayers} người
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text.primary },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.gold, borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  createText: { fontSize: 14, fontWeight: '600', color: colors.bg.primary },

  joinRow: {
    flexDirection: 'row', gap: spacing.md,
    paddingHorizontal: spacing.xl, marginBottom: spacing.xl,
  },
  joinInput: {
    flex: 1, backgroundColor: colors.bg.surfaceContainer, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.outlineVariant,
    color: colors.text.primary, fontSize: 16, paddingHorizontal: spacing.lg,
    letterSpacing: 2, textAlign: 'center',
  },

  sectionLabel: {
    fontSize: 14, fontWeight: '600', color: colors.text.secondary,
    paddingHorizontal: spacing.xl, marginBottom: spacing.md,
  },

  list: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing['4xl'] },
  emptyText: { color: colors.text.muted, textAlign: 'center', marginTop: spacing['3xl'] },

  roomCard: { marginBottom: 0 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  roomHost: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  roomCode: { fontSize: 13, fontWeight: '700', color: colors.gold, letterSpacing: 1 },
  roomMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  roomMode: { fontSize: 13, color: colors.gameMode.multiplayer },
  roomPlayers: { fontSize: 13, color: colors.text.secondary },
})
