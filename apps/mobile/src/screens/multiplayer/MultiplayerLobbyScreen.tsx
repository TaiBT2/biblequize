import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Room {
  id: string
  name: string
  mode: string
  hostName: string
  hostAvatarUrl?: string
  playerCount: number
  maxPlayers: number
  status: string
}

const MODE_LABELS: Record<string, { label: string; icon: string }> = {
  SPEED_RACE: { label: 'Speed Race', icon: '⚡' },
  BATTLE_ROYALE: { label: 'Battle Royale', icon: '💥' },
  TEAM_BATTLE: { label: 'Team Battle', icon: '⚔️' },
  COOP: { label: 'Co-op', icon: '🤝' },
}

export default function MultiplayerLobbyScreen() {
  const navigation = useNavigation<any>()

  const { data, isLoading, error, refetch, isRefetching } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: () => apiClient.get('/api/rooms').then(r => r.data),
    staleTime: 10_000,
    refetchInterval: 15_000,
  })

  const rooms = data ?? []

  if (isLoading) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Loading rooms...</Text>
        </View>
      </SafeScreen>
    )
  }

  if (error) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>Failed to load rooms</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.title}>Multiplayer</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.gold} />}
      >
        {rooms.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No rooms available</Text>
            <Text style={styles.emptySubtitle}>Create a room to start playing!</Text>
          </View>
        ) : (
          rooms.map((room) => {
            const modeInfo = MODE_LABELS[room.mode] ?? { label: room.mode, icon: '🎮' }
            return (
              <Pressable
                key={room.id}
                onPress={() => navigation.navigate('RoomWaiting', { roomId: room.id })}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <Card style={styles.roomCard}>
                  <View style={styles.roomTop}>
                    <View style={styles.modeBadge}>
                      <Text style={styles.modeIcon}>{modeInfo.icon}</Text>
                      <Text style={styles.modeLabel}>{modeInfo.label}</Text>
                    </View>
                    <Text style={styles.playerCount}>
                      {room.playerCount}/{room.maxPlayers}
                    </Text>
                  </View>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <View style={styles.hostRow}>
                    <Avatar uri={room.hostAvatarUrl} name={room.hostName} size={24} />
                    <Text style={styles.hostName}>{room.hostName}</Text>
                    <View style={[styles.statusDot, room.status === 'WAITING' ? styles.dotWaiting : styles.dotPlaying]} />
                    <Text style={styles.statusText}>
                      {room.status === 'WAITING' ? 'Waiting' : 'In Progress'}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            )
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Create Room"
          onPress={() => navigation.navigate('CreateRoom')}
          fullWidth
        />
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing.md },
  errorIcon: { fontSize: typography.size['3xl'], fontWeight: typography.weight.bold, color: colors.error, marginBottom: spacing.md },
  errorText: { fontSize: typography.size.base, color: colors.textSecondary, marginBottom: spacing.lg },
  retryBtn: { backgroundColor: colors.gold, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  retryText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.onSecondary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: 0 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18, color: colors.textPrimary, fontWeight: typography.weight.bold },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary },
  placeholder: { width: 36 },
  empty: { alignItems: 'center', paddingVertical: spacing['4xl'] },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  emptySubtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing.sm },
  roomCard: { marginBottom: spacing.md },
  roomTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  modeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerHighest, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  modeIcon: { fontSize: 14, marginRight: spacing.xs },
  modeLabel: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.textPrimary },
  playerCount: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold },
  roomName: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hostName: { fontSize: typography.size.xs, color: colors.textSecondary, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotWaiting: { backgroundColor: colors.success },
  dotPlaying: { backgroundColor: colors.warning },
  statusText: { fontSize: typography.size.xs, color: colors.textMuted },
  pressed: { opacity: 0.8 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderDefault },
})
