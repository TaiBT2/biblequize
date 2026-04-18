# Prompt viết test cho 47 files thiếu + 12 e2e flows

Copy toàn bộ phần PROMPT bên dưới paste vào Claude Code:

---

## PROMPT

Viết test cho 47 source files thiếu test + 12 e2e flows thiếu. Tuân thủ CLAUDE.md — chia nhỏ tasks vào TODO.md, làm từng task, test pass, commit.

**Đọc TODO.md trước. Nếu có task dở thì hoàn thành trước.**

**Quy tắc test theo CLAUDE.md:**
- Unit test: Vitest + @testing-library/react, happy-dom
- Minimum 8 test cases per screen/component
- E2E: Playwright, minimum 5 cases per flow
- Mock strategy: mock TanStack Query hooks hoặc MSW, mock useNavigate, mock Zustand store, mock useStomp/useWebSocket — KHÔNG mock implementation details
- Test behavior, not internals
- Đặt test file cạnh source: `__tests__/Xxx.test.tsx`
- E2E đặt trong `tests/xxx.spec.ts`
- Dùng `renderWithProviders` từ `src/test/test-utils.tsx` cho component tests

---

### PHASE 1 — CRITICAL (7 tasks, phải có trước khi ship)

#### Task 1: Test useWebSocket hook
- File test: `src/hooks/__tests__/useWebSocket.test.ts`
- File source: `src/hooks/useWebSocket.ts`
- Test cases (minimum 8):
  1. Kết nối WebSocket thành công → isConnected = true
  2. Nhận message PLAYER_JOINED → gọi onPlayerJoined callback
  3. Nhận message PLAYER_LEFT → gọi onPlayerLeft callback
  4. Nhận message QUESTION_START → gọi onQuestionStart callback
  5. Nhận message SCORE_UPDATE → gọi onScoreUpdate callback
  6. Nhận message ERROR → gọi onError callback
  7. Reconnect khi connection close bất thường (code !== 1000) → reconnect với exponential backoff
  8. Không reconnect khi vượt maxReconnectAttempts (5)
  9. sendMessage khi connected → socket.send được gọi
  10. sendMessage khi disconnected → console.warn, không throw
  11. disconnect() → socket.close(1000), clearTimeout reconnect
  12. Parse lỗi message → console.error, không crash
- Mock: Mock WebSocket global class
- Commit: `test: add useWebSocket hook tests`

#### Task 2: Test useStomp hook
- File test: `src/hooks/__tests__/useStomp.test.ts`
- File source: `src/hooks/useStomp.ts`
- Test cases (minimum 8):
  1. Activate STOMP client khi mount
  2. Subscribe `/topic/room/{roomId}` khi connected + roomId có giá trị
  3. Gọi onConnect callback lần đầu connect
  4. Gọi onReconnect callback lần 2+ connect
  5. Gọi onDisconnect khi WebSocket close
  6. Parse message body JSON → gọi onMessage
  7. send() publish message với Authorization header
  8. send() không gửi khi disconnected
  9. Deactivate client khi unmount
  10. Unsubscribe khi roomId thay đổi
  11. connectHeaders chứa Bearer token từ tokenStore
- Mock: Mock @stomp/stompjs Client, mock getAccessToken
- Commit: `test: add useStomp hook tests`

#### Task 3: Test useRankedDataSync hook
- File test: `src/hooks/__tests__/useRankedDataSync.test.ts`
- File source: `src/hooks/useRankedDataSync.ts`
- Test cases: đọc source trước rồi viết test cho tất cả logic paths
- Tối thiểu: sync on mount, sync on event, conflict handling, error handling, offline behavior
- Commit: `test: add useRankedDataSync hook tests`

#### Task 4: Test RequireAuth context
- File test: `src/contexts/__tests__/RequireAuth.test.tsx`
- File source: `src/contexts/RequireAuth.tsx`
- Test cases (minimum 8):
  1. isLoading = true → render spinner/loading
  2. isAuthenticated = false → Navigate to /login
  3. isAuthenticated = true → render children
  4. Preserve location state khi redirect (from location)
  5. Không redirect khi đang loading
  6. Render children đúng component
  7. Loading spinner có đúng styles
  8. Navigate có replace = true
