# Rebuild Mobile App — BibleQuiz React Native

> Làm lại từ đầu phần mobile (Expo + RN). 
> Claude Code phải kiểm tra designs có sẵn → HỎI LẠI nếu thiếu design cho screen nào.
> Paste vào Claude Code trong root project (monorepo).

---

## Mobile screens cần có (mapping từ SPEC_USER_v3)

Tổng cộng **34 screens** chia 6 nhóm:

| # | Screen | Group | Stitch design? |
|---|--------|-------|----------------|
| 1 | Splash / Loading | Onboarding | Cần check |
| 2 | Language Selection | Onboarding | ✅ Đã có |
| 3 | Welcome Slide 1 (Spark) | Onboarding | ✅ Đã có |
| 4 | Welcome Slide 2 (Together) | Onboarding | ✅ Đã có |
| 5 | Welcome Slide 3 (Journey) | Onboarding | ✅ Đã có |
| 6 | Try Quiz (3 câu) | Onboarding | ✅ Đã có |
| 7 | Try Quiz Result + CTA | Onboarding | ✅ Đã có |
| 8 | Login (Google OAuth) | Auth | Cần check |
| 9 | Home Dashboard | Main | Cần check |
| 10 | Practice Mode select | Quiz | Cần check |
| 11 | Quiz playing screen | Quiz | Cần check |
| 12 | Quiz Results | Quiz | Cần check |
| 13 | Quiz Review (xem lại câu sai) | Quiz | Cần check |
| 14 | Daily Challenge | Quiz | Cần check |
| 15 | Ranked Mode | Quiz | Cần check |
| 16 | Bible Journey Map (66 sách) | Progress | Cần check |
| 17 | Multiplayer Lobby | Multiplayer | Cần check |
| 18 | Create Room | Multiplayer | Cần check |
| 19 | Room Lobby (waiting) | Multiplayer | Cần check |
| 20 | Multiplayer Quiz playing | Multiplayer | Cần check |
| 21 | Multiplayer Results | Multiplayer | Cần check |
| 22 | Tournament Bracket | Multiplayer | Cần check |
| 23 | Leaderboard (Global/Friends/Group) | Social | Cần check |
| 24 | My Groups list | Social | Cần check |
| 25 | Group Detail (members + leaderboard + announcements) | Social | Cần check |
| 26 | Create/Join Group | Social | Cần check |
| 27 | Profile (own) | User | Cần check |
| 28 | Profile (other user) | User | Cần check |
| 29 | Achievements / Badges | User | Cần check |
| 30 | Settings | User | Cần check |
| 31 | Notifications list | System | Cần check |
| 32 | Tier Up celebration (modal/screen) | System | Cần check |
| 33 | Empty/Error states | System | Cần check |
| 34 | About / Privacy / Terms | System | Cần check |

---

## Prompt cho Claude Code

