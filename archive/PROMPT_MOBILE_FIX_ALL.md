# Mobile Fix All — BibleQuiz

> Paste vào Claude Code. Fix tất cả issues từ MOBILE_AUDIT_REPORT.md.
> Estimated: ~25-30 giờ Claude Code execution.
> Commit riêng mỗi task để dễ rollback.

---

```
Fix TẤT CẢ issues trong MOBILE_AUDIT_REPORT.md cho apps/mobile/.

QUAN TRỌNG:
- ĐỌC MOBILE_AUDIT_REPORT.md TRƯỚC khi bắt đầu
- KHÔNG rebuild — fix in place
- Giữ nguyên architecture (Expo + Zustand + RN Navigation + TanStack Query)
- Scoring formula đã đúng — CHỈ fix tier multiplier + daily bonus
- Commit riêng mỗi task (10+ commits tổng)
- Chạy tests sau mỗi task: `npm test`
- TypeScript check sau mỗi task: `npx tsc --noEmit`
- Mỗi task phải 0 errors trước khi sang task tiếp

TRƯỚC KHI CODE: tạo TODO.md với checklist 10 tasks theo thứ tự dưới.

═══════════════════════════════════════════
TASK 1: i18n — Migrate tất cả hardcoded Vietnamese strings
═══════════════════════════════════════════

Effort: ~3 giờ. Highest visible impact.

### Bước 1.1: Audit current state

```bash
# Count hardcoded Vietnamese strings
grep -rn "Tiếng\|Bạn\|Chào\|Bắt đầu\|Tiếp tục\|Hủy\|Xong\|Lưu\|Xóa\|Đăng" apps/mobile/src/screens/ --include="*.tsx" | wc -l

# Check useTranslation usage
grep -rn "useTranslation" apps/mobile/src/ --include="*.tsx"

# View i18n config
cat apps/mobile/src/i18n/index.ts
cat apps/mobile/src/i18n/vi.json | head -50
cat apps/mobile/src/i18n/en.json | head -50
```

### Bước 1.2: Extend translation files

Mở apps/mobile/src/i18n/vi.json + en.json, thêm đầy đủ keys cho:

```json
{
  "common": {
    "loading": "...", "error": "...", "retry": "...",
    "save": "...", "cancel": "...", "delete": "...",
    "edit": "...", "create": "...", "search": "...",
    "confirm": "...", "back": "...", "next": "...",
    "close": "...", "yes": "...", "no": "...",
    "all": "...", "noData": "..."
  },
  "nav": {
    "home": "...", "quiz": "...", "multiplayer": "...",
    "groups": "...", "profile": "..."
  },
  "auth": {
    "login": "...", "logout": "...",
    "loginWithGoogle": "...", "loginWithEmail": "...",
    "emailPlaceholder": "...", "passwordPlaceholder": "...",
    "agreeTerms": "...", "welcome": "..."
  },
  "home": {
    "greeting": "Chào {{name}}!",
    "streak": "🔥 {{count}} ngày",
    "tier": "Tier hiện tại",
    "leaderboard": "Bảng xếp hạng tuần",
    "gameModes": {
      "practice": "Luyện tập",
      "ranked": "Xếp hạng",
      "daily": "Hàng ngày",
      "multiplayer": "Nhiều người",
      "journey": "Hành trình",
      "tournaments": "Giải đấu"
    }
  },
  "quiz": {
    "question": "Câu {{current}}/{{total}}",
    "timeLeft": "Còn {{seconds}}s",
    "correct": "Đúng!",
    "wrong": "Sai!",
    "score": "Điểm",
    "quitConfirm": "Bạn có chắc muốn thoát? Tiến trình sẽ mất.",
    "start": "Bắt đầu",
    "next": "Câu tiếp"
  },
  "results": {
    "title": "Kết quả",
    "scoreLine": "{{correct}}/{{total}} câu đúng",
    "accuracy": "Độ chính xác: {{percent}}%",
    "xpGained": "+{{xp}} XP",
    "review": "Xem lại",
    "playAgain": "Chơi lại",
    "share": "Chia sẻ",
    "home": "Trang chủ"
  },
  "ranked": {
    "title": "Xếp hạng",
    "energy": "Năng lượng: {{current}}/{{max}}",
    "start": "Bắt đầu ranked",
    "noEnergy": "Hết năng lượng, chờ {{time}}"
  },
  "daily": {
    "title": "Thử thách hàng ngày",
    "questionsCount": "{{count}} câu hôm nay",
    "completed": "Đã hoàn thành!",
    "betterThan": "Giỏi hơn {{percent}}% người chơi",
    "countdown": "Thử thách mới sau {{time}}"
  },
  "multiplayer": {
    "title": "Nhiều người chơi",
    "createRoom": "Tạo phòng",
    "joinRoom": "Tham gia",
    "enterCode": "Nhập mã phòng...",
    "publicRooms": "Phòng công khai",
    "noRooms": "Chưa có phòng"
  },
  "room": {
    "waiting": "Đang chờ...",
    "ready": "Sẵn sàng",
    "start": "Bắt đầu",
    "leave": "Rời phòng",
    "playersReady": "{{ready}}/{{total}} sẵn sàng"
  },
  "groups": {
    "title": "Nhóm",
    "myGroups": "Nhóm của tôi",
    "createGroup": "Tạo nhóm",
    "joinGroup": "Tham gia",
    "members": "{{count}} thành viên",
    "leaderboard": "Bảng xếp hạng",
    "announcements": "Thông báo"
  },
  "profile": {
    "title": "Hồ sơ",
    "totalPoints": "Tổng điểm",
    "currentStreak": "Chuỗi hiện tại",
    "sessionsPlayed": "Phiên đã chơi",
    "badges": "Huy hiệu",
    "editProfile": "Chỉnh sửa"
  },
  "achievements": {
    "title": "Thành tích",
    "unlocked": "Đã mở khóa",
    "locked": "Chưa mở khóa",
    "progress": "{{current}}/{{total}}"
  },
  "settings": {
    "title": "Cài đặt",
    "account": "Tài khoản",
    "app": "Ứng dụng",
    "language": "Ngôn ngữ",
    "sound": "Âm thanh",
    "haptics": "Rung phản hồi",
    "notifications": "Thông báo",
    "darkMode": "Chế độ tối",
    "deleteAccount": "Xóa tài khoản",
    "deleteAccountWarning": "Tài khoản sẽ bị xóa sau 30 ngày. Bạn có thể hủy trong 30 ngày.",
    "terms": "Điều khoản",
    "privacy": "Chính sách bảo mật",
    "about": "Về BibleQuiz",
    "logout": "Đăng xuất",
    "logoutConfirm": "Bạn có chắc muốn đăng xuất?",
    "version": "Phiên bản {{version}}"
  },
  "errors": {
    "networkError": "Không có kết nối mạng",
    "serverError": "Lỗi máy chủ, thử lại sau",
    "unauthorized": "Phiên đăng nhập hết hạn",
    "offline": "Bạn đang offline",
    "retry": "Thử lại",
    "somethingWrong": "Đã có lỗi xảy ra"
  },
  "tiers": {
    "spark": "Tia Sáng",
    "dawn": "Ánh Bình Minh",
    "lamp": "Ngọn Đèn",
    "flame": "Ngọn Lửa",
    "star": "Ngôi Sao",
    "glory": "Vinh Quang"
  }
}
```

English translation với cùng key structure:
- common.loading: "Loading..."
- nav.home: "Home"
- auth.loginWithGoogle: "Continue with Google"
- home.greeting: "Hello {{name}}!"
- tiers.spark: "Spark"
- tiers.dawn: "Dawn"
- tiers.lamp: "Lamp"
- tiers.flame: "Flame"
- tiers.star: "Star"
- tiers.glory: "Glory"
- (và tất cả keys còn lại dịch tương ứng)

### Bước 1.3: Migrate ALL 32 screens

Cho mỗi screen trong apps/mobile/src/screens/:

```typescript
// TRƯỚC:
<Text>Chào {user.name}!</Text>

