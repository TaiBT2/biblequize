# React Native — BibleQuiz Mobile App

> Chia thành 6 phases. Paste từng phase vào Claude Code.
> Design giữ nguyên Sacred Modernist (dark theme, gold accent).
> API backend giữ nguyên — không thay đổi.
> Reuse: types, API client, stores, business logic từ web.

---

## Phase 0: Project Setup + Architecture

```
Tạo React Native project cho BibleQuiz mobile app.

### Task 1: Init project

```bash
# Dùng React Native CLI (không dùng Expo — cần native modules cho WebSocket, push)
npx react-native@latest init BibleQuizMobile --template react-native-template-typescript

# Hoặc nếu muốn Expo (dễ hơn cho prototype):
npx create-expo-app BibleQuizMobile --template expo-template-blank-typescript
```

Recommend: Expo cho giai đoạn đầu (dễ setup, dễ test). Migrate sang bare workflow sau nếu cần.

### Task 2: Install dependencies

```bash
cd BibleQuizMobile

# Navigation
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# State management (same as web)
npm install zustand @tanstack/react-query axios

# UI
npm install react-native-reanimated react-native-gesture-handler
npm install react-native-svg
npm install react-native-linear-gradient  # hoặc expo-linear-gradient
npm install @react-native-async-storage/async-storage

# i18n (same as web)
npm install react-i18next i18next

# Push notifications
npm install @react-native-firebase/app @react-native-firebase/messaging
# Hoặc expo-notifications nếu Expo

# Haptics
npm install expo-haptics  # hoặc react-native-haptic-feedback

# Icons
npm install react-native-vector-icons
# Hoặc @expo/vector-icons nếu Expo

# WebSocket (cho multiplayer)
# React Native có WebSocket built-in, nhưng cần STOMP client:
npm install @stomp/stompjs sockjs-client
```

### Task 3: Project structure

```
BibleQuizMobile/
├── src/
│   ├── api/                    # ← COPY từ web (axios config, types)
│   │   ├── client.ts           # API client config
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── endpoints.ts        # API endpoint definitions
│   │   └── queries/            # TanStack Query hooks
│   │       ├── useQuiz.ts
│   │       ├── useAuth.ts
│   │       ├── useLeaderboard.ts
│   │       └── ...
│   ├── stores/                 # ← COPY từ web (Zustand stores)
│   │   ├── authStore.ts        # Auth state (thay localStorage → AsyncStorage)
│   │   └── settingsStore.ts
│   ├── utils/                  # ← COPY từ web (business logic)
│   │   ├── scoring.ts          # Score calculation
│   │   ├── tiers.ts            # Tier definitions
│   │   ├── format.ts           # Date/number formatting
│   │   └── bookNames.ts        # Bible book names bilingual
│   ├── i18n/                   # ← COPY từ web
│   │   ├── index.ts
│   │   ├── vi.json
│   │   └── en.json
│   ├── theme/                  # NEW — React Native design system
│   │   ├── colors.ts           # Sacred Modernist colors
│   │   ├── typography.ts       # Font sizes, families
│   │   ├── spacing.ts          # Spacing scale
│   │   └── shadows.ts          # Shadow definitions
│   ├── components/             # NEW — Reusable RN components
│   │   ├── GlassCard.tsx
│   │   ├── GoldButton.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Timer.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── PageMeta.tsx
│   │   └── ...
│   ├── navigation/             # NEW — React Navigation
│   │   ├── RootNavigator.tsx   # Auth check → Login or Main
│   │   ├── MainTabs.tsx        # Bottom tab bar (5 tabs)
│   │   ├── HomeStack.tsx
│   │   ├── QuizStack.tsx
│   │   ├── GroupStack.tsx
│   │   └── ProfileStack.tsx
│   ├── screens/                # NEW — All screens (rewrite from web pages)
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── quiz/
│   │   │   ├── PracticeScreen.tsx
│   │   │   ├── RankedScreen.tsx
│   │   │   ├── DailyChallengeScreen.tsx
│   │   │   ├── QuizScreen.tsx
│   │   │   ├── QuizResultsScreen.tsx
│   │   │   └── ReviewScreen.tsx
│   │   ├── multiplayer/
│   │   │   ├── MultiplayerScreen.tsx
│   │   │   ├── CreateRoomScreen.tsx
│   │   │   ├── RoomLobbyScreen.tsx
│   │   │   └── RoomQuizScreen.tsx
│   │   ├── social/
│   │   │   ├── LeaderboardScreen.tsx
│   │   │   ├── GroupsScreen.tsx
│   │   │   ├── GroupDetailScreen.tsx
│   │   │   ├── TournamentsScreen.tsx
│   │   │   └── TournamentDetailScreen.tsx
│   │   ├── profile/
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── AchievementsScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   └── common/
│   │       └── NotFoundScreen.tsx
│   └── App.tsx
├── android/
├── ios/
├── assets/
│   └── fonts/
│       └── BeVietnamPro-*.ttf
├── app.json
├── package.json
└── tsconfig.json
```

### Task 4: Design System — Sacred Modernist cho RN

```typescript
// src/theme/colors.ts
export const colors = {
  // Background
  bg: {
    primary: '#11131e',
    secondary: '#1a1d2e',
    card: 'rgba(50, 52, 64, 0.6)',
    cardSolid: '#323440',
  },
  // Text
  text: {
    primary: '#e1e1f1',
    secondary: 'rgba(225, 225, 241, 0.7)',
    muted: 'rgba(225, 225, 241, 0.4)',
    dark: '#1a1d2e',
  },
  // Accent
  gold: '#e8a832',
  goldLight: 'rgba(232, 168, 50, 0.15)',
  // Status
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  // Tiers
  tier: {
    spark: '#9ca3af',
    dawn: '#60a5fa',
    lamp: '#3b82f6',
    flame: '#a855f7',
    star: '#eab308',
    glory: '#ef4444',
  },
}

