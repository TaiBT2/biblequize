# Mobile Feature Logic Audit — BibleQuiz

> Paste vào Claude Code. Audit only — KHÔNG fix gì.
> So sánh logic mobile với SPEC_USER_v3 + web app (source of truth).
> Output: bảng chi tiết ✅/⚠️/❌ cho từng tính năng + gap report.

---

```
Audit toàn bộ tính năng mobile app xem logic có đúng với SPEC_USER_v3 và web app không.
KHÔNG fix gì, chỉ report. Output phải chi tiết, actionable.

Sources of truth (theo thứ tự ưu tiên):
1. docs/SPEC_USER_v3.md — spec chính thức
2. apps/web/src/ — web implementation (đã production-ready)
3. apps/api/src/ — backend logic (authoritative)

Target audit: apps/mobile/ (hoặc apps/mobile-old-backup-*/ nếu đã rebuild)

TRƯỚC KHI CHẠY: tạo MOBILE_AUDIT_REPORT.md để ghi kết quả.

═══════════════════════════════════════════
PHẦN 1: SCAN STRUCTURE
═══════════════════════════════════════════

```bash
echo "=== MOBILE APP STRUCTURE ==="
find apps/mobile/src -type f \( -name "*.ts" -o -name "*.tsx" \) | head -50
find apps/mobile/src -type d | head -30

echo "=== LOC COUNT ==="
find apps/mobile/src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -5