// SAU:
import { useTranslation } from 'react-i18next'
const { t } = useTranslation()
<Text>{t('home.greeting', { name: user.name })}</Text>
```

Script giúp tìm hardcoded strings:
```bash
for file in apps/mobile/src/screens/**/*.tsx; do
  echo "=== $file ==="
  grep -n '"[^"]*[àáâãèéêìíòóôõùúýăđĩũơưăạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]' "$file" | head -5
done
```

Migrate theo batches:

**Batch A — Core screens:**
- LoginScreen.tsx
- HomeScreen.tsx
- QuizScreen.tsx
- QuizResultsScreen.tsx
- QuizReviewScreen.tsx
- SettingsScreen.tsx

**Batch B — Game modes:**
- PracticeSelectScreen.tsx
- DailyChallengeScreen.tsx
- RankedScreen.tsx

**Batch C — Multiplayer:**
- MultiplayerLobbyScreen.tsx
- CreateRoomScreen.tsx
- RoomWaitingScreen.tsx
- MultiplayerQuizScreen.tsx
- MultiplayerResultsScreen.tsx

**Batch D — Social:**
- GroupsListScreen.tsx
- GroupDetailScreen.tsx
- GroupCreateScreen.tsx
- GroupJoinScreen.tsx
- LeaderboardScreen.tsx
- ProfileScreen.tsx
- OtherProfileScreen.tsx

**Batch E — System:**
- AchievementsScreen.tsx
- JourneyMapScreen.tsx
- NotificationsScreen.tsx
- TierUpScreen.tsx
- LegalScreen.tsx
- OnboardingScreens (nếu chưa migrate)

### Bước 1.4: Wire language switcher

Trong SettingsScreen.tsx, language switcher phải thực sự đổi i18n:

```typescript
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'

const { i18n } = useTranslation()
const { language, setLanguage } = useSettingsStore()

const handleLanguageChange = async (newLang: 'vi' | 'en') => {
  await i18n.changeLanguage(newLang)
  setLanguage(newLang)
}
```

Trong src/i18n/index.ts, đảm bảo init language từ store:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

i18n
  .use(initReactI18next)
  .init({
    resources: { vi: { translation: vi }, en: { translation: en } },
    lng: 'vi', // Initial — will be overridden by store hydration
    fallbackLng: 'vi',
    interpolation: { escapeValue: false },
  })

// After hydration, set language from store
AsyncStorage.getItem('settings-storage').then(data => {
  if (data) {
    const parsed = JSON.parse(data)
    const lang = parsed?.state?.language
    if (lang) i18n.changeLanguage(lang)
  }
})
```

### Bước 1.5: Verify

```bash
# Check: 0 hardcoded Vietnamese strings trong screens
grep -rn '"[^"]*[àáâèéêìíòóôùúăđĩơư]' apps/mobile/src/screens/ --include="*.tsx" | head -10

# Check: tất cả screens import useTranslation
grep -L "useTranslation" apps/mobile/src/screens/**/*.tsx

# Manual test:
# - Open app → default Vietnamese
# - Go Settings → change to English
# - ALL screens should show English
# - Restart app → language persisted
```

Commit: "feat(i18n): migrate all 32 screens to useTranslation hook"

═══════════════════════════════════════════
TASK 2: Google Sign-In Native
═══════════════════════════════════════════

Effort: ~4 giờ.

### Bước 2.1: Install packages

```bash
cd apps/mobile
npx expo install expo-auth-session expo-crypto expo-web-browser
# expo-auth-session đã cài rồi (từ audit report)
```

### Bước 2.2: Setup Google OAuth config

Tạo `.env.example`:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

Update `app.json`:
```json
{
  "expo": {
    "scheme": "biblequiz",
    "android": {
      "package": "com.biblequiz.app"
    },
    "ios": {
      "bundleIdentifier": "com.biblequiz.app"
    },
    "plugins": [
      "expo-web-browser"
    ]
  }
}
```

### Bước 2.3: Implement Google Sign-In

Tạo `apps/mobile/src/hooks/useGoogleAuth.ts`:

```typescript
import { useEffect } from 'react'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'

WebBrowser.maybeCompleteAuthSession()

export const useGoogleAuth = () => {
  const setAuth = useAuthStore(s => s.setAuth)
  
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  })
  
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token
      handleGoogleSignIn(idToken)
    }
  }, [response])
  
  const handleGoogleSignIn = async (idToken: string) => {
    try {
      const { data } = await apiClient.post('/api/auth/mobile/google', { idToken })
      setAuth(data.user, data.accessToken, data.refreshToken)
    } catch (error) {
      console.error('Google Sign-In failed:', error)
      throw error
    }
  }
  
  return {
    signIn: () => promptAsync(),
    isReady: !!request,
  }
}
```

### Bước 2.4: Update LoginScreen

Replace placeholder trong LoginScreen.tsx:

```typescript
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { useTranslation } from 'react-i18next'

export const LoginScreen = () => {
  const { t } = useTranslation()
  const { signIn, isReady } = useGoogleAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      await signIn()
    } catch (err) {
      setError(t('errors.somethingWrong'))
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* ... hero section ... */}
      
      <Button
        title={t('auth.loginWithGoogle')}
        onPress={handleGoogleLogin}
        disabled={!isReady || loading}
        loading={loading}
        variant="primary"
      />
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      {/* Keep dev email/password login as fallback */}
      {__DEV__ && (
        <Button
          title={t('auth.loginWithEmail')}
          onPress={handleDevLogin}
          variant="outline"
        />
      )}
    </SafeAreaView>
  )
}
```

### Bước 2.5: Backend verify endpoint exists

```bash
grep -rn "mobile/google" apps/api/src/ --include="*.java"
```

Nếu endpoint chưa có, thêm vào AuthController.java:

```java
@PostMapping("/mobile/google")
public ResponseEntity<AuthResponse> mobileGoogleLogin(@RequestBody MobileGoogleRequest request) {
    // Verify idToken với Google
    GoogleIdToken.Payload payload = googleTokenVerifier.verify(request.getIdToken());
    if (payload == null) {
        return ResponseEntity.status(401).build();
    }
    
    String email = payload.getEmail();
    String name = (String) payload.get("name");
    String picture = (String) payload.get("picture");
    
    // Find or create user
    User user = userService.findOrCreate(email, name, picture);
    
    // Generate tokens
    String accessToken = jwtService.generateAccessToken(user);
    String refreshToken = jwtService.generateRefreshToken(user);
    
    return ResponseEntity.ok(new AuthResponse(user, accessToken, refreshToken));
}
```

