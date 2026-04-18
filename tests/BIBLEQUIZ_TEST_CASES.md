# BibleQuiz V2 — Bộ Test Cases Toàn diện

> Tài liệu này bao gồm toàn bộ test cases cho BibleQuiz V2.  
> Mỗi TC có: ID, loại test, mức độ ưu tiên, precondition, steps, expected result.

---

## Quy ước
| Ký hiệu | Ý nghĩa |
|---|---|
| 🔴 P0 | Critical — app không dùng được nếu fail |
| 🟠 P1 | High — tính năng chính bị ảnh hưởng |
| 🟡 P2 | Medium — ảnh hưởng một phần trải nghiệm |
| 🟢 P3 | Low — edge case, nice-to-have |
| [UT] | Unit Test |
| [IT] | Integration Test |
| [E2E] | End-to-End Test |
| [WS] | WebSocket Test |
| [SEC] | Security Test |
| [PERF] | Performance Test |

---

## Module 1 — Authentication & Authorization

### TC-AUTH-001 🔴 [IT]
**Đăng nhập Google OAuth thành công**
- Pre: App đang chạy, Google OAuth cấu hình đúng
- Steps:
  1. POST `/auth/oauth/start` `{ provider: "google" }`
  2. Nhận `redirectUrl`, điều hướng đến Google
  3. Google redirect về với `code`
  4. POST `/auth/oauth/callback` `{ provider: "google", code, codeVerifier }`
- Expected:
  - Response 200 có `{ accessToken, refreshToken, user }`
  - `accessToken` decode được, payload có `userId`, `role: "user"`, `exp` trong 15 phút
  - `refreshToken` tồn tại trong DB
  - User record được tạo trong DB với `provider: "google"`

### TC-AUTH-002 🔴 [IT]
**Refresh token hợp lệ**
- Pre: Có `refreshToken` hợp lệ chưa hết hạn
- Steps:
  1. POST `/auth/refresh` `{ refreshToken }`
- Expected:
  - Response 200 với `accessToken` mới + `refreshToken` mới (rotate)
  - `refreshToken` cũ bị invalidate trong DB
  - `accessToken` mới có `exp` đúng 15 phút

### TC-AUTH-003 🟠 [IT]
**Refresh token đã dùng (replay attack)**
- Pre: Đã dùng refreshToken một lần
- Steps:
  1. POST `/auth/refresh` với token đã dùng rồi
- Expected:
  - Response 401
  - Body `{ code: "TOKEN_REUSED" }`
  - Toàn bộ session của user bị invalidate (security: token rotation violation)

### TC-AUTH-004 🟠 [IT]
**Access token hết hạn**
- Pre: accessToken đã quá 15 phút
- Steps:
  1. GET `/me` với token hết hạn
- Expected:
  - Response 401 `{ code: "TOKEN_EXPIRED" }`

### TC-AUTH-005 🟡 [IT]
**Đăng nhập email/password sai**
- Steps:
  1. POST `/auth/login` `{ email: "x@x.com", password: "wrong" }`
- Expected:
  - Response 401
  - Không tiết lộ "email đúng nhưng password sai" vs "email không tồn tại" (same error message)

### TC-AUTH-006 🟡 [SEC]
**Rate limit endpoint đăng nhập**
- Steps:
  1. POST `/auth/login` với sai password 11 lần liên tiếp từ cùng IP
- Expected:
  - Từ request thứ 11: Response 429 `{ code: "RATE_LIMITED", retryAfter }`

### TC-AUTH-007 🟠 [IT]
**Logout — invalidate refresh token**
- Pre: Đang đăng nhập với accessToken hợp lệ
- Steps:
  1. POST `/auth/logout`
  2. POST `/auth/refresh` với refreshToken cũ
- Expected:
  - Bước 1: 204 No Content
  - Bước 2: 401 TOKEN_INVALID

### TC-AUTH-008 🟡 [IT]
**Guest access — endpoint không cần auth**
- Steps:
  1. GET `/daily-challenge` không có Authorization header
  2. GET `/leaderboard/global` không có header
- Expected:
  - Cả 2 trả về 200
  - Không có thông tin cá nhân user

### TC-AUTH-009 🟠 [IT]
**Guest bị chặn endpoint cần auth**
- Steps:
  1. GET `/me` không có Authorization header
  2. POST `/sessions` không có header
- Expected:
  - Cả 2 trả về 401

---

## Module 2 — User Profile & Tier System

### TC-USER-001 🔴 [IT]
**Lấy profile đầy đủ**
- Pre: Đăng nhập, user có 1500 all-time points
- Steps:
  1. GET `/me`
- Expected:
  - Response 200 có: `id`, `name`, `username`, `email`, `avatarUrl`
  - `totalPoints: 1500`
  - `currentTier: { id, name: "Người Tìm Kiếm", minPoints: 1000, maxPoints: 4999 }`
  - `tierProgress: { current: 1500, nextTierAt: 5000, percentage: 12.5 }`
  - `currentStreak`, `longestStreak`

### TC-TIER-001 🔴 [UT]
**Tính tier đúng theo điểm**
- Test data:

| Points | Expected Tier |
|---|---|
| 0 | Tân Tín Hữu |
| 999 | Tân Tín Hữu |
| 1000 | Người Tìm Kiếm |
| 4999 | Người Tìm Kiếm |
| 5000 | Môn Đồ |
| 14999 | Môn Đồ |
| 15000 | Hiền Triết |
| 39999 | Hiền Triết |
| 40000 | Tiên Tri |
| 99999 | Tiên Tri |
| 100000 | Sứ Đồ |

### TC-TIER-002 🔴 [IT]
**Lên tier tự động khi đủ điểm**
- Pre: User đang có 4980 điểm (tier "Người Tìm Kiếm"), energy > 0
- Steps:
  1. Trả lời đúng 2 câu medium (12đ × 2 = 24đ) → tổng 5004đ
- Expected:
  - Response answer lần 2 có `newBadge: { type: "tier_up", tierId: "mon-do", name: "Môn Đồ" }`
  - `User.currentTierId` cập nhật trong DB
  - `UserBadge` record mới được tạo
  - Push notification "Chúc mừng! Bạn đã đạt tier Môn Đồ 📖"

### TC-TIER-003 🟠 [IT]
**Tier không bao giờ giảm**
- Pre: User đang tier "Môn Đồ" (5000đ)
- Steps:
  1. Kiểm tra DB sau bất kỳ thao tác nào (kể cả không chơi)
- Expected:
  - `User.currentTierId` không thay đổi xuống "Người Tìm Kiếm"

### TC-STREAK-001 🔴 [UT]
**Tính streak đúng**
- Scenarios:

| Ngày | Hành động | Expected Streak |
|---|---|---|
| Day 1 | Chơi | 1 |
| Day 2 | Chơi | 2 |
| Day 3 | Không chơi | 0 (reset) |
| Day 4 | Chơi | 1 |

### TC-STREAK-002 🟠 [IT]
**Streak bonus điểm**
- Pre: User đang streak 5 ngày, hôm nay chưa chơi
- Steps:
  1. POST `/sessions` mode=ranked, trả lời đúng câu Medium
- Expected:
  - `scoreDelta` = base (12) + bonus(tốc độ) — không nhân
  - Sau khi chơi: `currentStreak = 6`
  - Ngày thứ 7: trả lời đúng → bonus +15% điểm áp dụng

### TC-STREAK-003 🟡 [IT]
**Streak Freeze dùng đúng**
- Pre: User streak 10 ngày, có 1 Freeze còn
- Steps:
  1. Không chơi ngày hôm nay (bỏ 1 ngày)
  2. POST `/me/streak-freeze/use`
  3. Ngày hôm sau xem streak
- Expected:
  - Streak vẫn là 10 (không reset)
  - Số Freeze còn: 0

### TC-STREAK-004 🟡 [IT]
**Streak Freeze không đủ**
- Pre: User đã dùng hết Freeze tuần này (0 còn lại)
- Steps:
  1. Không chơi 1 ngày
  2. POST `/me/streak-freeze/use`
- Expected:
  - Response 422 `{ code: "NO_FREEZE_AVAILABLE" }`
  - Streak reset về 0

### TC-BADGE-001 🟠 [IT]
**Badge streak 7 ngày**
- Pre: User streak 6 ngày liên tiếp
- Steps:
  1. Chơi thêm ngày thứ 7 (bất kỳ câu nào)
- Expected:
  - `UserBadge` record: `{ badgeType: "streak_7", badgeName: "Chuyên cần" }`
  - Response answer có `newBadge` field

---

## Module 3 — Daily Challenge

### TC-DAILY-001 🔴 [IT]
**Cùng 5 câu cho 2 user khác nhau**
- Pre: 2 user A và B, cùng ngày
- Steps:
  1. User A: GET `/daily-challenge`
  2. User B: GET `/daily-challenge`
- Expected:
  - `questions[].id` của A và B **giống hệt nhau** và cùng **thứ tự**
  - Đây là deterministic từ seed = ngày

### TC-DAILY-002 🔴 [IT]
**Guest chơi Daily Challenge**
- Pre: Không có Authorization header
- Steps:
  1. GET `/daily-challenge`
  2. POST `/daily-challenge/start` (không có auth)
  3. Trả lời 5 câu
- Expected:
  - Bước 1: 200, trả về câu hỏi
  - Bước 3: Điểm được tính tạm thời
  - Không lưu vào leaderboard (vì guest)
  - Hiển thị "Đăng nhập để lưu kết quả"

### TC-DAILY-003 🔴 [IT]
**User đăng nhập — điểm vào leaderboard daily**
- Pre: User đăng nhập, chưa chơi daily hôm nay
- Steps:
  1. POST `/daily-challenge/start`
  2. Trả lời 5 câu (3 đúng, 2 sai)
  3. GET `/daily-challenge/result`
- Expected:
  - `score: 3 * base_points`
  - `betterThanPercent` là số từ 0–100
  - `shareCardUrl` là URL hợp lệ trỏ đến PNG
  - `LeaderboardEntry` được tạo/cập nhật với `scope: "daily_challenge"`, `period: "daily"`

### TC-DAILY-004 🟠 [IT]
**Không thể chơi Daily Challenge 2 lần trong ngày**
- Pre: User đã hoàn thành Daily Challenge hôm nay
- Steps:
  1. POST `/daily-challenge/start` lần 2
