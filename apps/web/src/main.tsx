import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/global.css'
import './styles/tokens.css'
import { useAuthStore } from './store/authStore'
import { installSessionExpiryHandler } from './auth/sessionExpiry'
import { ErrorProvider } from './contexts/ErrorContext'
import { ToastProvider } from './contexts/ToastContext'
import RequireAuth from './contexts/RequireAuth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './components/ErrorBoundary'
import { HelmetProvider } from 'react-helmet-async'
import { initStorageSync } from './utils/localStorageClearDetector'
import './i18n'
import Home from './pages/Home'
import HomeKhungSangMock from './pages/HomeKhungSangMock'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Practice from './pages/Practice'
import Quiz from './pages/Quiz'
import Cosmetics from './pages/Cosmetics'
import WeeklyQuiz from './pages/WeeklyQuiz'
import MysteryMode from './pages/MysteryMode'
import SpeedRound from './pages/SpeedRound'
import Ranked from './pages/Ranked'
import BasicQuiz from './pages/BasicQuiz'
import Rooms from './pages/Rooms'
import AuthCallback from './pages/AuthCallback'
import AppLayout from './layouts/AppLayout'
import CapacitorBackButton from './platform/CapacitorBackButton'
import { initNative } from './platform/initNative'
// Admin is lazy + build-time gated: the mobile (Capacitor) build ships user
// pages only, so the constant VITE_TARGET check lets Rollup drop the whole
// admin chunk from the app bundle. The web build code-splits it as usual.
const AdminRoutes =
  import.meta.env.VITE_TARGET === 'capacitor'
    ? null
    : React.lazy(() => import('./pages/admin/AdminRoutes'))
import Review from './pages/Review'
import Achievements from './pages/Achievements'
import Leaderboard from './pages/Leaderboard'
import RoomLobby from './pages/RoomLobby'
import RoomQuiz from './pages/RoomQuiz'
import RoomQuizHost from './pages/room/RoomQuizHost'
import RoomAnalytics from './pages/RoomAnalytics'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import Multiplayer from './pages/Multiplayer'
import DailyChallenge from './pages/DailyChallenge'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import ScheduledQuizCreate from './pages/ScheduledQuizCreate'
import ScheduledQuizDetail from './pages/ScheduledQuizDetail'
import ScheduledQuizPlay from './pages/ScheduledQuizPlay'
import GroupAnalytics from './pages/GroupAnalytics'
import QuizSetList from './pages/group/QuizSetList'
import QuizSetEditor from './pages/group/GroupQuizSetEditor'
import QuizSetDetail from './pages/group/QuizSetDetail'
import Tournaments from './pages/Tournaments'
import TournamentDetail from './pages/TournamentDetail'
import TournamentMatch from './pages/TournamentMatch'
import NotFound from './pages/NotFound'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Onboarding from './pages/Onboarding'
import { useOnboardingStore } from './store/onboardingStore'
import OnboardingTryQuiz from './pages/OnboardingTryQuiz'
import Journey from './pages/Journey'
import Help from './pages/Help'
import MySets from './pages/MySets'
import PersonalQuizSetEditor from './pages/PersonalQuizSetEditor'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Detect cross-tab localStorage changes for ranked data sync
initStorageSync()

// Handle session expiry from API client (logout + SPA redirect). Guarded
// against the re-entrant logout→sync-progress→refresh→expiry request loop.
installSessionExpiryHandler()

// Initialize auth state on app startup (replaces AuthProvider useEffect)
useAuthStore.getState().checkAuth()

/** Show LandingPage for guests, Home (inside AppLayout) for authenticated users.
 *  First-time visitors go to Onboarding instead of LandingPage. */
function HomeOrLanding() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const hasSeenOnboarding = useOnboardingStore(s => s.hasSeenOnboarding)
  if (isLoading) return null // wait for auth check
  if (!isAuthenticated) {
    if (!hasSeenOnboarding) return <Onboarding />
    return <LandingPage />
  }
  return <AppLayout />
}