### Bước 2.6: Test

- Tap "Login with Google" → Google OAuth screen opens
- Select account → redirect back to app
- App should be authenticated, user stored
- Restart app → still logged in (token persisted)

Commit: "feat(auth): implement native Google Sign-In with expo-auth-session"

═══════════════════════════════════════════
TASK 3: Scoring — Fix Tier Multiplier + Daily Bonus
═══════════════════════════════════════════

Effort: ~1 giờ.

### Bước 3.1: Fetch real tier multiplier

Trong QuizScreen.tsx, fetch tier info từ /api/me khi bắt đầu session:

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

const { data: me } = useQuery({
  queryKey: ['me'],
  queryFn: async () => {
    const { data } = await apiClient.get('/api/me')
    return data
  },
})

// Use real tier multiplier
const tierMultiplier = me?.tier?.xpMultiplier ?? 1.0
```

### Bước 3.2: Pass daily bonus flag

Nếu là daily challenge first question của user trong ngày:

```typescript
const isDailyFirst = route.params?.mode === 'daily' && questionIndex === 0

const score = calculateScore({
  difficulty: question.difficulty,
  isCorrect,
  elapsedMs,
  timeLimitMs: 30000,
  comboCount,
  tierMultiplier,
  isDailyFirst, // ADD THIS
})
```

### Bước 3.3: Update logic/scoring.ts

```typescript
export interface ScoreInput {
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  isCorrect: boolean
  elapsedMs: number
  timeLimitMs: number
  comboCount: number
  tierMultiplier: number
  isDailyFirst?: boolean  // ADD
}

export const calculateScore = (input: ScoreInput): number => {
  if (!input.isCorrect) return 0
  
  const basePoints = { EASY: 8, MEDIUM: 12, HARD: 18 }[input.difficulty]
  const speedRatio = (input.timeLimitMs - input.elapsedMs) / input.timeLimitMs
  const speedBonus = Math.floor(basePoints * 0.5 * speedRatio * speedRatio)
  
  let comboMultiplier = 1.0
  if (input.comboCount >= 10) comboMultiplier = 1.5
  else if (input.comboCount >= 5) comboMultiplier = 1.2
  
  let total = Math.floor((basePoints + speedBonus) * comboMultiplier * input.tierMultiplier)
  
  // Daily first question 2x bonus
  if (input.isDailyFirst) {
    total = total * 2
  }
  
  return total
}
```

### Bước 3.4: Update tests

Trong logic/__tests__/scoring.test.ts, thêm:

```typescript
it('applies daily first-question 2x bonus', () => {
  const base = calculateScore({
    difficulty: 'MEDIUM', isCorrect: true, elapsedMs: 30000,
    timeLimitMs: 30000, comboCount: 0, tierMultiplier: 1.0
  })
  const dailyFirst = calculateScore({
    difficulty: 'MEDIUM', isCorrect: true, elapsedMs: 30000,
    timeLimitMs: 30000, comboCount: 0, tierMultiplier: 1.0,
    isDailyFirst: true
  })
  expect(dailyFirst).toBe(base * 2)
})

it('applies real tier multiplier', () => {
  const tier1 = calculateScore({
    difficulty: 'MEDIUM', isCorrect: true, elapsedMs: 30000,
    timeLimitMs: 30000, comboCount: 0, tierMultiplier: 1.0
  })
  const tier15 = calculateScore({
    difficulty: 'MEDIUM', isCorrect: true, elapsedMs: 30000,
    timeLimitMs: 30000, comboCount: 0, tierMultiplier: 1.5
  })
  expect(tier15).toBe(Math.floor(tier1 * 1.5))
})
```

Run tests:
```bash
cd apps/mobile && npm test -- scoring.test
```

Commit: "fix(quiz): use real tier multiplier + daily first-question bonus"

═══════════════════════════════════════════
TASK 4: Sound + Haptic Feedback
═══════════════════════════════════════════

Effort: ~2 giờ + thời gian tạo sound files.

### Bước 4.1: Create sound assets

Download/generate 15 SFX files (mp3, ~50KB each):

```
apps/mobile/assets/sounds/
├── correct.mp3         # Pleasant chime
├── wrong.mp3           # Low buzz
├── tick.mp3            # Timer tick
├── timeout.mp3         # Time's up sound
├── tier_up.mp3         # Celebration fanfare
├── streak.mp3          # Fire crackle
├── achievement.mp3     # Medal unlock
├── button_tap.mp3      # UI click
├── notification.mp3    # Gentle bell
├── mp_start.mp3        # Game start
├── mp_end.mp3          # Game end
├── countdown.mp3       # 3-2-1 countdown
├── combo.mp3           # Combo build up
├── reveal.mp3          # Answer reveal
└── share.mp3           # Share success
```

Sources:
- freesound.org (CC0 license)
- Or use online SFX generators
- Or ask user to provide

Nếu user chưa có → tạo placeholder 1-second silent mp3 để code chạy được:
```bash
cd apps/mobile/assets/sounds
# Create silent placeholders temporarily
for name in correct wrong tick timeout tier_up streak achievement button_tap notification mp_start mp_end countdown combo reveal share; do
  ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -q:a 9 -acodec libmp3lame "${name}.mp3" 2>/dev/null || echo "# Placeholder needed: ${name}.mp3" > "${name}.mp3.TODO"
done
```

### Bước 4.2: Create useSound hook

Tạo `apps/mobile/src/hooks/useSound.ts`:

```typescript
import { Audio } from 'expo-av'
import { useCallback, useRef, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

const SOUND_MAP = {
  correct: require('@/../assets/sounds/correct.mp3'),
  wrong: require('@/../assets/sounds/wrong.mp3'),
  tick: require('@/../assets/sounds/tick.mp3'),
  timeout: require('@/../assets/sounds/timeout.mp3'),
  tier_up: require('@/../assets/sounds/tier_up.mp3'),
  streak: require('@/../assets/sounds/streak.mp3'),
  achievement: require('@/../assets/sounds/achievement.mp3'),
  button_tap: require('@/../assets/sounds/button_tap.mp3'),
  notification: require('@/../assets/sounds/notification.mp3'),
  mp_start: require('@/../assets/sounds/mp_start.mp3'),
  mp_end: require('@/../assets/sounds/mp_end.mp3'),
  countdown: require('@/../assets/sounds/countdown.mp3'),
  combo: require('@/../assets/sounds/combo.mp3'),
  reveal: require('@/../assets/sounds/reveal.mp3'),
  share: require('@/../assets/sounds/share.mp3'),
} as const

export type SoundName = keyof typeof SOUND_MAP

export const useSound = () => {
  const soundEnabled = useSettingsStore(s => s.soundEnabled)
  const volume = useSettingsStore(s => s.volume ?? 0.7)
  const loadedSounds = useRef<Partial<Record<SoundName, Audio.Sound>>>({})
  
  useEffect(() => {
    // Preload common sounds
    const preload = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
      })
    }
    preload()
    
    return () => {
      // Cleanup on unmount
      Object.values(loadedSounds.current).forEach(sound => {
        sound?.unloadAsync()
      })
    }
  }, [])
  
  const play = useCallback(async (name: SoundName) => {
    if (!soundEnabled) return
    
    try {
      let sound = loadedSounds.current[name]
      
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          SOUND_MAP[name],
          { volume, shouldPlay: false }
        )
        loadedSounds.current[name] = newSound
        sound = newSound
      }
      
      await sound.setPositionAsync(0)
      await sound.playAsync()
    } catch (error) {
      console.warn(`Failed to play sound ${name}:`, error)
    }
  }, [soundEnabled, volume])
  
  return { play }
}
```

### Bước 4.3: Create useHaptic hook

Tạo `apps/mobile/src/hooks/useHaptic.ts`:

```typescript
import * as Haptics from 'expo-haptics'
import { useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

export const useHaptic = () => {
  const hapticsEnabled = useSettingsStore(s => s.hapticsEnabled)
  
  const trigger = useCallback(async (type: HapticType) => {
    if (!hapticsEnabled) return
    
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          break
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          break
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          break
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          break
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          break
        case 'selection':
          await Haptics.selectionAsync()
          break
      }
    } catch (error) {
      // Haptics not available on this device
    }
  }, [hapticsEnabled])
  
  return { trigger }
}
```

### Bước 4.4: Wire to quiz events

Trong QuizScreen.tsx:

```typescript
import { useSound } from '@/hooks/useSound'
import { useHaptic } from '@/hooks/useHaptic'