- Expected:
  - Response 409 `{ code: "ALREADY_COMPLETED_TODAY" }`
  - GET `/daily-challenge` trả về `alreadyCompleted: true`

### TC-DAILY-005 🟡 [IT]
**Daily Challenge câu hỏi khác nhau mỗi ngày**
- Pre: Ghi lại questionIds hôm nay
- Steps:
  1. Mock ngày mai (hoặc chờ)
  2. GET `/daily-challenge`
- Expected:
  - `questions[].id` khác với hôm nay (xác suất cao — seed khác)

---

## Module 4 — Practice Mode

### TC-PRAC-001 🔴 [IT]
**Tạo practice session cơ bản**
- Pre: User đăng nhập
- Steps:
  1. POST `/sessions` `{ mode: "practice", config: { books: ["Genesis"], difficulty: "easy", questionCount: 10 } }`
- Expected:
  - Response 201: `{ session: { id, mode: "practice", status: "active" }, questions: [...] }`
  - `questions.length = 10`
  - Mỗi question không có `correctAnswer` trong response (ẩn)
  - Tất cả questions thuộc book Genesis, difficulty easy

### TC-PRAC-002 🔴 [IT]
**Trả lời câu đúng — practice không ảnh hưởng leaderboard**
- Steps:
  1. Tạo practice session
  2. POST `/sessions/{id}/answer` với đáp án đúng
- Expected:
  - `isCorrect: true`
  - `scoreDelta` > 0 (để user có cảm giác phần thưởng)
  - `explanation` có trong response
  - **KHÔNG** xuất hiện entry mới trong bất kỳ leaderboard nào
  - `energyRemaining` **KHÔNG** thay đổi (sai cũng không trừ energy trong practice)

### TC-PRAC-003 🟠 [IT]
**Retry session practice**
- Pre: Có session practice đã kết thúc (10 câu)
- Steps:
  1. POST `/sessions/{sessionId}/retry`
- Expected:
  - Response 201 `{ newSessionId }`
  - Session mới có `config` giống session gốc
  - Session mới độc lập hoàn toàn

### TC-PRAC-004 🟡 [IT]
**Practice mode — bật/tắt giải thích ngay**
- Steps:
  1. POST `/sessions` với `config.showExplanationOnSubmit: false`
  2. Trả lời 1 câu
- Expected:
  - Response không có `explanation`
  - Sau đó GET `/sessions/{id}/review` mới thấy explanation

### TC-PRAC-005 🟡 [IT]
**Practice mode với unlimited questions**
- Steps:
  1. POST `/sessions` `{ config: { questionCount: "unlimited" } }`
  2. Trả lời 60 câu
- Expected:
  - Session vẫn active sau 50+ câu (không có hard cap)
  - `status` chỉ thành `completed` khi user chủ động kết thúc

---

## Module 5 — Ranked Mode & Scoring

### TC-RANK-001 🔴 [UT]
**Công thức điểm cơ bản theo độ khó**

| Độ khó | Điểm expected |
|---|---|
| easy | 8 |
| medium | 12 |
| hard | 18 |

### TC-RANK-002 🔴 [UT]
**Công thức speed bonus (phi tuyến)**
- Formula: `speedBonus = floor(basePoints * 0.5 * speedRatio²)`
- Test cases:

| Base | TimeLimit | Elapsed | SpeedRatio | Expected Bonus | Total |
|---|---|---|---|---|---|
| 12 | 15000ms | 3000ms | 0.8 | floor(12*0.5*0.64)=3 | 15 |
| 12 | 15000ms | 0ms | 1.0 | floor(12*0.5*1.0)=6 | 18 |
| 12 | 15000ms | 15000ms | 0.0 | floor(0)=0 | 12 |
| 8 | 15000ms | 7500ms | 0.5 | floor(8*0.5*0.25)=1 | 9 |
| 18 | 15000ms | 1500ms | 0.9 | floor(18*0.5*0.81)=7 | 25 |

### TC-RANK-003 🔴 [UT]
**Combo multiplier**
- Pre: Đang trong session ranked
- Steps: Trả lời đúng liên tiếp

| Câu đúng liên tiếp | Expected multiplier |
|---|---|
| 1–4 | x1.0 |
| 5–9 | x1.2 |
| 10+ | x1.5 |

### TC-RANK-004 🔴 [IT]
**Daily bonus — câu đầu tiên mỗi ngày x2**
- Pre: User chưa chơi ranked hôm nay
- Steps:
  1. POST `/sessions` mode=ranked
  2. Trả lời câu đầu tiên (medium, speedRatio=0)
- Expected:
  - `scoreDelta = 12 * 2 = 24` (x2 daily bonus, không có speed bonus)

### TC-RANK-005 🔴 [IT]
**Energy deduction khi trả lời sai**
- Pre: `energyRemaining = 100`
- Steps:
  1. POST `/sessions/{id}/answer` với đáp án SAI
- Expected:
  - `isCorrect: false`
  - `energyRemaining = 95` (trừ 5)
  - `scoreDelta = 0`
  - `questionsCounted` **KHÔNG** tăng (câu sai không tính vào cap 100)

### TC-RANK-006 🔴 [IT]
**Energy về 0 — điểm không vào leaderboard**
- Pre: Tạo user với `energyRemaining = 5`
- Steps:
  1. Trả lời SAI 1 câu → energy = 0
  2. Trả lời ĐÚNG 3 câu tiếp theo
