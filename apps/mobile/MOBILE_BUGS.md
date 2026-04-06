# BibleQuiz Mobile — Bug Report
> Generated: 2026-04-05

## Tổng quan

| Mức độ | Số lượng | Mô tả |
|--------|----------|-------|
| **CRITICAL** | 1 | Auth token refresh không redirect login |
| **MEDIUM** | 9 | Navigation, API endpoints, Google OAuth, WebSocket, mode handling |
| **LOW** | 10 | Type casting, error handling, documentation |

---

## CRITICAL

### BUG-01: Token refresh fail không navigate về Login
- **File**: `src/api/client.ts:58-63`
- **Mô tả**: Khi refresh token hết hạn, code clear tokens nhưng KHÔNG navigate về Login screen. User bị stuck ở screen hiện tại với state không hợp lệ.
- **Fix**: Gọi `useAuthStore.getState().logout()` khi refresh fail, hoặc dùng `navigationRef` để redirect.

---

## MEDIUM

### BUG-02: QuizScreen không handle mode 'daily' và 'multiplayer'
- **File**: `src/screens/quiz/QuizScreen.tsx:62`
- **Mô tả**: Chỉ check `isRanked = mode === 'ranked'`. Daily/multiplayer dùng chung logic practice — nếu cần scoring/endpoint khác sẽ sai.
- **Fix**: Thêm explicit check cho daily + multiplayer modes.

### BUG-03: Ranked session tạo 2 API calls không transactional
- **File**: `src/screens/quiz/RankedScreen.tsx:47-57`
- **Mô tả**: Gọi `POST /ranked/sessions` rồi `POST /sessions` — nếu call thứ 2 fail, ranked session bị orphan.
- **Fix**: Wrap trong try/catch hoặc rollback session nếu fail.

### BUG-04: Google OAuth không handle success mà thiếu accessToken
- **File**: `src/components/GoogleLoginButton.tsx:33-39`
- **Mô tả**: Nếu `type === 'success'` nhưng `accessToken` undefined → không gọi callback nào, user bị stuck.
- **Fix**: Thêm else branch gọi `onError('Missing access token')`.

### BUG-05: useEffect thiếu dependency trong GoogleLoginButton
- **File**: `src/components/GoogleLoginButton.tsx:39`
- **Mô tả**: Dependency array `[response]` thiếu `onToken`, `onError` → có thể dùng stale callbacks.
- **Fix**: Thêm `onToken`, `onError` vào dependency array.

### BUG-06: API client không có navigation ref → không redirect login khi 401
- **File**: `src/api/client.ts`
- **Mô tả**: Không có cơ chế navigate về Login từ API interceptor. Web dùng `window.location.href`, RN cần `navigationRef`.
- **Fix**: Tạo `navigationRef` trong App.tsx, export + dùng trong client.ts.

### BUG-07: WebSocket RoomLobby không có retry/reconnect UI
- **File**: `src/screens/multiplayer/RoomLobbyScreen.tsx:26-28`
- **Mô tả**: Connection error chỉ show Alert rồi dismiss. Không có UI indicator hay nút retry.
- **Fix**: Thêm state `connectionStatus` + nút reconnect.

### BUG-08: `GET /api/me/achievements` endpoint chưa verify
- **File**: `src/screens/profile/AchievementsScreen.tsx:17`
- **Mô tả**: Gọi endpoint không có trong PROJECT_STATUS.md. Có thể trả 404.
- **Fix**: Verify backend endpoint hoặc đổi sang endpoint đúng.

### BUG-09: `POST /api/me/devices` endpoint chưa implement
- **File**: `src/services/pushNotifications.ts:37`
- **Mô tả**: Push notification registration gọi endpoint không tồn tại. Silently fails.
- **Fix**: Implement endpoint hoặc xóa call cho đến khi backend ready.

### BUG-10: DailyChallengeScreen navigate nested sai pattern
- **File**: `src/screens/quiz/DailyChallengeScreen.tsx:58-61`
- **Mô tả**: Navigate `('RankedTab', { screen: 'Quiz' })` — Daily không nằm trong RankedTab conceptually.
- **Fix**: Cân nhắc tạo QuizScreen ở root level hoặc shared stack.

