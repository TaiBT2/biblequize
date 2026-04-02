# Prompts tạo design cho các màn hình thiếu (Cập nhật theo SPEC-v2)

> Mỗi prompt paste độc lập vào Claude Code.
> Đã cross-check với SPEC-v2.md để đảm bảo business logic đúng.

---

## 1. CreateRoom (Ưu tiên cao)

```
Redesign màn hình CreateRoom (`apps/web/src/pages/CreateRoom.tsx`, route `/room/create`).

### Context từ SPEC-v2 (mục 4.4 Multiplayer Room):
- Mã phòng: 6 chữ số, tự generate
- 2–20 người/phòng
- Host cấu hình: số câu, thời gian/câu (giây), sách, độ khó
- Có share link để mời bạn
- API: POST /rooms { timePerQuestionSec, maxPlayers, filters, visibility }

### Bước 1: Reference design
Dùng MCP Stitch (project 5341030797678838526) đọc design của:
- "Multiplayer Lobby List" → card style, color scheme, join code pattern
- "Multiplayer Lobby" (RoomLobby) → room code display, player grid

### Bước 2: Đọc code hiện tại CreateRoom.tsx → giữ nguyên business logic

### Bước 3: Redesign UI
- Layout: centered form trên bg #11131e, max-width 600px
- Form card: .glass-card
- Header: "🎮 Tạo phòng mới" + gold accent divider
- Fields:
  1. Room name: text input (optional, placeholder "Phòng của [username]")
  2. Game mode: 4 cards horizontal scroll (Speed/Survival/Team/Classic) — mỗi card có icon + accent color giống GameModeGrid
  3. Số câu: segmented control [10 | 15 | 20 | 30]
  4. Thời gian/câu: segmented control [10s | 15s | 20s | 30s]
  5. Độ khó: segmented control [Dễ | Trung bình | Khó | Hỗn hợp]
  6. Sách: SearchableSelect (optional, default "Tất cả")
  7. Số người tối đa: slider 2-20, hiển thị số
  8. Visibility: toggle Public/Private
- Share section (hiện sau khi tạo thành công): room code lớn + copy button + share link
- CTA: "Tạo phòng" .gold-gradient, full width
- Back: ghost button "← Quay lại" → /multiplayer
- Loading: button disabled + spinner
- Error: inline error dưới field hoặc toast

- Mobile: stack tất cả vertically, segmented controls full-width
- Responsive breakpoints: sm (stack) / md (2-col settings) / lg (centered max-w)

### Bước 4: Giữ nguyên API calls, navigation, validation

### Bước 5: Unit test (src/pages/CreateRoom.test.tsx hoặc src/pages/__tests__/CreateRoom.test.tsx)
- Render form đầy đủ fields
- Game mode selection: click → highlight đúng
- Segmented controls: click → update state (số câu, thời gian, độ khó)
- Max players slider: drag → update value
- Validation: submit với default values → should work (room name optional)
- Submit success: mock POST /rooms → show room code + share link
- Submit error: mock API error → show error message
- Loading state khi submitting
- Back button → /multiplayer
- Responsive: check mobile layout

### Bước 6: E2E test (tests/create-room.spec.ts)
- Visit /room/create (must be logged in, redirect if not)
- Fill form → select game mode → adjust settings → create
- Room created → see room code
- Copy room code button works
- Navigate to lobby after create
- Validation edge cases
- Mobile viewport test

### Bước 7: Chạy 3 tầng Regression Guard
- Tầng 1: npx vitest run src/pages/CreateRoom
- Tầng 2: npx vitest run src/pages/ (check Multiplayer, RoomLobby không break)
- Tầng 3: npx vitest run && npx playwright test
- Commit: "style: redesign CreateRoom per spec + tests"
```

---

## 2. TournamentDetail (Ưu tiên cao)