- Expected:
  - Câu đúng sau khi hết energy: `rankedApplied: false`
  - `scoreDelta` trả về để hiển thị nhưng điểm **không** cộng vào leaderboard
  - Session vẫn tiếp tục được (chỉ là practice mode tự động)

### TC-RANK-007 🔴 [IT]
**Cap 100 câu/ngày**
- Pre: User đã trả lời đúng 99 câu hôm nay
- Steps:
  1. Trả lời đúng câu thứ 100
  2. Trả lời đúng câu thứ 101
- Expected:
  - Câu 100: `rankedApplied: true`, `questionsCounted: 100`
  - Câu 101: `rankedApplied: false` (đã đạt cap), `scoreDelta` tính nhưng không vào leaderboard
  - UI nhận được message "Bạn đã đạt giới hạn 100 câu hôm nay"

### TC-RANK-008 🔴 [IT]
**Idempotency — submit 2 lần cùng 1 câu**
- Steps:
  1. POST `/sessions/{id}/answer` `{ questionId: "q1", answer: 0 }`
  2. POST `/sessions/{id}/answer` `{ questionId: "q1", answer: 0 }` (lần 2)
- Expected:
  - Lần 2: Response 409 `{ code: "ANSWER_ALREADY_SUBMITTED" }`
  - Energy chỉ bị trừ 1 lần (nếu sai)
  - `questionsCounted` chỉ tăng 1 (nếu đúng)

### TC-RANK-009 🔴 [IT]
**Reset daily vào UTC midnight**
- Pre: User có energyRemaining=20, questionsCounted=80 vào cuối ngày
- Steps:
  1. Mock thời gian sang ngày mới (UTC 00:00:01)
  2. GET `/me/ranked-status`
- Expected:
  - `energyRemaining: 100`
  - `questionsCounted: 0`
  - `pointsCounted: 0`
  - `currentBook` giữ nguyên (không reset tiến độ sách)

### TC-RANK-010 🟠 [IT]
**Book progression — tự động chuyển sách**
- Pre: User đang ở Genesis, kho Genesis chỉ còn 2 câu chưa làm
- Steps:
  1. Trả lời 2 câu cuối của Genesis trong ranked mode
- Expected:
  - Server tự động chuyển `currentBook` sang sách kế tiếp (Exodus)
  - Response câu tiếp theo thuộc Exodus
  - `UserDailyProgress.currentBookIndex` tăng 1

### TC-RANK-011 🟠 [IT]
**Book skip nếu pool không đủ**
- Pre: Sách Obadiah chỉ có 5 câu active (< minimum 30)
- Steps:
  1. Book pointer đến Obadiah
- Expected:
  - Server skip Obadiah, chuyển sang sách kế tiếp
  - Log ghi nhận "Book Obadiah skipped: insufficient pool"

### TC-RANK-012 🟠 [IT]
**Post-cycle — sau Khải Huyền**
- Pre: User hoàn thành hết Revelation trong ranked
- Steps:
  1. Trả lời câu cuối của Revelation
  2. Tiếp tục chơi
- Expected:
  - `isPostCycle: true`
  - `currentDifficulty` = "hard"
  - Câu tiếp theo lấy ngẫu nhiên từ mọi sách với difficulty hard

### TC-RANK-013 🔴 [IT]
**Energy, questionsCounted, điểm update trong 1 transaction**
- Steps:
  1. Gửi 2 request đồng thời trả lời cùng 1 câu (race condition)
- Expected:
  - Chỉ 1 request thành công (409 cho request còn lại)
  - DB không bị double-write

---

## Module 6 — Multiplayer Room

### TC-ROOM-001 🔴 [IT]
**Tạo room thành công**
- Steps:
  1. POST `/rooms` `{ timePerQuestionSec: 15, maxPlayers: 10, filters: { books: ["Matthew"] }, visibility: "public" }`
- Expected:
  - Response 201: `{ id, code (6 ký tự alphanum), status: "lobby", hostUserId }`
  - Code là UNIQUE trong DB

### TC-ROOM-002 🔴 [WS]
**Flow đầy đủ: tạo → join → start → chơi → kết thúc**
- Pre: Host H và 2 players A, B
- Steps:
  1. H tạo room → nhận code
  2. A, B kết nối WS `/room/{roomId}`, gửi `join`
  3. Server broadcast `state { status: lobby, players: [H, A, B] }`
  4. H gửi REST POST `/rooms/{id}/start`
  5. Server broadcast `question` câu 1
  6. A, B gửi WS `answer`
  7. Server broadcast `answer_result`, `scoreboard`
  8. Sau tất cả câu → `ended { finalRankings }`
- Expected:
  - Mỗi bước nhận đúng event type
  - `finalRankings` có đủ 3 player, sorted by score desc

### TC-ROOM-003 🟠 [WS]
**Timeout câu — server tự chuyển câu tiếp**
- Pre: Room đang in_progress, câu có timeLimitSec=10
- Steps:
  1. Không ai trả lời trong 10 giây
- Expected:
  - Server tự broadcast `scoreboard` sau 10s
  - Server broadcast `question` tiếp theo
  - Không cần client action

