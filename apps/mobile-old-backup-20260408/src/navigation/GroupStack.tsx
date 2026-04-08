import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { GroupStackParamList } from './types'
import { GroupsScreen } from '../screens/social/GroupsScreen'
import { GroupDetailScreen } from '../screens/social/GroupDetailScreen'
import { TournamentsScreen } from '../screens/social/TournamentsScreen'
import { TournamentDetailScreen } from '../screens/social/TournamentDetailScreen'

const Stack = createNativeStackNavigator<GroupStackParamList>()

export const GroupStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Groups" component={GroupsScreen} />
    <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
    <Stack.Screen name="Tournaments" component={TournamentsScreen} />
    <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
  </Stack.Navigator>
)