// src/theme/typography.ts
export const typography = {
  fontFamily: {
    regular: 'BeVietnamPro-Regular',
    medium: 'BeVietnamPro-Medium',
    semiBold: 'BeVietnamPro-SemiBold',
    bold: 'BeVietnamPro-Bold',
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
}

// src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
}
```

### Task 5: Copy reusable code từ web

```bash
# Copy types
cp apps/web/src/api/types.ts BibleQuizMobile/src/api/types.ts

# Copy API endpoints (adjust base URL)
cp apps/web/src/api/endpoints.ts BibleQuizMobile/src/api/endpoints.ts

# Copy Zustand stores (thay localStorage → AsyncStorage)
cp apps/web/src/stores/authStore.ts BibleQuizMobile/src/stores/authStore.ts

# Copy business logic
cp apps/web/src/utils/scoring.ts BibleQuizMobile/src/utils/scoring.ts
cp apps/web/src/utils/tiers.ts BibleQuizMobile/src/utils/tiers.ts
cp apps/web/src/data/bookNames.ts BibleQuizMobile/src/utils/bookNames.ts

# Copy i18n
cp apps/web/src/i18n/*.json BibleQuizMobile/src/i18n/
cp apps/web/src/i18n/index.ts BibleQuizMobile/src/i18n/index.ts

# Copy TanStack Query hooks
cp -r apps/web/src/api/queries/ BibleQuizMobile/src/api/queries/
```

Sau khi copy — sửa imports:
```typescript
// authStore.ts — thay localStorage → AsyncStorage
// TRƯỚC (web):
localStorage.setItem('token', token)
// SAU (RN):
import AsyncStorage from '@react-native-async-storage/async-storage'
await AsyncStorage.setItem('token', token)
```

### Task 6: API Client cho RN

```typescript
// src/api/client.ts
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const API_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api'    // Android emulator → host machine
    : 'http://localhost:8080/api'    // iOS simulator
  : 'https://api.biblequiz.app/api'  // Production

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// Interceptor — attach JWT token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor — handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token')
      // Navigate to login
    }
    return Promise.reject(error)
  }
)
```

Commit: "feat: RN project setup + design system + reusable code"
```

---

## Phase 1: Navigation + Auth

```
Setup React Navigation + Login flow.

### Task 1: Root Navigator

```typescript
// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from '../stores/authStore'
import { MainTabs } from './MainTabs'
import { LoginScreen } from '../screens/auth/LoginScreen'

const Stack = createNativeStackNavigator()

export const RootNavigator = () => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

### Task 2: Bottom Tab Bar (5 tabs)

```typescript
// src/navigation/MainTabs.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { colors } from '../theme/colors'
import { HomeStack } from './HomeStack'
import { QuizStack } from './QuizStack'
import { DailyChallengeScreen } from '../screens/quiz/DailyChallengeScreen'
import { GroupStack } from './GroupStack'
import { ProfileStack } from './ProfileStack'
import { useTranslation } from 'react-i18next'

const Tab = createBottomTabNavigator()

export const MainTabs = () => {
  const { t } = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.secondary,
          borderTopColor: 'rgba(255,255,255,0.05)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: t('nav.home'),
          tabBarIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="RankedTab"
        component={QuizStack}
        options={{
          tabBarLabel: t('nav.ranked'),
          tabBarIcon: ({ color, size }) => <Icon name="sword-cross" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="DailyTab"
        component={DailyChallengeScreen}
        options={{
          tabBarLabel: t('nav.daily'),
          tabBarIcon: ({ color, size }) => <Icon name="calendar-today" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="GroupsTab"
        component={GroupStack}
        options={{
          tabBarLabel: t('nav.groups'),
          tabBarIcon: ({ color, size }) => <Icon name="account-group" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: t('nav.profile'),
          tabBarIcon: ({ color, size }) => <Icon name="account" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}
```

### Task 3: Stack navigators

```typescript
// src/navigation/HomeStack.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

export const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
    <Stack.Screen name="Achievements" component={AchievementsScreen} />
  </Stack.Navigator>
)

// src/navigation/QuizStack.tsx
export const QuizStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Ranked" component={RankedScreen} />
    <Stack.Screen name="Practice" component={PracticeScreen} />
    <Stack.Screen name="Multiplayer" component={MultiplayerScreen} />
    <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
    <Stack.Screen name="RoomLobby" component={RoomLobbyScreen} />
    <Stack.Screen name="Quiz" component={QuizScreen} />
    <Stack.Screen name="QuizResults" component={QuizResultsScreen} />
    <Stack.Screen name="Review" component={ReviewScreen} />
  </Stack.Navigator>
)

// src/navigation/GroupStack.tsx
export const GroupStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Groups" component={GroupsScreen} />
    <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
    <Stack.Screen name="Tournaments" component={TournamentsScreen} />
    <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
  </Stack.Navigator>
)

// src/navigation/ProfileStack.tsx
export const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
)
```

### Task 4: Login Screen

```typescript
// src/screens/auth/LoginScreen.tsx
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { useTranslation } from 'react-i18next'

export const LoginScreen = () => {
  const { t } = useTranslation()

  const handleGoogleLogin = async () => {
    // Google OAuth flow cho RN
    // Dùng @react-native-google-signin/google-signin
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.logo}>✝</Text>
        <Text style={styles.title}>BibleQuiz</Text>
        <Text style={styles.subtitle}>
          {t('home.verse')}
        </Text>

        {/* Login buttons */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
          <Text style={styles.googleText}>{t('auth.loginWith', { provider: 'Google' })}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { fontSize: 64, color: colors.gold, marginBottom: 16 },
  title: { fontSize: 42, fontFamily: typography.fontFamily.bold, color: colors.gold, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.text.secondary, textAlign: 'center', marginBottom: 48, paddingHorizontal: 32 },
  googleButton: {
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32,
    flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center',
  },
  googleText: { fontSize: 16, fontFamily: typography.fontFamily.semiBold, color: '#333' },
})
```

Commit: "feat: navigation + auth flow"
```