```
Redesign màn hình TournamentDetail (`apps/web/src/pages/TournamentDetail.tsx`, route `/tournaments/:id`).

### Context từ SPEC-v2 (mục 4.5 Tournament):
- 4/8/16/32 người bracket elimination
- Mỗi trận: 3 mạng/người, sai → mất 1 mạng, hết mạng → thua
- Tie-break: sudden death (1 câu, đúng đầu tiên thắng)
- Church Tournament: group leader tổ chức cho nhóm
- API:
  - GET /tournaments/{id}
  - GET /tournaments/{id}/bracket
  - POST /tournaments/{id}/join
  - POST /tournaments/{id}/start (host/leader)
- WebSocket: /tournament/{tournamentId} → tournament_state, bracket_update
- State machine: lobby → seeding → in_progress → completed

### Bước 1: Reference design
Dùng MCP Stitch đọc:
- "Tournament Bracket - Enhanced UX" → bracket layout, snap scroll, sticky headers
- "BibleQuiz Dashboard - Final Redesign" → stats card pattern

### Bước 2: Đọc code TournamentDetail.tsx

### Bước 3: Redesign UI
- Hero section: .glass-panel
  - Tournament name (large, bold)
  - Status badge: "Đang chờ" (blue), "Đang seed" (yellow), "Đang diễn ra" (gold), "Hoàn thành" (green)
  - Player count: "12/16 người đã tham gia"
  - Countdown timer (if lobby) hoặc round indicator (if in_progress)
  - Config info: "Best of 3 mạng • 15s/câu • Độ khó: Hỗn hợp"

- Bracket section (main content):
  - Reuse snap scroll + sticky round headers pattern từ Tournaments.tsx
  - Round labels: "Vòng 1/8", "Tứ kết", "Bán kết", "Chung kết"
  - Match cards: .glass-card
    - Player 1 vs Player 2 (avatar + name + tier badge)
    - ❤️❤️❤️ (3 hearts per player, filled = remaining, empty = lost)
    - Score display
    - Winner: gold border + "🏆" icon
    - Status: "Đang chờ" / "Đang thi" / "Hoàn thành"
    - Click match → navigate /tournaments/:id/match/:matchId
  - Current user's match: gold-glow highlight
  - Bye matches: "Tự động thắng" muted text

- Participants tab:
  - Grid: avatar + name + tier badge + status (in/eliminated)
  - Eliminated: muted opacity, "Loại ở vòng X"
  - Sort: by seed hoặc by elimination round

- Actions:
  - Lobby state: "Tham gia" (.gold-gradient) hoặc "Đã tham gia" (disabled)
  - Host/Leader: "Bắt đầu giải đấu" button (only when enough players)
  - In progress: "Xem trận đấu của bạn" → scroll to user's match
  - Completed: "Chia sẻ kết quả" → ShareCard

- Tabs: "Bracket" | "Người chơi" | "Luật chơi"
  - Tab indicator: gold underline (same pattern as Leaderboard)

- Mobile: bracket horizontal scroll with swipe hint, tabs scrollable

### Bước 4: Giữ nguyên business logic + WebSocket subscriptions

### Bước 5: Unit test (src/pages/TournamentDetail.test.tsx hoặc __tests__/)
- Render tournament info (name, status, player count)
- Status badge correct color per state
- Bracket renders correct rounds (4→2→1 for 4 players, etc.)
- Match cards show players + hearts + score
- Winner highlighted with gold
- Current user's match has gold-glow
- Bye match shows "Tự động thắng"
- Join button visible in lobby state, hidden otherwise
- Host "Start" button only for host when enough players
- Tab switching works
- Loading skeleton
- Error state (tournament not found)
- Responsive: mobile layout

### Bước 6: E2E test (tests/tournament-detail.spec.ts)
- Visit /tournaments/:id → see tournament info
- Bracket visible and scrollable
- Click match → navigate to match page
- Tab navigation (Bracket / Người chơi / Luật chơi)
- Join tournament flow (if in lobby)
- Mobile: swipe bracket
- Requires auth

### Bước 7: 3 tầng Regression Guard → commit: "style: redesign TournamentDetail per spec + tests"
```

---

## 3. TournamentMatch (Ưu tiên cao)