```
Làm lại toàn bộ mobile app BibleQuiz từ đầu (React Native + Expo).
Mobile cũ có nhiều vấn đề lõi → bỏ hẳn, làm sạch lại theo architecture đúng.

Tech stack:
- React Native + Expo SDK 51+
- TypeScript strict mode
- React Navigation 6 (bottom tabs + stacks)
- Zustand + TanStack Query
- AsyncStorage thay localStorage
- react-i18next (vi + en)
- expo-haptics, expo-av (sound), expo-notifications

QUY TẮC NGHIÊM NGẶT:
- Mỗi screen mới TRƯỚC KHI code phải check design có sẵn không
- Nếu CÓ design trong designs/mobile/ → code theo design
- Nếu KHÔNG CÓ design → DỪNG, hỏi user trước, KHÔNG được tự bịa design
- Logic đặt trong src/logic/ — KHÔNG để trong components
- Mỗi function logic phải có test
- Mỗi screen phải có snapshot test
- KHÔNG dùng localStorage, window.*, document.*
- KHÔNG dùng <div>, <span>, className= — chỉ <View>, <Text>, style=
- Mọi <img> phải là <Image> với dimension
- Mọi screen phải có SafeAreaView wrapper

═══════════════════════════════════════════
BƯỚC 0: CHECK DESIGNS — BẮT BUỘC TRƯỚC KHI CODE
═══════════════════════════════════════════

```bash
# List tất cả designs hiện có
ls -la designs/mobile/ 2>/dev/null || ls -la designs/onboarding/ 2>/dev/null
find designs/ -name "*.png" -o -name "*.jpg" 2>/dev/null
```

Mapping designs → screens. Mobile cần 34 screens (xem list trong PROMPT_MOBILE_REBUILD.md):

NHÓM A — Onboarding (7 screens):
- [ ] 01-splash.png — Splash/loading screen
- [ ] 02-language-selection.png ← có thể đã có từ Stitch
- [ ] 03-welcome-spark.png ← có thể đã có
- [ ] 04-welcome-together.png ← có thể đã có
- [ ] 05-welcome-journey.png ← có thể đã có
- [ ] 06-try-quiz.png ← có thể đã có
- [ ] 07-try-quiz-result.png ← có thể đã có

NHÓM B — Auth + Home (2 screens):
- [ ] 08-login.png — Google OAuth login
- [ ] 09-home.png — Home dashboard với streak, daily challenge, energy

NHÓM C — Quiz Core (6 screens):
- [ ] 10-practice-select.png — Chọn book + difficulty
- [ ] 11-quiz-playing.png — Câu hỏi, 4 đáp án, timer, progress
- [ ] 12-quiz-results.png — Score, accuracy, XP, share
- [ ] 13-quiz-review.png — Xem lại câu sai với explanation
- [ ] 14-daily-challenge.png — Daily 5 câu + leaderboard
- [ ] 15-ranked-mode.png — Energy bar, current book, season info

NHÓM D — Progress + Multiplayer (7 screens):
- [ ] 16-journey-map.png — Bible Journey Map 66 sách
- [ ] 17-multiplayer-lobby.png — List public rooms
- [ ] 18-create-room.png — Form tạo room
- [ ] 19-room-waiting.png — Lobby chờ players
- [ ] 20-multiplayer-quiz.png — Quiz với realtime leaderboard
- [ ] 21-multiplayer-results.png — Final ranking, MVP
- [ ] 22-tournament-bracket.png — Bracket view

NHÓM E — Social (4 screens):
- [ ] 23-leaderboard.png — Tabs: Global / Friends / Group
- [ ] 24-groups-list.png — My groups
- [ ] 25-group-detail.png — Group info, members, leaderboard, announcements
- [ ] 26-group-join.png — Create / Join với code

NHÓM F — User + System (8 screens):
- [ ] 27-profile-own.png — Own profile với stats, badges, journey
- [ ] 28-profile-other.png — Profile người khác (challenge button)
- [ ] 29-achievements.png — Badge grid (locked + unlocked)
- [ ] 30-settings.png — Settings menu
- [ ] 31-notifications.png — Notification list
- [ ] 32-tier-up.png — Tier up celebration modal
- [ ] 33-empty-states.png — Empty + error states samples
- [ ] 34-legal.png — Privacy / Terms / About template

In ra terminal:

```
=== MOBILE DESIGNS AUDIT ===

✅ Có design (X/34):
  - 02-language-selection.png
  - 03-welcome-spark.png
  ...

❌ Thiếu design (Y/34):
  - 01-splash.png
  - 09-home.png
  - 11-quiz-playing.png
  ...

→ DỪNG. Trước khi code, cần user cung cấp Y designs còn thiếu.
→ Hoặc user xác nhận: "Tự code không cần design" cho từng screen.
```

⚠️ DỪNG TẠI ĐÂY. Đợi user phản hồi:
- Option A: Cung cấp designs còn thiếu (Stitch hoặc Figma export)
- Option B: Cho phép code không design cho screens cụ thể (list ra)
- Option C: Code theo design system tồn tại + tự design screens đơn giản

═══════════════════════════════════════════
BƯỚC 1: SAU KHI USER CONFIRM DESIGNS
═══════════════════════════════════════════

Backup mobile cũ (nếu có):
```bash
mv apps/mobile apps/mobile-old-backup-$(date +%Y%m%d)
```

Tạo Expo project mới:
```bash
cd apps
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
```

Cài dependencies:
```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# State + data
npm install zustand @tanstack/react-query axios
npx expo install @react-native-async-storage/async-storage