---

## Phase 2: Core Screens — Home + Quiz

```
Build Home Dashboard + Quiz gameplay (2 screens quan trọng nhất).

### Task 1: Reusable Components

Tạo GlassCard, GoldButton, Avatar, Badge, Timer, ProgressBar.

Mỗi component dùng StyleSheet.create(), KHÔNG dùng Tailwind (RN không có Tailwind native — dùng NativeWind nếu muốn, nhưng StyleSheet đơn giản hơn cho RN).

```typescript
// src/components/GlassCard.tsx
import { View, StyleSheet, ViewProps } from 'react-native'
import { colors } from '../theme/colors'

interface GlassCardProps extends ViewProps {
  children: React.ReactNode
}

export const GlassCard = ({ children, style, ...props }: GlassCardProps) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
)

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
})

// src/components/GoldButton.tsx
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import * as Haptics from 'expo-haptics'

interface GoldButtonProps {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline'
}

export const GoldButton = ({ title, onPress, loading, disabled, variant = 'primary' }: GoldButtonProps) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'outline' && styles.outline,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.gold : colors.bg.primary} />
      ) : (
        <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,  // Touch target 48dp
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontFamily: typography.fontFamily.semiBold, color: colors.bg.primary },
  outlineText: { color: colors.gold },
})
```

### Task 2: Home Screen

Dựa trên web Home.tsx — convert sang RN:
- ScrollView (pull-to-refresh)
- Greeting + streak
- Daily challenge card
- Energy bar
- Game mode cards (vertical list thay vì 2x2 grid)
- Mini leaderboard
- Activity feed

```typescript
// src/screens/home/HomeScreen.tsx
// Tham chiếu apps/web/src/pages/Home.tsx — giữ nguyên layout logic
// Thay <div> → <View>, <span> → <Text>, <button> → <TouchableOpacity>
// Thay className → StyleSheet
// Thay useNavigate → useNavigation
// Thay TanStack Query hooks → giữ nguyên (đã copy)
```

### Task 3: Quiz Screen

Dựa trên web Quiz.tsx — convert sang RN:
- Full screen, no tab bar
- Timer circle (SVG hoặc Reanimated)
- Question text (center)
- 4 answer buttons (vertical stack, min height 56dp)
- Haptic feedback khi tap (đúng = light, sai = heavy)
- Progress bar trên top

```typescript
// src/screens/quiz/QuizScreen.tsx
// Key differences from web:
// 1. Haptics.impactAsync() khi chọn đáp án
// 2. StatusBar hidden khi đang quiz
// 3. Back gesture disabled (Android)
// 4. Answer buttons min 56dp height, 12dp spacing
```

Commit: "feat: Home + Quiz screens"
```

