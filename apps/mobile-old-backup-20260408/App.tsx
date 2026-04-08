import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from './src/stores/authStore'
import { colors } from './src/theme/colors'
import { MainTabs } from './src/navigation/MainTabs'
import { LoginScreen } from './src/screens/auth/LoginScreen'
import { setupPushNotifications } from './src/services/pushNotifications'
import type { RootStackParamList } from './src/navigation/types'

// Deep linking config
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['biblequiz://', 'https://biblequiz.app'],
  config: {
    screens: {
      Main: {
        screens: {
          DailyTab: 'daily',
          GroupsTab: {
            screens: {
              GroupDetail: 'groups/:groupId',
            },
          },
        },
      },
      Login: 'login',
    },
  },
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
})

const Stack = createNativeStackNavigator()

function RootNavigator() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
    setupPushNotifications().catch(() => {})
  }, [checkAuth])

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer
            linking={linking}
            theme={{
              dark: true,
              colors: {
                primary: colors.gold,
                background: colors.bg.primary,
                card: colors.bg.secondary,
                text: colors.text.primary,
                border: colors.outlineVariant,
                notification: colors.gold,
              },
              fonts: {
                regular: { fontFamily: 'System', fontWeight: '400' },
                medium: { fontFamily: 'System', fontWeight: '500' },
                bold: { fontFamily: 'System', fontWeight: '700' },
                heavy: { fontFamily: 'System', fontWeight: '800' },
              },
            }}
          >
            <StatusBar style="light" backgroundColor={colors.bg.primary} />
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
