# BibleQuiz — Design Status Report
> Generated: 2026-03-29 (Updated: 2026-03-29)

## Project Stitch Info
- **Stitch Project ID:** `5341030797678838526`
- **Project Title:** Quiz Gameplay
- **Design Theme:** "The Sacred Modernist" — Illuminated Depth
- **Device Type:** Desktop (2560px wide)

## Screens hiện có (19 total)

| # | Screen | ScreenId | Version | Size (WxH) | Status | Mapped to |
|---|--------|----------|---------|------------|--------|-----------|
| 1 | Home Dashboard | `45799974dfcb49ac8ea490e935cc5587` | v1 | 2560x2442 | Superseded | — |
| 2 | Home Dashboard v2 | `4b689c21e2ea45a6a5c9b5e6b385ada4` | **v2** | 2560x3800 | **Active** | `Home.tsx` |
| 3 | Home Dashboard - Loading States | `ce02c518a24c43f8871117ea87a16741` | **v3** | 2560x3216 | Reference | `Home.tsx` |
| 4 | Leaderboard | `8e94193171dc4b02ba58d077928ac12a` | v1 | 2560x2730 | Superseded | — |
| 5 | Leaderboard v2 | `e1ab5baaa7574d4089eb81982a6e0670` | **v2** | 2560x3026 | **Active** | `Leaderboard.tsx` |
| 6 | User Profile | `e4d6fdd7c5c94577bb608981e6194151` | v1 | 2560x2450 | Superseded | — |
| 7 | User Profile v2 | `faee9d2702814bc99fc48a0d450fe5b1` | **v2** | 2560x3110 | **Active** | `Profile.tsx` |
| 8 | Quiz Gameplay | `a54d23fc7691421498bbf56b51fa5b0b` | v1 | 2560x2048 | Superseded | — |
| 9 | Quiz Gameplay v2 | `a90675d04d824f85971e983e38fb28e6` | v2 | 2560x2048 | Superseded | — |
| 10 | Quiz Gameplay - Timer Added | `e6bcad27baf146a1a4cbeba186dac02a` | **v3** | 2560x2048 | **Active** | `Quiz.tsx` |
| 11 | Tournament Bracket | `e608c5dff1fe441f915a0a5d91157b2f` | v1 | 2560x2952 | Superseded | — |
| 12 | Tournament Bracket v2 | `a3216c97d6c04ed58762e12d39fecfc4` | v2 | 2560x3080 | Superseded | — |
| 13 | Tournament Bracket - Enhanced UX | `413ebac4216e4c53a76623da2d31d49e` | **v3** | 2560x3048 | **Active** | `Tournaments.tsx` |
| 14 | Church Group | `78a0a8fbdc00409b8283021970bd8636` | v1 | 2560x2680 | Superseded | — |
| 15 | Church Group v2 | `bab4027abae54cccbcafd9900a9da487` | v2 | 2560x3808 | Superseded | — |
| 16 | Church Group - Data Viz Update | `c9c3e5e48a8a46ffb09c70a0358d74ca` | **v3** | 2560x3808 | **Active** | `Groups.tsx` |
| 17 | **Login Page** | `0ad2b28cf5384486858986a6e4798304` | **NEW** | 2560x2048 | **Active** | `Login.tsx` |
| 18 | **Daily Challenge** | `1751ebd8a8394484b5a21d4265f90f1e` | **NEW** | 2560x2840 | **Active** | `DailyChallenge.tsx` |
| 19 | **Multiplayer Lobby** | `12d729e3fe11497783ae8bd2519f27a0` | **NEW** | 2560x2048 | **Active** | `RoomLobby.tsx` |
| 20 | **Home Dashboard - Game Hub** | `981a1b54219049f09c6e378792f07565` | **v4** | 2560x2916 | **Active** | `Home.tsx` |

## Design System