---

## Phase 3: Quiz Results + Practice + Daily + Ranked

```
Build remaining quiz-related screens.

### Task 1: QuizResults Screen
- Score summary (big number)
- Grade text (Xuất sắc / Tốt / Cố gắng thêm)
- XP gained animation
- Review button, Play Again, Share, Home
- Confetti animation (react-native-reanimated)

### Task 2: Review Screen
- Filter tabs (All / Wrong / Correct)
- FlatList of questions
- Expand → show explanation
- Bookmark button

### Task 3: Practice Screen
- Book selector (FlatList hoặc Picker)
- Difficulty selector
- Question count slider
- Language selector
- Start button

### Task 4: Ranked Screen
- Energy display (circular progress)
- Season info
- Tier progress bar
- Start Ranked button

### Task 5: Daily Challenge Screen
- Today's challenge card
- Countdown timer to next
- "Better than X%" comparison
- Daily leaderboard

Commit: "feat: QuizResults + Practice + Daily + Ranked screens"
```

---

## Phase 4: Multiplayer + WebSocket

```
Build multiplayer screens + WebSocket integration.

### Task 1: WebSocket client cho RN

```typescript
// src/api/websocket.ts
import { Client } from '@stomp/stompjs'
import AsyncStorage from '@react-native-async-storage/async-storage'

// React Native có WebSocket built-in
Object.assign(global, { WebSocket: global.WebSocket })

export const createStompClient = async (roomId: string) => {
  const token = await AsyncStorage.getItem('token')
  const wsUrl = __DEV__
    ? 'ws://10.0.2.2:8080/ws'
    : 'wss://api.biblequiz.app/ws'

  const client = new Client({
    brokerURL: wsUrl,
    connectHeaders: { Authorization: `Bearer ${token}` },
    onConnect: () => {
      client.subscribe(`/topic/room/${roomId}`, (message) => {
        const data = JSON.parse(message.body)
        // Handle room events
      })
    },
  })

  client.activate()
  return client
}
```

### Task 2: Multiplayer Screen — room list + join
### Task 3: CreateRoom Screen — form
### Task 4: RoomLobby Screen — waiting room
### Task 5: RoomQuiz Screen — realtime quiz (4 game modes)

Commit: "feat: multiplayer screens + WebSocket"
```

---

## Phase 5: Social Screens

```
Build Leaderboard, Groups, Tournaments, Profile, Achievements.

### Task 1: Leaderboard Screen
- Tab bar: Today / Weekly / All Time
- FlatList with rank cards (not table)
- "You" highlight
- Pull-to-refresh

### Task 2: Groups Screen
- My groups list (FlatList)
- Join group (code input)
- Create group button

### Task 3: GroupDetail Screen
- Header: group name, member count
- Tabs: Leaderboard / Members / Announcements
- Tournament section

### Task 4: Tournaments Screen
- Active / Upcoming / Past tabs
- Tournament bracket view

### Task 5: Profile Screen
- Avatar + name + tier badge
- Stats grid (points, streak, sessions)
- Activity heatmap (simplified for mobile)
- Badges grid

### Task 6: Achievements Screen
- Badge grid (unlocked / locked)
- Progress indicators

### Task 7: Settings Screen
- UI Language toggle
- Quiz Language toggle
- Notification preferences
- Dark mode (always on — Sacred Modernist)
- About / Logout

Commit: "feat: social + profile screens"
```

