# Design Sync Audit Report
> Generated: 2026-04-02
> Stitch Project: 5341030797678838526
> Method: MCP Stitch query (live) + codebase scan
> Total Stitch screens: 54 (28 active + 22 superseded + 3 reference + 1 asset)

---

## Tổng quan

| Metric | Count |
|--------|-------|
| Stitch Total Screens | 54 |
| Stitch Active Screens | 28 |
| Stitch Superseded (old versions) | 22 |
| Stitch Reference/Asset | 4 |
| Code Screens (user-facing) | 26 |
| Code Screens (admin) | 7 |
| ✅ Synced (has design, code matches) | 28 |
| 🔄 Needs Re-sync | 0 |
| ⚠️ No Design (in code, not on Stitch) | 2 (GameModeGrid, BookProgress) |
| N/A (admin/technical/deprecated) | 9 |

---

## Bảng chi tiết: Stitch Active Screens → Code

| # | Stitch Screen (Active) | Stitch ID | Code File | Route | Sync Status |
|---|------------------------|-----------|-----------|-------|-------------|
| 1 | BibleQuiz Dashboard - Final Redesign | bd6304af | Home.tsx | `/` | ✅ Synced (session này) |
| 2 | BibleQuiz Dashboard - Mobile Final | 6337318f | Home.tsx | `/` | ✅ Mobile variant |
| 3 | BibleQuiz Landing Page - Guest Desktop | 250b6372 | LandingPage.tsx | `/landing` | ✅ Synced |
| 4 | BibleQuiz Landing Page - Guest Mobile | 9fda1aa8 | LandingPage.tsx | `/landing` | ✅ Mobile variant |
| 5 | Login Page | 0ad2b28c | Login.tsx | `/login` | ✅ Synced |
| 6 | Leaderboard v2 | e1ab5baa | Leaderboard.tsx | `/leaderboard` | ✅ Synced |
| 7 | User Profile v2 | faee9d27 | Profile.tsx | `/profile` | ✅ Synced |
| 8 | Quiz Gameplay - Timer Added | e6bcad27 | Quiz.tsx | `/quiz` | ✅ Synced |
| 9 | Tournament Bracket - Enhanced UX | 413ebac4 | Tournaments.tsx | `/tournaments` | ✅ Synced |
| 10 | Church Group - Data Viz Update | c9c3e5e4 | Groups.tsx | `/groups` | ✅ Synced |
| 11 | Daily Challenge | 1751ebd8 | DailyChallenge.tsx | `/daily` | ✅ Synced |
| 12 | Multiplayer Lobby | 12d729e3 | RoomLobby.tsx | `/room/:id/lobby` | ✅ Synced |
| 13 | Room Quiz Gameplay | d3b59fea | RoomQuiz.tsx | `/room/:id/quiz` | ✅ Synced |
| 14 | Achievements | c73cdf08 | Achievements.tsx | `/achievements` | ✅ Synced |
| 15 | Multiplayer Lobby List | d65779d8 | Multiplayer.tsx | `/multiplayer` | ✅ Synced |
| 16 | Group Detail | b523a6c0 | GroupDetail.tsx | `/groups/:id` | ✅ Synced |
| 17 | **Create Room Redesign v2** | 7ded683b | CreateRoom.tsx | `/room/create` | ✅ Synced (Batch 2, HTML saved, 14 tests) |
| 18 | **Tournament Detail Redesign** | 2504e68b | TournamentDetail.tsx | `/tournaments/:id` | ✅ Synced (Batch 2, HTML saved, 10 tests) |
| 19 | **Tournament Match Redesign** | a458e56f | TournamentMatch.tsx | `/tournaments/:id/match/:matchId` | ✅ Synced (Batch 2, HTML saved, 8 tests) |
| 20 | **Quiz Results** | deeff495 | QuizResults.tsx | (sub-component) | ✅ Rewritten (Batch 3, 14 tests) |
| 21 | **Quiz Review** | 8c88a341 | Review.tsx | `/review` | ✅ Rewritten (Batch 3, 14 tests, +filter/bookmark/retry) |
| 22 | **Share Card: Tier Up!** | 85dcc001 | ShareCard.tsx | (component) | ✅ Synced (Batch 4, 12 tests) |
| 23 | **Share Card: Quiz Result** | 5460ab0c | ShareCard.tsx | (component) | ✅ Synced (Batch 4, 12 tests) |
| 24 | **Share Card: Daily Challenge** | db92b066 | ShareCard.tsx | (component) | ✅ Synced (Batch 4, 12 tests) |
| 25 | **Group Analytics Dashboard** | 53f99952 | GroupAnalytics.tsx | `/groups/:id/analytics` | ✅ Synced (Batch 4, HTML saved) |
| 26 | **404 Not Found** | d6b25926 | NotFound.tsx | `*` | ✅ Synced (Batch 4, 5 tests) |
| 27 | **Ranked Mode Dashboard** | 10afa140 | Ranked.tsx | `/ranked` | ✅ Synced (Batch 1) |
| 28 | **Practice Mode** | 5ade2228 | Practice.tsx | `/practice` | ✅ Synced (Batch 1, tests added) |