echo "=== TESTS COUNT ==="
find apps/mobile -name "*.test.*" -o -name "*.spec.*" | wc -l
```

═══════════════════════════════════════════
PHẦN 2: AUDIT TỪNG FEATURE — 14 MODULES
═══════════════════════════════════════════

Cho MỖI feature sau, check:
1. Có implement trong mobile không?
2. Logic match SPEC_USER_v3 không?
3. Logic match web không?
4. API calls đúng endpoint không?
5. State management đúng không?
6. Edge cases có handle không?

### MODULE 1: Authentication

```bash
# Check auth implementation
grep -rn "GoogleSignin\|google.*signin\|auth" apps/mobile/src/ --include="*.ts" --include="*.tsx" -l
grep -rn "accessToken\|refreshToken\|JWT" apps/mobile/src/ --include="*.ts" --include="*.tsx" -l
cat apps/mobile/src/api/auth.ts 2>/dev/null
cat apps/mobile/src/stores/authStore.ts 2>/dev/null
```

Check points:
- [ ] Google Sign-In native (KHÔNG dùng OAuth browser flow như web)
- [ ] Endpoint: `POST /api/auth/mobile/google` (KHÔNG phải /api/auth/google)
- [ ] Gửi `idToken` (KHÔNG phải authorization code)
- [ ] Lưu `accessToken` + `refreshToken` vào AsyncStorage (KHÔNG localStorage)
- [ ] Token refresh tự động khi 401
- [ ] Logout xóa cả 2 tokens
- [ ] Biometric login (optional, nếu có)
- [ ] Handle case: backend down → error state
- [ ] Handle case: token expired → auto refresh → retry
- [ ] Handle case: refresh token expired → logout + navigate to login

So sánh với web:
- Web dùng authorization code flow (cookie-based)
- Mobile dùng ID token flow (body-based)
- Web endpoint `/api/auth/google` ≠ Mobile `/api/auth/mobile/google`

Report format:
```
### AUTH AUDIT
| Check | Status | Evidence | Gap |
|-------|--------|----------|-----|
| Google native | ✅/⚠️/❌ | file:line | ... |
| Token refresh | ... | ... | ... |
```

### MODULE 2: Home Dashboard

Check points:
- [ ] Fetch daily challenge status (completed today?)
- [ ] Show streak current + countdown to midnight
- [ ] Show energy current/max
- [ ] Show current tier + progress to next
- [ ] Show verse of the day
- [ ] Show recent activity (last 5 sessions)
- [ ] Show recommended book ("Bạn cần ôn: Rô-ma 40%")
- [ ] Pull to refresh
- [ ] Offline: show cached data
- [ ] Navigation to: Quiz, Daily, Profile, Journey

API calls required:
- `GET /api/me/dashboard` hoặc multiple endpoints
- `GET /api/daily-challenge/today`
- `GET /api/me/streak`
- `GET /api/me/energy`
- `GET /api/me/recommended-book`

So sánh với web: apps/web/src/pages/Home.tsx

### MODULE 3: Quiz Engine (Practice + Ranked + Daily)

Critical: scoring logic PHẢI match backend 100%.

```bash
grep -rn "calculateScore\|speedBonus\|comboMultiplier" apps/mobile/src/
cat apps/mobile/src/logic/scoring.ts 2>/dev/null
cat apps/api/src/main/java/com/biblequiz/modules/quiz/service/ScoringService.java 2>/dev/null
```

Check points:
- [ ] Base points: EASY=8, MEDIUM=12, HARD=18
- [ ] Speed bonus: non-linear `basePoints * 0.5 * (ratio²)`
- [ ] Combo multiplier: 5+ = 1.2x, 10+ = 1.5x
- [ ] Tier multiplier applied
- [ ] Wrong answer = 0 points (no partial)
- [ ] Timer: 30s default, HARD = 20s
- [ ] Time expired = treated as wrong
- [ ] Progress saved after EACH question (FIX-002)
- [ ] Abandoned session recovery on app relaunch
- [ ] Question not repeated within session
- [ ] Smart question selection (weighted by weak areas)
- [ ] Anti-cheat: timestamp + client hash (optional)

Critical comparison:
- Calculate score for sample inputs in BOTH mobile and backend
- If different → SEVERE BUG, list all discrepancies

### MODULE 4: Ranked Mode + Energy

Check points:
- [ ] Energy current/max from API
- [ ] Cost per ranked session: configurable (default 1)
- [ ] Regen: 1 energy per X minutes (from backend config)
- [ ] Cannot play if energy = 0 → show wait time
- [ ] Season info: name, days left, current tier
- [ ] Rank calculation: by total points in current season
- [ ] Season reset: tier demotion logic (from SPEC)
- [ ] Book scope enforcement per tier:
  - Tia Sáng: Genesis only
  - Ánh Bình Minh: Pentateuch
  - Ngọn Đèn: OT + Gospels
  - Ngọn Lửa: All NT
  - Ngôi Sao: Full Bible
  - Vinh Quang: Full Bible hardest

API calls:
- `GET /api/me/energy`
- `POST /api/sessions/ranked` (body: { bookOverride? })
- `GET /api/seasons/active`
- `GET /api/me/tier`

### MODULE 5: Daily Challenge

Check points:
- [ ] 5 questions per day (from config)
- [ ] Same 5 questions for all users globally (deterministic)
- [ ] Reset at user's local midnight (timezone-aware)
- [ ] Cannot replay once completed
- [ ] XP bonus: +50 base, streak multiplier
- [ ] Leaderboard scope: Global/Friends/Group
- [ ] Percentile calculation: "Better than X%"
- [ ] Push notification: "Daily challenge ready!" at 08:00 local time
- [ ] Missed day: breaks streak (unless freeze available)
- [ ] Streak freeze: 2 per week auto-used on miss

API:
- `GET /api/daily-challenge/today`
- `POST /api/daily-challenge/submit`
- `GET /api/daily-challenge/leaderboard?scope=global&limit=100`

### MODULE 6: Multiplayer / Rooms

Critical: WebSocket STOMP connection.

```bash
grep -rn "STOMP\|sockjs\|WebSocket" apps/mobile/src/
cat apps/mobile/src/ws/client.ts 2>/dev/null
```

Check points:
- [ ] STOMP client connects to `ws://host:8080/ws` (or wss:// prod)
- [ ] Auto-reconnect on disconnect (max 5 retries with backoff)
- [ ] Heartbeat: 10s client → server, 10s server → client
- [ ] Subscribe topics: `/topic/room/{id}`, `/user/queue/private`
- [ ] Send to: `/app/room/{id}/action`
- [ ] Handle disconnect mid-game: show "Reconnecting..." + timeout
- [ ] 4 game modes:
  - Speed Race: first to finish wins
  - Battle Royale: eliminate slowest
  - Team vs Team: team score
  - Sudden Death: wrong = eliminated
