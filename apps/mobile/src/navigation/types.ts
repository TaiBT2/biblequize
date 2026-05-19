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
  Leaderboard: undefined
  MultiplayerLobby: undefined
  CreateRoom: undefined
  RoomWaiting: { roomId: string; isHost: boolean }
  MultiplayerQuiz: { roomId: string; userId?: string }
  RoomQuizHost: { roomId: string }
  MultiplayerResults: { roomId: string; leaderboard?: any[] }
  RoomAnalytics: { roomId: string }
  TournamentBracket: { tournamentId: string }
  TournamentDetail: { tournamentId: string }
  TournamentMatch: { tournamentId: string; matchId: string }
}

export type GroupsStackParamList = {
  GroupsList: undefined
  GroupDetail: { groupId: string }
  GroupJoin: undefined
  GroupCreate: undefined
  GroupQuizSetList: { groupId: string }
  QuizSetDetail: { setId: string; isPersonal: boolean; groupId?: string }
  GroupAnalytics: { groupId: string }
  ScheduledQuizList: { groupId: string; canManage?: boolean }
  ScheduledQuizCreate: { groupId: string }
  ScheduledQuizDetail: { groupId: string; quizId: string }
  ScheduledQuizPlay: { groupId: string; quizId: string }
}

export type ProfileStackParamList = {
  Profile: undefined
  OtherProfile: { userId: string }
  Achievements: undefined
  Settings: undefined
  Cosmetics: undefined
  Help: undefined
  Legal: { type: 'privacy' | 'terms' | 'about' }
  MySets: undefined
  QuizSetDetail: { setId: string; isPersonal: boolean; groupId?: string }
  PersonalQuizSetEditor: { setId?: string }
  QuestionEditor: { setId: string; questionId?: string; question?: any }
}
