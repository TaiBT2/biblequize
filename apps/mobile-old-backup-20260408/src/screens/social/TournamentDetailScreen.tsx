import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'
import { GoldButton } from '../../components/GoldButton'
import type { GroupStackParamList } from '../../navigation/types'

export const TournamentDetailScreen = () => {
  const navigation = useNavigation()
  const route = useRoute<RouteProp<GroupStackParamList, 'TournamentDetail'>>()
  const { tournamentId } = route.params

  const query = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => api.get(`/api/tournaments/${tournamentId}`).then((r) => r.data),
  })

  const bracketQuery = useQuery({
    queryKey: ['tournament-bracket', tournamentId],
    queryFn: () => api.get(`/api/tournaments/${tournamentId}/bracket`).then((r) => r.data),
  })

  const tournament = query.data
  const bracket = bracketQuery.data ?? []

  const handleJoin = async () => {
    try {
      await api.post(`/api/tournaments/${tournamentId}/join`)
      query.refetch()
      Alert.alert('Thành công', 'Đã đăng ký giải đấu!')
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message ?? 'Không đăng ký được')
    }
  }

  if (query.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: 100 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <MaterialCommunityIcons name="trophy" size={48} color="#f59e0b" />
          <Text style={styles.name}>{tournament?.name ?? 'Giải đấu'}</Text>
          <Text style={styles.meta}>
            {tournament?.currentParticipants}/{tournament?.maxParticipants} người • {tournament?.status}
          </Text>
        </View>

        {tournament?.status === 'LOBBY' && (
          <GoldButton title="Đăng ký tham gia" onPress={handleJoin} />
        )}

        {/* Bracket */}
        <Text style={styles.sectionTitle}>Bracket</Text>
        {bracket.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có bracket</Text>
        ) : (
          bracket.map((match: any, i: number) => (
            <GlassCard key={match.id ?? i} style={styles.matchCard}>
              <Text style={styles.matchPlayers}>
                {match.player1Name ?? 'TBD'} vs {match.player2Name ?? 'TBD'}
              </Text>
              <Text style={styles.matchStatus}>{match.status ?? 'Pending'}</Text>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { padding: spacing.xl, paddingBottom: spacing['4xl'] },

  hero: { alignItems: 'center', marginVertical: spacing['2xl'] },
  name: { fontSize: 22, fontWeight: '700', color: colors.text.primary, marginTop: spacing.md },
  meta: { fontSize: 14, color: colors.text.secondary, marginTop: spacing.xs },

  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: colors.text.primary,
    marginTop: spacing['2xl'], marginBottom: spacing.md,
  },
  emptyText: { color: colors.text.muted, textAlign: 'center' },

  matchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  matchPlayers: { fontSize: 14, color: colors.text.primary, fontWeight: '500' },
  matchStatus: { fontSize: 12, color: colors.text.secondary },
})