- [ ] Room states: WAITING → STARTED → FINISHED
- [ ] Host controls: start, kick, close room
- [ ] Player controls: ready toggle, leave room
- [ ] Chat: basic text + emoji reactions
- [ ] Rate limit: max 5 messages/10s per user (FIX-011)
- [ ] Room code: 6 chars alphanumeric
- [ ] Max players: configurable per mode
- [ ] Public rooms list: polling `GET /api/rooms/public` every 5s when on lobby screen

### MODULE 7: Groups

Check points:
- [ ] Create group: name, description, avatar, type, privacy, max members
- [ ] Join group: by code OR by invitation link
- [ ] Group roles: Member, Admin, Leader
- [ ] Leader permissions: edit group, delete, assign admins
- [ ] Admin permissions: kick members, post announcements
- [ ] Group tabs: Members, Leaderboard, Announcements, Quiz sets
- [ ] Group leaderboard: filter by time (today/week/month/all-time)
- [ ] Private groups: only via invite code
- [ ] Public groups: searchable + "join" button
- [ ] Member limit enforcement
- [ ] Group quiz sets: created by admin, members play together
- [ ] Notifications: new announcement, member joined, mention

API:
- `GET /api/me/groups`
- `POST /api/groups`
- `POST /api/groups/{id}/join`
- `GET /api/groups/{id}`
- `GET /api/groups/{id}/leaderboard?period=week`
- `POST /api/groups/{id}/announcements`

### MODULE 8: Profile + Stats

Check points:
- [ ] Own profile: full stats, edit button
- [ ] Other profile: public stats only, challenge button
- [ ] Stats: total points, streak, sessions, accuracy, avg time
- [ ] Activity heatmap: 12 weeks grid
- [ ] Badges: recent + all
- [ ] Journey progress: books conquered count
- [ ] Groups list preview
- [ ] Tier history (optional)
- [ ] Privacy settings respected (hide stats, hide groups)
- [ ] Friend request (if friends feature enabled — check FIX-005 status)

### MODULE 9: Achievements / Badges

Check points:
- [ ] Badge unlock logic runs on backend (mobile just displays)
- [ ] Badge categories: Streak, Quiz, Social, Book, Season
- [ ] Progress tracking for locked badges (e.g., "6/10 correct streak")
- [ ] Unlock notification: push + in-app celebration
- [ ] Share achievement: opens native share sheet
- [ ] Hidden badges: "???" until conditions met
- [ ] Seasonal badges: special border, limited-time

### MODULE 10: Bible Journey Map

Check points:
- [ ] 66 books displayed as progression map
- [ ] Book states: Locked, Available, InProgress, Mastered
- [ ] Mastery calculation: (correct answers / total questions for book) ≥ 80%
- [ ] Stars: 1 star (50%), 2 stars (75%), 3 stars (95%)
- [ ] Unlock logic: sequential? Or by tier?
- [ ] Grouping: Pentateuch, History, Poetry, Prophets (Major/Minor), Gospels, Epistles, Revelation
- [ ] Tap book → navigate to Practice with that book pre-selected
- [ ] Visual: current book highlighted + pulsing
- [ ] Next recommended book indicator

API:
- `GET /api/me/journey` → returns all 66 books with mastery data

### MODULE 11: Settings

Check points:
- [ ] Account: profile edit, password change, delete account (required by Apple!)
- [ ] App: UI language, quiz language, dark mode (only dark for now)
- [ ] Notifications: daily reminder time, toggle per type
- [ ] Sound & Haptics: sound on/off, music on/off, haptic on/off
- [ ] Data: offline download, cache clear, restore progress
- [ ] About: rate app, share, terms, privacy, version
- [ ] Logout button at bottom
- [ ] DELETE ACCOUNT flow: confirm password → 30-day soft delete → final delete (FIX required)