// Native shell setup (status bar, splash, keyboard) — no-op on web.
initNative()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorProvider>
          <ToastProvider>
            <BrowserRouter>
              <CapacitorBackButton />
              <Routes>
                {/* PREVIEW-ONLY: coded mockup of the game-vibe Home redesign (v2).
                    Standalone (own chrome), no auth, no AppLayout. Remove after approval. */}
                <Route path="/home-khung-sang-preview" element={<HomeKhungSangMock />} />
                {/* "/" = LandingPage for guest, Home (with AppLayout) for authenticated */}
                <Route element={<HomeOrLanding />}>
                  <Route path="/" element={<Home />} />
                </Route>

                {/* Pages with AppLayout (sidebar + nav) — requires auth check already done */}
                <Route element={<AppLayout />}>
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  <Route path="/groups" element={<RequireAuth><Groups /></RequireAuth>} />
                  <Route path="/groups/:id" element={<RequireAuth><GroupDetail /></RequireAuth>} />
                  <Route path="/groups/:id/analytics" element={<RequireAuth><GroupAnalytics /></RequireAuth>} />
                  <Route path="/groups/:id/quiz-sets" element={<RequireAuth><QuizSetList /></RequireAuth>} />
                  <Route path="/groups/:id/quiz-sets/new" element={<RequireAuth><QuizSetEditor mode="create" /></RequireAuth>} />
                  <Route path="/groups/:id/quiz-sets/:setId/edit" element={<RequireAuth><QuizSetEditor mode="edit" /></RequireAuth>} />
                  <Route path="/groups/:id/quiz-sets/:setId" element={<RequireAuth><QuizSetDetail /></RequireAuth>} />
                  <Route path="/groups/:id/scheduled-quizzes/new" element={<RequireAuth><ScheduledQuizCreate /></RequireAuth>} />
                  <Route path="/groups/:id/scheduled-quizzes/:quizId" element={<RequireAuth><ScheduledQuizDetail /></RequireAuth>} />
                  <Route path="/groups/:id/scheduled-quizzes/:quizId/play" element={<RequireAuth><ScheduledQuizPlay /></RequireAuth>} />
                  <Route path="/tournaments" element={<RequireAuth><Tournaments /></RequireAuth>} />
                  <Route path="/tournaments/:id" element={<RequireAuth><TournamentDetail /></RequireAuth>} />
                  <Route path="/tournaments/:id/match/:matchId" element={<RequireAuth><TournamentMatch /></RequireAuth>} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/journey" element={<Journey />} />
                  <Route path="/cosmetics" element={<RequireAuth><Cosmetics /></RequireAuth>} />
                  <Route path="/weekly-quiz" element={<RequireAuth><WeeklyQuiz /></RequireAuth>} />
                  <Route path="/mystery-mode" element={<RequireAuth><MysteryMode /></RequireAuth>} />
                  <Route path="/speed-round" element={<RequireAuth><SpeedRound /></RequireAuth>} />
                  <Route path="/ranked" element={<Ranked />} />
                  <Route path="/basic-quiz" element={<RequireAuth><BasicQuiz /></RequireAuth>} />
                  <Route path="/daily" element={<DailyChallenge />} />
                  <Route path="/practice" element={<Practice />} />
                  <Route path="/review" element={<Review />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/multiplayer" element={<RequireAuth><Multiplayer /></RequireAuth>} />
                  <Route path="/rooms" element={<RequireAuth><Rooms /></RequireAuth>} />
                  <Route path="/room/create" element={<RequireAuth><CreateRoom /></RequireAuth>} />
                  <Route path="/room/join" element={<RequireAuth><JoinRoom /></RequireAuth>} />
                  <Route path="/my-sets" element={<RequireAuth><MySets /></RequireAuth>} />
                  <Route path="/my-sets/new" element={<RequireAuth><PersonalQuizSetEditor mode="create" /></RequireAuth>} />
                  <Route path="/my-sets/:setId/edit" element={<RequireAuth><PersonalQuizSetEditor mode="edit" /></RequireAuth>} />
                  {/* Back-compat: legacy /my-sets/:setId redirects users into the new editor. */}
                  <Route path="/my-sets/:setId" element={<RequireAuth><PersonalQuizSetEditor mode="edit" /></RequireAuth>} />
                </Route>

                {/* Public pages (no auth) */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/onboarding/try" element={<OnboardingTryQuiz />} />

                {/* Full-screen pages (no AppLayout) — immersive gameplay / auth / marketing */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/room/:roomId/lobby" element={<RequireAuth><RoomLobby /></RequireAuth>} />
                <Route path="/room/:roomId/quiz" element={<RequireAuth><RoomQuiz /></RequireAuth>} />
                {/* Sprint 4 (S4-8): Quan Tro spectator + control view. */}
                <Route path="/room/:roomId/host" element={<RequireAuth><RoomQuizHost /></RequireAuth>} />
                <Route path="/room/:roomId/analytics" element={<RequireAuth><RoomAnalytics /></RequireAuth>} />

                {/* Admin — web only; excluded from the mobile app bundle. */}
                {AdminRoutes && (
                  <Route
                    path="/admin/*"
                    element={
                      <React.Suspense fallback={null}>
                        <AdminRoutes />
                      </React.Suspense>
                    }
                  />
                )}

                {/* Catch-all 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </ErrorProvider>
      </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
)


