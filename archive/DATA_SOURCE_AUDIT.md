# Data Source Audit
> Generated: 2026-04-02

## Tổng quan

| Metric | Count |
|--------|-------|
| Total screens audited | 28 |
| 🟢 API (real data) | ~65 data points |
| 🔴 HARDCODED (fake data) | ~45 data points |
| 🟡 MOCK/PLACEHOLDER | ~8 data points |
| 🔵 COMPUTED | ~20 data points |
| ⚪ STATIC (labels, OK) | ~40+ |

---

## Bảng tổng hợp per screen

### User-Facing Pages

| # | Screen | File | API Calls | Hardcoded | Mock | Status |
|---|--------|------|-----------|-----------|------|--------|
| 1 | Home | Home.tsx | 3 (me, leaderboard, my-rank) | 2 (activity feed, verse) | 0 | ⚠️ Has hardcoded |
| 2 | Login | Login.tsx | 1 (auth/login) | 1 (OAuth URL localhost) | 0 | ⚠️ |
| 3 | Quiz | Quiz.tsx | 2 (answer, review) | 2 (hint button, "Hỏi ý kiến") | 0 | ⚠️ |
| 4 | QuizResults | QuizResults.tsx | 0 (props from Quiz) | 1 (Streak label) | 0 | ✅ Mostly computed |
| 5 | Review | Review.tsx | 2 (bookmarks, retry) | 0 | 0 | ✅ All API/computed |
| 6 | Practice | Practice.tsx | 2 (books, sessions) | 1 (MOCK_SESSIONS) | 0 | ⚠️ |
| 7 | Ranked | Ranked.tsx | 2 (ranked-status, my-rank) | 2 (TIERS, season 65%) | 0 | ⚠️ |
| 8 | DailyChallenge | DailyChallenge.tsx | 4 (challenge, leaderboard, result, start) | 0 | 0 | ✅ All API |
| 9 | **Leaderboard** | **Leaderboard.tsx** | **0** | **6** | **1** | **🔴 100% hardcoded** |
| 10 | **Profile** | **Profile.tsx** | **0** | **6** | **0** | **🔴 95% hardcoded** |
| 11 | Achievements | Achievements.tsx | 2 (achievements, stats) | 2 (TIERS dup, promo banner) | 0 | ⚠️ |
| 12 | **Groups** | **Groups.tsx** | **2 (create, join)** | **9** | **0** | **🔴 90% hardcoded** |
| 13 | GroupDetail | GroupDetail.tsx | 4 (group, leaderboard, announce, quiz-sets) | 1 (banner image) | 0 | ✅ Mostly API |
| 14 | GroupAnalytics | GroupAnalytics.tsx | 1 (analytics) | 4 (chart, contributors, trends) | 0 | ⚠️ |
| 15 | Multiplayer | Multiplayer.tsx | 1 (rooms/public) | 1 (featured suggestion) | 0 | ⚠️ |
| 16 | CreateRoom | CreateRoom.tsx | 1 (create room) | 0 | 0 | ✅ All API |
| 17 | **Tournaments** | **Tournaments.tsx** | **0** | **7** | **0** | **🔴 100% hardcoded** |
| 18 | TournamentDetail | TournamentDetail.tsx | 3 (bracket, join, start) | 0 | 0 | ✅ All API |
| 19 | TournamentMatch | TournamentMatch.tsx | 2 (bracket, forfeit) | 0 | 0 | ✅ All API |
| 20 | LandingPage | LandingPage.tsx | 0 | 5 (stats, leaderboard, streak) | 0 | ⚠️ Marketing page OK |
| 21 | NotFound | NotFound.tsx | 0 | 0 | 0 | ✅ Static |
| 22 | GameModeGrid | GameModeGrid.tsx | 3 (ranked, daily, rooms) | 0 | 0 | ✅ All API (uses useEffect) |
| 23 | AppLayout | AppLayout.tsx | 0 (from store) | 1 (displayRole "Hạng Vàng") | 0 | ⚠️ |

### Admin Pages