---

## Phase 6: Native Features + Polish

```
Push notifications, deep links, app icon, splash screen, store preparation.

### Task 1: Push Notifications (Firebase)

```typescript
// src/services/pushNotification.ts
import messaging from '@react-native-firebase/messaging'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiClient } from '../api/client'

export const setupPushNotifications = async () => {
  // Request permission
  const authStatus = await messaging().requestPermission()
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED

  if (enabled) {
    // Get FCM token
    const fcmToken = await messaging().getToken()
    
    // Send to backend
    await apiClient.post('/me/devices', { fcmToken, platform: Platform.OS })
    
    // Save locally
    await AsyncStorage.setItem('fcmToken', fcmToken)
  }

  // Handle notifications
  messaging().onMessage(async remoteMessage => {
    // Foreground notification
    // Show local notification
  })

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    // Background notification
  })
}
```

Notification types:
- Streak warning: "Streak sắp gãy! Còn 2 giờ"
- Daily challenge: "Thử thách hôm nay đã sẵn sàng"
- Group invite: "Bạn được mời vào nhóm X"
- Tournament start: "Giải đấu bắt đầu trong 5 phút"

### Task 2: Deep Links

```typescript
// App.tsx
const linking = {
  prefixes: ['biblequiz://', 'https://biblequiz.app'],
  config: {
    screens: {
      Main: {
        screens: {
          DailyTab: 'daily',
          GroupsTab: {
            screens: {
              GroupDetail: 'groups/:id',
            },
          },
        },
      },
      Login: 'login',
    },
  },
}

<NavigationContainer linking={linking}>
```

### Task 3: App Icon + Splash Screen

```bash
# App icon: 1024x1024 PNG
# Splash screen: Sacred Modernist dark bg + BibleQuiz gold logo

# Expo:
# app.json → icon, splash config

# Bare RN:
# Android: android/app/src/main/res/mipmap-*
# iOS: ios/BibleQuizMobile/Images.xcassets/AppIcon.appiconset
```

### Task 4: Font setup

```bash
# Copy Be Vietnam Pro font files
cp assets/fonts/BeVietnamPro-*.ttf BibleQuizMobile/assets/fonts/

# Expo: app.json → fonts
# Bare RN: npx react-native-asset
```

### Task 5: Build + Test

```bash
# Android
npx react-native run-android
# hoặc: npx expo run:android

# iOS (cần Mac)
npx react-native run-ios
# hoặc: npx expo run:ios
```

### Task 6: Store preparation

Google Play:
- App name: "BibleQuiz"
- Short description (80 chars): "Học Kinh Thánh qua quiz & thi đấu. 4,000+ câu hỏi. Miễn phí."
- Full description (4000 chars)
- Screenshots: 2-8 screenshots per device type
- Feature graphic: 1024x500
- Content rating: Everyone
- Category: Education
- Privacy policy URL

Apple App Store:
- App name, subtitle
- Keywords (100 chars)
- Description
- Screenshots: 6.7", 6.5", 5.5" devices
- App Preview (optional video)
- Age rating: 4+
- Category: Education / Trivia

Commit: "feat: native features + store preparation"
```

---

## Tóm tắt Phases:

| Phase | Nội dung | Effort |
|-------|----------|--------|
| 0 | Project setup + architecture + design system | 2-3 ngày |
| 1 | Navigation + Auth (Login, tab bar, stacks) | 2-3 ngày |
| 2 | Home + Quiz screens (core gameplay) | 3-5 ngày |
| 3 | Results + Practice + Daily + Ranked | 3-4 ngày |
| 4 | Multiplayer + WebSocket | 4-5 ngày |
| 5 | Social screens (Leaderboard, Groups, Profile) | 4-5 ngày |
| 6 | Native features + Polish + Store | 3-4 ngày |
| **TỔNG** | **33 screens** | **~5-7 tuần** |

## Code reuse từ web:
- TypeScript types/interfaces → 100% reuse
- API client config → 90% reuse (thay localStorage → AsyncStorage)
- Zustand stores → 90% reuse
- TanStack Query hooks → 80% reuse
- Business logic (scoring, tiers) → 100% reuse
- i18n files → 100% reuse
- JSX markup → 0% reuse (viết lại hết)
- Styling → 0% reuse (Tailwind → StyleSheet)