```
Redesign màn hình TournamentMatch (`apps/web/src/pages/TournamentMatch.tsx`, route `/tournaments/:id/match/:matchId`).

### Context từ SPEC-v2 (mục 4.5 + 9.3):
- 1v1 match, mỗi người 3 mạng (lives)
- Trả lời sai → mất 1 mạng
- Trả lời đúng → không mất mạng, tính điểm
- Hết 3 mạng → thua, match kết thúc
- Tie-break: sudden death — 1 câu, ai đúng trước thắng
- WebSocket events:
  - match_start: { matchId, round, p1, p2, timePerQuestionSec }
  - match_question: { matchId, id, content, options, timeLimitSec, order }
  - match_update: { matchId, p1Lives, p2Lives, lastAnswer }
  - match_end: { matchId, winnerUserId, reason, shareCardUrl? }
- Scoring: base + speedBonus (speedRatio² formula)

### Bước 1: Reference design
Dùng MCP Stitch đọc:
- "Quiz Gameplay - Timer Added" → timer SVG, answer grid, progress
- "Room Quiz Gameplay" → multiplayer result popup, score overlay

### Bước 2: Đọc code TournamentMatch.tsx

### Bước 3: Redesign UI
- Full-screen layout (NO AppLayout), bg #11131e

- **Top Bar — Player vs Player:**
  Left side (Player 1):
  - Avatar (border: gold if current user, gray if opponent)
  - Name + tier badge
  - ❤️❤️❤️ hearts row (red filled = remaining, gray outline = lost)
  - Score number

  Center: "VS" text with gold accent, round indicator "Vòng Tứ kết"

  Right side (Player 2):
  - Same layout mirrored
  - Real-time: khi opponent trả lời → heart animation (nếu sai → heart breaks)

- **Question Area (center):**
  - Timer SVG circle (.timer-svg, countdown từ timeLimitSec)
  - Question number "Câu 3/10"
  - Question text (large, #e1e1f1)
  - 4 answer buttons:
    - Default: .glass-card, hover: gold border
    - Selected: gold background
    - Correct: green flash + checkmark
    - Incorrect: red flash + X mark
  - Combo counter (nếu streak): "🔥 Combo x3" gold text

- **Answer Feedback:**
  - Bạn đúng + opponent sai: "+12 điểm" green, opponent heart breaks
  - Bạn sai: heart break animation, "-1 ❤️" red text
  - Cả 2 đúng: chỉ hiện điểm, không mất mạng
  - Cả 2 sai: cả 2 mất mạng

- **Sudden Death Overlay (khi tie-break):**
  - .glass-panel overlay
  - "⚡ SUDDEN DEATH" gold text, pulsing
  - "Câu hỏi quyết định — ai đúng trước thắng!"
  - Bầu không khí căng thẳng: red/gold flashing border

- **Match End Overlay:**
  Winner:
  - Gold confetti animation (tái sử dụng existing confetti nếu có)
  - "🏆 CHIẾN THẮNG!" gold-gradient text, large
  - Score comparison: You X - Y Opponent
  - Stats: câu đúng, thời gian TB, combo max
  - Buttons: "Xem bracket" → /tournaments/:id, "Chia sẻ" → ShareCard

  Loser:
  - Muted styling, no confetti
  - "Thua cuộc" text
  - Same stats + buttons

  Nếu match_end reason = "forfeit": "Đối thủ bỏ cuộc — Bạn thắng!"

- Mobile: stack player bars vertically above question

### Bước 4: Giữ nguyên WebSocket logic (useStomp subscriptions)

### Bước 5: Unit test (src/pages/TournamentMatch.test.tsx hoặc __tests__/)
- Render player vs player with names + avatars
- Hearts: render đúng số (3/3 ban đầu)
- Hearts decrease when match_update received (mock WebSocket)
- Question + 4 answers render
- Timer SVG present with correct timeLimitSec
- Answer selection → correct/incorrect feedback
- Sudden death overlay renders when triggered
- Match end: winner overlay with confetti text
- Match end: loser overlay without confetti
- Forfeit: "Đối thủ bỏ cuộc" message
- Score displays update realtime
- Navigation back to tournament
- Loading state
- Error state (match not found)

### Bước 6: E2E test (tests/tournament-match.spec.ts)
- Visit match page → see player info
- Hearts visible (3 each)
- Question appears
- Answer question → feedback
- Complete match → result overlay
- Click "Xem bracket" → back to tournament detail
- Mobile viewport
- Auth required

### Bước 7: 3 tầng Regression Guard → commit: "style: redesign TournamentMatch per spec + tests"
```

---

## 4. JoinRoom (Ưu tiên trung bình — đánh giá merge)

