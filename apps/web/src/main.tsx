import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/global.css'
import { useAuthStore } from './store/authStore'
import { ErrorProvider } from './contexts/ErrorContext'
import RequireAuth from './contexts/RequireAuth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './components/ErrorBoundary'
import './utils/localStorageClearDetector'
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Practice from './pages/Practice'
import Quiz from './pages/Quiz'
import Ranked from './pages/Ranked'
import Rooms from './pages/Rooms'
import AuthCallback from './pages/AuthCallback'
import AdminLayout from './layouts/AdminLayout'
import AIQuestionGenerator from './pages/admin/AIQuestionGenerator'
import ReviewQueue from './pages/admin/ReviewQueue'
import QuestionsAdmin from './pages/admin/Questions'
import UsersAdmin from './pages/admin/Users'
import RankingsAdmin from './pages/admin/Rankings'
import EventsAdmin from './pages/admin/Events'
import FeedbackAdmin from './pages/admin/Feedback'
import RequireAdmin from './contexts/RequireAdmin'
import Review from './pages/Review'
import Achievements from './pages/Achievements'
import Leaderboard from './pages/Leaderboard'
import RoomLobby from './pages/RoomLobby'
import RoomQuiz from './pages/RoomQuiz'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import Multiplayer from './pages/Multiplayer'
import DailyChallenge from './pages/DailyChallenge'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import GroupAnalytics from './pages/GroupAnalytics'
import Tournaments from './pages/Tournaments'
import TournamentDetail from './pages/TournamentDetail'
import TournamentMatch from './pages/TournamentMatch'

const queryClient = new QueryClient()

// Initialize auth state on app startup (replaces AuthProvider useEffect)
useAuthStore.getState().checkAuth()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ErrorProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/daily" element={<DailyChallenge />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/quiz" element={<Quiz />} />
                  <Route path="/review" element={<Review />} />
                  <Route path="/achievements" element={<Achievements />} />
                <Route path="/ranked" element={<Ranked />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/rooms" element={<RequireAuth><Rooms /></RequireAuth>} />
                <Route path="/multiplayer" element={<RequireAuth><Multiplayer /></RequireAuth>} />
                <Route path="/groups" element={<RequireAuth><Groups /></RequireAuth>} />
                <Route path="/groups/:id" element={<RequireAuth><GroupDetail /></RequireAuth>} />
                <Route path="/groups/:id/analytics" element={<RequireAuth><GroupAnalytics /></RequireAuth>} />
                <Route path="/tournaments" element={<RequireAuth><Tournaments /></RequireAuth>} />
                <Route path="/tournaments/:id" element={<RequireAuth><TournamentDetail /></RequireAuth>} />
                <Route path="/tournaments/:id/match/:matchId" element={<RequireAuth><TournamentMatch /></RequireAuth>} />
                <Route path="/room/create" element={<RequireAuth><CreateRoom /></RequireAuth>} />
                <Route path="/room/join" element={<RequireAuth><JoinRoom /></RequireAuth>} />
                <Route path="/room/:roomId/lobby" element={<RequireAuth><RoomLobby /></RequireAuth>} />
                <Route path="/room/:roomId/quiz" element={<RequireAuth><RoomQuiz /></RequireAuth>} />
                <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                  <Route index element={<UsersAdmin />} />
                  <Route path="users" element={<UsersAdmin />} />
                  <Route path="questions" element={<QuestionsAdmin />} />
                  <Route path="feedback" element={<FeedbackAdmin />} />
                  <Route path="rankings" element={<RankingsAdmin />} />
                  <Route path="events" element={<EventsAdmin />} />
                  <Route path="ai-generator" element={<AIQuestionGenerator />} />
                  <Route path="review-queue" element={<ReviewQueue />} />
                </Route>
              </Routes>
            </BrowserRouter>
        </ErrorProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)


