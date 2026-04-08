import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../api/client'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function setupPushNotifications(): Promise<string | null> {
  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return null
  }

  // Get push token
  const tokenData = await Notifications.getExpoPushTokenAsync()
  const pushToken = tokenData.data

  // Send to backend
  try {
    await api.post('/api/me/devices', {
      pushToken,
      platform: Platform.OS,
    })
  } catch {
    // Backend may not have this endpoint yet
  }

  // Save locally
  await AsyncStorage.setItem('pushToken', pushToken)

  // Android notification channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'BibleQuiz',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  return pushToken
}

// Schedule local notification
export async function scheduleStreakReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Giữ streak!',
      body: 'Đừng quên hoàn thành thử thách hàng ngày hôm nay.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  })
}