```
Đánh giá và xử lý JoinRoom (`apps/web/src/pages/JoinRoom.tsx`, route `/room/join`).

### Context từ SPEC-v2 (mục 4.4 + 8.9):
- Join room bằng mã 6 chữ số hoặc share link
- API: POST /rooms/{id}/join
- Multiplayer.tsx đã có join-by-code trên Stitch design

### Bước 1: Dùng MCP Stitch đọc "Multiplayer Lobby List" → xem đã có join-by-code input chưa

### Bước 2: So sánh Multiplayer.tsx vs JoinRoom.tsx:
- Multiplayer.tsx có input code join chưa?
- JoinRoom.tsx có feature nào Multiplayer không có?

### Bước 3: Quyết định (GHI DECISIONS.md):
**Nếu Multiplayer đã có join-by-code** → MERGE:
1. Đảm bảo Multiplayer.tsx handle: input code, validate, POST /rooms/{id}/join, redirect to /room/:id/lobby
2. Route /room/join → redirect 301 to /multiplayer
3. Giữ JoinRoom.tsx nhưng component chỉ là <Navigate to="/multiplayer" replace />
4. Update router trong main.tsx

**Nếu cần giữ riêng** → Redesign:
- Centered .glass-card layout
- Room code input: large, monospace, auto-uppercase, 6 chars, auto-focus
- "Tham gia" button: .gold-gradient
- Error: "Phòng không tồn tại", "Phòng đã đầy", "Phòng đang chơi"
- Recent rooms list (nếu API support)
- Back → /multiplayer

### Bước 4: Unit test
- Nếu merge: update Multiplayer tests — thêm join flow
- Nếu redirect: test Navigate component
- Nếu giữ: test input, validation, API call, error states

### Bước 5: E2E test (tests/join-room.spec.ts hoặc update multiplayer.spec.ts)
- Enter valid 6-digit code → join → redirect to lobby
- Enter invalid code → error "Phòng không tồn tại"
- Room full → error "Phòng đã đầy"
- Empty input → validation error

### Bước 6: 3 tầng Regression Guard → commit
```

---

## 5. Rooms (Ưu tiên trung bình — likely deprecated)

```
Đánh giá deprecate Rooms (`apps/web/src/pages/Rooms.tsx`, route `/rooms`).

### Context: Multiplayer.tsx đã có trên Stitch và match SPEC-v2 mục 4.4
Rooms.tsx có thể là phiên bản cũ trước khi Multiplayer ra đời.

### Bước 1: So sánh features
Đọc Rooms.tsx và Multiplayer.tsx → liệt kê feature mỗi page.

### Bước 2: Quyết định (GHI DECISIONS.md)
Nếu Multiplayer thay thế hoàn toàn:
1. Route /rooms → <Navigate to="/multiplayer" replace />
2. Sidebar/nav: remove link đến /rooms nếu có
3. Giữ Rooms.tsx file với redirect + comment "DEPRECATED"
4. Sau 1 sprint → xóa hẳn file

### Bước 3: Test
- Unit: /rooms renders redirect
- E2E: visit /rooms → end up at /multiplayer, all features work

### Bước 4: 3 tầng → commit: "refactor: deprecate /rooms, redirect to /multiplayer"
```

---

## 6. ShareCard (Ưu tiên trung bình)

```
Redesign ShareCard (`apps/web/src/components/ShareCard.tsx`).

### Context từ SPEC-v2 (mục 5.2 Share Card):
- Tự động tạo sau mỗi phiên / daily challenge / lên tier
- Layout mockup từ spec:
  ┌─────────────────────────────────┐
  │  🕊️  BibleQuiz                  │
  │  Daily Challenge — 25/03/2025   │
  │     ★★★★★  5/5 câu đúng        │
  │  🏆 Giỏi hơn 94% người chơi    │
  │  [Tier icon]  Nguyễn A          │
  │  biblequiz.app/daily            │
  └─────────────────────────────────┘
- Server-rendered PNG (Puppeteer/Canvas) — nhưng frontend cần preview component
- API:
  - GET /share/session/{sessionId} → PNG
  - GET /share/tier-up/{tierId} → PNG
  - GET /share/daily/{date} → PNG
  - POST /share/{id}/view → track views
- 3 kích thước: Facebook (1200x630), Zalo, Instagram story (1080x1920)
- Watermark link app → viral growth

### Bước 1: Reference design
Dùng MCP Stitch đọc:
- "User Profile v2" → tier badge, stats pattern
- "BibleQuiz Dashboard - Final Redesign" → card, gold accents

### Bước 2: Đọc ShareCard.tsx hiện tại

### Bước 3: Redesign ShareCard preview component
**Card variants:**

A) Quiz Result Card:
- Background: gradient #11131e → #1d1f2a
- Top: "🕊️ BibleQuiz" logo + gold line
- Score circle: SVG circular progress, gold-gradient fill
- Center: "8/10 câu đúng" + accuracy %
- Stats row: time taken, XP earned, combo max
- User: avatar + name + tier badge
- Footer: "biblequiz.app" watermark

B) Daily Challenge Card (per spec mockup):
- Same background
- "Daily Challenge — [date]"
- Stars: ★ filled gold / ☆ empty (X/5)
- "Giỏi hơn Y% người chơi" badge
- User info + tier
- Footer watermark

C) Tier Up Card:
- Celebration theme: more gold, confetti elements
- "🎉 Đạt cấp [Tier Name]!"
- Old tier → New tier (arrow)
- Tier icon large
- User info
- Footer watermark

**Share actions:**
- "Chia sẻ" → copy share URL (GET /share/session/{id})
- "Tải ảnh" → download PNG from server API
- Preview: render card in-app before sharing

### Bước 4: Unit test (src/components/ShareCard.test.tsx hoặc __tests__/)
- Render quiz result variant (score, accuracy, stats)
- Render daily challenge variant (stars, percentile)
- Render tier-up variant (old tier → new tier)
- Score circle SVG renders correctly
- User info (name, avatar, tier) displays
- Copy URL button triggers clipboard
- Download button triggers API call
- Watermark "biblequiz.app" present
- Different data → different display

### Bước 5: E2E test (tests/share-card.spec.ts)
- Complete quiz → share button → card preview
- Click copy → clipboard has URL
- Daily challenge complete → share card with stars
- Share card URL publicly accessible (no auth needed)

### Bước 6: 3 tầng → commit: "style: redesign ShareCard per spec + tests"
```