const { play: playSound } = useSound()
const { trigger: haptic } = useHaptic()

const handleAnswer = async (answerIndex: number) => {
  const isCorrect = answerIndex === question.correctIndex
  
  if (isCorrect) {
    await playSound('correct')
    await haptic('success')
  } else {
    await playSound('wrong')
    await haptic('error')
  }
  
  // ... rest of logic
}

// Timer warning (last 5s)
useEffect(() => {
  if (timeLeft <= 5 && timeLeft > 0) {
    playSound('tick')
    haptic('warning')
  }
  if (timeLeft === 0) {
    playSound('timeout')
    haptic('error')
  }
}, [timeLeft])
```

Wire button_tap vào Button component:

```typescript
// src/components/ui/Button.tsx
import { useSound } from '@/hooks/useSound'
import { useHaptic } from '@/hooks/useHaptic'

export const Button = ({ onPress, ...props }) => {
  const { play } = useSound()
  const { trigger } = useHaptic()
  
  const handlePress = async () => {
    await play('button_tap')
    await trigger('light')
    onPress()
  }
  
  return <Pressable onPress={handlePress} {...props} />
}
```

Wire tier_up vào TierUpScreen.tsx (play on mount).
Wire achievement vào Achievements unlock modal.
Wire mp_start/mp_end vào multiplayer flow.

### Bước 4.5: Volume control in settings

Trong SettingsScreen.tsx, thêm volume slider:

```typescript
import Slider from '@react-native-community/slider'

<View style={styles.row}>
  <Text>{t('settings.volume')}</Text>
  <Slider
    style={{ width: 200 }}
    minimumValue={0}
    maximumValue={1}
    value={volume}
    onValueChange={setVolume}
    minimumTrackTintColor="#e8a832"
    maximumTrackTintColor="rgba(255,255,255,0.2)"
  />
</View>
```

Commit: "feat(feedback): sound + haptic feedback system with 15 SFX"

═══════════════════════════════════════════
TASK 5: Offline Support
═══════════════════════════════════════════

Effort: ~2 giờ.

### Bước 5.1: Install NetInfo

```bash
cd apps/mobile
npx expo install @react-native-community/netinfo
```

### Bước 5.2: Create useOnlineStatus hook

Tạo `apps/mobile/src/hooks/useOnlineStatus.ts`:

```typescript
import { useEffect, useState } from 'react'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionType, setConnectionType] = useState<string>('unknown')
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false)
      setConnectionType(state.type)
    })
    
    // Get initial state
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? false)
      setConnectionType(state.type)
    })
    
    return unsubscribe
  }, [])
  
  return { isOnline, connectionType }
}
```

### Bước 5.3: Create OfflineBanner component

Tạo `apps/mobile/src/components/feedback/OfflineBanner.tsx`:

```typescript
import { View, Text, StyleSheet, Animated } from 'react-native'
import { useEffect, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { colors } from '@/theme'

export const OfflineBanner = () => {
  const { t } = useTranslation()
  const { isOnline } = useOnlineStatus()
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(-100)).current
  
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOnline ? -100 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [isOnline])
  
  return (
    <Animated.View
      style={[
        styles.banner,
        { paddingTop: insets.top + 8, transform: [{ translateY }] }
      ]}
      pointerEvents={isOnline ? 'none' : 'auto'}
    >
      <Text style={styles.text}>⚠️ {t('errors.offline')}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.warning,
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  text: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
})
```

### Bước 5.4: Add to App root

Trong App.tsx:

```typescript
import { OfflineBanner } from '@/components/feedback/OfflineBanner'

export default function App() {
  return (
    <>
      <RootNavigator />
      <OfflineBanner />
    </>
  )
}
```

### Bước 5.5: Create offline queue for quiz answers

Tạo `apps/mobile/src/logic/offlineQueue.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiClient } from '@/api/client'

interface QueuedAction {
  id: string
  endpoint: string
  method: 'POST' | 'PUT' | 'PATCH'
  body: any
  timestamp: number
  retries: number
}

const QUEUE_KEY = 'offline-queue'
const MAX_RETRIES = 3

export const offlineQueue = {
  async add(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) {
    const queue = await this.getAll()
    const newAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    }
    queue.push(newAction)
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  },
  
  async getAll(): Promise<QueuedAction[]> {
    const data = await AsyncStorage.getItem(QUEUE_KEY)
    return data ? JSON.parse(data) : []
  },
  
  async processAll() {
    const queue = await this.getAll()
    const remaining: QueuedAction[] = []
    
    for (const action of queue) {
      if (action.retries >= MAX_RETRIES) {
        console.warn('Dropping action after max retries:', action.id)
        continue
      }
      
      try {
        await apiClient.request({
          url: action.endpoint,
          method: action.method,
          data: action.body,
        })
      } catch (error) {
        action.retries += 1
        remaining.push(action)
      }
    }
    
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
    return { processed: queue.length - remaining.length, remaining: remaining.length }
  },
  
  async clear() {
    await AsyncStorage.removeItem(QUEUE_KEY)
  },
}
```

### Bước 5.6: Auto-process queue on reconnect

Trong App.tsx hoặc RootNavigator:

```typescript
import { useEffect } from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { offlineQueue } from '@/logic/offlineQueue'

const App = () => {
  const { isOnline } = useOnlineStatus()
  
  useEffect(() => {
    if (isOnline) {
      offlineQueue.processAll()
        .then(result => console.log('Queue processed:', result))
        .catch(err => console.error('Queue process failed:', err))
    }
  }, [isOnline])
  
  // ...
}
```

### Bước 5.7: Use queue in quiz submit

Trong QuizScreen.tsx:

```typescript
import { offlineQueue } from '@/logic/offlineQueue'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

const { isOnline } = useOnlineStatus()