### MODULE 12: Notifications System

Check points:
- [ ] Push token registration on login
- [ ] Permission request: proper timing (not on first launch)
- [ ] Notification types configured:
  - Daily reminder (scheduled local, 20:00 default)
  - Streak warning (if streak about to break)
  - Friend request
  - Group announcement
  - Room invitation
  - Tier up
  - Achievement unlocked
  - Multiplayer game starting
- [ ] Tap notification → deep link to correct screen
- [ ] In-app notification center: list with read/unread
- [ ] Clear all / mark as read functions
- [ ] Notification preferences saved to backend

### MODULE 13: Sound + Haptic Feedback

Check points:
- [ ] 15 SFX files required (per SPEC):
  - correct.mp3, wrong.mp3, tick.mp3, timeout.mp3
  - tier_up.mp3, streak.mp3, achievement.mp3
  - button_tap.mp3, notification.mp3, mp_start.mp3, mp_end.mp3
  - countdown.mp3, combo.mp3, reveal.mp3, share.mp3
- [ ] Haptic patterns:
  - Light: button taps
  - Medium: correct answer
  - Heavy: wrong answer
  - Success: quiz complete
  - Warning: low time
- [ ] Volume respects system mute switch
- [ ] Battery optimization: no audio in background
- [ ] Can be disabled in settings

### MODULE 14: Offline Support

Check points:
- [ ] Detect online/offline status
- [ ] Show offline banner when disconnected
- [ ] Cache dashboard data in AsyncStorage
- [ ] Queue actions when offline → sync when online
- [ ] Offline practice: downloaded question packs
- [ ] Prevent: multiplayer, daily submit, ranked in offline
- [ ] Sync conflict resolution: server wins for scores

═══════════════════════════════════════════
PHẦN 3: CROSS-CUTTING CONCERNS
═══════════════════════════════════════════

### A. API Client

```bash
cat apps/mobile/src/api/client.ts 2>/dev/null
```

Check:
- [ ] Base URL: Android uses `10.0.2.2`, iOS uses `localhost`
- [ ] Production URL from env var `EXPO_PUBLIC_API_URL`
- [ ] Auth header attached automatically
- [ ] 401 handler: refresh token + retry
- [ ] 403 handler: logout + redirect
- [ ] 500 handler: show error toast
- [ ] Network error: show offline banner
- [ ] Timeout: 10s default
- [ ] Request/response logging in dev only

### B. State Management (Zustand)

```bash
find apps/mobile/src/stores -name "*.ts"
```

Check:
- [ ] authStore: user, tokens, login, logout
- [ ] settingsStore: language, notifications, sound preferences
- [ ] quizStore: current session, answers, progress
- [ ] onboardingStore: hasSeenOnboarding flag
- [ ] AsyncStorage persist middleware used (NOT localStorage)
- [ ] Hydration on app start
- [ ] Clear all on logout

### C. Navigation

```bash
cat apps/mobile/src/navigation/RootNavigator.tsx 2>/dev/null
```

Check:
- [ ] Conditional flow: Onboarding → Auth → Main
- [ ] Bottom tabs: Home, Quiz/Practice, Multiplayer, Groups, Profile
- [ ] Stack navigators per tab
- [ ] Deep links configured (for notification taps)
- [ ] Back button behavior: confirm on quiz exit
- [ ] Modal screens: Tier Up, Create Room, Delete Account
- [ ] Safe area handling

### D. Internationalization

Check:
- [ ] react-i18next setup
- [ ] vi.json + en.json exist
- [ ] Language from device default initially
- [ ] User override saved to settingsStore
- [ ] Dynamic switching without restart
- [ ] ALL hardcoded strings replaced with t()
- [ ] Date/number formatting: locale-aware
- [ ] Pluralization handled

### E. Error Handling

Check:
- [ ] Global error boundary
- [ ] Sentry integration (mobile)
- [ ] User-friendly error messages (not stack traces)
- [ ] Retry buttons on errors
- [ ] Loading states everywhere
- [ ] Empty states for lists
- [ ] Network error specific UI