---

## 7. Practice (Ưu tiên thấp — polish + thêm Retry)

```
Polish + bổ sung feature Practice (`apps/web/src/pages/Practice.tsx`, route `/practice`).

### Context từ SPEC-v2 (mục 4.1):
- Không giới hạn, không ảnh hưởng leaderboard
- Chọn: sách / nhóm sách / toàn bộ / bộ tùy chọn
- Chọn: độ khó, số câu, bật/tắt giải thích
- Lưu lịch sử cá nhân để ôn lại
- **Retry mode**: chơi lại bộ câu sai của phiên vừa rồi (1 click)
- API: POST /sessions/practice/retry-last → { newSessionId }

### Bước 1: Reference design từ MCP Stitch
- "Quiz Gameplay - Timer Added" → gameplay patterns
- "BibleQuiz Dashboard - Final Redesign" → card + filter patterns

### Bước 2: Đọc Practice.tsx → kiểm tra:
- Đã có filter (sách, độ khó, số câu)? ✓
- Đã có recent sessions? ✓
- Đã có Retry mode chưa? → Kiểm tra, nếu chưa → THÊM
- Đã có toggle giải thích? → Kiểm tra, nếu chưa → THÊM

### Bước 3: Polish + bổ sung
- Align design tokens (nếu chưa đúng)
- Filter bar: .glass-card, gold accent trên active filter
- Cards: .glass-card
- CTA "Bắt đầu": .gold-gradient
- **Thêm Retry button**: "🔄 Làm lại câu sai" → POST /sessions/practice/retry-last
  - Chỉ hiện khi có phiên gần nhất với câu sai
  - .glass-card style, icon + text
- **Thêm toggle "Hiện giải thích"**: switch/checkbox trong filter section
- Recent sessions: list với score, date, book, nút "Ôn lại"
  - Mỗi session card: POST /sessions/{id}/retry

### Bước 4: Unit test (src/pages/Practice.test.tsx hoặc __tests__/)
- Render filter bar (book, difficulty, count)
- Filter selections update state
- Toggle "Hiện giải thích" works
- Recent sessions list renders
- Empty state (no sessions)
- Retry button visible when last session has wrong answers
- Retry button hidden when no wrong answers
- Click Retry → calls POST /sessions/practice/retry-last → navigates to quiz
- Click session "Ôn lại" → calls POST /sessions/{id}/retry
- Start button → navigate to /quiz with params
- Loading + error states

### Bước 5: E2E test (tests/practice.spec.ts)
- Visit /practice → see filters
- Select book, difficulty → filters update
- Click start → navigates to quiz
- Complete quiz with wrong answers → return → Retry button visible
- Click Retry → starts new quiz with same wrong questions
- Mobile viewport

### Bước 6: 3 tầng → commit: "feat: add Retry mode to Practice + polish + tests"
```

---

## 8. Ranked (Ưu tiên thấp — polish)

