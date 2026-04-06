# TODO — Mobile App

## Phase 1 — Fix Bugs + Test Screens [DONE]

### Task 1: BUG-01 — Auth redirect khi token refresh fail (CRITICAL)
- Status: [x] DONE
- File(s): src/api/client.ts
- Fix: setState trực tiếp khi refresh fail, tránh loop với logout() API call

### Task 2: BUG-06 — Navigation ref cho API client (401 redirect)
- Status: [x] DONE (merged with Task 1)
- Fix: Zustand setState → isAuthenticated=false → RootNavigator auto-redirect Login

### Task 3: BUG-04/05 — Google OAuth edge cases
- Status: [x] DONE
- Fix: Đã rewrite sang native SDK, BUG-04 (missing token) handled line 42-43, BUG-05 (useEffect deps) eliminated

### Task 4: BUG-02 — QuizScreen handle daily/multiplayer modes
- Status: [x] DONE
- Fix: Added isDaily, isMultiplayer flags + cleaner question loading with ranked try/catch

### Task 5: BUG-03 — Ranked session rollback khi fail
- Status: [x] DONE
- Fix: Cleanup orphan ranked session nếu quiz session creation fail

### Task 6: BUG-11 — Remove `as string` casts
- Status: [x] DONE
- Fix: Removed `as const` from colors.ts → removed all 24 files `as string` casts

### Task 7: BUG-12 — Quiz navigation params strict type
- Status: [x] DONE
- Fix: mode: 'practice' | 'ranked' | 'daily' | 'multiplayer'

### Task 8: BUG-17 — HomeScreen navigation type safety
- Status: [ ] TODO (deferred — needs CompositeScreenProps refactor)

### Task 9: BUG-18 — Settings toggle wired
- Status: [x] DONE
- Fix: State + AsyncStorage persist for notifications toggle

### Task 10: BUG-20 — EnergyBar shadow Android
- Status: [x] DONE
- Fix: Added elevation: 3 for Android shadow

---

## Phase 2 — Refactor theo CLAUDE.md Mobile [IN PROGRESS]

### Task 11: Setup Jest + test infrastructure
- Status: [x] DONE
- Fix: jest + babel-preset-expo + react-test-renderer + @testing-library/react-native

### Task 12: Tạo src/logic/ — extract quiz engine
- Status: [x] DONE (30 tests)
- File(s): src/logic/quizEngine.ts + test

### Task 13: Tạo src/logic/ — extract tier system
- Status: [x] DONE (12 tests)
- File(s): src/logic/tierSystem.ts + test

### Task 14: Tạo src/logic/ — extract energy system
- Status: [x] DONE (12 tests)
- File(s): src/logic/energySystem.ts + test

### Task 15: Tạo src/hooks/ — useQuiz hook
- Status: [ ] TODO (deferred — needs full QuizScreen refactor)

### Task 16: Tạo src/hooks/ — useAuth hook
- Status: [ ] TODO (deferred — needs full auth flow refactor)

### Task 17: Tạo src/hooks/ — useTimer hook
- Status: [x] DONE (6 tests)
- File(s): src/hooks/useTimer.ts + test

### Task 18: Component tests — GoldButton, GlassCard
- Status: [x] DONE (9 tests)
- File(s): src/components/GoldButton.test.tsx, GlassCard.test.tsx

### Task 19: Screen tests — LoginScreen
- Status: [x] DONE (12 tests)
- File(s): src/screens/auth/LoginScreen.test.tsx

### Task 20: Screen tests — HomeScreen
- Status: [x] DONE (5 tests)
- File(s): src/screens/home/HomeScreen.test.tsx

### Task 21: Screen tests — QuizScreen
- Status: [x] DONE (5 tests)
- File(s): src/screens/quiz/QuizScreen.test.tsx

### Task 22: Snapshot tests — all screens
- Status: [ ] TODO (deferred)

---

## Test Summary
- **Total: 97 tests, 9 suites, ALL PASS**
- Logic: 54 tests (quizEngine 30, tierSystem 12, energySystem 12)
- Hooks: 6 tests (useTimer)
- Components: 9 tests (GoldButton 6, GlassCard 3)
- Screens: 22 tests (LoginScreen 12, HomeScreen 5, QuizScreen 5)
- Baseline: 97 tests
