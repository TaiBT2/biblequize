import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MaterialIcons } from '@expo/vector-icons'
import { colors } from '../theme'
import type { MainTabParamList, HomeStackParamList, QuizStackParamList, MultiplayerStackParamList, GroupsStackParamList, ProfileStackParamList } from './types'

// Placeholder screens (will be replaced with real screens)
import HomeScreen from '../screens/main/HomeScreen'
import PracticeSelectScreen from '../screens/quiz/PracticeSelectScreen'
import QuizScreen from '../screens/quiz/QuizScreen'
import QuizResultsScreen from '../screens/quiz/QuizResultsScreen'
import QuizReviewScreen from '../screens/quiz/QuizReviewScreen'
import DailyChallengeScreen from '../screens/quiz/DailyChallengeScreen'
import RankedScreen from '../screens/quiz/RankedScreen'
import MultiplayerLobbyScreen from '../screens/multiplayer/MultiplayerLobbyScreen'
import CreateRoomScreen from '../screens/multiplayer/CreateRoomScreen'
import RoomWaitingScreen from '../screens/multiplayer/RoomWaitingScreen'
import MultiplayerQuizScreen from '../screens/multiplayer/MultiplayerQuizScreen'
import MultiplayerResultsScreen from '../screens/multiplayer/MultiplayerResultsScreen'
import TournamentBracketScreen from '../screens/multiplayer/TournamentBracketScreen'
import GroupsListScreen from '../screens/social/GroupsListScreen'
import GroupDetailScreen from '../screens/social/GroupDetailScreen'
import GroupJoinScreen from '../screens/social/GroupJoinScreen'
import GroupCreateScreen from '../screens/social/GroupCreateScreen'
import ProfileScreen from '../screens/user/ProfileScreen'
import AchievementsScreen from '../screens/user/AchievementsScreen'
import SettingsScreen from '../screens/user/SettingsScreen'
import LeaderboardScreen from '../screens/social/LeaderboardScreen'
import NotificationsScreen from '../screens/system/NotificationsScreen'
import JourneyMapScreen from '../screens/progress/JourneyMapScreen'

const Tab = createBottomTabNavigator<MainTabParamList>()

// Stack navigators for each tab
const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const QuizStack = createNativeStackNavigator<QuizStackParamList>()
const MultiplayerStack = createNativeStackNavigator<MultiplayerStackParamList>()
const GroupsStack = createNativeStackNavigator<GroupsStackParamList>()
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>()

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <HomeStack.Screen name="Journey" component={JourneyMapScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  )
}

function QuizStackNavigator() {
  return (
    <QuizStack.Navigator screenOptions={{ headerShown: false }}>
      <QuizStack.Screen name="PracticeSelect" component={PracticeSelectScreen} />
      <QuizStack.Screen name="Quiz" component={QuizScreen} />
      <QuizStack.Screen name="QuizResults" component={QuizResultsScreen} />
      <QuizStack.Screen name="QuizReview" component={QuizReviewScreen} />
      <QuizStack.Screen name="DailyChallenge" component={DailyChallengeScreen} />
      <QuizStack.Screen name="Ranked" component={RankedScreen} />
    </QuizStack.Navigator>
  )
}

function MultiplayerStackNavigator() {
  return (
    <MultiplayerStack.Navigator screenOptions={{ headerShown: false }}>
      <MultiplayerStack.Screen name="MultiplayerLobby" component={MultiplayerLobbyScreen} />
      <MultiplayerStack.Screen name="CreateRoom" component={CreateRoomScreen} />
      <MultiplayerStack.Screen name="RoomWaiting" component={RoomWaitingScreen} />
      <MultiplayerStack.Screen name="MultiplayerQuiz" component={MultiplayerQuizScreen} />
      <MultiplayerStack.Screen name="MultiplayerResults" component={MultiplayerResultsScreen} />
      <MultiplayerStack.Screen name="TournamentBracket" component={TournamentBracketScreen} />
    </MultiplayerStack.Navigator>
  )
}

function GroupsStackNavigator() {
  return (
    <GroupsStack.Navigator screenOptions={{ headerShown: false }}>
      <GroupsStack.Screen name="GroupsList" component={GroupsListScreen} />
      <GroupsStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <GroupsStack.Screen name="GroupJoin" component={GroupJoinScreen} />
      <GroupsStack.Screen name="GroupCreate" component={GroupCreateScreen} />
    </GroupsStack.Navigator>
  )
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Achievements" component={AchievementsScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  )
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgPrimary,
          borderTopColor: colors.borderDefault,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="QuizTab"
        component={QuizStackNavigator}
        options={{
          tabBarLabel: 'Quiz',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="quiz" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MultiplayerTab"
        component={MultiplayerStackNavigator}
        options={{
          tabBarLabel: 'Chơi cùng',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="groups" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="GroupsTab"
        component={GroupsStackNavigator}
        options={{
          tabBarLabel: 'Nhóm',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="church" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  )
}
