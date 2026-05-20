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
import DailyResultScreen from '../screens/quiz/DailyResultScreen'
import QuizReviewScreen from '../screens/quiz/QuizReviewScreen'
import DailyChallengeScreen from '../screens/quiz/DailyChallengeScreen'
import BasicQuizScreen from '../screens/quiz/BasicQuizScreen'
import RankedScreen from '../screens/quiz/RankedScreen'
import MultiplayerLobbyScreen from '../screens/multiplayer/MultiplayerLobbyScreen'
import CreateRoomScreen from '../screens/multiplayer/CreateRoomScreen'
import RoomWaitingScreen from '../screens/multiplayer/RoomWaitingScreen'
import MultiplayerQuizScreen from '../screens/multiplayer/MultiplayerQuizScreen'
import MultiplayerResultsScreen from '../screens/multiplayer/MultiplayerResultsScreen'
import TournamentBracketScreen from '../screens/multiplayer/TournamentBracketScreen'
import RoomQuizHostScreen from '../screens/multiplayer/RoomQuizHostScreen'
import RoomAnalyticsScreen from '../screens/multiplayer/RoomAnalyticsScreen'
import MySetsScreen from '../screens/quizSets/MySetsScreen'
import QuizSetDetailScreen from '../screens/quizSets/QuizSetDetailScreen'
import PersonalQuizSetEditorScreen from '../screens/quizSets/PersonalQuizSetEditorScreen'
import QuestionEditorScreen from '../screens/quizSets/QuestionEditorScreen'
import GroupQuizSetListScreen from '../screens/quizSets/GroupQuizSetListScreen'
import GroupAnalyticsScreen from '../screens/social/GroupAnalyticsScreen'
import ScheduledQuizListScreen from '../screens/scheduled/ScheduledQuizListScreen'
import ScheduledQuizCreateScreen from '../screens/scheduled/ScheduledQuizCreateScreen'
import ScheduledQuizDetailScreen from '../screens/scheduled/ScheduledQuizDetailScreen'
import ScheduledQuizPlayScreen from '../screens/scheduled/ScheduledQuizPlayScreen'
import TournamentDetailScreen from '../screens/multiplayer/TournamentDetailScreen'
import TournamentMatchScreen from '../screens/multiplayer/TournamentMatchScreen'
import CosmeticsScreen from '../screens/user/CosmeticsScreen'
import HelpScreen from '../screens/system/HelpScreen'
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
      <QuizStack.Screen name="DailyResults" component={DailyResultScreen} />
      <QuizStack.Screen name="QuizReview" component={QuizReviewScreen} />
      <QuizStack.Screen name="DailyChallenge" component={DailyChallengeScreen} />
      <QuizStack.Screen name="Ranked" component={RankedScreen} />
      <QuizStack.Screen name="BasicQuiz" component={BasicQuizScreen} />
    </QuizStack.Navigator>
  )
}

function MultiplayerStackNavigator() {
  return (
    <MultiplayerStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Leaderboard"
    >
      {/* Leaderboard là root screen của tab "Bảng Xếp Hạng" (2026-05-19) —
          multiplayer screens vẫn registered + accessible từ Home cards via
          navigation.navigate('MultiplayerTab', { screen: 'MultiplayerLobby' }).
          initialRouteName explicit để guarantee fresh mount route + tránh
          stale persisted state hiển thị MultiplayerLobby. */}
      <MultiplayerStack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <MultiplayerStack.Screen name="MultiplayerLobby" component={MultiplayerLobbyScreen} />
      <MultiplayerStack.Screen name="CreateRoom" component={CreateRoomScreen} />
      <MultiplayerStack.Screen name="RoomWaiting" component={RoomWaitingScreen} />
      <MultiplayerStack.Screen name="MultiplayerQuiz" component={MultiplayerQuizScreen} />
      <MultiplayerStack.Screen name="RoomQuizHost" component={RoomQuizHostScreen} />
      <MultiplayerStack.Screen name="MultiplayerResults" component={MultiplayerResultsScreen} />
      <MultiplayerStack.Screen name="RoomAnalytics" component={RoomAnalyticsScreen} />
      <MultiplayerStack.Screen name="TournamentBracket" component={TournamentBracketScreen} />
      <MultiplayerStack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
      <MultiplayerStack.Screen name="TournamentMatch" component={TournamentMatchScreen} />
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
      <GroupsStack.Screen name="GroupQuizSetList" component={GroupQuizSetListScreen} />
      <GroupsStack.Screen name="QuizSetDetail" component={QuizSetDetailScreen} />
      <GroupsStack.Screen name="GroupAnalytics" component={GroupAnalyticsScreen} />
      <GroupsStack.Screen name="ScheduledQuizList" component={ScheduledQuizListScreen} />
      <GroupsStack.Screen name="ScheduledQuizCreate" component={ScheduledQuizCreateScreen} />
      <GroupsStack.Screen name="ScheduledQuizDetail" component={ScheduledQuizDetailScreen} />
      <GroupsStack.Screen name="ScheduledQuizPlay" component={ScheduledQuizPlayScreen} />
    </GroupsStack.Navigator>
  )
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Achievements" component={AchievementsScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="MySets" component={MySetsScreen} />
      <ProfileStack.Screen name="QuizSetDetail" component={QuizSetDetailScreen} />
      <ProfileStack.Screen name="PersonalQuizSetEditor" component={PersonalQuizSetEditorScreen} />
      <ProfileStack.Screen name="QuestionEditor" component={QuestionEditorScreen} />
      <ProfileStack.Screen name="Cosmetics" component={CosmeticsScreen} />
      <ProfileStack.Screen name="Help" component={HelpScreen} />
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
      {/* QuizTab hidden từ bottom bar (2026-05-19 user request) — stack vẫn
          registered để Home cards + internal nav (PracticeSelect → Quiz →
          Results → Review) work qua navigate('QuizTab', { screen: ... }). */}
      <Tab.Screen
        name="QuizTab"
        component={QuizStackNavigator}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="MultiplayerTab"
        component={MultiplayerStackNavigator}
        listeners={({ navigation }) => ({
          // Tap tab → luôn reset về Leaderboard nếu current route khác.
          // Fix HMR cached state + UX bug: user nhấn tab nhưng vẫn thấy
          // MultiplayerLobby do nav state cũ còn pinned.
          tabPress: (e) => {
            const state = navigation.getState()
            const tab = state.routes.find((r: any) => r.name === 'MultiplayerTab') as any
            const tabState = tab?.state
            if (!tabState) return
            const currentRoute = tabState.routes?.[tabState.index ?? 0]
            if (currentRoute && currentRoute.name !== 'Leaderboard') {
              e.preventDefault()
              ;(navigation as any).navigate('MultiplayerTab', { screen: 'Leaderboard' })
            }
          },
        })}
        options={{
          tabBarLabel: 'Xếp Hạng',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="leaderboard" size={size} color={color} />,
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