# UI
npx expo install expo-haptics expo-av expo-notifications expo-image expo-font expo-splash-screen expo-status-bar
npx expo install react-native-gesture-handler react-native-reanimated

# i18n
npm install react-i18next i18next

# Auth
npx expo install expo-auth-session expo-crypto expo-web-browser
npm install @react-native-google-signin/google-signin

# Sentry
npx expo install @sentry/react-native

# WebSocket
npm install @stomp/stompjs sockjs-client

# Dev
npm install -D @types/react @types/react-native eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

═══════════════════════════════════════════
BƯỚC 2: ARCHITECTURE — TẠO STRUCTURE
═══════════════════════════════════════════

```
apps/mobile/
├── app.json                    # Expo config
├── App.tsx                     # Root
├── tsconfig.json               # Strict mode
├── babel.config.js
├── metro.config.js
├── .env.example
├── src/
│   ├── api/                    # API client + endpoints
│   │   ├── client.ts           # Axios instance + interceptors
│   │   ├── auth.ts
│   │   ├── quiz.ts
│   │   ├── user.ts
│   │   ├── groups.ts
│   │   └── multiplayer.ts
│   ├── stores/                 # Zustand
│   │   ├── authStore.ts
│   │   ├── settingsStore.ts
│   │   ├── onboardingStore.ts
│   │   └── quizStore.ts
│   ├── logic/                  # Pure business logic (testable)
│   │   ├── scoring.ts          # Scoring engine
│   │   ├── tierProgression.ts  # Tier calculation
│   │   ├── streaks.ts          # Streak logic
│   │   ├── timer.ts            # Quiz timer
│   │   ├── journey.ts          # Journey progress
│   │   └── __tests__/          # Tests cho logic
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useQuiz.ts
│   │   ├── useTimer.ts
│   │   ├── useHaptic.ts
│   │   ├── useSound.ts
│   │   └── useOnlineStatus.ts
│   ├── components/             # Reusable
│   │   ├── ui/                 # Base: Button, Card, Input, etc.
│   │   ├── quiz/               # QuestionCard, AnswerButton, Timer
│   │   ├── feedback/           # Toast, Loading, Empty, Error
│   │   ├── layout/             # SafeScreen wrapper
│   │   └── __tests__/
│   ├── screens/                # Screen components
│   │   ├── onboarding/
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── LanguageSelectionScreen.tsx
│   │   │   ├── WelcomeSlidesScreen.tsx
│   │   │   ├── TryQuizScreen.tsx
│   │   │   └── TryQuizResultScreen.tsx
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── main/
│   │   │   └── HomeScreen.tsx
│   │   ├── quiz/
│   │   │   ├── PracticeSelectScreen.tsx
│   │   │   ├── QuizScreen.tsx
│   │   │   ├── QuizResultsScreen.tsx
│   │   │   ├── QuizReviewScreen.tsx
│   │   │   ├── DailyChallengeScreen.tsx
│   │   │   └── RankedScreen.tsx
│   │   ├── progress/
│   │   │   └── JourneyMapScreen.tsx
│   │   ├── multiplayer/
│   │   │   ├── MultiplayerLobbyScreen.tsx
│   │   │   ├── CreateRoomScreen.tsx
│   │   │   ├── RoomWaitingScreen.tsx
│   │   │   ├── MultiplayerQuizScreen.tsx
│   │   │   ├── MultiplayerResultsScreen.tsx
│   │   │   └── TournamentBracketScreen.tsx
│   │   ├── social/
│   │   │   ├── LeaderboardScreen.tsx
│   │   │   ├── GroupsListScreen.tsx
│   │   │   ├── GroupDetailScreen.tsx
│   │   │   └── GroupJoinScreen.tsx
│   │   ├── user/
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── OtherProfileScreen.tsx
│   │   │   ├── AchievementsScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   ├── system/
│   │   │   ├── NotificationsScreen.tsx
│   │   │   ├── TierUpScreen.tsx
│   │   │   └── LegalScreen.tsx
│   │   └── __tests__/          # Snapshot tests
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── OnboardingNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   └── types.ts            # Navigation type definitions
│   ├── theme/
│   │   ├── colors.ts           # #11131e, #e8a832, etc.
│   │   ├── typography.ts       # Font sizes, weights
│   │   ├── spacing.ts          # 4, 8, 12, 16, 24, 32
│   │   └── index.ts
│   ├── i18n/
│   │   ├── index.ts            # i18next setup
│   │   ├── vi.json
│   │   └── en.json
│   ├── utils/
│   │   ├── format.ts           # Date, number formatters
│   │   ├── validators.ts
│   │   └── constants.ts        # API URLs, etc.
│   ├── ws/                     # WebSocket
│   │   ├── client.ts           # STOMP client
│   │   └── handlers.ts
│   └── types/                  # TypeScript types
│       ├── api.ts
│       ├── models.ts           # Question, User, Group, etc.
│       └── navigation.ts
└── assets/
    ├── fonts/                  # Inter, Crimson Pro
    ├── sounds/                 # 15 SFX files
    ├── images/
    └── icons/
```