| # | Screen | File | API Calls | Hardcoded | Mock | Status |
|---|--------|------|-----------|-----------|------|--------|
| 24 | Dashboard | Dashboard.tsx + 7 subs | 2 (dashboard, coverage) | 5 (backend TODOs) | 2 (charts) | ⚠️ Partial |
| 25 | Users | Users.tsx | 3 (list, ban, role) | 1 (CSV button no-op) | 0 | ✅ Mostly API |
| 26 | Questions | Questions.tsx | 5 (CRUD, import) | 0 | 0 | ✅ All API |
| 27 | AI Generator | AIQuestionGenerator.tsx | 3 (info, generate, save) | 0 | 0 | ✅ All API |
| 28 | ReviewQueue | ReviewQueue.tsx | 3 (pending, stats, approve/reject) | 0 | 0 | ✅ All API |
| 29 | Feedback | Feedback.tsx | 2 (list, update) | 0 | 0 | ✅ All API |
| 30 | Rankings | Rankings.tsx | 3 (list, create, end) | 0 | 0 | ✅ All API |
| 31 | Events | Events.tsx | 1 (tournaments) | 0 | 0 | ✅ All API |
| 32 | Groups (admin) | admin/Groups.tsx | 3 (list, lock/unlock, delete) | 0 | 0 | ✅ All API |
| 33 | Notifications | Notifications.tsx | 1 (history) | 1 (automated list) | 1 (broadcast) | 🔴 Partial mock |
| 34 | **Configuration** | **Configuration.tsx** | **0** | **All values** | **1 (save)** | **🔴 No API** |
| 35 | **ExportCenter** | **ExportCenter.tsx** | **0** | **0** | **All buttons** | **🔴 No API** |
| 36 | QuestionQuality | QuestionQuality.tsx | 1 (coverage) | 1 (score "72") | 1 (problem cards) | ⚠️ |
| 37 | AdminLayout | AdminLayout.tsx | 0 (from store) | 2 (search no-op, notif dot) | 0 | ⚠️ |

---

## 🔴 Screens 100% HARDCODED (Critical — Zero API)

| # | Screen | Data cần API | Priority |
|---|--------|-------------|----------|
| 1 | **Leaderboard.tsx** | Podium top 3, all entries, my rank, season countdown — ALL fake | **Rất cao** |
| 2 | **Profile.tsx** | User stats, tier progress, heatmap, badges — ALL fake | **Rất cao** |
| 3 | **Tournaments.tsx** | Entire bracket, all players, match results — ALL fake | **Cao** |
| 4 | **Groups.tsx** (user page) | Member leaderboard, weekly chart, announcements, stats — ALL fake | **Cao** |

---

## 🔴 Admin Pages Without API

| # | Screen | Issue | Priority |
|---|--------|-------|----------|
| 1 | **Configuration** | All values hardcoded defaults, save = alert() | Trung bình |
| 2 | **ExportCenter** | All buttons = alert("API chưa implement") | Trung bình |

---

## ⚠️ Partially Hardcoded — Needs Fix

| # | Screen | Hardcoded Data | Cần | API Endpoint | Priority |
|---|--------|---------------|-----|-------------|----------|
| 1 | Home | Activity feed (3 items) | Dynamic notifications | GET /api/notifications | Cao |
| 2 | Home | Daily verse (30 items local) | OK — local array acceptable | — | Thấp |
| 3 | Practice | MOCK_SESSIONS (3 fake sessions) | Real session history | GET /api/sessions?mode=practice&size=3 | Cao |
| 4 | Ranked | Season progress bar = 65% | Real progress | From /api/me/ranked-status | Trung bình |
| 5 | Ranked | TIERS config (duplicated 3x) | Single source | Extract to shared/tierConfig.ts | Thấp |
| 6 | GroupAnalytics | Weekly chart, top contributors | Real analytics data | GET /api/groups/{id}/analytics | Trung bình |
| 7 | Multiplayer | "Đề xuất hôm nay" card | Real suggestion or remove | — | Thấp |
| 8 | AppLayout | displayRole = "Hạng Vàng" | Real tier from user data | From authStore user | Cao |
| 9 | Quiz | Hint button "(2)" | Implement or remove | — | Thấp |
| 10 | Login + Landing | OAuth URL localhost:8080 | Use env var | VITE_API_URL | Cao |

---

## ⚠️ Admin Dashboard Backend Gaps