const submitAnswer = async (answerIndex: number, elapsedMs: number) => {
  const payload = {
    questionId: question.id,
    answerIndex,
    elapsedMs,
    timestamp: Date.now(),
  }
  
  if (isOnline) {
    try {
      await apiClient.post(`/api/sessions/${sessionId}/answer`, payload)
    } catch (error) {
      // Network error → queue it
      await offlineQueue.add({
        endpoint: `/api/sessions/${sessionId}/answer`,
        method: 'POST',
        body: payload,
      })
    }
  } else {
    // Offline → queue immediately
    await offlineQueue.add({
      endpoint: `/api/sessions/${sessionId}/answer`,
      method: 'POST',
      body: payload,
    })
  }
}
```

### Bước 5.8: Block multiplayer/ranked when offline

Trong RankedScreen.tsx và MultiplayerLobbyScreen.tsx:

```typescript
const { isOnline } = useOnlineStatus()

if (!isOnline) {
  return (
    <EmptyState
      icon="wifi-off"
      title={t('errors.offline')}
      description={t('errors.offlineFeatureDisabled')}
    />
  )
}
```

Commit: "feat(offline): NetInfo detection + queue for quiz answers"

═══════════════════════════════════════════
TASK 6: Global ErrorBoundary
═══════════════════════════════════════════

Effort: ~30 phút.

### Bước 6.1: Create ErrorBoundary component

Tạo `apps/mobile/src/components/ErrorBoundary.tsx`:

```typescript
import React, { Component, ReactNode } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { colors, typography, spacing } from '@/theme'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    
    // Send to Sentry if configured
    // Sentry.captureException(error, { extra: errorInfo })
  }
  
  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Đã có lỗi xảy ra</Text>
          <Text style={styles.description}>
            {this.state.error?.message || 'Lỗi không xác định'}
          </Text>
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Thử lại</Text>
          </Pressable>
        </View>
      )
    }
    
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bgPrimary,
  },
  icon: { fontSize: 64, marginBottom: spacing.lg },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.bgPrimary,
    fontSize: typography.size.base,
    fontWeight: '600',
  },
})
```

### Bước 6.2: Wrap App root

```typescript
// App.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <RootNavigator />
      <OfflineBanner />
    </ErrorBoundary>
  )
}
```

### Bước 6.3: Add Sentry (optional but recommended)

```bash
cd apps/mobile
npx expo install @sentry/react-native
```

```typescript
// App.tsx
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
})

export default Sentry.wrap(App)
```

Commit: "feat(errors): global ErrorBoundary + Sentry integration"

═══════════════════════════════════════════
TASK 7: Push Notifications
═══════════════════════════════════════════

Effort: ~4 giờ.

### Bước 7.1: Install expo-notifications

```bash
cd apps/mobile
npx expo install expo-notifications expo-device
```

### Bước 7.2: Setup notification config

Update `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#e8a832",
          "sounds": ["./assets/sounds/notification.mp3"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#e8a832"
    }
  }
}
```

### Bước 7.3: Create useNotifications hook

Tạo `apps/mobile/src/hooks/useNotifications.ts`:

```typescript
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.warn('Push notifications require physical device')
    return null
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  
  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied')
    return null
  }
  
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
  const token = tokenData.data
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e8a832',
    })
  }
  
  return token
}

export const useNotifications = () => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  
  useEffect(() => {
    if (!isAuthenticated) return
    
    // Register token với backend
    registerForPushNotifications().then(async (token) => {
      if (token) {
        try {
          await apiClient.post('/api/me/push-token', { 
            token, 
            platform: Platform.OS 
          })
        } catch (error) {
          console.error('Failed to register push token:', error)
        }
      }
    })
    
    // Listen for notifications while app is foreground
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification)
    })
    
    // Handle notification tap
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      handleDeepLink(data)
    })
    
    return () => {
      subscription.remove()
      responseSubscription.remove()
    }
  }, [isAuthenticated])
}

const handleDeepLink = (data: any) => {
  // Navigate based on notification type
  // This will be handled by deep linking setup below
  console.log('Deep link data:', data)
}
```

### Bước 7.4: Setup deep linking

Trong RootNavigator.tsx:

```typescript
import { NavigationContainer, LinkingOptions } from '@react-navigation/native'
import * as Linking from 'expo-linking'

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'biblequiz://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Quiz: {
            screens: {
              Practice: 'practice',
              Daily: 'daily',
              Ranked: 'ranked',
            }
          },
          Multiplayer: {
            screens: {
              Lobby: 'multiplayer',
              Room: 'room/:roomId',
            }
          },
          Groups: {
            screens: {
              List: 'groups',
              Detail: 'groups/:groupId',
            }
          },
          Profile: {
            screens: {
              Own: 'profile',
              Other: 'profile/:userId',
              Settings: 'settings',
              Notifications: 'notifications',
            }
          },
        }
      }
    }
  }
}

export const RootNavigator = () => {
  return (
    <NavigationContainer linking={linking}>
      {/* ... */}
    </NavigationContainer>
  )
}
```

### Bước 7.5: Wire hook vào App

```typescript
// App.tsx hoặc RootNavigator
import { useNotifications } from '@/hooks/useNotifications'

const AppContent = () => {
  useNotifications()
  return <RootNavigator />
}
```

### Bước 7.6: Add notification settings UI

Trong SettingsScreen.tsx, thêm section:

```typescript
<View style={styles.section}>
  <Text style={styles.sectionHeader}>{t('settings.notifications')}</Text>
  
  <View style={styles.row}>
    <Text>{t('settings.dailyReminder')}</Text>
    <Switch value={dailyReminder} onValueChange={setDailyReminder} />
  </View>
  
  <View style={styles.row}>
    <Text>{t('settings.streakWarning')}</Text>
    <Switch value={streakWarning} onValueChange={setStreakWarning} />
  </View>
  
  <View style={styles.row}>
    <Text>{t('settings.groupAnnouncements')}</Text>
    <Switch value={groupAnnouncements} onValueChange={setGroupAnnouncements} />
  </View>
  
  <View style={styles.row}>
    <Text>{t('settings.tierUp')}</Text>
    <Switch value={tierUpNotif} onValueChange={setTierUpNotif} />
  </View>
</View>
```

### Bước 7.7: Backend endpoint

Verify hoặc tạo endpoint:

```java
@PostMapping("/me/push-token")
public ResponseEntity<Void> registerPushToken(
    @RequestBody PushTokenRequest request,
    @AuthenticationPrincipal User user
) {
    userService.updatePushToken(user.getId(), request.getToken(), request.getPlatform());
    return ResponseEntity.ok().build();
}
```

Commit: "feat(notifications): push notifications with deep linking"

═══════════════════════════════════════════
TASK 8: Multiplayer STOMP WebSocket
═══════════════════════════════════════════

Effort: ~8 giờ. Lớn nhất.

### Bước 8.1: Check packages

```bash
cd apps/mobile
npm ls @stomp/stompjs sockjs-client
# Nếu thiếu:
npm install @stomp/stompjs sockjs-client
npm install --save-dev @types/sockjs-client
```

### Bước 8.2: Create STOMP client

Tạo `apps/mobile/src/ws/client.ts`:

```typescript
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// React Native needs this
import 'react-native-url-polyfill/auto'
import { TextEncoder, TextDecoder } from 'text-encoding'
Object.assign(global, { TextEncoder, TextDecoder })

const getWsUrl = () => {
  if (__DEV__) {
    return Platform.OS === 'android' 
      ? 'ws://10.0.2.2:8080/ws'
      : 'ws://localhost:8080/ws'
  }
  return process.env.EXPO_PUBLIC_WS_URL || 'wss://api.biblequiz.app/ws'
}

