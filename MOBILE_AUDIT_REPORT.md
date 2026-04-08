# Mobile Audit Report — BibleQuiz
Date: 2026-04-09
Auditor: Claude Code
Target: apps/mobile/ (rebuilt Expo project)
Structure: 60 files, 4106 LOC, 41 test files, 31 passing tests

## Executive Summary
- Total features audited: 14 modules + 6 cross-cutting = 20
- Fully compliant: **2/20** (State Management, Scoring Formula)
- Partial: **6/20** (Auth, Quiz Engine, Sound/Haptics, Error Handling, Navigation, Theme)
- Missing/broken: **5/20** (Multiplayer WS, Offline, Push Notifs, i18n usage, Full Error Boundary)
- Baseline placeholder: **7/20** (several screens functional but minimal)
- Overall health: **FAIR** — foundation solid, critical features need implementation

## Critical Issues (Must fix before launch)

1. **[SEVERE] Multiplayer is non-functional** — STOMP client never initialized, `ws/` directory empty. `@stomp/stompjs` in package.json but unused. MultiplayerQuizScreen is placeholder text. Backend `RoomWebSocketController` ready but mobile can't connect.

2. **[SEVERE] Google Sign-In is placeholder** — LoginScreen.tsx:13-16 shows `Alert.alert()` instead of real Google auth. `expo-auth-session` installed but unused. Only dev email/password fallback works.

3. **[SEVERE] All UI text hardcoded in Vietnamese** — i18n infrastructure exists (i18next + vi.json + en.json) but `useTranslation()` hook unused in ALL 32 screens. ~50+ hardcoded Vietnamese strings. Language switch in Settings does nothing visible.

## High Priority Issues

4. **[HIGH] No offline handling** — No NetInfo, no connectivity detection, no offline banner. Quiz answers POST immediately with no queue. Network drop = lost data. Web has `OfflineBanner.tsx` that mobile lacks.

5. **[HIGH] Push notifications not implemented** — `expo-notifications` not imported anywhere. No push token registration, no deep link handling. NotificationsScreen fetches from API but doesn't receive pushes.

6. **[HIGH] Scoring incomplete** — Tier multiplier hardcoded to `1.0` in QuizScreen.tsx:53. Backend `calculateWithTier()` applies real tier XP boost. Daily first-question 2x bonus never sent.

## Medium Priority Issues

7. **[MEDIUM] No global ErrorBoundary** — No React error boundary at app root. Errors crash the app. Web has error handling patterns in api/client.ts interceptor.

8. **[MEDIUM] Quiz session not recoverable** — If app closes mid-quiz, all progress lost. No session ID persistence for resume.

9. **[MEDIUM] No quiz exit confirmation** — Back button during quiz doesn't warn user. Progress silently lost.

10. **[MEDIUM] Sound/haptics toggles exist but never fire** — settingsStore has `soundEnabled`/`hapticsEnabled` but no `Haptics.impactAsync()` or `Audio.Sound` calls in quiz or answer feedback.

## Low Priority Issues

11. **[LOW] No deep linking** — NavigationContainer has no `linking` prop. Push notification taps won't navigate to correct screen.

12. **[LOW] No modal screens** — TierUp celebration, CreateRoom should be modals but are full screens.

13. **[LOW] No image optimization** — No `expo-image` usage, avatars use basic `<Image>` without caching.

14. **[LOW] FlatList not used** — Leaderboard, GroupsList, etc. use `ScrollView` + map instead of FlatList for long lists.

---

## Module-by-Module Report

### Module 1: Authentication ⚠️
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Google Sign-In native | ❌ | LoginScreen.tsx:13 | Placeholder Alert only |
| Endpoint /api/auth/mobile/google | ❌ | - | Never called |
| Token storage AsyncStorage | ✅ | authStore.ts:27-28 | Via Zustand persist |
| Token refresh on 401 | ✅ | api/client.ts:33-48 | Interceptor works |
| Logout clears tokens | ✅ | authStore.ts:32-34 | AsyncStorage.multiRemove |
| Dev login fallback | ✅ | LoginScreen.tsx:25-37 | POST /api/auth/mobile/login |

Gap: Google native auth needs `expo-auth-session` + `@react-native-google-signin/google-signin` integration.

### Module 2: Home Dashboard ⚠️
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Tier progress display | ✅ | HomeScreen.tsx:50-57 | getTierProgress() used |
| Streak display | ✅ | HomeScreen.tsx:43 | From /api/me |
| Game modes grid | ✅ | HomeScreen.tsx:18-25 | 6 modes |
| Leaderboard preview | ✅ | HomeScreen.tsx:97-114 | GET /api/leaderboard/weekly |
| Daily challenge status | ❌ | - | Not fetched |
| Energy display | ❌ | - | Not fetched |
| Verse of the day | ❌ | - | Not implemented |
| Pull to refresh | ❌ | - | Not implemented |

