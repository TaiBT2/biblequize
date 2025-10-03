import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/global.css'
import { AuthProvider } from './contexts/AuthContext'
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/quiz" element={<Quiz />} />
            <Route path="/review" element={<Review />} />
            <Route path="/achievements" element={<Achievements />} />
          <Route path="/ranked" element={<Ranked />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/room/:roomId/lobby" element={<RoomLobby />} />
          <Route path="/room/:roomId/quiz" element={<RoomQuiz />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="ai-generator" element={<AIQuestionGenerator />} />
            <Route path="questions" element={<QuestionsAdmin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)