---

## LOW

### BUG-11: `as string` casts lan tràn (20+ chỗ)
- **Files**: HomeScreen, QuizScreen, MultiplayerScreen, LeaderboardScreen, v.v.
- **Mô tả**: `colors.text.muted as string`, `colors.bg.card as string` — do `as const` trong colors.ts khiến types quá strict cho StyleSheet.
- **Fix**: Bỏ `as const` ở colors.ts hoặc dùng type assertion tại definition.

### BUG-12: Quiz navigation params type quá loose
- **File**: `src/navigation/types.ts:34`
- **Mô tả**: `mode: string` thay vì union type `'practice' | 'ranked' | 'daily' | 'multiplayer'`.
- **Fix**: Dùng union type.

### BUG-13: RefreshControl không handle error
- **Files**: MultiplayerScreen, LeaderboardScreen
- **Mô tả**: `onRefresh={() => query.refetch()}` — nếu fail user không biết.
- **Fix**: Wrap trong try/catch + Alert.

### BUG-14: TournamentDetailScreen handleJoin success message trước refetch
- **File**: `src/screens/social/TournamentDetailScreen.tsx:34`
- **Mô tả**: Show "Thành công" rồi mới refetch — nếu refetch fail, data không cập nhật.
- **Fix**: Await refetch trước khi show alert.

### BUG-15: GroupsScreen join refetch không await
- **File**: `src/screens/social/GroupsScreen.tsx:30`
- **Mô tả**: `groupsQuery.refetch()` không await — data có thể chưa cập nhật khi alert hiện.
- **Fix**: `await groupsQuery.refetch()`.

### BUG-16: RoomLobbyScreen không validate game mode trước navigate
- **File**: `src/screens/multiplayer/RoomLobbyScreen.tsx:48`
- **Mô tả**: Navigate Quiz với `mode: 'multiplayer'` nhưng QuizScreen không handle mode này explicitly.
- **Fix**: Document hoặc thêm multiplayer handling.

### BUG-17: HomeScreen game mode cards type `any` cho navigation
- **File**: `src/screens/home/HomeScreen.tsx:114`
- **Mô tả**: `useNavigation<any>()` — mất type safety cho navigate calls.
- **Fix**: Dùng proper CompositeScreenProps type.

### BUG-18: SettingsScreen notification toggle không wired
- **File**: `src/screens/profile/SettingsScreen.tsx`
- **Mô tả**: Switch component `value={true}` hardcoded, không toggle state.
- **Fix**: Dùng state + AsyncStorage persist preference.

### BUG-19: CircularTimer không animate smooth
- **File**: `src/components/CircularTimer.tsx`
- **Mô tả**: strokeDashoffset thay đổi discrete (mỗi giây) thay vì animated smooth.
- **Fix**: Dùng `react-native-reanimated` animated value cho smooth transition.

### BUG-20: EnergyBar shadow chỉ hoạt động trên iOS
- **File**: `src/components/EnergyBar.tsx:35-39`
- **Mô tả**: shadowColor/shadowOffset/shadowOpacity chỉ work trên iOS. Android cần `elevation`.
- **Fix**: Thêm `elevation` cho Android.

---

## Action Plan

### Phase 1 — Fix Critical (trước khi test tiếp)
1. [ ] BUG-01: Auth redirect on token failure

### Phase 2 — Fix Medium (trước khi release)
2. [ ] BUG-02: Quiz mode handling
3. [ ] BUG-03: Ranked session rollback
4. [ ] BUG-04 + BUG-05: Google OAuth edge cases
5. [ ] BUG-06: Navigation ref cho API client
6. [ ] BUG-07: WebSocket reconnect UI

### Phase 3 — Fix Low (polish)
7. [ ] BUG-11: Remove `as string` casts
8. [ ] BUG-12: Strict mode union type
9. [ ] BUG-18: Settings toggle wired
10. [ ] BUG-19: Smooth timer animation
