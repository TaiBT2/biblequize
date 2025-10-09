import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/global.css'
import { AuthProvider } from './contexts/AuthContext'
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
import QuestionsAdmin from './pages/admin/Questions'
import Review from './pages/Review'
import Achievements from './pages/Achievements'
import Leaderboard from './pages/Leaderboard'
import RoomLobby from './pages/RoomLobby'
import RoomQuiz from './pages/RoomQuiz'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ErrorProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/quiz" element={<Quiz />} />
                  <Route path="/review" element={<Review />} />
                  <Route path="/achievements" element={<Achievements />} />
                <Route path="/ranked" element={<Ranked />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/rooms" element={<RequireAuth><Rooms /></RequireAuth>} />
                <Route path="/room/:roomId/lobby" element={<RequireAuth><RoomLobby /></RequireAuth>} />
                <Route path="/room/:roomId/quiz" element={<RequireAuth><RoomQuiz /></RequireAuth>} />
                <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
                  <Route path="ai-generator" element={<AIQuestionGenerator />} />
                  <Route path="questions" element={<QuestionsAdmin />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ErrorProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)


