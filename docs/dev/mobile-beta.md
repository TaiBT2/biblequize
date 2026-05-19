# Mobile Beta — Internal Track Setup

> S2 sprint deliverable (2026-05-19). Hướng dẫn ship build cho tester nội bộ qua Expo Go (dev) + EAS internal distribution (preview APK/IPA).

## 1. Prerequisites (one-time per project)

### Account setup
- **Expo account**: https://expo.dev → sign up
- **EAS CLI**: `npm install -g eas-cli` (>= 16.0.0)
- **Apple Developer** ($99/yr): chỉ cần khi build iOS internal distribution thật (TestFlight). Bỏ qua nếu chỉ test Android.
- **Google Play Console** ($25 one-time): chỉ cần khi muốn ship Play Store internal track. Bỏ qua nếu chỉ share APK qua link.

### Sentry setup (optional nhưng strong recommend cho beta)
1. https://sentry.io → new project → React Native
2. Copy DSN → paste vào `apps/mobile/.env` `EXPO_PUBLIC_SENTRY_DSN=...`
3. Build sẽ ship với DSN; crash + JS error tự động về dashboard

### EAS project init (one-time)
```bash
cd apps/mobile
eas login
eas init  # tạo projectId, ghi vào app.json
```

## 2. Build profiles

3 profiles trong [`eas.json`](../../apps/mobile/eas.json):

| Profile | Distribution | Channel | Use case |
|---|---|---|---|
| `development` | internal | development | Dev client với hot reload, đầy đủ debug tools |
| `preview` | internal | preview | APK/IPA cho tester — share URL từ EAS dashboard |
| `production` | store (defer S7) | production | App Store + Play Store submission |

## 3. Workflows

### A. Dev workflow (no build needed)
```bash
cd apps/mobile
pnpm start
# Scan QR với Expo Go app (App Store / Play Store)
# Or press 'a' (Android emulator), 'i' (iOS simulator), 'w' (web)
```
**Limit**: Expo Go không hỗ trợ native modules (Sentry crash reporting fallback JS-only, push notif không work). Cho full feature → cần build A hoặc B.

### B. Preview build cho tester (APK)
```bash
cd apps/mobile
eas build --profile preview --platform android
# Wait ~10-15 phút, EAS log link kết thúc với "Build finished"
# Open link → "Install" → scan QR hoặc copy link gửi tester
```
Tester install bằng cách:
1. Mở link trên Android phone
2. "Install" → trình duyệt báo "Unknown sources" → cho phép
3. App icon "BibleQuiz" xuất hiện, mở thôi

### C. Preview build iOS (TestFlight internal)
```bash
cd apps/mobile
eas build --profile preview --platform ios
eas submit --profile preview --platform ios  # upload to TestFlight
# Mở App Store Connect → TestFlight → Internal Testing → invite emails
# Tester install TestFlight app → accept invite → install BibleQuiz
```

## 4. Manual QA checklist (cho tester)

> Test mỗi build preview trước khi share rộng. Check off từng item.

### Onboarding + Auth
- [ ] App splash hiển thị dark (`#11131e`), không flash trắng
- [ ] Welcome slides 3 trang carousel hoạt động
- [ ] Language selector → chọn VI → home text VN, EN → home text EN
- [ ] TryQuiz 3 câu sample → tap đáp → highlight đúng/sai → next → result
- [ ] Login Google OAuth flow → redirect về app, header hiển thị tên user
- [ ] Login fail (sai mật khẩu) → toast/alert error

### Single-player core
- [ ] Home: tier card hiển thị đúng `totalPoints` + progress bar + streak badge
- [ ] Practice: book selector + difficulty + count → start → 10 câu → result → review
- [ ] Daily Challenge: status hôm nay (chưa làm / đang làm / xong) → play 5 câu → claim 50 XP
- [ ] Ranked: tier locked? → unlock flow. Tier 2+ → energy bar render, play 1 game

### Multiplayer (cần 2 devices)
- [ ] Device A: tạo room SPEED_RACE, copy roomCode
- [ ] Device B: join bằng roomCode → tên xuất hiện trên A's player list
- [ ] Device B: tap "Sẵn sàng" → badge "Sẵn sàng" green trên A
- [ ] Device A (host): tap "Bắt đầu" → cả 2 navigate sang quiz screen
- [ ] Quiz: QUESTION_START render → tap đáp → ROUND_END highlight correct → next câu
- [ ] QUIZ_END → cả 2 navigate sang Results với leaderboard sorted

### Tournament
- [ ] Tournaments list view (có thể empty nếu chưa có tournament active)
- [ ] Open tournament → Bracket render rounds × matches, winner highlight gold

### Groups
- [ ] My groups list → empty → "Tạo nhóm" → form → submit → group code generated
- [ ] Group detail: members list, role badges (Leader gold), XP display
- [ ] Khác device: Join nhóm bằng code → member list update

### Profile + Settings
- [ ] Profile screen tier card render
- [ ] Edit profile modal → đổi tên + chọn preset avatar → save
- [ ] Settings: sound toggle, haptic toggle, language switch, logout
- [ ] Achievements grid render với locked/unlocked state

### Cosmetics + system
- [ ] Notifications list (có thể empty)
- [ ] Legal screen (Privacy/Terms)
- [ ] Force JS error in dev (e.g., paste throw vào component temp) → ErrorBoundary catch → "Thử lại" button works
- [ ] **Sentry verify** (nếu DSN set): dashboard https://sentry.io shows captured error trong 1-2 phút

### Performance smoke
- [ ] Cold start < 5s tới Home (login state)
- [ ] Navigation transitions không lag
- [ ] Scroll long list (groups, leaderboard) smooth 60fps
- [ ] Network offline: OfflineBanner hiển thị; reconnect → banner ẩn

## 5. Known limits (S2 baseline)

**Wired nhưng chưa polish** (S3 sẽ làm):
- Multiplayer: chỉ SPEED_RACE happy path. Battle Royale/Team vs Team/Sudden Death overlay chưa có
- Multiplayer Quiz: chưa có countdown timer animation, sound, haptic, combo banner
- Tournament: bracket render list-per-round, chưa có visual tree
- Quản trò (host orchestration) chưa wire mobile

**Chưa implement** (S4-S6):
- QuizSet CRUD (group + personal)
- Scheduled quizzes
- Cosmetics page
- RoomAnalytics post-game

**Defer hard** (S7+):
- Push notifications
- Deep links beyond `biblequiz://` scheme
- In-app updates (expo-updates)

## 6. Reporting bugs

- **Crash** (app close suddenly): Sentry capture tự động (nếu DSN set). Cũng note thời gian + step reproduce
- **Bug visual**: screenshot + screen name + step
- **Bug logic** (data sai, click không work): screenshot + state mô tả ("Tôi vừa làm X, thấy Y, mong đợi Z")
- **Submit qua**: Slack #biblequiz-mobile-beta hoặc GitHub issues (TBD setup)

## 7. References

- Expo docs: https://docs.expo.dev/
- EAS Build: https://docs.expo.dev/build/introduction/
- Sentry RN: https://docs.sentry.io/platforms/react-native/manual-setup/expo/
- Roadmap: [`docs/todo/active/2026-05-18-mobile-rewrite-roadmap.md`](../todo/active/2026-05-18-mobile-rewrite-roadmap.md)