### Colors (Material Design 3 — Custom)
| Token | Hex | Usage |
|-------|-----|-------|
| **Background** | `#11131e` | Page background, deep navy |
| **Surface** | `#11131e` | Base layer |
| **Surface Container** | `#1d1f2a` | Primary content cards |
| **Surface Container Low** | `#191b26` | Recessed areas |
| **Surface Container High** | `#272935` | Elevated cards/inputs |
| **Surface Container Highest** | `#323440` | Interactive overlays |
| **Surface Container Lowest** | `#0b0e18` | Deepest recessed |
| **Primary** | `#c0c4e8` | Soft lavender accent |
| **Primary Container** | `#1a1f3a` | Dark blue container |
| **Secondary (Gold)** | `#e8a832` | Main CTA, highlights, gold accent |
| **Tertiary** | `#e7c268` | Gold variant, gradient end |
| **On-Surface** | `#e1e1f1` | Primary text (NOT #ffffff) |
| **On-Surface-Variant** | `#c7c5ce` | Secondary text |
| **On-Secondary** | `#412d00` | Text on gold surfaces |
| **Outline** | `#919098` | Subtle borders |
| **Outline Variant** | `#46464d` | Ghost borders (15% opacity) |
| **Error** | `#ffb4ab` | Error states |

### Typography
- **Font:** Be Vietnam Pro (all weights 100-900)
- **Headlines:** Tight letter-spacing (-0.02em), editorial feel
- **Body:** Line-height 1.5+ for Vietnamese diacritics
- **Labels:** Uppercase, tracking 0.05em+, "badge" aesthetic

### Border Radius
- `sm`: 0.25rem — minimum rounding
- `md`: 0.75rem — buttons, inputs
- `lg`: 0.5rem
- `xl`: 0.75rem
- `2xl`: 1rem — cards
- `3xl`: 1.5rem — large cards
- `full`: 9999px — avatars, pills

### Dark/Light Mode
- **Dark mode only** (class="dark" on `<html>`)
- No light mode variant designed
- "No-line" rule: boundaries via background color shifts, not borders

### Special Effects
- **Glassmorphism:** `rgba(50, 52, 64, 0.6)` + `backdrop-blur(12-20px)`
- **Gold Gradient:** `linear-gradient(135deg, #e8a832, #e7c268)` for CTAs
- **Tonal Layering:** Elevation via surface container tiers (no drop shadows)
- **Ambient Shadows:** `#0b0e18` tinted (not pure black), 24px blur, 6% opacity
- **Gold Glow:** `box-shadow: 0 0 20px rgba(232, 168, 50, 0.2)` for active elements

## Nhận xét từng screen

### 1. Home Dashboard v2
- **Layout:** Sidebar (272px) + Main content, 3-column bento grid
- **Components:** Stats row (streak/rank/XP), Hero section with CTA, Daily verse blockquote, Old/New Testament category cards, Leaderboard preview (top 3 + current user)
- **Điểm tốt:**
  - Hero section rất ấn tượng với gradient overlay và CTA nổi bật
  - Stats row sử dụng border-left accent rất hiệu quả
  - Daily verse blockquote với gold accent bar tạo cảm giác trang nghiêm
  - Leaderboard preview giúp engagement
- **Điểm cần cải thiện:**
  - Hero image phụ thuộc vào external URL (nên self-host)
  - Chưa có skeleton/loading state
  - Sidebar user info đang hardcode

### 2. Leaderboard v2
- **Layout:** Sidebar + Main, podium top 3 + scrollable list
- **Components:** Season countdown timer, Top 3 podium (avatar + rank badge), Tab navigation (daily/weekly/all), Rank rows with highlight for current user, Tier info cards (Gold/Silver/Bronze/Iron)
- **Điểm tốt:**
  - Podium design rất trực quan với scale khác nhau cho rank 1/2/3
  - Current user row highlight bằng full gold background rất nổi bật
  - Tier info section giúp user hiểu ranking system
  - Responsive podium (avatar size thay đổi theo breakpoint)
- **Điểm cần cải thiện:**
  - Cần thêm pagination cho danh sách dài
  - Season countdown nên realtime (không hardcode)

### 3. User Profile v2
- **Layout:** Full-width hero + bento grid stats + heatmap + badges
- **Components:** Cover image + avatar overlay, Tier progress bar (gold gradient), Quick stats (questions/streak/accuracy), Study heatmap (20-col grid), Badge collection (unlocked/locked states)
- **Điểm tốt:**
  - Hero section với cover photo + avatar overlap rất professional
  - Heatmap grid (GitHub-style) rất phù hợp cho gamification
  - Badge collection có locked state rõ ràng (grayscale + opacity)
  - Tier progress bar với motivational quote
- **Điểm cần cải thiện:**
  - Heatmap data đang static, cần API integration
  - Thiếu edit profile form
  - Share button chưa có chức năng

### 4. Quiz Gameplay v2
- **Layout:** Full-screen (no sidebar), compact header + question card + answer grid
- **Components:** Progress bar (gradient), Combo counter (x5), Energy/lives indicator (5 bars), Question card with book reference, 4-option answer grid (A/B/C/D), Confirmation modal (correct/wrong), Footer actions (hint/ask/skip)
- **Điểm tốt:**
  - Clean, focused gameplay — không distraction
  - Answer selection state rất rõ (gold border + glow + check icon)
  - Combo counter tạo sense of achievement
  - Energy bars visual rất trực quan
  - Confirmation modal ở bottom không che question
- **Điểm cần cải thiện:**
  - Cần thêm timer countdown visual (đang thiếu)
  - Wrong answer state (red) cần rõ hơn
  - Mobile progress bar quá mỏng (1px)

### 5. Tournament Bracket v2
- **Layout:** Sidebar + horizontal scrollable bracket
- **Components:** Tournament header (title/stats), Quarter-finals (4 matches), Semi-finals (2 matches), Finals (glow card), Bracket connector lines, Match cards (in-progress/completed/upcoming), Rules section, Prizes section
- **Điểm tốt:**
  - Bracket layout rất chuyên nghiệp với connector lines
  - In-progress match có ring glow + pulse animation
  - Finals card có gradient glow effect rất ấn tượng
  - Rules + Prizes bento grid bổ sung thông tin tốt
- **Điểm cần cải thiện:**
  - Horizontal scroll trên mobile có thể khó dùng
  - Connector lines cần responsive hơn
  - Thiếu realtime update cho match đang diễn ra

### 6. Church Group v2
- **Layout:** Sidebar + 3-column bento grid (2+1)
- **Components:** Group hero header (banner + logo + stats), Member leaderboard (top 3 podium + list), Weekly points bar chart, Group management buttons (create/search), Announcements feed, Scripture quote block, Group stats summary (glass panel)
- **Điểm tốt:**
  - Group hero với banner + gold-bordered logo rất polished
  - Weekly chart mockup tạo visual interest
  - Scripture quote block với gold left border rất on-brand
  - Announcements feed có pulse indicator cho new items
  - Glass panel stats card tạo depth
- **Điểm cần cải thiện:**
  - Bar chart là mockup, cần thay bằng real chart library
  - Thiếu member management (invite/kick/roles)
  - Announcements chưa có create/edit UI

## Screenshots
Lưu tại `docs/design-screenshots/`:
- `01-home-dashboard-v2.png`
- `02-leaderboard-v2.png`
- `03-profile-v2.png`
- `04-quiz-gameplay-v2.png`
- `05-tournament-bracket-v2.png`
- `06-church-group-v2.png`
- `07-login-page.png` (NEW)
- `08-daily-challenge.png` (NEW)
- `09-multiplayer-lobby.png` (NEW)
- `10-quiz-timer-added.png` (IMPROVED)
- `11-tournament-enhanced.png` (IMPROVED)
- `12-church-group-dataviz.png` (IMPROVED)
- `13-home-loading-states.png` (REFERENCE)

## Screens còn thiếu so với Routes hiện tại

Các routes trong `main.tsx` chưa có Stitch design:
- [x] ~~**Login** (`/login`)~~ — Done (2026-03-29)
- [x] ~~**Daily Challenge** (`/daily`)~~ — Done (2026-03-29)
- [x] ~~**Room Lobby** (`/room/:roomId/lobby`)~~ — Done (2026-03-29)
- [x] ~~**Practice** (`/practice`)~~ — Done (2026-03-29)
- [x] ~~**Ranked** (`/ranked`)~~ — Done (2026-03-29)
- [ ] **Achievements** (`/achievements`) — Achievement/badge detail page
- [ ] **Multiplayer** (`/multiplayer`) — Multiplayer lobby list
- [ ] **Room Quiz** (`/room/:roomId/quiz`) — Multiplayer quiz gameplay
- [ ] **Group Detail** (`/groups/:id`) — Individual group detail
- [ ] **Group Analytics** (`/groups/:id/analytics`) — Group analytics dashboard
- [ ] **Tournament Detail** (`/tournaments/:id`) — Individual tournament detail
- [ ] **Tournament Match** (`/tournaments/:id/match/:matchId`) — Live tournament match
- [ ] **Admin Dashboard** (`/admin/*`) — Admin panel (7 sub-pages)
- [ ] **Share Card** — Social sharing card component
- [ ] **Notification Panel** — In-app notification dropdown
- [ ] **404 / Error Page** — Not found page

## Đề xuất cải thiện

### Ưu tiên cao
1. ~~**Login page redesign**~~ — DONE
2. ~~**Daily Challenge**~~ — DONE
3. **Loading/Skeleton states** — Home loading states có design reference, cần apply cho các pages khác
4. **Real data integration** — Thay thế hardcode data bằng TanStack Query API calls
5. **Mobile responsive testing** — Design Stitch chỉ ở desktop (2560px), cần verify mobile

### Ưu tiên trung bình
6. ~~**Timer component** cho Quiz~~ — DONE (circular timer added)
7. **Toast/Notification** redesign theo Stitch theme
8. ~~**Bar chart** trong Groups~~ — DONE (Data Viz update with Y-axis, tooltips)
9. **Share Card** component — Social sharing theo design system
10. ~~**Multiplayer screens**~~ — DONE (Room lobby)

### Ưu tiên thấp
11. **Light mode** variant (hiện chỉ có dark)
12. **Micro-animations** — Page transitions, skeleton loading
13. **Admin panel** redesign — Hiện dùng AdminLayout riêng
14. **PWA support** — Offline mode, push notifications
15. **Accessibility** — Color contrast audit cho dark theme, keyboard navigation

## Tóm tắt

| Metric | Value |
|--------|-------|
| **Tổng screens trong Stitch** | 20 (6 v1 + 6 v2 + 4 v3 + 3 new + 1 v4) |
| **Screens active** | 10 |
| **Screens đã convert sang React** | 10/10 + 2 custom (Practice, Ranked) |
| **Screens improved** | 3 (Quiz Timer, Tournament UX, Group DataViz) |
| **Routes chưa có design** | 11 (giảm từ 13) |
| **Screen đẹp nhất** | **Quiz Gameplay v3** — Timer added, clean focused UX |
| **Screen ấn tượng nhất** | **Home Dashboard v2** — Hero section + bento grid |
| **Screen mới tốt nhất** | **Login Page** — Split-screen hero + form, professional |
| **Design consistency** | Excellent — Nhất quán across all 9 active screens |
| **Build status** | Pass (0 errors) |