- Mock: mock useAuthStore (Zustand), mock react-router-dom
- Commit: `test: add RequireAuth context tests`

#### Task 5: Test RequireAdmin context
- File test: `src/contexts/__tests__/RequireAdmin.test.tsx`
- File source: `src/contexts/RequireAdmin.tsx`
- Test cases (minimum 8):
  1. isLoading = true → render spinner
  2. isAuthenticated = false → Navigate to /login
  3. isAdmin = true → render children
  4. role = CONTENT_MOD → render children (allowed)
  5. role = content_mod (lowercase) → render children (allowed)
  6. isAuthenticated + không phải admin/content_mod → Navigate to /
  7. Preserve location state khi redirect to login
  8. Navigate to / (not /login) khi authenticated but not authorized
- Mock: mock useAuthStore
- Commit: `test: add RequireAdmin context tests`

#### Task 6: Test ErrorBoundary component
- File test: `src/components/__tests__/ErrorBoundary.test.tsx`
- File source: `src/components/ErrorBoundary.tsx`
- Test cases (minimum 8):
  1. Render children bình thường khi không có error
  2. Catch error → render fallback UI
  3. Hiển thị error message trong fallback
  4. Có nút retry/reload
  5. Click retry → reset error state hoặc reload
  6. Không catch errors ngoài subtree
  7. Log error (componentDidCatch hoặc getDerivedStateFromError)
  8. Nested errors handled correctly
- Commit: `test: add ErrorBoundary component tests`

#### Task 7: Test AuthCallback page
- File test: `src/pages/__tests__/AuthCallback.test.tsx`
- File source: `src/pages/AuthCallback.tsx`
- Test cases (minimum 8):
  1. Render loading spinner khi processing
  2. Có code param → gọi api.post('/api/auth/exchange')
  3. Exchange thành công → gọi login() với tokens
  4. Exchange thành công → navigate to /
  5. Không có code param → hiển thị error
  6. errorParam trong URL → hiển thị OAuth error
  7. API exchange fail → hiển thị error message
  8. Redirect to /login sau error timeout
- Mock: mock api.post, mock useAuth.login, mock useNavigate, mock useSearchParams
- Commit: `test: add AuthCallback page tests`

---

### PHASE 2 — HIGH (11 tasks)

#### Task 8: Test ErrorContext
- File test: `src/contexts/__tests__/ErrorContext.test.tsx`
- File source: `src/contexts/ErrorContext.tsx`
- Test cases:
  1. showError() thêm error vào list
  2. Auto-remove sau 5 giây
  3. clearErrors() xóa hết
  4. Render ErrorToast cho mỗi error
  5. Support 3 types: error, warning, info
  6. Multiple errors hiển thị đồng thời
  7. onClose xóa đúng error
  8. useError() throw khi dùng ngoài Provider
- Commit: `test: add ErrorContext tests`

#### Task 9: Test Header component
- File test: `src/components/__tests__/Header.test.tsx`
- File source: `src/components/Header.tsx`
- Test cases: render, user info display, notification badge, navigation links, logout, mobile menu, search
- Đọc source trước rồi viết test phủ tất cả branches
- Commit: `test: add Header component tests`

#### Task 10: Test useOnlineStatus hook
- File test: `src/hooks/__tests__/useOnlineStatus.test.ts`
- File source: `src/hooks/useOnlineStatus.ts`
- Test cases: online → offline event, offline → online event, initial state, cleanup listeners
- Commit: `test: add useOnlineStatus hook tests`

#### Task 11: Test Onboarding + OnboardingTryQuiz pages
- File test: `src/pages/__tests__/Onboarding.test.tsx`, `src/pages/__tests__/OnboardingTryQuiz.test.tsx`
- Test cases per page: render, step navigation, skip, completion, state persistence
- Commit: `test: add Onboarding page tests`

