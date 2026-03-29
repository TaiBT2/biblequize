# TODO

## v2.2 — Game Mode Hub + Practice/Ranked (Stitch MCP Round 3) [DONE]

### Home Game Hub Redesign
- [x] Home Dashboard v4 → Home.tsx (compact hero, quick stats, game mode grid, daily verse, leaderboard)
- [x] GameModeGrid.tsx (NEW) — 4 game mode cards with accent colors (blue/gold/orange/purple)
  - Practice: simple navigation
  - Ranked: energy bar from API, disabled when energy=0
  - Daily: completion status + countdown timer
  - Multiplayer: live room count from API
- [x] Skeleton loading states for Home page

### New Pages (Custom Design System)
- [x] Practice.tsx — Filter bar (book/difficulty/count), recent sessions, start CTA
- [x] Ranked.tsx — Energy section, today's progress, season info, quick start

### Build
- [x] npm run build — 0 errors

## v2.1 — New Screens + UX Improvements (Stitch MCP Round 2) [DONE]

### New Pages Converted
- [x] Login Page → Login.tsx (split-screen hero + Google OAuth + email form)
- [x] Daily Challenge → DailyChallenge.tsx (countdown timer, stats, leaderboard, calendar strip)
- [x] Multiplayer Lobby → RoomLobby.tsx (room code, player grid, chat, start/leave)

### Existing Pages Improved
- [x] Quiz Gameplay — Timer Added: circular countdown timer with SVG arc animation
- [x] Tournament Bracket — Enhanced UX: mobile swipe hints, scroll indicators, snap scrolling, sticky headers
- [x] Church Group — Data Viz Update: Y-axis labels, grid lines, hover tooltips on chart bars

### Screenshots
- [x] 7 new screenshots saved to docs/design-screenshots/

### Build
- [x] npm run build — 0 errors from new/updated code

## v2.0 — UX/UI Redesign (Stitch Design System) [DONE]

### Design System Setup
- [x] Tailwind config updated with Stitch color palette (Sacred Modernist theme)
- [x] Be Vietnam Pro font + Material Symbols Outlined icons
- [x] Global CSS utilities: glass-card, glass-panel, gold-gradient, gold-glow, streak-grid
- [x] Dark mode with Navy/Gold/Copper spectrum

### Shared Components
- [x] AppLayout — shared sidebar nav + top nav + bottom mobile nav
- [x] Routing updated: pages with AppLayout vs full-screen pages

### Pages Converted (from Google Stitch MCP)
- [x] Home Dashboard v2 → Home.tsx (stats row, hero section, daily verse, category cards, leaderboard preview)
- [x] Quiz Gameplay v2 → Quiz.tsx (full-screen, progress bar, combo counter, energy system, answer grid)
- [x] Leaderboard v2 → Leaderboard.tsx (podium top 3, tabs daily/weekly/all, tier info)
- [x] Church Group v2 → Groups.tsx (group hero, member leaderboard, weekly chart, announcements)
- [x] Tournament Bracket v2 → Tournaments.tsx (bracket layout, quarter/semi/finals, rules, prizes)
- [x] User Profile v2 → Profile.tsx (hero section, tier progress, stats, heatmap, badge collection)

### Build
- [x] npm run build — 0 errors, 0 warnings from new code

## v1.5 — Notification System [DONE]

### Database
- [x] V14__notifications.sql — table + index

### Backend
- [x] NotificationEntity (modules/notification/entity/)
- [x] NotificationRepository (modules/notification/repository/)
- [x] NotificationService — create, markAsRead, markAllAsRead, getUnread, getUnreadCount
- [x] NotificationController — GET /api/notifications, PATCH /{id}/read, PATCH /read-all
- [x] Tier-up notification integration (RankedController)
- [x] CORS — added PATCH to allowed methods

### Frontend
- [x] Notification bell icon + badge count (Header.tsx)
- [x] Dropdown panel — list, mark as read, mark all as read
- [x] Polling every 30s

### Tests
- [x] NotificationServiceTest — 7 tests pass
- [x] NotificationControllerTest — 4 tests pass

### Cron Jobs
- [x] @EnableScheduling on ApiApplication
- [x] NotificationScheduler — streak warning (hourly), daily reminder (8AM)
- [x] UserRepository.findUsersWithStreakAtRisk query
- [x] NotificationSchedulerTest — 3 tests pass

### Frontend Navigation
- [x] Click notification → navigate to relevant page (ranked, daily, leaderboard, groups, multiplayer)
