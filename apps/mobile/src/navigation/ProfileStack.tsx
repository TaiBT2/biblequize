import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { ProfileStackParamList } from './types'
import { ProfileScreen } from '../screens/profile/ProfileScreen'
import { SettingsScreen } from '../screens/profile/SettingsScreen'

const Stack = createNativeStackNavigator<ProfileStackParamList>()

export const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
)