#### Task 12: Test WeeklyQuiz page
- File test: `src/pages/__tests__/WeeklyQuiz.test.tsx`
- Test cases: render, theme display, loading/error/success states, start quiz, navigation, countdown
- Commit: `test: add WeeklyQuiz page tests`

#### Task 13: Test MysteryMode page
- File test: `src/pages/__tests__/MysteryMode.test.tsx`
- Tương tự WeeklyQuiz: render, loading/error/success, game logic, navigation
- Commit: `test: add MysteryMode page tests`

#### Task 14: Test SpeedRound page
- File test: `src/pages/__tests__/SpeedRound.test.tsx`
- Tương tự: render, timer, scoring, loading/error/success
- Commit: `test: add SpeedRound page tests`

#### Task 15: Test LiveFeed component
- File test: `src/components/__tests__/LiveFeed.test.tsx`
- Test cases: render events, max 3 events, auto-remove, animation, empty state
- Commit: `test: add LiveFeed component tests`

#### Task 16: Test ReactionBar component
- File test: `src/components/__tests__/ReactionBar.test.tsx`
- Test cases: render emojis, click reaction, cooldown (1500ms), floating animation, send callback
- Commit: `test: add ReactionBar component tests`

#### Task 17: E2E — Onboarding flow
- File: `tests/onboarding.spec.ts`
- Cases (minimum 5):
  1. First-time visitor → thấy onboarding (không phải landing)
  2. Hoàn thành tất cả steps → navigate to home
  3. Skip onboarding → navigate to landing
  4. Try quiz step → quiz renders đúng
  5. Quay lại sau khi hoàn thành → thấy landing (không onboarding)
- Commit: `test: add onboarding e2e tests`

#### Task 18: E2E — Multiplayer UI flow
- File: `tests/multiplayer-ui.spec.ts`
- Cases (minimum 5):
  1. Navigate to /multiplayer → thấy room list
  2. Create room → điền form → vào lobby
  3. Join room bằng code → vào lobby
  4. Lobby hiển thị player list
  5. Error khi room full hoặc invalid code
- Commit: `test: add multiplayer UI e2e tests`

---

### PHASE 3 — MEDIUM (7 tasks)

#### Task 19: Test Modal components (5 files cùng 1 task)
- Files test:
  - `src/components/__tests__/BookCompletionModal.test.tsx`
  - `src/components/__tests__/TierUpModal.test.tsx`
  - `src/components/__tests__/DailyBonusModal.test.tsx`
  - `src/components/__tests__/ComebackModal.test.tsx`
  - `src/components/__tests__/TutorialOverlay.test.tsx`
- Mỗi modal tối thiểu 5 cases: render, open/close, content, actions, animation
- Commit: `test: add modal component tests`

#### Task 20: Test Cosmetics page
- File test: `src/pages/__tests__/Cosmetics.test.tsx`
- Test cases: render, item list, preview, equip, loading/error states, categories
- Commit: `test: add Cosmetics page tests`

#### Task 21: Test admin/Questions + AIQuestionGenerator
- Files test: `src/pages/admin/__tests__/Questions.test.tsx`, `src/pages/admin/__tests__/AIQuestionGenerator.test.tsx`
- Cases: render, CRUD operations, search/filter, pagination, AI generate, draft review
- Commit: `test: add admin Questions and AIGenerator tests`

#### Task 22: Test admin dashboard sub-components (7 files cùng 1 task)
- Files test:
  - `src/pages/admin/dashboard/__tests__/KpiCards.test.tsx`
  - `src/pages/admin/dashboard/__tests__/CoverageChart.test.tsx`
  - `src/pages/admin/dashboard/__tests__/QuestionQueue.test.tsx`
  - `src/pages/admin/dashboard/__tests__/ActionItems.test.tsx`
  - `src/pages/admin/dashboard/__tests__/ActivityLog.test.tsx`
  - `src/pages/admin/dashboard/__tests__/SessionsChart.test.tsx`
  - `src/pages/admin/dashboard/__tests__/UserRegChart.test.tsx`
