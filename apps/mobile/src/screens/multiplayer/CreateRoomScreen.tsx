import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useMutation } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

const GAME_MODES = [
  { value: 'SPEED_RACE', label: 'Speed Race', icon: '⚡', desc: 'First to answer wins' },
  { value: 'BATTLE_ROYALE', label: 'Battle Royale', icon: '💥', desc: 'Last one standing' },
  { value: 'TEAM_BATTLE', label: 'Team Battle', icon: '⚔️', desc: 'Team vs Team' },
  { value: 'COOP', label: 'Co-op', icon: '🤝', desc: 'Work together' },
]

const PLAYER_COUNTS = [2, 4, 6, 8, 10]

const BOOK_FILTERS = [
  { value: 'ALL', label: 'All Books' },
  { value: 'OT', label: 'Old Testament' },
  { value: 'NT', label: 'New Testament' },
  { value: 'GOSPEL', label: 'Gospels' },
  { value: 'PSALMS', label: 'Psalms & Proverbs' },
]

export default function CreateRoomScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const [roomName, setRoomName] = useState('')
  const [selectedMode, setSelectedMode] = useState('SPEED_RACE')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [bookFilter, setBookFilter] = useState('ALL')

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/api/rooms', {
        name: roomName.trim() || 'Bible Quiz Room',
        mode: selectedMode,
        maxPlayers,
        bookFilter,
      }).then(r => r.data),
    onSuccess: (data) => {
      navigation.replace('RoomWaiting', { roomId: data.id })
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create room. Please try again.')
    },
  })

  return (
    <SafeScreen>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.title}>Create Room</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Room Name */}
        <Text style={styles.sectionTitle}>Room Name</Text>
        <TextInput
          style={styles.input}
          value={roomName}
          onChangeText={setRoomName}
          placeholder="Enter room name..."
          placeholderTextColor={colors.textMuted}
          maxLength={30}
        />

        {/* Game Mode */}
        <Text style={styles.sectionTitle}>Game Mode</Text>
        <View style={styles.modesGrid}>
          {GAME_MODES.map((mode) => (
            <Pressable
              key={mode.value}
              onPress={() => setSelectedMode(mode.value)}
              style={[styles.modeCard, selectedMode === mode.value && styles.modeSelected]}
            >
              <Text style={styles.modeIcon}>{mode.icon}</Text>
              <Text style={styles.modeLabel}>{mode.label}</Text>
              <Text style={styles.modeDesc}>{mode.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* Player Count */}
        <Text style={styles.sectionTitle}>Max Players</Text>
        <View style={styles.playerRow}>
          {PLAYER_COUNTS.map((count) => (
            <Pressable
              key={count}
              onPress={() => setMaxPlayers(count)}
              style={[styles.playerBtn, maxPlayers === count && styles.playerSelected]}
            >
              <Text style={[styles.playerText, maxPlayers === count && styles.playerTextSelected]}>
                {count}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Book Filter */}
        <Text style={styles.sectionTitle}>Book Filter</Text>
        <Card style={styles.filterCard}>
          {BOOK_FILTERS.map((filter) => (
            <Pressable
              key={filter.value}
              onPress={() => setBookFilter(filter.value)}
              style={[styles.filterRow, bookFilter === filter.value && styles.filterSelected]}
            >
              <Text style={[styles.filterText, bookFilter === filter.value && styles.filterTextSelected]}>
                {filter.label}
              </Text>
              {bookFilter === filter.value && <Text style={styles.checkmark}>{'✓'}</Text>}
            </Pressable>
          ))}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Create Room"
          onPress={() => createMutation.mutate()}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
          fullWidth
        />
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: 0 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18, color: colors.textPrimary, fontWeight: typography.weight.bold },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary },
  placeholder: { width: 36 },
  sectionTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.xl },
  input: {
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, padding: spacing.lg,
    fontSize: typography.size.base, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.borderDefault,
  },
  modesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  modeCard: {
    width: '47%', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl,
    padding: spacing.lg, borderWidth: 2, borderColor: 'transparent',
  },
  modeSelected: { borderColor: colors.gold, backgroundColor: 'rgba(232,168,50,0.08)' },
  modeIcon: { fontSize: 24, marginBottom: spacing.sm },
  modeLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary },
  modeDesc: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing.xs },
  playerRow: { flexDirection: 'row', gap: spacing.md },
  playerBtn: {
    width: 48, height: 48, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  playerSelected: { borderColor: colors.gold, backgroundColor: 'rgba(232,168,50,0.08)' },
  playerText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textMuted },
  playerTextSelected: { color: colors.gold },
  filterCard: { padding: 0, overflow: 'hidden' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderDefault },
  filterSelected: { backgroundColor: 'rgba(232,168,50,0.08)' },
  filterText: { fontSize: typography.size.sm, color: colors.textSecondary },
  filterTextSelected: { color: colors.gold, fontWeight: typography.weight.bold },
  checkmark: { fontSize: typography.size.base, color: colors.gold, fontWeight: typography.weight.bold },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderDefault },
})