| # | Field | Current Value | Cần | Priority |
|---|-------|-------------|-----|----------|
| 1 | actionItems.pendingFeedback | Always 0 (TODO) | feedbackRepository.countByStatus | Trung bình |
| 2 | actionItems.reportedGroups | Always 0 (TODO) | groupRepository query | Thấp |
| 3 | actionItems.flaggedUsers | Always 0 (TODO) | userRepository query | Thấp |
| 4 | questionQueue.aiGenerated | Always 0 (TODO) | Count AI-generated questions | Thấp |
| 5 | recentActivity | Always empty | Implement audit logging | Trung bình |
| 6 | charts.sessionsTotal | Not returned | Count sessions 7 days | Trung bình |
| 7 | charts.newUsers30d | Not returned | Count new users 30 days | Trung bình |
| 8 | kpis.newUsersThisWeek | Not returned | Count new users 7 days | Thấp |
| 9 | kpis.aiQuotaUsed | Not returned | From AI quota tracking | Thấp |
| 10 | SessionsChart SVG | Hardcoded path | Real per-day session counts | Trung bình |
| 11 | UserRegChart bars | Hardcoded heights | Real per-day registration counts | Trung bình |
| 12 | AdminLayout notification dot | Always visible | Real unread notification count | Thấp |
| 13 | AdminLayout search bar | No functionality | Implement search or remove | Thấp |

---

## ✅ Screens 100% API (No Issues)

| # | Screen | API calls |
|---|--------|-----------|
| 1 | DailyChallenge | 4 (challenge, leaderboard, result, start) |
| 2 | Review | 2 (bookmarks, retry) |
| 3 | CreateRoom | 1 (create room) |
| 4 | TournamentDetail | 3 (bracket, join, start) |
| 5 | TournamentMatch | 2 (bracket, forfeit) |
| 6 | GroupDetail | 4 (group, leaderboard, announce, quiz-sets) |
| 7 | Admin Questions | 5 (CRUD, import) |
| 8 | Admin AI Generator | 3 (info, generate, save) |
| 9 | Admin ReviewQueue | 3 (pending, stats, approve/reject) |
| 10 | Admin Feedback | 2 (list, update) |
| 11 | Admin Rankings | 3 (list, create, end) |
| 12 | Admin Events | 1 (tournaments) |
| 13 | Admin Groups | 3 (list, lock/unlock, delete) |

---

## Pattern Issues

1. **TIERS config duplicated 3 times** — Home.tsx, Ranked.tsx, Achievements.tsx (different minPoints values!)
2. **GameModeGrid uses useEffect+fetch** instead of TanStack Query (violates CLAUDE.md convention)
3. **Multiplayer uses raw fetch()** instead of api client
4. **OAuth URL hardcoded** as `http://localhost:8080` in Login.tsx and LandingPage.tsx
5. **Admin Notifications broadcast** — `setTimeout(500)` placeholder, no backend endpoint
6. **Admin Configuration** — entire page is local state, no GET/POST config API
7. **Admin ExportCenter** — every button shows `alert()`, no export API

---

## Ưu tiên Fix (Đề xuất)

### P0 — Critical (hiển thị sai data cho user)
1. Leaderboard.tsx — kết nối API `/api/leaderboard/{period}`
2. Profile.tsx — kết nối API `/api/me`, `/api/me/stats`, `/api/achievements/my-achievements`
3. AppLayout.tsx — fix displayRole từ user.totalPoints → tier name
4. OAuth URL — dùng `import.meta.env.VITE_API_URL`

### P1 — Important (page thiếu data)
5. Tournaments.tsx — kết nối API `/api/tournaments`
6. Groups.tsx (user) — kết nối API `/api/groups/{id}/members`, `/api/groups/{id}/analytics`
7. Practice.tsx — thay MOCK_SESSIONS bằng GET `/api/sessions?mode=practice&size=3`
8. Home.tsx — Activity feed → GET `/api/notifications?limit=5`

### P2 — Admin gaps
9. Admin Dashboard backend — add missing fields (charts, newUsersThisWeek, aiQuota)
10. Admin Configuration — implement config API (GET + POST)
11. Admin ExportCenter — implement export endpoints

### P3 — Polish
12. TIERS config → extract to shared file
13. GameModeGrid → migrate to useQuery
14. Ranked season progress → compute from API
15. GroupAnalytics → connect remaining hardcoded sections