- Mỗi component tối thiểu 5 cases: render, data display, loading, error, empty
- Commit: `test: add admin dashboard sub-component tests`

#### Task 23: Test RoomOverlays + DraftCard
- Files test:
  - `src/pages/room/__tests__/RoomOverlays.test.tsx`
  - `src/pages/admin/ai-generator/__tests__/DraftCard.test.tsx`
- Commit: `test: add RoomOverlays and DraftCard tests`

#### Task 24: E2E — Tournament full flow
- File: `tests/tournament-flow.spec.ts`
- Cases (minimum 5):
  1. Navigate to /tournaments → list renders
  2. Tournament detail page → bracket hiển thị
  3. Match page → quiz gameplay works
  4. Auth required cho tournament actions
  5. Tournament countdown/status display
- Commit: `test: add tournament e2e tests`

#### Task 25: E2E — Admin CRUD workflows
- File: `tests/admin-crud.spec.ts`
- Cases (minimum 5):
  1. Admin access control (non-admin blocked)
  2. Dashboard renders với KPIs
  3. Questions list + search
  4. Review queue → approve/reject
  5. User management → view users
- Commit: `test: add admin CRUD e2e tests`

---

### PHASE 4 — LOW (5 tasks)

#### Task 26: Test utility components (EmptyState, Skeleton, PageMeta, OfflineBanner, MilestoneBanner, StarPopup, QuizLanguageSelect)
- 1 test file per component trong `__tests__/`
- Mỗi component tối thiểu 5 cases: render, props, variants, accessibility, edge cases
- Commit: `test: add utility component tests`

#### Task 27: Test PrivacyPolicy + TermsOfService pages
- Mỗi page tối thiểu 3 cases: render, content present, navigation
- Commit: `test: add legal pages tests`

#### Task 28: Test onboardingStore + quizLanguage util
- `src/store/__tests__/onboardingStore.test.ts`: persistence, hasSeenOnboarding, reset
- `src/utils/__tests__/quizLanguage.test.ts`: get/set language, localStorage persistence, default
- Commit: `test: add onboardingStore and quizLanguage tests`

#### Task 29: E2E — Game modes UI + Error recovery
- File: `tests/game-modes-ui.spec.ts`
- Cases: WeeklyQuiz UI, MysteryMode UI, SpeedRound UI renders correctly
- File: `tests/error-recovery.spec.ts`
- Cases: network failure → offline banner → retry → success
- Commit: `test: add game modes and error recovery e2e tests`

#### Task 30: Full regression
- Chạy đủ 3 tầng:
  ```bash
  cd apps/web && npx vitest run
  cd apps/web && npx playwright test
  cd apps/api && ./mvnw test -Dtest="com.biblequiz.api.**,com.biblequiz.service.**"
  ```
- Verify: số test > baseline (518) — target: ~600+ sau khi thêm tất cả tests mới
- Không có test skip/disabled
- Nếu regression → DỪNG → fix → chạy lại
- Commit: `test: full regression pass after test coverage expansion`

---

### THỨ TỰ THỰC HIỆN:
1. Đọc TODO.md → ghi tất cả 30 tasks vào
2. Làm Task 1 → vitest run file vừa viết → pass → commit
3. Làm Task 2 → test → commit
4. ... lặp lại cho từng task ...
5. Sau mỗi 5 tasks: chạy `npx vitest run` toàn bộ để check regression
6. Task 30: Full regression cuối cùng

### LƯU Ý QUAN TRỌNG:
- KHÔNG viết test rỗng hoặc skip test — mỗi test phải assert behavior thật
- KHÔNG mock quá sâu — test behavior user thấy, không test implementation
- Nếu source file có bug (đã biết từ code review) → viết test thể hiện bug đó (test fail), ghi TODO fix sau
- Đọc source file TRƯỚC khi viết test — hiểu logic rồi mới test
- Dùng `renderWithProviders` cho mọi component test
- E2E cần app chạy (dev server + backend + DB) — nếu không chạy được thì ghi BLOCKED