### Module 3: Quiz Engine ⚠️
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Base points EASY=8,MED=12,HARD=18 | ✅ | logic/scoring.ts:9 | Matches backend |
| Speed bonus quadratic | ✅ | logic/scoring.ts:12 | `base * 0.5 * ratio²` |
| Combo 5+=1.2x, 10+=1.5x | ✅ | logic/scoring.ts:15-16 | Matches backend |
| Tier multiplier applied | ❌ | QuizScreen.tsx:53 | Hardcoded 1.0 |
| Daily first-question 2x | ❌ | - | Not implemented |
| Timer handling | ✅ | QuizScreen.tsx:30-37 | 30s default, configurable |
| Answer submission to server | ✅ | QuizScreen.tsx:75-82 | POST /api/sessions/{id}/answer |
| Progress save per question | ✅ | QuizScreen.tsx:67-72 | Local state updated |
| Session recovery | ❌ | - | Not persisted |

### Module 4: Ranked Mode ⚠️
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Energy display | ❌ | RankedScreen.tsx | No energy API call |
| Tier progress | ✅ | RankedScreen.tsx:17-20 | getTierProgress() used |
| Session creation | ✅ | RankedScreen.tsx:24-31 | POST /api/sessions mode=ranked |
| Book scope per tier | ❌ | - | Not enforced client-side |

### Module 5: Daily Challenge ⚠️
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Fetch daily questions | ✅ | DailyChallengeScreen.tsx:14-17 | GET /api/daily-challenge |
| Navigate to quiz | ✅ | DailyChallengeScreen.tsx:23-29 | Passes questions to QuizScreen |
| Replay prevention | ❌ | - | Not checked |
| Streak multiplier | ❌ | - | Not implemented |
| Leaderboard | ❌ | - | Not shown |

### Module 6: Multiplayer / Rooms ❌
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| STOMP client | ❌ | ws/ empty | Not implemented |
| Room list from API | ✅ | MultiplayerLobbyScreen.tsx:33 | GET /api/rooms |
| Create room | ✅ | CreateRoomScreen.tsx | POST /api/rooms |
| Real-time quiz | ❌ | MultiplayerQuizScreen.tsx | Placeholder only |
| 4 game modes | ❌ | - | UI exists, no logic |

### Module 7: Groups ⚠️
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| List my groups | ✅ | GroupsListScreen.tsx:13 | GET /api/groups/my |
| Join by code | ✅ | GroupJoinScreen.tsx:15-19 | POST /api/groups/join |
| Create group | ✅ | GroupCreateScreen.tsx:15-17 | POST /api/groups |
| Group detail | ✅ | GroupDetailScreen.tsx:10-12 | GET /api/groups/{id} |
| Announcements | ❌ | - | Not implemented |
| Group quiz sets | ❌ | - | Not implemented |

### Module 8: Profile + Stats ⚠️
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Own profile stats | ✅ | ProfileScreen.tsx:15-17 | GET /api/me |
| Tier display | ✅ | ProfileScreen.tsx:20-21 | getTierProgress() |
| Achievements link | ✅ | ProfileScreen.tsx:55 | Navigate to Achievements |
| Activity heatmap | ❌ | - | Not implemented |
| Edit profile | ❌ | - | Not implemented |

### Module 9: Achievements ⚠️
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Badge grid | ✅ | AchievementsScreen.tsx:10-14 | GET /api/achievements/me |
| Locked/unlocked states | ✅ | AchievementsScreen.tsx:34-42 | Visual distinction |
| Progress tracking | ❌ | - | No progress % shown |
| Share achievement | ❌ | - | No native share |

### Module 10: Journey Map ✅
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| 66 books display | ✅ | JourneyMapScreen.tsx | Full implementation |
| OT/NT sections | ✅ | JourneyMapScreen.tsx | Grouped by testament |
| Mastery percentage | ✅ | JourneyMapScreen.tsx | Progress bars |
| Locked/available states | ✅ | JourneyMapScreen.tsx:135 | Disabled + opacity |
| Navigate to practice | ✅ | JourneyMapScreen.tsx:129-133 | Pre-selects book |

### Module 11: Settings ⚠️
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Sound toggle | ✅ | SettingsScreen.tsx:28-30 | Switch component |
| Haptics toggle | ✅ | SettingsScreen.tsx:32-34 | Switch component |
| Language switch | ⚠️ | SettingsScreen.tsx:37-46 | Saves to store, but screens don't use t() |
| Logout | ✅ | SettingsScreen.tsx:16-20 | Alert confirm + logout() |
| Delete account | ❌ | - | Required by Apple App Store |
| Terms/Privacy links | ⚠️ | SettingsScreen.tsx:52-53 | Pressable exists, no navigation |

