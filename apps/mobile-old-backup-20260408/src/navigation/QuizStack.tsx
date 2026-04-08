import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { QuizStackParamList } from './types'
import { RankedScreen } from '../screens/quiz/RankedScreen'
import { PracticeScreen } from '../screens/quiz/PracticeScreen'
import { QuizScreen } from '../screens/quiz/QuizScreen'
import { QuizResultsScreen } from '../screens/quiz/QuizResultsScreen'
import { ReviewScreen } from '../screens/quiz/ReviewScreen'
import { MultiplayerScreen } from '../screens/multiplayer/MultiplayerScreen'
import { CreateRoomScreen } from '../screens/multiplayer/CreateRoomScreen'
import { RoomLobbyScreen } from '../screens/multiplayer/RoomLobbyScreen'

const Stack = createNativeStackNavigator<QuizStackParamList>()

export const QuizStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Ranked" component={RankedScreen} />
    <Stack.Screen name="Practice" component={PracticeScreen} />
    <Stack.Screen name="Multiplayer" component={MultiplayerScreen} />
    <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
    <Stack.Screen name="RoomLobby" component={RoomLobbyScreen} />
    <Stack.Screen name="Quiz" component={QuizScreen} />
    <Stack.Screen name="QuizResults" component={QuizResultsScreen} />
    <Stack.Screen name="Review" component={ReviewScreen} />
  </Stack.Navigator>
)