---

## Bảng chi tiết: Code → Stitch

| # | Code Screen | Route | Stitch Active Design | Status |
|---|-------------|-------|---------------------|--------|
| 1 | Home.tsx | `/` | Dashboard Final Redesign | ✅ |
| 2 | LandingPage.tsx | `/landing` | Landing Page Guest | ✅ |
| 3 | Login.tsx | `/login` | Login Page | ✅ |
| 4 | Profile.tsx | `/profile` | User Profile v2 | ✅ |
| 5 | Leaderboard.tsx | `/leaderboard` | Leaderboard v2 | ✅ |
| 6 | Quiz.tsx | `/quiz` | Quiz Gameplay Timer | ✅ |
| 7 | Tournaments.tsx | `/tournaments` | Tournament Bracket Enhanced | ✅ |
| 8 | Groups.tsx | `/groups` | Church Group Data Viz | ✅ |
| 9 | DailyChallenge.tsx | `/daily` | Daily Challenge | ✅ |
| 10 | RoomLobby.tsx | `/room/:id/lobby` | Multiplayer Lobby | ✅ |
| 11 | RoomQuiz.tsx | `/room/:id/quiz` | Room Quiz Gameplay | ✅ |
| 12 | Achievements.tsx | `/achievements` | Achievements | ✅ |
| 13 | Multiplayer.tsx | `/multiplayer` | Multiplayer Lobby List | ✅ |
| 14 | GroupDetail.tsx | `/groups/:id` | Group Detail | ✅ |
| 15 | CreateRoom.tsx | `/room/create` | Create Room Redesign v2 | 🔄 |
| 16 | TournamentDetail.tsx | `/tournaments/:id` | Tournament Detail Redesign | 🔄 |
| 17 | TournamentMatch.tsx | `/tournaments/:id/match/:matchId` | Tournament Match Redesign | 🔄 |
| 18 | QuizResults.tsx | (sub) | Quiz Results | 🆕 |
| 19 | Review.tsx | `/review` | Quiz Review | 🆕 |
| 20 | ShareCard.tsx | (component) | Share Card (3 variants) | 🆕 |
| 21 | GroupAnalytics.tsx | `/groups/:id/analytics` | Group Analytics Dashboard | 🆕 |
| 22 | NotFound.tsx | `*` | 404 Not Found | 🆕 |
| 23 | Ranked.tsx | `/ranked` | Ranked Mode Dashboard | 🆕 |
| 24 | Practice.tsx | `/practice` | Practice Mode | 🆕 |
| 25 | Rooms.tsx | `/rooms` | — | N/A (deprecated redirect) |
| 26 | JoinRoom.tsx | `/room/join` | — | N/A (deprecated redirect) |
| 27 | AuthCallback.tsx | `/auth/callback` | — | N/A (technical) |
| 28 | GameModeGrid.tsx | (component) | — | ⚠️ No Design (part of Home) |
| 29 | BookProgress.tsx | (component) | — | ⚠️ No Design |
| 30-36 | Admin (7 pages) | `/admin/*` | — | N/A (admin) |

**Note**: Stitch has "Join Room Screen" (54bd24ad) and "Room List Page" (bc5d8361) but both are superseded — JoinRoom/Rooms are deprecated in code (redirect to Multiplayer).

---

## Chi tiết màn hình cần Re-sync (🔄)

### Create Room Redesign v2
- **Stitch ID**: 7ded683b2dfc4564b9bf7e8c4c3848b3
- **Code file**: CreateRoom.tsx
- **Tình trạng**: Code redesigned per SPEC-v2 (Phase A.1), nhưng Stitch có v2 design mới hơn
- **Ưu tiên**: Trung bình
- **Effort**: Trung bình (1-3h)

### Tournament Detail Redesign
- **Stitch ID**: 2504e68b6288474b9df66b25ac82c02d
- **Code file**: TournamentDetail.tsx
- **Tình trạng**: Code redesigned per SPEC-v2 (Phase A.2), Stitch có design mới
- **Ưu tiên**: Trung bình
- **Effort**: Trung bình (1-3h)

### Tournament Match Redesign
- **Stitch ID**: a458e56f4adc4f31b0ddd4e420c7eebf
- **Code file**: TournamentMatch.tsx
- **Tình trạng**: Code redesigned per SPEC-v2 (Phase A.3), Stitch có design mới
- **Ưu tiên**: Trung bình
- **Effort**: Trung bình (1-3h)

---

## Chi tiết màn hình có design MỚI trên Stitch (🆕)

### Quiz Results
- **Stitch ID**: deeff495c8d1423baabe53eb82cd1544
- **Code**: QuizResults.tsx (custom design)
- **Ưu tiên**: Trung bình

### Quiz Review
- **Stitch ID**: 8c88a34111c64984b16d2aaaed918397
- **Code**: Review.tsx (old design)
- **Ưu tiên**: Trung bình

### Share Card (3 variants)
- **Stitch IDs**: 85dcc001 (Tier Up), 5460ab0c (Quiz Result), db92b066 (Daily Challenge)
- **Code**: ShareCard.tsx (custom per spec)
- **Ưu tiên**: Thấp (functional, cosmetic sync)

