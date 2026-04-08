import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

export default function GroupJoinScreen() {
  const navigation = useNavigation<any>()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!code.trim()) return
    setLoading(true)
    try {
      await apiClient.post('/api/groups/join', { code: code.trim() })
      Alert.alert('Thành công', 'Đã tham gia nhóm!', [{ text: 'OK', onPress: () => navigation.goBack() }])
    } catch (e: any) { Alert.alert('Lỗi', e.response?.data?.error ?? 'Mã nhóm không hợp lệ') }
    finally { setLoading(false) }
  }

  return (
    <SafeScreen>
      <View style={s.container}>
        <Text style={s.title}>Tham gia nhóm</Text>
        <Text style={s.subtitle}>Nhập mã nhóm từ trưởng nhóm</Text>
        <TextInput style={s.input} placeholder="Mã nhóm (6 ký tự)" placeholderTextColor={colors.textMuted}
          value={code} onChangeText={setCode} autoCapitalize="characters" maxLength={6} />
        <Button title="Tham gia" onPress={handleJoin} loading={loading} disabled={code.length < 4} fullWidth />
        <Button title="Tạo nhóm mới" onPress={() => navigation.navigate('GroupCreate')} variant="outline" fullWidth />
      </View>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.xl, justifyContent: 'center' },
  title: { fontSize: typography.size['3xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center' },
  input: { backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.lg, padding: spacing.lg, fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center', letterSpacing: 4 },
})