### TC-ROOM-004 🟠 [WS]
**Player ngắt kết nối mid-game**
- Steps:
  1. Room đang chơi với 3 người
  2. Player A ngắt kết nối WS
  3. A reconnect trong vòng 30s
- Expected:
  - Server broadcast `player_left { userId: A }` cho B, H
  - A reconnect: nhận lại `state` hiện tại (câu đang ở, điểm hiện tại)
  - Game tiếp tục không bị gián đoạn

### TC-ROOM-005 🟠 [IT]
**Host kick player**
- Pre: Room ở lobby, có player A
- Steps:
  1. POST `/rooms/{id}/kick` `{ userId: A.id }` bởi host
- Expected:
  - A nhận WS event `kicked`
  - A bị remove khỏi `RoomMember`
  - A không thể rejoin (response 403 "You have been kicked")

### TC-ROOM-006 🟡 [IT]
**Join phòng đã đầy**
- Pre: Room maxPlayers=5, đang có 5 thành viên
- Steps:
  1. User mới POST `/rooms/{id}/join`
- Expected:
  - Response 409 `{ code: "ROOM_FULL" }`

---

## Module 7 — Tournament

### TC-TOURN-001 🔴 [IT]
**Tạo bracket đúng với 8 người**
- Pre: Tournament với 8 participants
- Steps:
  1. POST `/tournaments/{id}/start`
- Expected:
  - Round 1 có 4 matches
  - Mỗi match có đúng 2 MatchParticipant
  - Không có bye (8 là số chẵn hoàn hảo)
  - `TournamentParticipant.seed` được assign (1–8)

### TC-TOURN-002 🔴 [IT]
**Bracket với số người lẻ (7 người) — bye rule**
- Pre: 7 participants
- Steps:
  1. POST `/tournaments/{id}/start`