```
Polish màn hình Ranked (`apps/web/src/pages/Ranked.tsx`, route `/ranked`).

### Context từ SPEC-v2 (mục 4.2 + 3.2):
- Server chọn sách theo currentBookIndex — user KHÔNG chọn
- Cap: 100 câu/ngày, 100 energy/ngày
- Energy: sai -5, đúng không tốn, regen 20/hour, hết → practice only
- Post-cycle: sau Khải Huyền → tăng độ khó hard, random mọi sách
- API: GET /me/ranked-status → { energyRemaining, questionsCounted, pointsToday,
        currentBook, currentBookIndex, isPostCycle, currentDifficulty, resetAt, streakDays }
- Điểm vào leaderboard daily/weekly/season/all-time

### Bước 1: Reference từ MCP Stitch
- "Leaderboard v2" → tier/ranking display
- "User Profile v2" → tier progress, stats

### Bước 2: Đọc Ranked.tsx → kiểm tra hiển thị:
- Energy bar: hiện đúng X/100, regen countdown?
- Current book: tên sách đang chơi?
- Post-cycle indicator?
- Questions counted: X/100 hôm nay?
- Season info?

### Bước 3: Polish
- Energy section: .glass-card
  - Progress bar: gold-gradient fill (energyRemaining/100)
  - Text: "⚡ 75/100 năng lượng"
  - Regen timer: "Phục hồi: +20 trong X phút" (nếu < 100)
  - Energy = 0: red text "Hết năng lượng — chơi Practice để luyện tập"

- Today's progress: .glass-card
  - "📊 Hôm nay"
  - Câu đã tính: X/100 (progress bar)
  - Điểm hôm nay: Y điểm
  - Streak: Z ngày liên tiếp 🔥

- Current book: .glass-card
  - "📖 Đang chơi: [Book Name]"
  - Book index: "Sách thứ X/66"
  - Nếu isPostCycle: badge "🔄 Post-cycle — Thử thách toàn bộ Kinh Thánh!"
  - Current difficulty indicator

- Season info: .glass-card
  - "🏆 Mùa: [Season Name]"
  - Rank hiện tại trong mùa
  - Điểm mùa
  - Thời gian còn lại

- Quick start CTA:
  - Energy > 0: "Bắt đầu" .gold-gradient → /quiz?mode=ranked
  - Energy = 0: "Chơi Practice" ghost button → /practice

- Mobile: stack all cards vertically

### Bước 4: Unit test (src/pages/Ranked.test.tsx hoặc __tests__/)
- Energy bar fills correctly (75/100 = 75%)
- Energy = 0 → "Hết năng lượng" message + start disabled
- Energy = 100 → no regen timer shown
- Current book name + index display
- Post-cycle badge when isPostCycle = true
- Questions counted X/100
- Season info renders
- Start button enabled/disabled based on energy
- Loading state (fetching /me/ranked-status)
- Error state
- Responsive layout

### Bước 5: E2E test (tests/ranked.spec.ts)
- Visit /ranked → see energy + stats
- Energy > 0 → click start → quiz page
- All sections visible (energy, progress, book, season)
- Mobile viewport
- Auth required

### Bước 6: 3 tầng → commit: "style: polish Ranked page per spec + tests"
```

---

## 9. GroupAnalytics (Ưu tiên thấp)

```
Polish GroupAnalytics (`apps/web/src/pages/GroupAnalytics.tsx`, route `/groups/:id/analytics`).

### Context từ SPEC-v2 (mục 5.3):
- Group admin xem analytics: ai đang học, tiến độ từng thành viên
- API: GET /groups/{id}/analytics (leader) → member activity, top players
- Max 200 thành viên/group

### Bước 1: Reference từ MCP Stitch
- "Church Group - Data Viz Update" → chart Y-axis, tooltips pattern

### Bước 2: Đọc GroupAnalytics.tsx → đánh giá design alignment

### Bước 3: Polish
- Stats cards row: .glass-card
  - Tổng thành viên (active vs inactive)
  - Câu trả lời tuần này
  - Điểm trung bình
  - Streak nhóm
- Weekly chart: reuse pattern từ Groups.tsx (Y-axis labels, grid lines, hover tooltips)
  - Bar chart: câu trả lời / ngày trong tuần
  - Gold bars, tooltip với exact number
- Top contributors: podium top 3 (gold/silver/bronze) + list
  - Avatar + name + score + streak days
- Member activity table:
  - Name, last active, câu/tuần, accuracy, streak
  - Sort by any column
  - Inactive highlight (>7 days no activity)
- Date range filter: "Tuần này" | "Tháng này" | "Mùa này"
- Leader-only: badge "Chỉ leader mới xem được"
- Mobile: cards stack, table → scrollable horizontal

### Bước 4: Unit test (src/pages/GroupAnalytics.test.tsx hoặc __tests__/)
- Stats cards render with data
- Chart renders with data points
- Top 3 podium display
- Member table renders + sortable
- Empty state (new group)
- Date filter changes data
- Non-leader → access denied
- Loading + error states

### Bước 5: E2E test (tests/group-analytics.spec.ts)
- Visit /groups/:id/analytics → see dashboard
- Charts + tables visible
- Non-leader → redirect or error
- Back to group detail
- Mobile viewport

### Bước 6: 3 tầng → commit: "style: polish GroupAnalytics per spec + tests"
```