Tạo theo thứ tự:
1. Theme system (colors, typography, spacing)
2. API client + types
3. Stores (auth, settings)
4. Navigation skeleton
5. Logic modules + tests
6. Components UI base
7. Screens (theo nhóm A → F)

Mỗi nhóm commit riêng.

═══════════════════════════════════════════
BƯỚC 3: THEME SYSTEM
═══════════════════════════════════════════

```typescript
// src/theme/colors.ts
export const colors = {
  // Background
  bgPrimary: '#11131e',
  bgSecondary: '#1a1d2e',
  bgCard: 'rgba(255,255,255,0.05)',
  
  // Accent (Sacred Modernist gold)
  gold: '#e8a832',
  goldLight: '#f0bc56',
  goldDark: '#c08818',
  
  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Text
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  textDisabled: 'rgba(255,255,255,0.2)',
  
  // Border
  borderDefault: 'rgba(255,255,255,0.1)',
  borderActive: '#e8a832',
  
  // Tier colors
  tierSpark: '#9ca3af',     // Tia Sáng
  tierDawn: '#60a5fa',      // Ánh Bình Minh
  tierLamp: '#3b82f6',      // Ngọn Đèn
  tierFlame: '#a855f7',     // Ngọn Lửa
  tierStar: '#eab308',      // Ngôi Sao
  tierGlory: '#ef4444',     // Vinh Quang
}

// src/theme/typography.ts
export const typography = {
  // Font families
  inter: 'Inter',
  crimson: 'CrimsonPro',
  
  // Sizes
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 56,
  },
  
  // Weights
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
}

// src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
}
```

Commit: "feat: theme system (colors, typography, spacing)"

═══════════════════════════════════════════
BƯỚC 4: API CLIENT (mobile-specific endpoints)
═══════════════════════════════════════════

```typescript
// src/api/client.ts
import axios, { AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// QUAN TRỌNG: Android emulator dùng 10.0.2.2 thay vì localhost
const getBaseURL = () => {
  if (__DEV__) {
    return Platform.OS === 'android' 
      ? 'http://10.0.2.2:8080'
      : 'http://localhost:8080'
  }
  return process.env.EXPO_PUBLIC_API_URL || 'https://api.biblequiz.app'
}

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — refresh token + error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Try refresh token
      const refreshToken = await AsyncStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${getBaseURL()}/api/auth/mobile/refresh`, { refreshToken })
          await AsyncStorage.setItem('accessToken', data.accessToken)
          // Retry original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${data.accessToken}`
            return apiClient.request(error.config)
          }
        } catch {
          // Refresh failed → logout
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken'])
          // Navigate to login (handled by RootNavigator)
        }
      }
    }
    return Promise.reject(error)
  }
)
```

Mobile auth endpoints (KHÁC web):
- `POST /api/auth/mobile/google` { idToken } → { accessToken, refreshToken, user }
- `POST /api/auth/mobile/refresh` { refreshToken } → { accessToken, refreshToken }
- `POST /api/auth/mobile/login` { email, password } → tokens in body

Commit: "feat: API client with mobile-specific auth + retry logic"

═══════════════════════════════════════════
BƯỚC 5: STORES (Zustand + AsyncStorage persist)
═══════════════════════════════════════════

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setAuth: (user, accessToken, refreshToken) => 
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      
      logout: () => 
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      
      updateUser: (updates) => 
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

Tạo tương tự: settingsStore, onboardingStore, quizStore.

Commit: "feat: Zustand stores with AsyncStorage persistence"

═══════════════════════════════════════════
BƯỚC 6: NAVIGATION SKELETON
═══════════════════════════════════════════

```typescript
// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useAuthStore } from '@/stores/authStore'
import { OnboardingNavigator } from './OnboardingNavigator'
import { AuthNavigator } from './AuthNavigator'
import { MainTabNavigator } from './MainTabNavigator'