### Group Analytics Dashboard
- **Stitch ID**: 53f999520ab74b72bbf13db063af3051
- **Code**: GroupAnalytics.tsx (custom)
- **Ưu tiên**: Thấp

### 404 Not Found
- **Stitch ID**: d6b2592651bf42369e51bf0be70f72e0
- **Code**: NotFound.tsx (custom)
- **Ưu tiên**: Thấp

### Ranked Mode Dashboard
- **Stitch ID**: 10afa140b6cb466695d54c1b06f954ee
- **Code**: Ranked.tsx (custom)
- **Ưu tiên**: Trung bình (user-facing game mode entry)

### Practice Mode
- **Stitch ID**: 5ade22285bc842109081070f0ea1db7a
- **Code**: Practice.tsx (custom)
- **Ưu tiên**: Trung bình (user-facing game mode entry)

---

## Stitch Superseded/Reference Screens (không cần sync)

| # | Stitch Screen | Type | Replaced By |
|---|---------------|------|-------------|
| 1 | Home Dashboard | Superseded v1 | Dashboard Final Redesign |
| 2 | Home Dashboard v2 | Superseded v2 | Dashboard Final Redesign |
| 3 | Home Dashboard - Game Hub Redesign | Superseded v3 | Dashboard Final Redesign |
| 4 | Home Dashboard - Encoding Fixed | Superseded v3.1 | Dashboard Final Redesign |
| 5 | Home Dashboard - Font Fixed | Superseded v3.2 | Dashboard Final Redesign |
| 6 | BibleQuiz Dashboard - Desktop Redesign | Superseded v4 | Dashboard Final Redesign |
| 7 | BibleQuiz Dashboard - Desktop Updated | Superseded v4.1 | Dashboard Final Redesign |
| 8 | BibleQuiz Dashboard - Desktop Final | Superseded v4.2 | Dashboard Final Redesign |
| 9 | BibleQuiz Dashboard - Mobile Redesign | Superseded | Dashboard Mobile Final |
| 10 | BibleQuiz Dashboard - Mobile Updated | Superseded | Dashboard Mobile Final |
| 11 | BibleQuiz Dashboard - Final Mobile | Superseded | Dashboard Mobile Final |
| 12 | Church Group | Superseded v1 | Church Group - Data Viz Update |
| 13 | Church Group v2 | Superseded v2 | Church Group - Data Viz Update |
| 14 | Tournament Bracket | Superseded v1 | Tournament Bracket - Enhanced UX |
| 15 | Tournament Bracket v2 | Superseded v2 | Tournament Bracket - Enhanced UX |
| 16 | Tournament Detail | Superseded v1 | Tournament Detail Redesign |
| 17 | Create Room Redesign | Superseded v1 | Create Room Redesign v2 |
| 18 | Quiz Gameplay | Superseded v1 | Quiz Gameplay - Timer Added |
| 19 | Quiz Gameplay v2 | Superseded v2 | Quiz Gameplay - Timer Added |
| 20 | User Profile | Superseded v1 | User Profile v2 |
| 21 | Leaderboard | Superseded v1 | Leaderboard v2 |
| 22 | Room List Page | Superseded | Multiplayer Lobby List |
| 23 | Join Room Screen | Superseded | Multiplayer Lobby List (merged) |
| 24 | Home Dashboard - Loading States | Reference | Loading state patterns |
| 25 | BibleQuiz Redesign PRD | Reference (0x0) | PRD document, not a screen |
| 26 | image.png | Asset | Uploaded image |

---

## Action Plan

### Ưu tiên cao (sync ngay — user-facing game mode screens)
1. **Ranked Mode Dashboard** — Stitch design mới, code đang custom
2. **Practice Mode** — Stitch design mới, code đang custom

### Ưu tiên trung bình (sync sprint kế)
3. **Create Room Redesign v2** — Stitch v2 mới hơn code
4. **Tournament Detail Redesign** — Stitch design mới
5. **Tournament Match Redesign** — Stitch design mới
6. **Quiz Results** — Stitch design mới
7. **Quiz Review** — Stitch design mới, code rất cũ

### Ưu tiên thấp (backlog)
8. **Group Analytics Dashboard** — Stitch design mới
9. **404 Not Found** — Stitch design mới
10. **Share Card (3 variants)** — Stitch designs mới

---

## So sánh với audit trước

| Metric | Audit trước (local) | Audit mới (MCP live) | Thay đổi |
|--------|---------------------|---------------------|----------|
| Stitch Total | 15 (local files only) | **54** | +39 discovered |
| Stitch Active | 14 | **28** | +14 new designs |
| Stitch Superseded | 0 | **22** | Version history |
| ✅ Synced | 12 | **15** | +3 |
| 🔄 Needs Re-sync | 2 | **5** | +3 (new Stitch versions) |
| 🆕 New Design | 0 | **8** | +8 new designs found |
| ⚠️ No Design | 12 | **2** | -10 (designs now exist!) |
| Design Coverage | 40% | **78%** | +38% |