type MessageHandler = (message: any) => void

class WebSocketClient {
  private client: Client | null = null
  private subscriptions: Map<string, StompSubscription> = new Map()
  private connected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  
  async connect(): Promise<void> {
    if (this.client?.active) {
      console.log('WS already connected')
      return
    }
    
    const token = await AsyncStorage.getItem('accessToken')
    if (!token) {
      throw new Error('No auth token for WebSocket')
    }
    
    return new Promise((resolve, reject) => {
      this.client = new Client({
        brokerURL: getWsUrl(),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: __DEV__ ? (str) => console.log('STOMP:', str) : undefined,
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        
        onConnect: () => {
          console.log('WebSocket connected')
          this.connected = true
          this.reconnectAttempts = 0
          resolve()
        },
        
        onDisconnect: () => {
          console.log('WebSocket disconnected')
          this.connected = false
        },
        
        onStompError: (frame) => {
          console.error('STOMP error:', frame)
          reject(new Error(frame.headers['message']))
        },
        
        onWebSocketError: (error) => {
          console.error('WebSocket error:', error)
          this.reconnectAttempts++
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.disconnect()
          }
        },
      })
      
      this.client.activate()
    })
  }
  
  disconnect() {
    if (this.client) {
      this.subscriptions.forEach(sub => sub.unsubscribe())
      this.subscriptions.clear()
      this.client.deactivate()
      this.client = null
      this.connected = false
    }
  }
  
  subscribe(destination: string, handler: MessageHandler): string {
    if (!this.client?.active) {
      throw new Error('WebSocket not connected')
    }
    
    const subId = `sub-${Date.now()}`
    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const parsed = JSON.parse(message.body)
        handler(parsed)
      } catch (error) {
        console.error('Failed to parse WS message:', error)
      }
    })
    
    this.subscriptions.set(subId, subscription)
    return subId
  }
  
  unsubscribe(subId: string) {
    const sub = this.subscriptions.get(subId)
    if (sub) {
      sub.unsubscribe()
      this.subscriptions.delete(subId)
    }
  }
  
  send(destination: string, body: any) {
    if (!this.client?.active) {
      throw new Error('WebSocket not connected')
    }
    
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    })
  }
  
  isConnected(): boolean {
    return this.connected
  }
}

export const wsClient = new WebSocketClient()
```

### Bước 8.3: Install polyfills

```bash
cd apps/mobile
npx expo install react-native-url-polyfill
npm install text-encoding
```

### Bước 8.4: Create useRoomWebSocket hook

Tạo `apps/mobile/src/hooks/useRoomWebSocket.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react'
import { wsClient } from '@/ws/client'

export interface RoomEvent {
  type: 'PLAYER_JOINED' | 'PLAYER_LEFT' | 'PLAYER_READY' | 
        'GAME_STARTED' | 'QUESTION_NEW' | 'PLAYER_ANSWERED' |
        'SCORE_UPDATE' | 'GAME_ENDED' | 'CHAT_MESSAGE' | 'REACTION'
  payload: any
  timestamp: number
  senderId?: string
}

export const useRoomWebSocket = (
  roomId: string | null,
  onEvent: (event: RoomEvent) => void
) => {
  const subIdRef = useRef<string | null>(null)
  const onEventRef = useRef(onEvent)
  
  // Keep ref updated without re-subscribing
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])
  
  useEffect(() => {
    if (!roomId) return
    
    const connect = async () => {
      try {
        if (!wsClient.isConnected()) {
          await wsClient.connect()
        }
        
        subIdRef.current = wsClient.subscribe(
          `/topic/room/${roomId}`,
          (message: RoomEvent) => onEventRef.current(message)
        )
      } catch (error) {
        console.error('Failed to connect to room WS:', error)
      }
    }
    
    connect()
    
    return () => {
      if (subIdRef.current) {
        wsClient.unsubscribe(subIdRef.current)
        subIdRef.current = null
      }
    }
  }, [roomId])
  
  const sendAction = useCallback((action: string, payload: any) => {
    if (!roomId) return
    try {
      wsClient.send(`/app/room/${roomId}/${action}`, payload)
    } catch (error) {
      console.error('Failed to send WS message:', error)
    }
  }, [roomId])
  
  return { sendAction, isConnected: wsClient.isConnected() }
}
```

### Bước 8.5: Implement RoomWaitingScreen

```typescript
import { useRoomWebSocket } from '@/hooks/useRoomWebSocket'

export const RoomWaitingScreen = ({ route }) => {
  const { roomId } = route.params
  const [players, setPlayers] = useState<Player[]>([])
  const [isReady, setIsReady] = useState(false)
  
  const { sendAction, isConnected } = useRoomWebSocket(roomId, (event) => {
    switch (event.type) {
      case 'PLAYER_JOINED':
        setPlayers(prev => [...prev, event.payload])
        break
      case 'PLAYER_LEFT':
        setPlayers(prev => prev.filter(p => p.id !== event.payload.playerId))
        break
      case 'PLAYER_READY':
        setPlayers(prev => prev.map(p => 
          p.id === event.payload.playerId ? { ...p, ready: true } : p
        ))
        break
      case 'GAME_STARTED':
        navigation.replace('MultiplayerQuiz', { roomId })
        break
    }
  })
  
  const handleReady = () => {
    setIsReady(!isReady)
    sendAction('ready', { ready: !isReady })
  }
  
  // ... render UI
}
```

### Bước 8.6: Implement MultiplayerQuizScreen

```typescript
import { useRoomWebSocket } from '@/hooks/useRoomWebSocket'

export const MultiplayerQuizScreen = ({ route }) => {
  const { roomId } = route.params
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  
  const { sendAction } = useRoomWebSocket(roomId, (event) => {
    switch (event.type) {
      case 'QUESTION_NEW':
        setCurrentQuestion(event.payload.question)
        setTimeLeft(event.payload.timeLimit)
        break
      case 'SCORE_UPDATE':
        setLeaderboard(event.payload.leaderboard)
        break
      case 'GAME_ENDED':
        navigation.replace('MultiplayerResults', { 
          roomId, 
          finalScores: event.payload.finalScores 
        })
        break
    }
  })
  
  const handleAnswer = (answerIndex: number) => {
    sendAction('answer', {
      questionId: currentQuestion!.id,
      answerIndex,
      elapsedMs: (30 - timeLeft) * 1000,
    })
  }
  
  // ... render UI
}
```

### Bước 8.7: Connection UI indicator

Create `ConnectionStatus` component hiển thị trạng thái WS connection trong multiplayer screens:

```typescript
export const ConnectionStatus = ({ connected }: { connected: boolean }) => (
  <View style={[styles.dot, connected ? styles.green : styles.red]}>
    <Text>{connected ? '🟢 Connected' : '🔴 Disconnected'}</Text>
  </View>
)
```

### Bước 8.8: Disconnect on logout

Trong authStore.ts logout action:

```typescript
logout: () => {
  wsClient.disconnect()
  set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
}
```

Commit: "feat(multiplayer): STOMP WebSocket client + real-time room events"

═══════════════════════════════════════════
TASK 9: Delete Account (Apple App Store requirement)
═══════════════════════════════════════════

Effort: ~2 giờ.

### Bước 9.1: Backend endpoint

Check hoặc tạo:

```java
@DeleteMapping("/me")
public ResponseEntity<Void> deleteAccount(
    @RequestBody DeleteAccountRequest request,
    @AuthenticationPrincipal User user
) {
    // Verify password (optional for OAuth users)
    // Soft delete: mark deletedAt = now() + 30 days
    // Schedule hard delete job
    userService.scheduleAccountDeletion(user.getId());
    return ResponseEntity.noContent().build();
}