export const RootNavigator = () => {
  const hasSeenOnboarding = useOnboardingStore(s => s.hasSeenOnboarding)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  
  return (
    <NavigationContainer>
      {!hasSeenOnboarding ? (
        <OnboardingNavigator />
      ) : !isAuthenticated ? (
        <AuthNavigator />
      ) : (
        <MainTabNavigator />
      )}
    </NavigationContainer>
  )
}

// src/navigation/MainTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const Tab = createBottomTabNavigator()

export const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#11131e', borderTopColor: 'rgba(255,255,255,0.1)' },
      tabBarActiveTintColor: '#e8a832',
      tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
    }}
  >
    <Tab.Screen name="Home" component={HomeStackNavigator} />
    <Tab.Screen name="Quiz" component={QuizStackNavigator} />
    <Tab.Screen name="Multiplayer" component={MultiplayerStackNavigator} />
    <Tab.Screen name="Groups" component={GroupsStackNavigator} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} />
  </Tab.Navigator>
)
```

Commit: "feat: navigation structure with conditional flows"

═══════════════════════════════════════════
BƯỚC 7: LOGIC MODULES + TESTS
═══════════════════════════════════════════

Tạo pure functions trong src/logic/ — KHÔNG dependencies vào React/RN:

```typescript
// src/logic/scoring.ts
export interface ScoreInput {
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  isCorrect: boolean
  elapsedMs: number
  timeLimitMs: number
  comboCount: number
  tierMultiplier: number
}

export const calculateScore = (input: ScoreInput): number => {
  if (!input.isCorrect) return 0
  
  const basePoints = { EASY: 8, MEDIUM: 12, HARD: 18 }[input.difficulty]
  
  // Speed bonus (non-linear)
  const speedRatio = (input.timeLimitMs - input.elapsedMs) / input.timeLimitMs
  const speedBonus = Math.floor(basePoints * 0.5 * speedRatio * speedRatio)
  
  // Combo multiplier
  let comboMultiplier = 1.0
  if (input.comboCount >= 10) comboMultiplier = 1.5
  else if (input.comboCount >= 5) comboMultiplier = 1.2
  
  return Math.floor((basePoints + speedBonus) * comboMultiplier * input.tierMultiplier)
}

