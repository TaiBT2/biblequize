import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { HomeStackParamList } from './types'
import { HomeScreen } from '../screens/home/HomeScreen'
import { LeaderboardScreen } from '../screens/social/LeaderboardScreen'
import { AchievementsScreen } from '../screens/profile/AchievementsScreen'

const Stack = createNativeStackNavigator<HomeStackParamList>()

export const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
    <Stack.Screen name="Achievements" component={AchievementsScreen} />
  </Stack.Navigator>
)