### Module 12: Notifications ❌
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Push token registration | ❌ | - | Not implemented |
| Deep link handling | ❌ | - | Not implemented |
| Notification list UI | ✅ | NotificationsScreen.tsx:10-14 | GET /api/notifications |

### Module 13: Sound + Haptic ⚠️
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Settings toggles | ✅ | settingsStore.ts | Persisted |
| Haptic on answer | ❌ | - | Not called in QuizScreen |
| Sound on answer | ❌ | - | Not called in QuizScreen |
| Sound files | ❌ | assets/sounds/ empty | No audio assets |

### Module 14: Offline Support ❌
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Connectivity detection | ❌ | - | No NetInfo |
| Offline banner | ❌ | - | Not implemented |
| Action queue | ❌ | - | Not implemented |
| Cached data | ⚠️ | Zustand persist | Auth only, no content cache |

---

## Cross-Cutting Issues

### API Client ⚠️
- ✅ Platform-aware base URL (10.0.2.2 for Android)
- ✅ Auth header auto-attached
- ✅ 401 refresh + retry
- ❌ No 403 handler (logout)
- ❌ No 500 error toast
- ❌ No network error detection
- ❌ No request logging in dev

### State Management ✅
- ✅ authStore: user + tokens persisted
- ✅ settingsStore: sound + haptics + volume
- ✅ onboardingStore: hasSeenOnboarding + language
- ✅ All use AsyncStorage persist
- ❌ No quizStore (session not recoverable)

### Navigation ⚠️
- ✅ Conditional flow: Onboarding → Auth → Main
- ✅ 5 bottom tabs with nested stacks
- ❌ No deep link config
- ❌ No quiz exit confirmation
- ❌ No modal presentations

### i18n ❌
- ✅ i18next setup complete
- ✅ vi.json + en.json with ~50 keys each
- ❌ 0 screens use `useTranslation()` hook
- ❌ All strings hardcoded in Vietnamese

### Error Handling ⚠️
- ⚠️ Try/catch in some screens
- ❌ No global ErrorBoundary
- ❌ No consistent error UI pattern
- ❌ Silent catch in QuizScreen answer submission

---

## Scoring Logic Comparison

| Input | Mobile | Backend | Match? |
|-------|--------|---------|--------|
| EASY, correct, 30s/30s, combo=0, tier=1.0 | 8 | 8 | ✅ |
| MEDIUM, correct, 15s/30s, combo=0, tier=1.0 | 13 | 13 | ✅ |
| HARD, correct, 0s/30s, combo=0, tier=1.0 | 27 | 27 | ✅ |
| MEDIUM, correct, 30s/30s, combo=5, tier=1.0 | 14 | 14 | ✅ |
| MEDIUM, correct, 30s/30s, combo=10, tier=1.0 | 18 | 18 | ✅ |
| MEDIUM, correct, 30s/30s, combo=0, tier=1.2 | **14** | **14** | ✅ |
| MEDIUM, wrong, any | 0 | 0 | ✅ |
| ANY, correct, tier=1.0, dailyFirst=true | **no bonus** | **x2** | ❌ |
| ANY, correct, tier=1.5 (real tier) | **uses 1.0** | **uses 1.5** | ⚠️ mobile ignores |

Note: Formula matches, but mobile always passes `tierMultiplier: 1.0` and never sends `isDailyFirst`.

---

## Recommended Action Plan

Priority order:
1. **Fix i18n** — Replace all hardcoded strings with t() keys (~2-3 hours)
2. **Implement Google Sign-In** — expo-auth-session integration (~4 hours)
3. **Fix scoring** — Pass real tier multiplier from /api/me (~1 hour)
4. **Add sound/haptics** — Wire expo-haptics + expo-av to quiz events (~2 hours)
5. **Add offline detection** — expo-network + banner component (~2 hours)
6. **Add ErrorBoundary** — Wrap app root (~30 min)
7. **Add push notifications** — expo-notifications + deep links (~4 hours)
8. **Implement STOMP client** — WebSocket for multiplayer (~8 hours)
9. **Add delete account** — Required for App Store (~2 hours)
10. **Add quiz session recovery** — Persist session ID + resume (~3 hours)

## Rebuild vs Fix Decision

**Recommendation: FIX IN PLACE**

Rationale:
- Architecture is solid (Expo + Zustand + React Navigation + TanStack Query)
- Theme system and design tokens correct
- 32 screens exist with proper navigation structure
- Scoring formula verified correct
- 31 logic tests passing
- Issues are mostly "not wired up yet" rather than "wrong architecture"
- No SEVERE architectural problems — just incomplete features

Estimated total fix effort: **~25-30 hours** to reach production-ready state.
