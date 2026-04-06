import { useState, useEffect, useRef } from 'react'
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { type Client } from '@stomp/stompjs'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'
import { GoldButton } from '../../components/GoldButton'
import { Avatar } from '../../components/Avatar'
import { createStompClient, sendRoomMessage, type RoomEvent } from '../../api/websocket'
import type { QuizStackParamList } from '../../navigation/types'

export const RoomLobbyScreen = () => {
  const navigation = useNavigation<any>()
  const route = useRoute<RouteProp<QuizStackParamList, 'RoomLobby'>>()
  const { roomId, roomCode } = route.params

  const [players, setPlayers] = useState<any[]>([])
  const [isHost, setIsHost] = useState(false)
  const [gameMode, setGameMode] = useState('')
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    const client = createStompClient(roomId, handleEvent, (err) => {
      Alert.alert('Lỗi kết nối', err)
    })
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [roomId])

  const handleEvent = (event: RoomEvent) => {
    switch (event.type) {
      case 'ROOM_STATE':
      case 'PLAYER_JOINED':
      case 'PLAYER_LEFT':
      case 'PLAYER_READY':
        if (event.payload?.players) setPlayers(event.payload.players)
        if (event.payload?.gameMode) setGameMode(event.payload.gameMode)
        if (event.payload?.isHost !== undefined) setIsHost(event.payload.isHost)
        break
      case 'GAME_START':
      case 'QUESTION_START':
        navigation.replace('Quiz', { sessionId: event.payload?.sessionId ?? roomId, mode: 'multiplayer' })
        break
    }
  }

  const handleReady = () => {
    if (clientRef.current) {
      sendRoomMessage(clientRef.current, roomId, 'READY')
    }
  }

  const handleStart = () => {
    if (clientRef.current) {
      sendRoomMessage(clientRef.current, roomId, 'START')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Phòng chờ</Text>
        <View style={styles.codeTag}>
          <Text style={styles.codeText}>{roomCode}</Text>
        </View>
      </View>

      {gameMode ? (
        <Text style={styles.modeText}>{gameMode.replace(/_/g, ' ')}</Text>
      ) : null}

      {/* Players */}
      <FlatList
        data={players}
        keyExtractor={(item) => item.userId ?? item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <GlassCard style={styles.playerCard}>
            <Avatar uri={item.avatarUrl} name={item.name ?? 'Player'} size={36} />
            <Text style={styles.playerName}>{item.name ?? 'Player'}</Text>
            {item.isHost && (
              <MaterialCommunityIcons name="crown" size={18} color={colors.gold} />
            )}
            {item.isReady && (
              <MaterialCommunityIcons name="check-circle" size={18} color="#22c55e" />
            )}
          </GlassCard>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Đang chờ người chơi...</Text>
        }
      />

      {/* Actions */}
      <View style={styles.actions}>
        {isHost ? (
          <GoldButton title="Bắt đầu" onPress={handleStart} disabled={players.length < 2} />
        ) : (
          <GoldButton title="Sẵn sàng" onPress={handleReady} />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
  codeTag: {
    backgroundColor: colors.goldLight, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  codeText: { fontSize: 16, fontWeight: '700', color: colors.gold, letterSpacing: 2 },
  modeText: {
    fontSize: 14, color: colors.gameMode.multiplayer, fontWeight: '500',
    paddingHorizontal: spacing.xl, marginBottom: spacing.md,
  },

  list: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing['3xl'] },
  emptyText: { color: colors.text.muted, textAlign: 'center', marginTop: spacing['3xl'] },

  playerCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 0,
  },
  playerName: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text.primary },

  actions: { padding: spacing.xl, paddingBottom: spacing['3xl'] },
})