### F. Performance

Check:
- [ ] FlatList used for long lists (NOT ScrollView + map)
- [ ] Image optimization: expo-image with caching
- [ ] Memoization: React.memo on expensive components
- [ ] useMemo/useCallback where needed
- [ ] Code splitting: lazy load screens?
- [ ] Bundle size reasonable

═══════════════════════════════════════════
PHẦN 4: GENERATE REPORT
═══════════════════════════════════════════

Tạo MOBILE_AUDIT_REPORT.md với format:

```markdown
# Mobile Audit Report — BibleQuiz
Date: YYYY-MM-DD
Auditor: Claude Code
Target: apps/mobile/

## Executive Summary
- Total features audited: 14 modules + 6 cross-cutting
- Fully compliant: X/20
- Partial: Y/20
- Missing/broken: Z/20
- Overall health: GOOD/FAIR/POOR

## Critical Issues (Must fix before launch)
1. [SEVERE] ...
2. [SEVERE] ...

## High Priority Issues
1. [HIGH] ...

## Medium Priority Issues
1. [MEDIUM] ...

## Low Priority Issues
1. [LOW] ...

## Module-by-Module Report

### Module 1: Authentication ✅/⚠️/❌
| Check | Status | File:Line | Notes |
|-------|--------|-----------|-------|
| Google Sign-In native | ✅ | auth.ts:23 | OK |
| Token refresh | ❌ | - | NOT IMPLEMENTED |
| ... | ... | ... | ... |

Gap analysis:
- Missing: token refresh interceptor
- Wrong endpoint: using /api/auth/google instead of /api/auth/mobile/google
- Recommendation: ...

### Module 2: Home Dashboard ...

[Continue for all 14 modules]

## Cross-Cutting Issues
### API Client ...
### State Management ...
### Navigation ...

## Scoring Logic Comparison
Sample test cases run against mobile vs backend:

| Input | Mobile | Backend | Match? |
|-------|--------|---------|--------|
| EASY, correct, 5s/30s, combo=0, tier=1.0 | X | Y | ✅/❌ |
| ... | ... | ... | ... |

## SPEC Coverage
| SPEC Section | Mobile Status | Notes |
|--------------|---------------|-------|
| 3. Tier Progression | ⚠️ Partial | Missing tier demotion logic |
| 5.1 Game Mechanics | ❌ Scoring wrong | See comparison above |
| ... | ... | ... |

## Recommended Action Plan
Priority order:
1. Fix SEVERE issues (1-2 days)
2. Fix HIGH issues (3-5 days)
3. Fix MEDIUM issues (1 week)
4. LOW issues: after launch

## Rebuild vs Fix Decision
Based on audit:
- If SEVERE count > 5 OR critical architecture wrong → REBUILD (use PROMPT_MOBILE_REBUILD.md)
- If mostly MEDIUM/LOW → FIX in place
- Recommendation: [REBUILD / FIX]

Rationale: ...
```

═══════════════════════════════════════════
PHẦN 5: OUTPUT

1. Tạo MOBILE_AUDIT_REPORT.md với toàn bộ findings
2. In summary ngắn ra terminal
3. Đề xuất REBUILD hay FIX dựa trên severity
4. List top 5 critical issues cần fix ngay

KHÔNG fix gì. Chỉ report.
```

---

## Sau khi audit xong

Claude Code sẽ tạo `MOBILE_AUDIT_REPORT.md` với:
- ✅/⚠️/❌ cho mỗi check point
- File:line evidence cho mỗi claim
- Gap analysis per module
- Scoring logic comparison (mobile vs backend)
- SPEC coverage matrix
- Action plan ưu tiên
- Recommendation: REBUILD hay FIX in place

Dựa vào report, bạn quyết định:
- **Rebuild** (dùng PROMPT_MOBILE_REBUILD.md) nếu critical issues nhiều
- **Fix in place** nếu chỉ cần patch một vài chỗ

Effort audit: ~1-2 giờ để Claude Code scan hết.
