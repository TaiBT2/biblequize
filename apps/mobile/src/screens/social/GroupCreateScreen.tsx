import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

export default function GroupCreateScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await apiClient.post('/api/groups', { name: name.trim(), description: desc.trim() })
      Alert.alert('Thành công', 'Mã nhóm: ' + (res.data?.code ?? ''), [{ text: 'OK', onPress: () => navigation.goBack() }])
    } catch (e: any) { Alert.alert('Lỗi', e.response?.data?.error ?? 'Không thể tạo nhóm') }
    finally { setLoading(false) }
  }

  return (
    <SafeScreen>
      <View style={s.container}>
        <Text style={s.title}>Tạo nhóm mới</Text>
        <TextInput style={s.input} placeholder="Tên nhóm" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
        <TextInput style={[s.input, { height: 80 }]} placeholder="Mô tả (tuỳ chọn)" placeholderTextColor={colors.textMuted} value={desc} onChangeText={setDesc} multiline textAlignVertical="top" />
        <Button title="Tạo nhóm" onPress={handleCreate} loading={loading} disabled={!name.trim()} fullWidth />
      </View>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.xl },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  input: { backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.lg, padding: spacing.lg, fontSize: typography.size.base, color: colors.textPrimary },
})