- Expected:
  - Round 1 có 4 matches (3 match thực + 1 bye)
  - Người được bye (seed #1 hoặc seed cao nhất): tự động vào round 2
  - Bye match có `status: ended`, `isWinner: true` cho người được bye

### TC-TOURN-003 🔴 [WS]
**Match flow — player sai hết mạng, thua**
- Pre: Match giữa P1 và P2, lives=3 mỗi người
- Steps:
  1. P1 trả lời SAI 3 lần liên tiếp
- Expected:
  - Sau sai lần 3: `match_update { p1Lives: 0 }`
  - Server broadcast `match_end { winnerUserId: P2.id, reason: "lives_out" }`
  - `MatchParticipant(P1).isWinner = false`, `MatchParticipant(P2).isWinner = true`

### TC-TOURN-004 🟠 [WS]
**Tie-break sudden death**
- Pre: Hết tất cả câu trong match, P1Lives=2, P2Lives=2 (hòa)
- Steps:
  1. Server gửi câu sudden death
  2. P1 trả lời đúng trước
- Expected:
  - `match_end { winnerUserId: P1.id, reason: "tiebreak" }`

### TC-TOURN-005 🟠 [WS]
**Forfeit mid-match**
- Steps:
  1. P1 POST `/tournaments/{id}/matches/{matchId}/forfeit`
- Expected:
  - `match_end { winnerUserId: P2.id, reason: "forfeit" }`
  - P1 `eliminatedAt` được set

### TC-TOURN-006 🟠 [IT]
**Bracket advancement sau mỗi trận**
- Pre: Round 1 match xong, P1 thắng
- Expected:
  - P1 tự động được tạo `MatchParticipant` trong round 2
  - Server broadcast `bracket_update` cho tất cả tournament members
  - Round 2 match chỉ start khi đủ 2 người đã advance

---

## Module 8 — Church Group

### TC-GROUP-001 🔴 [IT]
**Tạo group mới**
- Steps:
  1. POST `/groups` `{ name: "Nhóm Tế Bào A", description: "...", isPublic: false }`
- Expected:
  - Response 201: `{ id, name, code (6 ký tự), createdBy }`
  - Creator tự động có `GroupMember` với `role: "leader"`

### TC-GROUP-002 🔴 [IT]
**Join group bằng code**
- Pre: Group tồn tại với code "ABC123"
- Steps:
  1. POST `/groups/join` `{ code: "ABC123" }`
- Expected:
  - Response 200, `GroupMember` được tạo với `role: "member"`
  - `Group.memberCount` tăng 1

### TC-GROUP-003 🟠 [IT]
**Group leaderboard cập nhật khi thành viên chơi**
- Pre: User A và B đều trong group G
- Steps:
  1. A chơi ranked mode, ghi được 500đ
  2. GET `/groups/{G.id}/leaderboard?period=weekly`
- Expected:
  - A xuất hiện trong leaderboard với 500đ
  - B cũng xuất hiện (0đ nếu chưa chơi)
  - Leaderboard chỉ hiển thị thành viên của group G

### TC-GROUP-004 🟠 [IT]
**Leader xem analytics nhóm**
- Pre: Group có 10 thành viên, một số đã chơi hôm nay
- Steps:
  1. GET `/groups/{id}/analytics` bởi leader
- Expected:
  - Response có: `totalMembers`, `activeToday`, `weeklyPoints`
  - Per-member: `userId`, `name`, `questionsToday`, `pointsThisWeek`

### TC-GROUP-005 🟡 [IT]
**Non-leader không xem được analytics**
- Steps:
  1. GET `/groups/{id}/analytics` bởi `role: "member"`
- Expected:
  - Response 403 `{ code: "FORBIDDEN" }`

### TC-GROUP-006 🟡 [IT]
**Join group đã đầy (maxMembers=200)**
- Pre: Group đang có 200 thành viên
- Steps:
  1. POST `/groups/join`
- Expected:
  - Response 409 `{ code: "GROUP_FULL" }`

### TC-GROUP-007 🟡 [IT]
**Tạo Group Quiz Set**
- Pre: Leader đã login
- Steps:
  1. POST `/groups/{id}/quiz-sets` `{ name: "Bài học CN 24/3", questionIds: ["q1","q2","q3"] }`
- Expected:
  - Response 201 `{ id, name, questionIds, createdBy }`
  - Thành viên group có thể POST `/sessions` với `config.quizSetId` này

### TC-GROUP-008 🟡 [IT]
**Leave group**
- Pre: Là member (không phải leader)
- Steps:
  1. DELETE `/groups/{id}/leave`
- Expected:
  - `GroupMember` record bị xóa
  - `Group.memberCount` giảm 1
  - User không còn thấy group leaderboard

### TC-GROUP-009 🟡 [IT]
**Leader không thể leave (phải transfer hoặc xóa group)**
- Steps:
  1. DELETE `/groups/{id}/leave` bởi leader
- Expected:
  - Response 422 `{ code: "LEADER_CANNOT_LEAVE", message: "Chuyển quyền leader trước khi rời nhóm" }`

---

## Module 9 — Leaderboard

### TC-LB-001 🔴 [IT]
**Leaderboard global daily cập nhật real-time**
- Pre: Leaderboard hiện tại, user A ở rank 5
- Steps:
  1. A chơi ranked, ghi thêm điểm đủ vào top 3
  2. GET `/leaderboard/global?period=daily`
- Expected:
  - A xuất hiện ở rank đúng (≤3)
  - Response time < 200ms (từ Redis ZSET)

### TC-LB-002 🟠 [IT]
**Around-me API**
- Pre: User ở rank 50 trong leaderboard weekly
- Steps:
  1. GET `/leaderboard/around-me?period=weekly`
- Expected:
  - Response: ranks 45–55 (5 trên, user, 5 dưới)
  - User được highlight trong response

### TC-LB-003 🟠 [IT]
**Leaderboard friend**
- Pre: User A đã add friend B và C
- Steps:
  1. GET `/leaderboard/friends?period=weekly`
- Expected:
  - Chỉ hiển thị A, B, C
  - Không hiển thị người lạ dù họ có điểm cao hơn

### TC-LB-004 🟠 [IT]
**Season leaderboard reset**
- Pre: Season 1 đã kết thúc, A đang có 5000 season points
- Steps:
  1. Season 2 bắt đầu
  2. GET `/leaderboard/global?period=season` (season đang active)
- Expected:
  - A's season points = 0 trong season 2
  - A vẫn có tier all-time không đổi
  - Badge "top 3 Season 1" của A vẫn còn

### TC-LB-005 🟡 [IT]
**Leaderboard không hiển thị user bị ban**
- Pre: Admin ban user X
- Steps:
  1. GET `/leaderboard/global`
- Expected:
  - X không xuất hiện dù điểm cao

---

## Module 10 — Share Card

### TC-SHARE-001 🔴 [IT]
**Tạo share card sau Daily Challenge**
- Pre: User hoàn thành daily challenge, `sessionId = "s1"`
- Steps:
  1. GET `/share/session/s1`
- Expected:
  - Response `Content-Type: image/png`
  - Image width = 1200px, height = 630px (OG standard)
  - Image chứa: username, score, ngày, "BibleQuiz" branding, URL app

### TC-SHARE-002 🟠 [IT]
**Share card tier-up**
- Steps:
  1. GET `/share/tier-up/mon-do`
- Expected:
  - PNG với tier icon + "Môn Đồ" text
  - Có user's name + avatar

### TC-SHARE-003 🟡 [IT]
**Share card chỉ của chính mình**
- Pre: Session s1 thuộc user A
- Steps:
  1. User B GET `/share/session/s1` (session của A)
- Expected:
  - Response 403 hoặc 404 (không lộ data người khác)

### TC-SHARE-004 🟡 [IT]
**View count tracking**
- Steps:
  1. POST `/share/s1/view` 3 lần
  2. (Admin) GET share record
- Expected:
  - `ShareCard.views = 3`

---

## Module 11 — Admin & Content

### TC-ADMIN-001 🔴 [IT]
**Import CSV câu hỏi — happy path**
- Pre: File CSV đúng format, 100 câu
- Steps:
  1. POST `/admin/import` multipart với file + `{ format: "csv", dryRun: true }`
  2. Kiểm tra response preview
  3. POST `/admin/import` với `dryRun: false`
- Expected:
  - Bước 1: `{ status: "ready", stats: { valid: 98, invalid: 2, errors: [...] } }`
  - Bước 3: 100 Question records mới trong DB (2 invalid bị skip)
  - `ImportBatch` record với `status: "completed"`, `statsJSON`
  - `AuditLog` entry ghi nhận action

### TC-ADMIN-002 🟠 [IT]
**Import CSV — rollback khi fail giữa chừng**
- Pre: File CSV 50 dòng, dòng 30 có lỗi schema nghiêm trọng
- Steps:
  1. POST `/admin/import` `{ dryRun: false }` với file lỗi
- Expected:
  - Response 422, không có Question nào được tạo (all-or-nothing)
  - `ImportBatch.status = "failed"`

### TC-ADMIN-003 🟠 [IT]
**CRUD câu hỏi — quyền admin**
- Steps:
  1. POST `/admin/questions` với question data bởi `role: "user"` (không phải admin)
- Expected:
  - Response 403

### TC-ADMIN-004 🟠 [IT]
**Pool coverage API**
- Steps:
  1. GET `/admin/coverage`
- Expected:
  - Response: mỗi book có `{ book, easy, medium, hard, meetsMinimum: boolean }`
  - Sách < minimum: `meetsMinimum: false`

### TC-AI-001 🟠 [IT]
**AI generate job — happy path**
- Pre: Bedrock mock trả về valid draft
- Steps:
  1. POST `/admin/ai/generate` `{ scripture: { book: "Genesis", chapter: 1 }, count: 5, difficulty: "easy", language: "vi" }`
  2. GET `/admin/ai/jobs/{jobId}` (poll)
  3. POST `/admin/ai/drafts/{draftId}/approve`
- Expected:
  - Bước 1: `{ jobId }`, `AIGenerationJob.status = "pending"`
  - Bước 2: `{ status: "completed", drafts: [5 items], costUSD: number }`
  - Bước 3: `{ questionId }`, Question mới trong DB với `createdBy: "ai-generated"`, `reviewedBy: adminId`

### TC-AI-002 🟡 [IT]
**AI daily quota exceeded**
- Pre: Admin đã generate 200 câu hôm nay (= quota)
- Steps:
  1. POST `/admin/ai/generate`
- Expected:
  - Response 429 `{ code: "AI_QUOTA_EXCEEDED", resetAt: "..." }`

### TC-AI-003 🟡 [IT]
**AI draft validation — reject malformed**
- Pre: Mock Bedrock trả về JSON thiếu field `explanation`
- Steps:
  1. POST `/admin/ai/generate`
  2. GET `/admin/ai/jobs/{jobId}`
- Expected:
  - Draft có `validationStatus: "invalid"`, `validationErrorsJSON: ["explanation is required"]`
  - Draft không thể approve trực tiếp (phải edit trước)

---

## Module 12 — Security & Anti-Cheat

### TC-SEC-001 🔴 [SEC]
**Điểm tính server-side, không tin client**
- Steps:
  1. POST `/sessions/{id}/answer` với `clientElapsedMs: -1000` (âm, cố tình hack bonus)
- Expected:
  - Server clamp: `clientElapsedMs = max(0, clientElapsedMs)`
  - `scoreDelta` không vượt quá max hợp lệ

### TC-SEC-002 🔴 [SEC]
**IDOR — user không xem session của người khác**
- Pre: Session s1 thuộc user A
- Steps:
  1. User B GET `/sessions/s1`
- Expected:
  - Response 403 hoặc 404

### TC-SEC-003 🔴 [SEC]
**Không submit đáp án sau khi session kết thúc**
- Pre: Session đã `status: completed`
- Steps:
  1. POST `/sessions/{id}/answer` với questionId hợp lệ
- Expected:
  - Response 422 `{ code: "SESSION_ENDED" }`

### TC-SEC-004 🟠 [SEC]
**SQL Injection trong search**
- Steps:
  1. GET `/questions?q=' OR '1'='1`
- Expected:
  - Response 200 với kết quả bình thường (parameterized query hoạt động)
  - Không có SQL error, không lộ data không liên quan

### TC-SEC-005 🟠 [SEC]
**XSS trong content câu hỏi**
- Steps:
  1. Admin tạo question với `content: "<script>alert('xss')</script>"`
- Expected:
  - Lưu DB: content bị sanitize hoặc escape
  - Khi render: không execute script

### TC-SEC-006 🟠 [SEC]
**Rate limit submit đáp án**
- Steps:
  1. Gửi 35 request POST `/sessions/{id}/answer` trong 1 phút
- Expected:
  - Request thứ 31+: 429 Too Many Requests
  - `Retry-After` header có giá trị

### TC-SEC-007 🟡 [SEC]
**Leaderboard anomaly detection**
- Steps:
  1. User tăng đột ngột 10,000 điểm trong 1 phút
- Expected:
  - `AuditLog` ghi nhận anomaly event
  - User bị flag để review (không bị ban ngay)
  - Admin nhận alert

### TC-SEC-008 🟡 [SEC]
**Không lộ internal server error details**
- Steps:
  1. Gây ra 500 error (ví dụ: gửi request format sai)
- Expected:
  - Response `{ code: "INTERNAL_ERROR", requestId: "xxx", message: "An error occurred" }`
  - Không có stack trace trong response

---

## Module 13 — Notifications

### TC-NOTIF-001 🟠 [IT]
**Push notification khi lên tier**
- Pre: User đăng ký FCM token
- Steps:
  1. User đạt đủ điểm lên tier mới
- Expected:
  - FCM được gọi với đúng token
  - Message body: "Chúc mừng! Bạn đã đạt tier Môn Đồ 📖"
  - `Notification` record được tạo trong DB

### TC-NOTIF-002 🟡 [IT]
**In-app notification — đọc và đánh dấu đã đọc**
- Steps:
  1. GET `/notifications?unread=true`
  2. PATCH `/notifications/read-all`
  3. GET `/notifications?unread=true`
- Expected:
  - Bước 1: list notifications với `read: false`
  - Bước 3: empty list

### TC-NOTIF-003 🟡 [IT]
**Streak warning — còn 2 giờ để giữ streak**
- Pre: User có streak, chưa chơi hôm nay, còn 2 giờ đến reset
- Expected:
  - FCM push: "Streak của bạn sắp gãy — còn 2 giờ để giữ streak!"
  - Chỉ gửi 1 lần/ngày, không spam

---

## Module 14 — Performance & Non-functional

### TC-PERF-001 🔴 [PERF]
**API đọc P95 < 200ms**
- Tool: k6 hoặc JMeter
- Steps: 1000 concurrent GET `/leaderboard/global`
- Expected: P95 latency < 200ms, error rate < 0.1%

### TC-PERF-002 🔴 [PERF]
**WebSocket — 100 user đồng thời trong 1 room**
- Steps: Simulate 100 WS connections, tất cả gửi `answer` cùng lúc
- Expected:
  - Server xử lý hết trong < 1s
  - Không có message bị drop
  - `scoreboard` broadcast chính xác

### TC-PERF-003 🟠 [PERF]
**Leaderboard read dưới tải**
- Steps: 1000 req/s GET `/leaderboard/global`
- Expected: P99 < 500ms, hit Redis cache > 95%

### TC-PERF-004 🟠 [PERF]
**Share card generation time**
- Steps: 50 concurrent GET `/share/session/{id}`
- Expected: P95 < 3s (Puppeteer render)

### TC-PERF-005 🟡 [PERF]
**DB query — câu hỏi filter phức tạp**
- Steps: GET `/questions?book=Genesis&difficulty=hard&tags=covenant&limit=20`
- Expected: P95 < 100ms (index đúng)

---

## Module 15 — WebSocket Reliability

### TC-WS-001 🔴 [WS]
**Reconnect và resume state**
- Pre: User đang trong room đang chơi
- Steps:
  1. Ngắt kết nối WS (simulate network drop)
  2. Reconnect trong vòng 30s với `{ lastEventId }`
- Expected:
  - Server gửi lại các events đã miss
  - Client nhận đúng state hiện tại (câu đang ở, điểm)
  - Game không bị gián đoạn

### TC-WS-002 🟠 [WS]
**Exponential backoff reconnect**
- Steps:
  1. Ngắt kết nối WS
  2. Observe reconnect attempts từ client
- Expected:
  - Retry: 1s, 2s, 4s, 8s, 16s, 30s (tối đa), sau đó cứ 30s

### TC-WS-003 🟡 [WS]
**Heartbeat ping/pong**
- Steps: Giữ WS connection idle 35s
- Expected:
  - Server gửi `ping` sau 30s
  - Client trả `pong`
  - Connection không bị đóng

### TC-WS-004 🟡 [WS]
**Token hết hạn mid-game**
- Pre: User join room, accessToken còn 1 phút
- Steps:
  1. Chờ token hết hạn
  2. Gửi WS message
- Expected:
  - Server gửi `error { code: "TOKEN_EXPIRED" }`
  - Client tự refresh token và reconnect mà không mất state

---

## Checklist Test Coverage Summary

| Module | P0 | P1 | P2 | P3 | Total |
|---|---|---|---|---|---|
| Auth | 4 | 3 | 2 | 0 | 9 |
| User/Tier/Streak/Badge | 3 | 3 | 3 | 2 | 11 |
| Daily Challenge | 3 | 1 | 1 | 0 | 5 |
| Practice Mode | 2 | 1 | 2 | 0 | 5 |
| Ranked Mode | 9 | 4 | 0 | 0 | 13 |
| Multiplayer Room | 2 | 3 | 1 | 0 | 6 |
| Tournament | 2 | 3 | 1 | 0 | 6 |
| Church Group | 2 | 2 | 3 | 2 | 9 |
| Leaderboard | 2 | 2 | 1 | 0 | 5 |
| Share Card | 1 | 1 | 1 | 1 | 4 |
| Admin/Content/AI | 2 | 3 | 2 | 0 | 7 |
| Security | 3 | 3 | 1 | 1 | 8 |
| Notifications | 0 | 1 | 2 | 0 | 3 |
| Performance | 2 | 2 | 1 | 0 | 5 |
| WebSocket | 1 | 1 | 1 | 1 | 4 |
| **Total** | **38** | **33** | **22** | **7** | **100** |

---

## Thứ tự ưu tiên chạy test

### Phase 1 — Trước khi deploy v1.0
Tất cả test 🔴 P0 (38 test cases)

### Phase 2 — Staging
Tất cả P0 + P1 (71 test cases)

### Phase 3 — Full regression
Tất cả 100 test cases

### Regression tự động (CI/CD)
- Mỗi PR: Unit test + Integration test P0/P1
- Mỗi merge to main: Full test suite
- Nightly: Load test + E2E

---

*Tài liệu này cần được cập nhật khi có tính năng mới. Mỗi TC phải có ticket tương ứng trong issue tracker.*