---

## 10. Review (Ưu tiên thấp)

```
Redesign Review (`apps/web/src/pages/Review.tsx`, route `/review`).

### Context từ SPEC-v2:
- API: GET /sessions/{id}/review → answers + explanations
- Mỗi câu bắt buộc có explanation (mục 6.3)
- Explanation: trích dẫn Kinh Thánh + 1-2 câu bối cảnh, max 150 từ
- contextNote: bản đồ địa lý, bối cảnh lịch sử
- Practice Retry: POST /sessions/{id}/retry → replay wrong answers

### Bước 1: Reference từ MCP Stitch
- "Quiz Gameplay - Timer Added" → question display
- "User Profile v2" → stats pattern

### Bước 2: Đọc Review.tsx hiện tại

### Bước 3: Redesign
- Header bar: sticky top
  - "Xem lại bài làm" + back button
  - Score summary: "8/10 đúng (80%)" gold accent
  - Time taken
  - "🔄 Làm lại câu sai" button (.gold-gradient) → POST /sessions/{id}/retry

- Filter bar:
  - "Tất cả" | "Chỉ câu sai" | "Chỉ câu đúng" — tab/toggle

- Question list: vertical scroll
  - Mỗi câu: .glass-card
    - Header: "Câu X" + difficulty badge (easy/medium/hard) + book:chapter:verse
    - Question text
    - 4 answers:
      - User's answer: green border (đúng) hoặc red border (sai)
      - Correct answer: green background + ✓
    - Explanation section (always visible):
      - 📖 Scripture reference (bold)
      - Explanation text
      - contextNote (nếu có): italic, muted, với icon 🗺️
    - Bookmark button: ★ toggle (POST /me/bookmarks)

- Bottom: "Chơi lại" (.gold-gradient) + "Trang chủ" (ghost)
- Mobile: full-width cards, compact layout

### Bước 4: Unit test (src/pages/Review.test.tsx hoặc __tests__/)
- Render question list with correct/incorrect indicators
- Green for correct, red for incorrect
- Explanation always shown with scripture ref
- contextNote shown when available
- Filter "Chỉ câu sai" → only wrong questions
- Score summary correct
- Retry button → API call
- Bookmark toggle
- Empty state (no quiz data to review)
- Navigation buttons

### Bước 5: E2E test (tests/review.spec.ts)
- Complete quiz → navigate to /review
- All questions visible with answers
- Filter toggle works
- Click "Làm lại câu sai" → starts quiz
- Bookmark a question → saves
- Mobile viewport

### Bước 6: 3 tầng → commit: "style: redesign Review page per spec + tests"
```

---

## 11. QuizResults (Ưu tiên thấp)

