import { useTranslation } from 'react-i18next'
import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import ChatOverlay, { ChatMessage } from '../../components/multiplayer/ChatOverlay'
import { apiClient } from '../../api/client'
import { useStomp } from '../../hooks/useStomp'
import { colors, typography, spacing } from '../../theme'

interface PlayerInfo {
  id: string
  userId: string
  username: string
  avatarUrl?: string
  isReady: boolean
  score: number
  team?: string
  playerStatus: string
}

interface RoomDetails {
  id: string
  roomCode: string
  roomName: string
  status: string
  mode: string
  maxPlayers: number
  currentPlayers: number
  hostId: string
  hostName: string
  hostPlaysGame: boolean
  players: PlayerInfo[]
}

export default function RoomWaitingScreen() {
  const { t } = useTranslation()
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const roomId: string = route.params?.roomId ?? ''
  const viewerUserId: string | undefined = route.params?.userId

  const { data: room, refetch } = useQuery<RoomDetails>({
    queryKey: ['room', roomId],
    queryFn: () => apiClient.get(`/api/rooms/${roomId}`).then(r => r.data),
    enabled: !!roomId,
  })

  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    if (room?.players) setPlayers(room.players)
  }, [room?.players])

  const handleStompMessage = useCallback((msg: any) => {
    switch (msg?.type) {
      case 'PLAYER_JOINED':
      case 'PLAYER_LEFT':
      case 'PLAYER_READY':
      case 'PLAYER_UNREADY':
      case 'ROOM_STATE':
        // Re-fetch room snapshot for canonical state instead of patching locally.
        refetch()
        break
      case 'ROOM_STARTING':
        navigation.replace('MultiplayerQuiz', { roomId })
        break
      case 'CHAT_MESSAGE': {
        const d = msg.data ?? {}
        setChatMessages(prev => [...prev, {
          senderId: d.senderId,
          sender: d.sender ?? d.senderName ?? 'Người chơi',
          text: String(d.text ?? ''),
          receivedAt: Date.now(),
        }])
        break
      }
    }
  }, [navigation, refetch, roomId])

  const { connected, send } = useStomp({
    roomId,
    onMessage: handleStompMessage,
  })

  const me = players.find(p => p.userId === viewerUserId)
  const isHost = !!room && !!viewerUserId && room.hostId === viewerUserId
  const isReady = me?.isReady ?? false

  const handleReadyToggle = () => {
    if (!send(`/app/room/${roomId}/ready`, { ready: !isReady })) {
      Alert.alert('Mất kết nối', 'Đang kết nối lại, thử lại sau giây lát.')
    }
  }

  const handleStart = async () => {
    try {
      await apiClient.post(`/api/rooms/${roomId}/start`)
    } catch (e: any) {
      Alert.alert('Không thể bắt đầu', e?.response?.data?.message ?? 'Lỗi không xác định')
    }
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Phòng Chờ</Text>
        <Text style={s.subtitle}>
          {isHost ? 'Bạn là chủ phòng' : 'Đang chờ chủ phòng bắt đầu...'}
          {!connected && ' · Đang kết nối...'}
        </Text>

        <Card style={s.infoCard}>
          <Text style={s.infoLabel}>Mã phòng</Text>
          <Text style={s.roomCode}>{room?.roomCode ?? '------'}</Text>
        </Card>

        <Text style={s.section}>
          Người chơi ({players.length}/{room?.maxPlayers ?? 8})
        </Text>
        <View style={s.playersList}>
          {players.map(p => (
            <Card key={p.id} style={s.playerRow}>
              <Avatar
                name={p.username}
                size={40}
                borderColor={p.userId === room?.hostId ? colors.gold : undefined}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.playerName}>{p.username}</Text>
                <Text style={s.playerRole}>
                  {p.userId === room?.hostId ? '👑 Chủ phòng' : 'Người chơi'}
                </Text>
              </View>
              <Text style={[s.readyBadge, !p.isReady && s.notReady]}>
                {p.isReady ? 'Sẵn sàng' : 'Chưa sẵn sàng'}
              </Text>
            </Card>
          ))}
        </View>

        {!isHost && (
          <Button
            title={isReady ? 'Bỏ sẵn sàng' : 'Sẵn sàng'}
            onPress={handleReadyToggle}
            fullWidth
          />
        )}
        {isHost && (
          <Button title="Bắt đầu" onPress={handleStart} fullWidth />
        )}

        <Button title="💬 Mở chat" onPress={() => setChatOpen(true)} variant="outline" fullWidth />
      </ScrollView>

      <ChatOverlay
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        onSend={(text) => send(`/app/room/${roomId}/chat`, { text })}
      />
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
  notReady: { color: colors.textMuted },
})