@PostMapping("/me/cancel-deletion")
public ResponseEntity<Void> cancelDeletion(@AuthenticationPrincipal User user) {
    userService.cancelAccountDeletion(user.getId());
    return ResponseEntity.ok().build();
}
```

### Bước 9.2: Create DeleteAccountScreen

Tạo `apps/mobile/src/screens/user/DeleteAccountScreen.tsx`:

```typescript
export const DeleteAccountScreen = () => {
  const { t } = useTranslation()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const logout = useAuthStore(s => s.logout)
  
  const handleDelete = async () => {
    if (confirmText !== 'XÓA') {
      Alert.alert(t('common.error'), t('settings.deleteTypeConfirm'))
      return
    }
    
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountFinalConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              await apiClient.delete('/api/me')
              logout()
              // Navigation will auto-redirect to login
            } catch (error) {
              Alert.alert(t('common.error'), t('errors.somethingWrong'))
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>{t('settings.deleteAccount')}</Text>
        
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>{t('settings.deleteWarningTitle')}</Text>
          <Text style={styles.warningText}>
            {t('settings.deleteAccountWarning')}
          </Text>
          
          <Text style={styles.bulletTitle}>{t('settings.whatWillBeDeleted')}:</Text>
          <Text style={styles.bullet}>• {t('settings.deleteItems.profile')}</Text>
          <Text style={styles.bullet}>• {t('settings.deleteItems.stats')}</Text>
          <Text style={styles.bullet}>• {t('settings.deleteItems.groups')}</Text>
          <Text style={styles.bullet}>• {t('settings.deleteItems.achievements')}</Text>
        </View>
        
        <View style={styles.gracePeriodCard}>
          <Text>{t('settings.gracePeriod30Days')}</Text>
        </View>
        
        <Text style={styles.confirmLabel}>
          {t('settings.typeDeleteToConfirm')}
        </Text>
        <TextInput
          style={styles.input}
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder="XÓA"
          autoCapitalize="characters"
        />
        
        <Button
          title={t('settings.deleteAccount')}
          onPress={handleDelete}
          disabled={confirmText !== 'XÓA' || loading}
          loading={loading}
          variant="danger"
        />
        
        <Button
          title={t('common.cancel')}
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </ScrollView>
    </SafeAreaView>
  )
}
```

### Bước 9.3: Wire to Settings

Trong SettingsScreen.tsx account section:

```typescript
<Pressable
  style={styles.dangerRow}
  onPress={() => navigation.navigate('DeleteAccount')}
>
  <Text style={styles.dangerText}>{t('settings.deleteAccount')}</Text>
</Pressable>
```

Register route trong UserStackNavigator.

Commit: "feat(account): delete account flow with 30-day grace period"

═══════════════════════════════════════════
TASK 10: Quiz Session Recovery + Exit Confirmation
═══════════════════════════════════════════

Effort: ~3 giờ.

### Bước 10.1: Create quizStore

Tạo `apps/mobile/src/stores/quizStore.ts`:

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface QuizSession {
  sessionId: string
  mode: 'practice' | 'ranked' | 'daily'
  questions: Question[]
  currentIndex: number
  answers: Answer[]
  startedAt: number
  comboCount: number
}

interface QuizState {
  activeSession: QuizSession | null
  
  startSession: (session: QuizSession) => void
  updateSession: (updates: Partial<QuizSession>) => void
  addAnswer: (answer: Answer) => void
  endSession: () => void
  hasActiveSession: () => boolean
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      
      startSession: (session) => set({ activeSession: session }),
      
      updateSession: (updates) => set((state) => ({
        activeSession: state.activeSession ? { ...state.activeSession, ...updates } : null
      })),
      
      addAnswer: (answer) => set((state) => {
        if (!state.activeSession) return state
        return {
          activeSession: {
            ...state.activeSession,
            answers: [...state.activeSession.answers, answer],
            currentIndex: state.activeSession.currentIndex + 1,
            comboCount: answer.isCorrect ? state.activeSession.comboCount + 1 : 0,
          }
        }
      }),
      
      endSession: () => set({ activeSession: null }),
      
      hasActiveSession: () => get().activeSession !== null,
    }),
    {
      name: 'quiz-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

### Bước 10.2: Check for recovery on Home

Trong HomeScreen.tsx:

```typescript
import { useQuizStore } from '@/stores/quizStore'

const activeSession = useQuizStore(s => s.activeSession)

useEffect(() => {
  if (activeSession) {
    Alert.alert(
      t('quiz.unfinishedTitle'),
      t('quiz.unfinishedDescription', { 
        current: activeSession.currentIndex + 1,
        total: activeSession.questions.length
      }),
      [
        {
          text: t('quiz.discard'),
          style: 'destructive',
          onPress: () => useQuizStore.getState().endSession()
        },
        {
          text: t('quiz.resume'),
          onPress: () => navigation.navigate('Quiz', { 
            resumeSession: true 
          })
        }
      ]
    )
  }
}, [])
```

### Bước 10.3: Use store in QuizScreen

Trong QuizScreen.tsx:

```typescript
const { activeSession, startSession, addAnswer, endSession } = useQuizStore()

useEffect(() => {
  if (route.params?.resumeSession && activeSession) {
    // Restore state from session
    setCurrentIndex(activeSession.currentIndex)
    setComboCount(activeSession.comboCount)
    // ... etc
  } else {
    // Start new session
    startSession({
      sessionId: newSessionId,
      mode: route.params?.mode ?? 'practice',
      questions,
      currentIndex: 0,
      answers: [],
      startedAt: Date.now(),
      comboCount: 0,
    })
  }
}, [])

const handleAnswer = (answerIndex: number) => {
  // ... existing logic ...
  
  addAnswer({ questionId, answerIndex, isCorrect, score, elapsedMs })
  
  if (isLastQuestion) {
    endSession()
    navigation.replace('QuizResults', { ... })
  }
}
```

### Bước 10.4: Exit confirmation

Trong QuizScreen.tsx, use beforeRemove event:

```typescript
import { useFocusEffect } from '@react-navigation/native'

useFocusEffect(
  useCallback(() => {
    const onBeforeRemove = (e: any) => {
      if (isQuizFinished) return
      
      e.preventDefault()
      
      Alert.alert(
        t('quiz.quitTitle'),
        t('quiz.quitConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('quiz.saveAndQuit'),
            onPress: () => {
              // Session already persisted in store
              navigation.dispatch(e.data.action)
            }
          },
          {
            text: t('quiz.discardAndQuit'),
            style: 'destructive',
            onPress: () => {
              endSession()
              navigation.dispatch(e.data.action)
            }
          }
        ]
      )
    }
    
    const unsubscribe = navigation.addListener('beforeRemove', onBeforeRemove)
    return unsubscribe
  }, [isQuizFinished])
)
```

Commit: "feat(quiz): session recovery + exit confirmation"

═══════════════════════════════════════════
TASK 11: Additional fixes (low priority)
═══════════════════════════════════════════

Effort: ~2 giờ total.

### Bước 11.1: Use FlatList for long lists

Replace ScrollView + map trong:
- LeaderboardScreen
- GroupsListScreen  
- NotificationsScreen
- AchievementsScreen

```typescript
// TRƯỚC:
<ScrollView>
  {items.map(item => <Row key={item.id} item={item} />)}
