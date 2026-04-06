import { useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'
import { GoldButton } from '../../components/GoldButton'

export const GroupsScreen = () => {
  const navigation = useNavigation<any>()
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  const groupsQuery = useQuery({
    queryKey: ['my-groups'],
    queryFn: () => api.get('/api/groups').then((r) => r.data),
  })

  const groups = groupsQuery.data?.content ?? groupsQuery.data ?? []

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setJoining(true)
    try {
      const res = await api.post('/api/groups/join', { code: joinCode.trim() })
      groupsQuery.refetch()
      setJoinCode('')
      Alert.alert('Thành công', 'Đã tham gia nhóm!')
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message ?? 'Mã nhóm không hợp lệ')
    } finally {
      setJoining(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Nhóm Hội Thánh</Text>

      {/* Join */}
      <View style={styles.joinRow}>
        <TextInput
          style={styles.joinInput}
          placeholder="Nhập mã nhóm"
          placeholderTextColor={colors.text.muted}
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="characters"
        />
        <GoldButton title="Vào" onPress={handleJoin} loading={joining} />
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>Chưa tham gia nhóm nào</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
            activeOpacity={0.7}
          >
            <GlassCard style={styles.groupCard}>
              <View style={styles.groupIcon}>
                <MaterialCommunityIcons name="church" size={24} color="#22c55e" />
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupMembers}>{item.memberCount ?? 0} thành viên</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.muted} />
            </GlassCard>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  title: {
    fontSize: 24, fontWeight: '700', color: colors.text.primary,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, marginBottom: spacing.lg,
  },

  joinRow: {
    flexDirection: 'row', gap: spacing.md,
    paddingHorizontal: spacing.xl, marginBottom: spacing.xl,
  },
  joinInput: {
    flex: 1, backgroundColor: colors.bg.surfaceContainer, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.outlineVariant,
    color: colors.text.primary, fontSize: 16, paddingHorizontal: spacing.lg,
  },

  list: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing['4xl'] },

  emptyState: { alignItems: 'center', marginTop: spacing['4xl'], gap: spacing.md },
  emptyText: { color: colors.text.muted, fontSize: 15 },

  groupCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 0 },
  groupIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  groupMembers: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
})