```
Redesign QuizResults (`apps/web/src/pages/QuizResults.tsx`).

### Context từ SPEC-v2 (mục 3.1 Scoring):
- Điểm = basePoints + speedBonus + multipliers
- speedBonus = floor(basePoints * 0.5 * speedRatio²)
- Combo: 5 streak → x1.2, 10 streak → x1.5
- Daily bonus: câu đầu tiên/ngày → x2
- Tier progress: all-time points → rank chỉ tăng
- Share card tự động tạo (mục 5.2)
- Badges có thể earned (streak, tier-up, daily_perfect, etc.)

### Bước 1: Reference từ MCP Stitch
- "Quiz Gameplay - Timer Added" → end-of-quiz flow
- "User Profile v2" → tier progress, badges

### Bước 2: Đọc QuizResults.tsx

### Bước 3: Redesign
- Full-screen, bg #11131e

- **Score Circle** (center, large):
  - SVG circular progress: gold-gradient fill
  - Center: fraction "8/10"
  - Below circle: accuracy % + grade
  - Grade: "Xuất sắc!" (≥90%), "Tốt!" (≥70%), "Cố gắng thêm" (<70%)

- **Score Breakdown**: .glass-card
  - Base points: X
  - Speed bonus: +Y
  - Combo bonus: +Z (max combo: N)
  - Daily bonus: +W (nếu câu đầu ngày)
  - **Tổng: XYZ điểm** (gold, large)

- **Stats Row**: 3 mini .glass-cards
  - ⏱️ Thời gian: Xm Ys
  - ⭐ XP earned: +N
  - 🔥 Streak: X ngày

- **Tier Progress** (nếu ranked mode): .glass-card
  - [Current Tier icon] → [Next Tier icon]
  - Progress bar: gold-gradient
  - "+X điểm" text
  - Nếu vừa lên tier: "🎉 Chúc mừng! Bạn đã đạt [Tier Name]!" celebration
  
- **Badge Earned** (nếu có new achievement):
  - Popup overlay: badge icon + name + description
  - "Xem tất cả thành tựu →" link

- **Action Buttons**:
  - "Xem lại" → /review (glass-card style)
  - "Chơi lại" → /quiz same config (glass-card style)
  - "Chia sẻ" → ShareCard preview (.gold-gradient, primary)
  - "Trang chủ" → / (ghost text link)

- **Confetti**: trigger khi perfect score (10/10) hoặc new high score hoặc tier up

- Mobile: stack vertically, score circle smaller

### Bước 4: Unit test (src/pages/QuizResults.test.tsx hoặc __tests__/)
- Score circle: correct fraction + accuracy
- Grade text matches accuracy threshold
- Score breakdown: base + speed + combo + daily
- Stats cards: time, XP, streak
- Tier progress bar (ranked only, hidden in practice)
- Tier up celebration when tier changed
- Badge popup when new achievement
- Confetti on perfect score
- All 4 action buttons render + navigate correctly
- No tier progress shown for practice/daily mode
- Loading state

### Bước 5: E2E test (tests/quiz-results.spec.ts)
- Complete quiz → results screen shown
- Score matches performance
- Click "Xem lại" → /review
- Click "Chơi lại" → new quiz
- Click "Chia sẻ" → share card
- Click "Trang chủ" → home
- Mobile viewport

### Bước 6: 3 tầng → commit: "style: redesign QuizResults per spec + tests"
```

---

## 12. NotFound (Ưu tiên thấp)

```
Polish NotFound (`apps/web/src/pages/NotFound.tsx`, route `*`).

### Không có trong SPEC-v2, nhưng cần consistent với design system.

### Bước 1: Đọc NotFound.tsx hiện tại

### Bước 2: Polish
- Full-screen centered, bg #11131e
- "404" large text: gold-gradient, ~120px
- "Trang không tìm thấy": #e1e1f1, muted
- Bible verse: random inspirational, italic
  - Ví dụ: "Hãy tìm, các ngươi sẽ gặp" — Ma-thi-ơ 7:7
- Simple SVG illustration: cross/book outline, gold stroke
- CTA: "Về trang chủ" → /, .gold-gradient
- Secondary: "Thử Daily Challenge" → /daily (text link)
- Nếu đã đủ tốt → chỉ viết test

### Bước 3: Unit test (src/pages/NotFound.test.tsx hoặc __tests__/)
- Render 404 text
- Bible verse present (non-empty)
- Home button → navigates to /
- Secondary link present

### Bước 4: E2E test (tests/not-found.spec.ts)
- /random-path → 404 page
- /another/bad/path → same 404
- Click home → /
- Mobile viewport

### Bước 5: 3 tầng → commit: "style: polish NotFound + tests"
```

---

## Thứ tự thực hiện

```
Phase A — Ưu tiên cao:
  1. CreateRoom        ← config room đúng spec (6-digit code, 2-20 players, time/question)
  2. TournamentDetail  ← bracket + 3 lives + sudden death display
  3. TournamentMatch   ← 1v1 gameplay + hearts + sudden death overlay

Phase B — Ưu tiên trung bình:
  4. JoinRoom          ← đánh giá merge vào Multiplayer
  5. Rooms             ← đánh giá deprecate
  6. ShareCard         ← 3 variants per spec mockup

Phase C — Ưu tiên thấp:
  7. Practice          ← thêm Retry mode per spec
  8. Ranked            ← thêm post-cycle display, energy regen timer
  9. GroupAnalytics    ← polish chart + member table
  10. Review           ← redesign + explanation + contextNote + bookmark
  11. QuizResults      ← score breakdown + tier progress + confetti
  12. NotFound         ← polish

Sau mỗi Phase → chạy full regression, đảm bảo baseline tests không giảm.
```