// src/logic/__tests__/scoring.test.ts
describe('calculateScore', () => {
  it('returns 0 for wrong answer', () => {
    expect(calculateScore({
      difficulty: 'MEDIUM', isCorrect: false, elapsedMs: 0,
      timeLimitMs: 30000, comboCount: 0, tierMultiplier: 1.0
    })).toBe(0)
  })
  
  it('calculates basic correct score', () => {
    expect(calculateScore({
      difficulty: 'MEDIUM', isCorrect: true, elapsedMs: 30000,
      timeLimitMs: 30000, comboCount: 0, tierMultiplier: 1.0
    })).toBe(12)
  })
  
  it('applies speed bonus for fast answers', () => {
    expect(calculateScore({
      difficulty: 'MEDIUM', isCorrect: true, elapsedMs: 6000,
      timeLimitMs: 30000, comboCount: 0, tierMultiplier: 1.0
    })).toBeGreaterThan(12)
  })
  
  it('applies combo multiplier at 5+', () => {
    const base = calculateScore({
      difficulty: 'MEDIUM', isCorrect: true, elapsedMs: 30000,
      timeLimitMs: 30000, comboCount: 0, tierMultiplier: 1.0
    })
    const combo5 = calculateScore({
      difficulty: 'MEDIUM', isCorrect: true, elapsedMs: 30000,
      timeLimitMs: 30000, comboCount: 5, tierMultiplier: 1.0
    })
    expect(combo5).toBeGreaterThan(base)
  })
  
  // More tests...
})
```

Tạo logic + tests cho:
- scoring.ts (8+ tests)
- tierProgression.ts (10+ tests — difficulty distribution, multipliers, unlocks)
- streaks.ts (6+ tests — calculation, freeze logic)
- timer.ts (4+ tests)
- journey.ts (8+ tests — mastery calculation, milestones)

Commit: "feat: logic modules with full test coverage"

═══════════════════════════════════════════
BƯỚC 8: COMPONENTS UI BASE
═══════════════════════════════════════════

Tạo components reusable theo design system:

```typescript
// src/components/ui/Button.tsx
import { Pressable, Text, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { colors, typography, spacing } from '@/theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

export const Button = ({ title, onPress, variant = 'primary', size = 'md', disabled, loading, icon }: ButtonProps) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }
  
  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, styles[`text_${variant}`]]}>
        {loading ? 'Đang tải...' : title}
      </Text>
    </Pressable>
  )
}
```

Tạo components:
- Button (primary, secondary, outline)
- Card (glassmorphism)
- Input (text field with label)
- Avatar (with size variants + fallback)
- Badge (tier badge, status badge)
- TierBadge (per-tier color)
- Skeleton (loading placeholder)
- EmptyState (icon + title + description + action)
- ErrorState
- Toast (success/error/info)
- Modal (bottom sheet + center modal)
- ProgressBar
- StreakBadge

Commit: "feat: UI base components"

═══════════════════════════════════════════
BƯỚC 9: SCREENS THEO NHÓM
═══════════════════════════════════════════

Sau khi user confirm có designs, code từng nhóm:

NHÓM A — Onboarding:
- Đọc designs/mobile/01-07.png
- Implement 7 screens
- Test flow đầy đủ
- Commit: "feat: onboarding screens (group A)"

NHÓM B — Auth + Home:
- Đọc designs/mobile/08-09.png
- LoginScreen với Google Sign-In
- HomeScreen với daily challenge, streak, energy
- Commit: "feat: auth + home (group B)"

NHÓM C — Quiz Core:
- Đọc designs/mobile/10-15.png
- 6 quiz-related screens
- Commit: "feat: quiz screens (group C)"

NHÓM D — Progress + Multiplayer:
- Đọc designs/mobile/16-22.png
- 7 screens
- Commit: "feat: multiplayer screens (group D)"

NHÓM E — Social:
- Đọc designs/mobile/23-26.png
- 4 screens
- Commit: "feat: social screens (group E)"

NHÓM F — User + System:
- Đọc designs/mobile/27-34.png
- 8 screens
- Commit: "feat: user + system screens (group F)"

QUAN TRỌNG: Trước mỗi screen, view design file. Code MATCH design 100%. Nếu design không rõ → hỏi user.

═══════════════════════════════════════════
BƯỚC 10: TESTS + VERIFY
═══════════════════════════════════════════

```bash
# TypeScript check
npx tsc --noEmit
# Phải 0 errors

# Run tests
npm test
# Logic tests + snapshot tests phải pass

# Lint
npx eslint src/
# Phải 0 errors

# Build check
npx expo prebuild
npx expo run:android  # hoặc ios
```

Manual test:
- [ ] Onboarding flow đầy đủ
- [ ] Login với Google
- [ ] Home page render đúng
- [ ] Practice quiz hoàn thành
- [ ] Daily challenge hoạt động
- [ ] Multiplayer room create + join
- [ ] Profile + settings
- [ ] Language switch vi ↔ en
- [ ] Sound + haptic feedback
- [ ] Offline detection

═══════════════════════════════════════════

## Tổng kết effort

| Bước | Thời gian |
|------|-----------|
| Bước 0: Audit designs + hỏi user | 30 phút |
| Bước 1-2: Setup + structure | 2 giờ |
| Bước 3: Theme | 1 giờ |
| Bước 4-5: API + stores | 3 giờ |
| Bước 6: Navigation | 2 giờ |
| Bước 7: Logic + tests | 4 giờ |
| Bước 8: UI components | 6 giờ |
| Bước 9: Screens (34 screens × ~30 phút) | 17 giờ |
| Bước 10: Tests + verify | 4 giờ |
| **Tổng** | **~40 giờ (~5 ngày)** |

NHỚ: Stop tại Bước 0 nếu thiếu designs. KHÔNG được tự code không có design.
```
