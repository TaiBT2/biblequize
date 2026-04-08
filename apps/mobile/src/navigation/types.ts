export type RootStackParamList = {
  Onboarding: undefined
  Auth: undefined
  Main: undefined
}

export type OnboardingStackParamList = {
  Splash: undefined
  LanguageSelection: undefined
  WelcomeSlides: undefined
  TryQuiz: undefined
  TryQuizResult: { score: number; total: number }
}

export type AuthStackParamList = {
  Login: undefined
}

export type MainTabParamList = {
  HomeTab: undefined
  QuizTab: undefined
  MultiplayerTab: undefined
  GroupsTab: undefined
  ProfileTab: undefined
}

export type HomeStackParamList = {
  Home: undefined
  Leaderboard: undefined
  Journey: undefined
  Notifications: undefined
}

export type QuizStackParamList = {
  PracticeSelect: undefined
  Quiz: { sessionId?: string; questions?: any[]; mode?: string; timePerQuestion?: number; showExplanation?: boolean }
  QuizResults: { stats: any }
  QuizReview: { stats: any }
  DailyChallenge: undefined
  Ranked: undefined
  WeeklyQuiz: undefined
  MysteryMode: undefined
  SpeedRound: undefined
}

export type MultiplayerStackParamList = {
  MultiplayerLobby: undefined
  CreateRoom: undefined
  RoomWaiting: { roomId: string; isHost: boolean }
  MultiplayerQuiz: { roomId: string }
  MultiplayerResults: { roomId: string }
  TournamentBracket: { tournamentId: string }
}

export type GroupsStackParamList = {
  GroupsList: undefined
  GroupDetail: { groupId: string }
  GroupJoin: undefined
  GroupCreate: undefined
}

export type ProfileStackParamList = {
  Profile: undefined
  OtherProfile: { userId: string }
  Achievements: undefined
  Settings: undefined
  Cosmetics: undefined
  Legal: { type: 'privacy' | 'terms' | 'about' }
}