</ScrollView>

// SAU:
<FlatList
  data={items}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <Row item={item} />}
  contentContainerStyle={styles.list}
  showsVerticalScrollIndicator={false}
/>
```

### Bước 11.2: Use expo-image for avatars

```bash
cd apps/mobile
npx expo install expo-image
```

Replace `<Image>` trong avatar components:

```typescript
import { Image } from 'expo-image'

<Image
  source={{ uri: user.avatar }}
  style={styles.avatar}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

### Bước 11.3: Modal presentations

Trong navigator, set TierUpScreen as modal:

```typescript
<Stack.Screen 
  name="TierUp" 
  component={TierUpScreen}
  options={{ presentation: 'modal', animationTypeForReplace: 'push' }}
/>
<Stack.Screen 
  name="CreateRoom" 
  component={CreateRoomScreen}
  options={{ presentation: 'modal' }}
/>
<Stack.Screen 
  name="DeleteAccount" 
  component={DeleteAccountScreen}
  options={{ presentation: 'modal' }}
/>
```

### Bước 11.4: Fetch missing data

HomeScreen additions:
- Energy: `GET /api/me/energy`
- Daily status: `GET /api/daily-challenge/status`
- Verse of day: `GET /api/verse/today`

RankedScreen additions:
- Energy display
- Book scope per tier

DailyChallengeScreen additions:
- Leaderboard: `GET /api/daily-challenge/leaderboard?scope=global`
- Percentile calculation

Commit: "perf: FlatList + expo-image + modal screens + missing API data"

═══════════════════════════════════════════
TASK 12: Verify all fixes
═══════════════════════════════════════════

```bash
cd apps/mobile

echo "=== TYPESCRIPT ==="
npx tsc --noEmit
# Must be 0 errors

echo "=== TESTS ==="
npm test
# Must pass all + new tests added

echo "=== LINT ==="
npx eslint src/ --ext .ts,.tsx
# Must be 0 errors

echo "=== BUILD ==="
npx expo prebuild --clean
# Must complete without errors

echo "=== I18N COVERAGE ==="
# Check useTranslation hook in all screens
MISSING=$(grep -L "useTranslation" src/screens/**/*.tsx | wc -l)
echo "Screens without useTranslation: $MISSING (should be 0 or very few)"

echo "=== SOUND ASSETS ==="
ls assets/sounds/*.mp3 | wc -l
# Should be 15

echo "=== CHECKLIST ==="
grep -q "useGoogleAuth" src/screens/auth/LoginScreen.tsx && echo "✅ Google Sign-In" || echo "❌ Google Sign-In"
grep -q "useSound\|useHaptic" src/screens/quiz/QuizScreen.tsx && echo "✅ Sound+Haptic in quiz" || echo "❌ Sound+Haptic"
grep -q "useOnlineStatus\|NetInfo" src/ -r && echo "✅ Offline detection" || echo "❌ Offline detection"
grep -q "ErrorBoundary" App.tsx && echo "✅ ErrorBoundary" || echo "❌ ErrorBoundary"
grep -q "expo-notifications" package.json && echo "✅ Push notifications" || echo "❌ Push notifications"
grep -q "@stomp/stompjs" src/ws/client.ts && echo "✅ STOMP client" || echo "❌ STOMP client"
grep -q "DeleteAccountScreen" src/screens/user/ -r && echo "✅ Delete account" || echo "❌ Delete account"
grep -q "quizStore" src/stores/ -r && echo "✅ Quiz recovery" || echo "❌ Quiz recovery"
```

Manual testing checklist:
- [ ] Open app → Vietnamese by default
- [ ] Settings → switch to English → ALL screens show English
- [ ] Login with Google → real OAuth flow works
- [ ] Start practice quiz → correct answer plays sound + haptic
- [ ] Wrong answer plays different sound + haptic
- [ ] Timer <5s plays tick sound
- [ ] Disable WiFi → offline banner appears
- [ ] Enable WiFi → banner disappears
- [ ] Force close app during quiz → reopen → resume prompt
- [ ] Settings → Delete Account → confirms flow works
- [ ] Multiplayer → Create Room → real-time players update
- [ ] Multiplayer → Play quiz → real-time leaderboard updates
- [ ] Trigger error → ErrorBoundary catches, shows retry
- [ ] Push notification (if backend sends) → received
- [ ] Tap notification → deep links to correct screen

═══════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════

Commits expected (~12 total):
1. "feat(i18n): migrate all 32 screens to useTranslation hook"
2. "feat(auth): implement native Google Sign-In with expo-auth-session"
3. "fix(quiz): use real tier multiplier + daily first-question bonus"
4. "feat(feedback): sound + haptic feedback system with 15 SFX"
5. "feat(offline): NetInfo detection + queue for quiz answers"
6. "feat(errors): global ErrorBoundary + Sentry integration"
7. "feat(notifications): push notifications with deep linking"
8. "feat(multiplayer): STOMP WebSocket client + real-time room events"
9. "feat(account): delete account flow with 30-day grace period"
10. "feat(quiz): session recovery + exit confirmation"
11. "perf: FlatList + expo-image + modal screens + missing API data"
12. "test: add tests for new logic + integration tests"

Files created:
- src/hooks/useGoogleAuth.ts
- src/hooks/useSound.ts
- src/hooks/useHaptic.ts
- src/hooks/useOnlineStatus.ts
- src/hooks/useNotifications.ts
- src/hooks/useRoomWebSocket.ts
- src/components/ErrorBoundary.tsx
- src/components/feedback/OfflineBanner.tsx
- src/components/feedback/ConnectionStatus.tsx
- src/stores/quizStore.ts
- src/ws/client.ts
- src/logic/offlineQueue.ts
- src/screens/user/DeleteAccountScreen.tsx
- assets/sounds/*.mp3 (15 files)

Files modified:
- src/i18n/vi.json + en.json (extended)
- ALL 32 screens (i18n migration)
- src/screens/auth/LoginScreen.tsx (Google Sign-In)
- src/screens/quiz/QuizScreen.tsx (tier + sound + haptic + recovery + exit)
- src/logic/scoring.ts (daily bonus)
- src/logic/__tests__/scoring.test.ts (new tests)
- src/stores/authStore.ts (WS disconnect on logout)
- src/stores/settingsStore.ts (volume, notification prefs)
- src/navigation/RootNavigator.tsx (deep linking)
- App.tsx (ErrorBoundary + OfflineBanner + useNotifications)
- app.json (plugins, notification config)
- package.json (new dependencies)

Estimated total: 25-30 hours Claude Code execution.

Sau khi xong, tạo MOBILE_FIX_REPORT.md tổng kết:
- Tasks completed ✅
- Tasks skipped (với lý do) ⚠️
- Known issues còn lại ❌
- Next steps (nếu có)
```
