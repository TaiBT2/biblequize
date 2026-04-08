import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { useAuthStore } from '../../stores/authStore'

const NOTIFICATION_KEY = 'settings:notifications'

export const SettingsScreen = () => {
  const navigation = useNavigation()
  const { logout } = useAuthStore()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATION_KEY).then((val) => {
      if (val !== null) setNotificationsEnabled(val === 'true')
    })
  }, [])

  const toggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value)
    AsyncStorage.setItem(NOTIFICATION_KEY, String(value))
  }

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: logout,
      },
    ])
  }

  const ITEMS = [
    { icon: 'bell-outline' as const, label: 'Thông báo', type: 'toggle' },
    { icon: 'information-outline' as const, label: 'Về BibleQuiz', type: 'link' },
    { icon: 'shield-check-outline' as const, label: 'Chính sách bảo mật', type: 'link' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Cài Đặt</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Theme note */}
        <View style={styles.themeNote}>
          <MaterialCommunityIcons name="palette" size={18} color={colors.gold} />
          <Text style={styles.themeText}>Sacred Modernist — Dark mode</Text>
        </View>

        {/* Items */}
        {ITEMS.map((item) => (
          <View key={item.label} style={styles.row}>
            <MaterialCommunityIcons name={item.icon} size={20} color={colors.text.secondary} />
            <Text style={styles.rowLabel}>{item.label}</Text>
            {item.type === 'toggle' ? (
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ true: colors.gold, false: colors.bg.surfaceContainerHighest }}
                thumbColor="#fff"
              />
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.muted} />
            )}
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>BibleQuiz Mobile v1.0.0</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text.primary },

  content: { padding: spacing.xl },

  themeNote: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.goldLight, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.xl,
  },
  themeText: { fontSize: 13, color: colors.gold, fontWeight: '500' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: `${colors.outlineVariant}40`,
  },
  rowLabel: { flex: 1, fontSize: 15, color: colors.text.primary },

  logoutButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginTop: spacing['3xl'], paddingVertical: spacing.lg,
  },
  logoutText: { fontSize: 15, color: colors.error, fontWeight: '500' },

  version: {
    fontSize: 12, color: colors.text.muted,
    textAlign: 'center', marginTop: spacing['4xl'],
  },
})
