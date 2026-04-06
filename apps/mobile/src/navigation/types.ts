import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

// === Root Stack ===
export type RootStackParamList = {
  Login: undefined
  Main: NavigatorScreenParams<MainTabParamList>
}

// === Bottom Tabs ===
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>
  RankedTab: NavigatorScreenParams<QuizStackParamList>
  DailyTab: undefined
  GroupsTab: NavigatorScreenParams<GroupStackParamList>
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>
}

// === Home Stack ===
export type HomeStackParamList = {
  Home: undefined
  Leaderboard: undefined
  Achievements: undefined
}

// === Quiz Stack ===
export type QuizStackParamList = {
  Ranked: undefined
  Practice: undefined
  Multiplayer: undefined
  CreateRoom: undefined
  RoomLobby: { roomId: string; roomCode: string }
  Quiz: { sessionId: string; mode: 'practice' | 'ranked' | 'daily' | 'multiplayer' }
  QuizResults: { sessionId: string }
  Review: { sessionId: string }
}

// === Group Stack ===
export type GroupStackParamList = {
  Groups: undefined
  GroupDetail: { groupId: string }
  Tournaments: undefined
  TournamentDetail: { tournamentId: string }
}

// === Profile Stack ===
export type ProfileStackParamList = {
  Profile: undefined
  Settings: undefined
}

// === Screen Props helpers ===
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >

export type QuizStackScreenProps<T extends keyof QuizStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<QuizStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >

export type GroupStackScreenProps<T extends keyof GroupStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<GroupStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >
