# BibleQuiz — Spec Thiết Kế V2
> Phiên bản cải tiến tập trung vào user engagement, viral growth và game design thực tế.

---

## Mục lục
1. Tầm nhìn & đối tượng
2. Hệ thống Rank Tier
3. Game mechanics & điểm số
4. Chế độ chơi
5. Social & Viral loop
6. Nội dung & câu hỏi
7. Mô hình dữ liệu
8. API thiết kế
9. Realtime (WebSocket)
10. Kiến trúc & hạ tầng
11. Bảo mật & chống gian lận
12. Monetization
13. Kiểm thử
14. Roadmap thực tế
15. Scaffold thư mục

---

## 1. Tầm nhìn & đối tượng

### 1.1 Tầm nhìn
BibleQuiz là nền tảng học Kinh Thánh qua gamification — không phải chỉ là app quiz. Người dùng học Lời Chúa một cách tự nhiên thông qua cạnh tranh lành mạnh, cộng đồng, và phần thưởng có ý nghĩa tâm linh.

**Khác biệt cốt lõi so với app quiz thông thường:**
- Rank system lấy cảm hứng từ Kinh Thánh (không phải Diamond/Platinum chung chung)
- Church Group feature — nhà thờ, nhóm tế bào thi đua nhau
- Nội dung có chiều sâu: giải thích bối cảnh lịch sử, bản đồ địa lý, cross-reference

### 1.2 Đối tượng chính (Personas)
| Persona | Mô tả | Nhu cầu |
|---|---|---|
| **Tín hữu trẻ** | 18–35 tuổi, đi nhà thờ, dùng smartphone thành thạo | Học vui, chia sẻ kết quả, cạnh tranh với bạn bè |
| **Người học Kinh Thánh** | Mọi lứa tuổi, muốn hiểu sâu hơn | Giải thích chi tiết, lộ trình học có hệ thống |
| **Lãnh đạo nhóm / Mục sư** | Tổ chức hoạt động cho nhóm | Tạo quiz riêng, theo dõi tiến độ thành viên |
| **Khách** | Tò mò, chưa đăng ký | Chơi thử ngay, không cần tài khoản |

### 1.3 Vai trò & quyền
| Vai trò | Quyền |
|---|---|
| `guest` | Chơi nhanh (practice), xem leaderboard public |
| `user` | Tất cả chế độ, lưu lịch sử, tham gia group, gửi góp ý |
| `group_leader` | Tạo/quản lý Church Group, xem analytics nhóm |
| `content_mod` | Duyệt câu hỏi người dùng đề xuất |
| `admin` | CRUD toàn bộ, analytics, quản lý user, AI generator |

---

## 2. Hệ thống Rank Tier

### 2.1 Tier system

Rank dựa trên **tổng điểm tích lũy (all-time)**, không reset. Tên tier lấy cảm hứng từ Kinh Thánh:

| Tier | Tên | Điểm cần | Màu | Icon ý tưởng |
|---|---|---|---|---|
| 1 | **Tân Tín Hữu** | 0 – 999 | Xám | Hạt giống |
| 2 | **Người Tìm Kiếm** | 1,000 – 4,999 | Xanh lá | Cây non |
| 3 | **Môn Đồ** | 5,000 – 14,999 | Xanh dương | Cuộn sách |
| 4 | **Hiền Triết** | 15,000 – 39,999 | Tím | Đèn dầu |
| 5 | **Tiên Tri** | 40,000 – 99,999 | Vàng | Ngọn lửa |
| 6 | **Sứ Đồ** | 100,000+ | Đỏ san hô | Vương miện |

**Quy tắc:**
- Rank chỉ tăng, không giảm (all-time points)
- Khi đạt tier mới → thông báo in-app + push notification + badge
- Hiển thị progress bar "X / Y điểm đến [tier tiếp theo]"
- Profile hiển thị tier icon + tier name rõ ràng

### 2.2 Season system (Rank cạnh tranh)

Song song với all-time rank, có **Season** để cạnh tranh ngắn hạn:
- Mỗi season kéo dài **3 tháng** (4 seasons/năm, đặt tên theo sự kiện: Mùa Phục Sinh, Mùa Giáng Sinh...)
- Điểm season reset về 0 đầu mỗi mùa
- Tier season riêng biệt với tier all-time
- Kết thúc mùa: top 3 mỗi tier nhận badge độc quyền "Sứ Đồ Mùa 1 🏆"
- Season leaderboard chia theo tier → người mới vẫn có cơ hội top trong tier mình

### 2.3 Streak system

| Streak | Thưởng |
|---|---|
| 3 ngày | +10% điểm ngày thứ 3 |
| 7 ngày | Badge "Chuyên cần" + +15% điểm |
| 30 ngày | Badge "Trung tín" + avatar frame đặc biệt |
| 100 ngày | Badge "Kiên nhẫn như Gióp" + theme đặc biệt |

Streak reset nếu bỏ 1 ngày. Có "Streak Freeze" — 1 lần/tuần dùng để bảo vệ streak khi bận.

---

## 3. Game Mechanics & Điểm số

### 3.1 Hệ thống điểm (cải tiến)

**Điểm cơ bản theo độ khó:**
| Độ khó | Điểm nếu đúng |
|---|---|
| Easy | 8 điểm |
| Medium | 12 điểm |
| Hard | 18 điểm |

**Bonus tốc độ (phi tuyến, cảm giác thỏa mãn hơn):**
```
speedRatio = (timeLimitMs - elapsedMs) / timeLimitMs   // 0.0 → 1.0
speedBonus = floor(basePoints * 0.5 * speedRatio²)
```
Ví dụ: câu Medium 12 điểm, trả lời trong 20% thời gian → bonus = floor(12 * 0.5 * 0.8²) = floor(3.84) = 3 điểm.
Tổng tối đa: 12 + floor(6 * 1.0) = 18 điểm/câu medium.

**Multipliers:**
- Streak đúng liên tiếp trong 1 phiên: 5 câu đúng liên tiếp → x1.2; 10 câu → x1.5 (hiển thị "combo!")
- Daily bonus: câu đầu tiên mỗi ngày → x2

### 3.2 Hệ thống năng lượng (thay thế lives)

Thay "mất mạng khi sai" bằng hệ thống **Energy** nhẹ nhàng hơn:

- Mỗi ngày có **100 energy**
- Trả lời sai: -5 energy
- Trả lời đúng: không tốn energy
- Hết energy: vẫn chơi được nhưng điểm không vào Ranked leaderboard (chỉ practice)
- Energy tự phục hồi 20/giờ (full sau 5 giờ nếu hết hoàn toàn)
- Lý do: không tạo cảm giác "bị phạt" khi học, phù hợp với tinh thần của app

**Ghi chú về `UserDailyProgress`:**
```
livesRemaining     → energyRemaining (0–100)
questionsCounted   → giữ nguyên, cap 100 câu/ngày (tăng từ 50)
```
- Ghi chú implementation: Code sử dụng field name `livesRemaining` / `dailyLives` 
(từ spec v1). Semantic tương đương energyRemaining / dailyEnergy trong spec này. 
Xem DECISIONS.md ngày 2026-04-02.
### 3.3 Book Progression (Ranked Mode)

Giữ nguyên ý tưởng từ spec cũ, bổ sung:
- **Minimum pool size**: mỗi sách cần ít nhất **30 câu active** mới được activate trong ranked
- Nếu sách chưa đủ câu: bỏ qua sách đó, hiển thị badge "📖 Sách này đang được bổ sung nội dung"
- Admin dashboard hiển thị % coverage từng sách để ưu tiên nhập câu

---

## 4. Chế độ chơi

### 4.1 Practice Mode (Tự luyện)
- Không giới hạn, không ảnh hưởng leaderboard
- Chọn: sách / nhóm sách / toàn bộ / bộ tùy chọn
- Chọn: độ khó, số câu, bật/tắt giải thích
- Lưu lịch sử cá nhân để ôn lại
- **Retry mode**: chơi lại bộ câu sai của phiên vừa rồi (1 click)

### 4.2 Ranked Mode (Xếp hạng)
- Server chọn sách theo `currentBookIndex` — user không chọn được
- Cap: 100 câu/ngày, 100 energy/ngày
- Điểm vào leaderboard daily/weekly/season/all-time
- Hiển thị: sách đang chơi, energy còn lại, câu đã tính hôm nay (x/100)
- Post-cycle: sau Khải Huyền → tăng độ khó hard, random mọi sách

### 4.3 Daily Challenge
- **5 câu cố định mỗi ngày**, giống nhau cho tất cả user (cùng seed theo ngày)
- Không cần đăng nhập để chơi (guest được phép)
- Kết thúc: hiển thị "X/5 đúng — hôm nay bạn giỏi hơn Y% người chơi"
- Share card tự động tạo khi hoàn thành (xem mục 5.2)
- Nếu đã đăng nhập: điểm vào leaderboard "Daily Challenge"

### 4.4 Multiplayer Room
- Tạo phòng: mã 6 chữ số, share link
- 2–20 người/phòng
- Host cấu hình: số câu, thời gian/câu, sách, độ khó
- Realtime: câu hỏi đồng bộ, bảng điểm live
- Kết thúc: hiển thị top 3 + animation ăn mừng, share card

### 4.5 Tournament (1v1 bracket)
- Tạo tournament trong 1 room: 4/8/16/32 người
- Bracket elimination: thua → out
- Mỗi trận: 3 mạng/người, sai → mất 1 mạng, hết mạng → thua
- Tie-break: sudden death (1 câu đầu tiên trả lời đúng thắng)
- **Church Tournament**: group leader tổ chức tournament cho nhóm mình

### 4.6 Church Group Mode ⭐ (Tính năng mới, quan trọng)
Xem mục 5.3.

---

## 5. Social & Viral Loop

### 5.1 Friend System (v2.5 — Chưa implement)
> ⚠️ Feature này nằm trong roadmap v2.5. Chưa có trong codebase hiện tại.
> Khi implement, cần thêm: Friend entity, FriendRequest entity, FriendController, notification integration, friend leaderboard tab.

- Thêm bạn qua username hoặc link mời
- Feed "hoạt động bạn bè": "Nguyễn A vừa đạt tier Hiền Triết 🎉"
- Leaderboard "Bạn bè" — tab riêng bên cạnh leaderboard global
- Thách đấu 1v1: gửi lời thách đấu cho bạn bè (tạo private room tự động)

### 5.2 Share Card (Viral feature)

Sau mỗi phiên chơi / daily challenge / lên tier, tự động tạo **ảnh share** đẹp:

**Thiết kế share card:**
```
┌─────────────────────────────────┐
│  🕊️  BibleQuiz                  │
│                                 │
│  Daily Challenge — 25/03/2025   │
│                                 │
│     ★★★★★  5/5 câu đúng        │
│                                 │
│  🏆 Giỏi hơn 94% người chơi    │
│                                 │
│  [Sứ Đồ rank icon]  Nguyễn A   │
│  biblequiz.app/daily            │
└─────────────────────────────────┘
```

**API tạo share card:**
- `GET /share/session/{sessionId}` → PNG (server-side render bằng Puppeteer/Canvas)
- `GET /share/tier-up/{tierId}` → PNG khi lên tier
- Card có watermark link app → viral growth tự nhiên
- Tối ưu cho Facebook, Zalo, Instagram story (3 kích thước)

### 5.3 Church Group ⭐

**Đây là differentiator lớn nhất của BibleQuiz.**

Nhà thờ, nhóm tế bào, lớp Kinh Thánh có thể tạo group riêng:

**Tạo group:**
- Group leader tạo group, đặt tên, upload ảnh
- Mã tham gia 6 ký tự hoặc QR code
- Tối đa 200 thành viên/group

**Tính năng group:**
- Leaderboard riêng của group (weekly / all-time)
- Group admin xem analytics: ai đang học, tiến độ từng thành viên
- Group announcement: leader gửi thông báo cho thành viên
- Group quiz: leader tạo bộ câu riêng cho nhóm (dựa trên bài học gần đây)
- Group tournament: leader tổ chức giải đấu nội bộ
- Group streak: "Nhóm chúng ta đang có streak 14 ngày liên tiếp! 🔥"

**Data model:**
```
Group(id, name, avatarUrl, code, createdBy, description, isPublic, maxMembers, createdAt)
GroupMember(id, groupId, userId, role[leader/mod/member], joinedAt)
GroupAnnouncement(id, groupId, authorId, content, createdAt)
GroupQuizSet(id, groupId, name, questionIds[], createdBy, createdAt)
```

**Use case thực tế:**
- Mục sư dùng sau buổi giảng: "Nhóm ơi, quiz về bài học Chúa Nhật hôm nay!"
- Lớp Kinh Thánh thiếu nhi: leader theo dõi ai học bài
- Nhóm thanh niên: thi đua weekly leaderboard

### 5.4 Push Notification
- Nhắc daily challenge (giờ người dùng hay chơi nhất, học từ behavior)
- "Bạn của bạn vừa vượt qua điểm số của bạn! 😤"
- "Streak của bạn sắp gãy — còn 2 giờ để giữ streak!"
- "Nhóm [Group name] vừa mời bạn tham gia tournament"
- Weekly summary: "Tuần này bạn trả lời đúng 87 câu 📖"

---

## 6. Nội dung & Câu hỏi

### 6.1 Loại câu hỏi
| Type | Mô tả | Ví dụ |
|---|---|---|
| `multiple_choice_single` | 4 lựa chọn, 1 đúng | Câu MCQ thông thường |
| `multiple_choice_multi` | 4–6 lựa chọn, ≥2 đúng | "Chọn tất cả các sứ đồ..." |
| `true_false` | Đúng / Sai | "Môi-se viết 5 sách đầu Kinh Thánh" |
| `fill_in_blank` | Điền từ còn thiếu | "Ban đầu ___ dựng nên trời đất" |
| `ordering` | Sắp xếp đúng thứ tự | Sắp xếp sự kiện theo trình tự |
| `matching` | Ghép cặp | Ghép nhân vật với sự kiện |

`ordering` và `matching` là 2 loại mới — tăng độ phong phú, đặc biệt phù hợp với lịch sử Kinh Thánh.

### 6.2 Metadata câu hỏi
```typescript
type Question = {
  id: string                  // UUID v7
  book: string                // "Genesis", "Matthew"...
  chapter: number
  verseStart?: number
  verseEnd?: number
  difficulty: 'easy' | 'medium' | 'hard'
  type: QuestionType
  language: string            // "vi", "en"
  content: string
  options?: string[]
  correctAnswer: number | number[] | boolean | string | string[]
  explanation: string         // bắt buộc, không được để trống
  contextNote?: string        // bối cảnh lịch sử/địa lý ngắn gọn
  tags: string[]
  source: string              // "Kinh Thánh Việt Ngữ 2011"
  scriptureVersion: string    // "VIE2011", "NIV", "ESV"
  isActive: boolean
  qualityScore?: number       // 0-100, tổng hợp từ user feedback
  timesAnswered: number
  timesCorrect: number
  createdBy: string           // userId hoặc "ai-generated"
  reviewedBy?: string         // admin reviewer
  version: number
  createdAt: Date
  updatedAt: Date
}
```

### 6.3 Giải thích đáp án (Explanation quality)

Mỗi câu hỏi **bắt buộc** phải có explanation chất lượng cao:
- Trích dẫn đúng câu Kinh Thánh
- 1-2 câu bối cảnh ngắn (nếu cần)
- Không dài quá 150 từ
- AI generator phải tuân theo template này

### 6.4 AI Question Generator (Admin)

Dùng AWS Bedrock (Claude hoặc Titan):

**Quy trình:**
1. Admin chọn: sách, chương, đoạn (từ-đến), loại câu, độ khó, số lượng, ngôn ngữ
2. System tạo prompt có cấu trúc + safety grounding (bắt buộc trích dẫn đúng)
3. AI sinh ra draft JSON
4. Validator kiểm tra: format, độ dài, correctAnswer hợp lệ, explanation có trích dẫn
5. Admin review: approve / edit / reject từng draft
6. Approved → vào Question table với `createdBy='ai-generated'`, `reviewedBy=adminId`

**Kiểm soát chi phí:**
- Quota: 200 câu/ngày/admin
- Batch tối đa: 20 câu/lần gọi
- Log chi phí USD mỗi job
- Alert khi vượt $10/ngày

### 6.5 Minimum pool size
Ranked mode chỉ activate sách khi:
- ≥ 30 câu active ở difficulty easy
- ≥ 20 câu active ở difficulty medium  
- ≥ 10 câu active ở difficulty hard

Admin dashboard hiển thị coverage map từng sách.

---

## 7. Mô hình dữ liệu

### 7.1 Users & Auth
```sql
User(id UUID, name, email, avatarUrl, username UNIQUE, 
     provider, role, totalPoints, currentTierId, currentStreak,
     longestStreak, lastPlayedAt, timezone, language, createdAt)

AuthIdentity(id, userId, provider, providerUserId, createdAt)

UserDailyProgress(id, userId, date UNIQUE per userId,
                  energyRemaining DEFAULT 100,
                  questionsCounted DEFAULT 0, -- cap 100
                  pointsCounted DEFAULT 0,
                  currentBook, currentBookIndex, isPostCycle,
                  currentDifficulty DEFAULT 'all',
                  lastUpdatedAt)
```

### 7.2 Tier & Season
```sql
Tier(id, name, minPoints, maxPoints, color, iconUrl, order)

Season(id, name, startAt, endAt, status[upcoming/active/ended])

SeasonParticipant(id, seasonId, userId, points, tierId, rank, updatedAt)
-- unique(seasonId, userId)

UserBadge(id, userId, badgeType, badgeName, iconUrl, earnedAt, metadata JSON)
-- badge types: tier_up, season_top3, streak_7, streak_30, streak_100, 
--              daily_perfect, tournament_winner, group_champion...
```

### 7.3 Questions & Content
```sql
Question(id, book, chapter, verseStart, verseEnd, difficulty, type,
         language, scriptureVersion, content, options JSON, correctAnswer JSON,
         explanation, contextNote, tags JSON, source,
         isActive, qualityScore, timesAnswered, timesCorrect,
         createdBy, reviewedBy, version, createdAt, updatedAt)

QuestionLocale(id, questionId, language, content, options JSON, explanation,
               contextNote, version)

QuestionSet(id, name, description, filtersJSON, ownerId, 
            groupId NULL, visibility[public/private/group], createdAt)

Bookmark(id, userId, questionId, createdAt)
-- unique(userId, questionId)

UserQuestionFeedback(id, userId, questionId, rating[1-5], note, createdAt)
```

### 7.4 Sessions & Answers
```sql
QuizSession(id, mode[practice/ranked/daily/room/tournament], 
            ownerId, configJSON, status, score,
            questionsTotal, questionsCorrect, createdAt, endedAt)

QuizSessionQuestion(id, sessionId, questionId, order, timeLimitSec)

Answer(id, sessionId, questionId, userId, answer JSON, isCorrect,
       elapsedMs, scoreDelta, createdAt)
-- unique(sessionId, questionId, userId)

RankedSession(id, userId, sessionId, date, questionsCounted, pointsCounted)
```

### 7.5 Rooms & Multiplayer
```sql
Room(id, code UNIQUE, hostUserId, status[lobby/in_progress/ended],
     configJSON, createdAt, startedAt, endedAt)

RoomMember(id, roomId, userId, joinedAt, leftAt, score, rank)
-- unique(roomId, userId)
```

### 7.6 Tournament
```sql
Tournament(id, roomId, groupId NULL, name, status, configJSON,
           createdAt, startedAt, endedAt)

TournamentParticipant(id, tournamentId, userId, seed, eliminatedAt, finalRank)
-- unique(tournamentId, userId)

Match(id, tournamentId, round, indexInRound, status, bestOf,
      createdAt, startedAt, endedAt)

MatchParticipant(id, matchId, userId, livesRemaining DEFAULT 3, score, isWinner)
-- unique(matchId, userId)

MatchQuestion(id, matchId, questionId, order, timeLimitSec)

MatchAnswer(id, matchId, questionId, userId, answer JSON,
            isCorrect, elapsedMs, createdAt)
-- unique(matchId, questionId, userId)
```

### 7.7 Groups (Church Group)
```sql
Group(id, name, avatarUrl, code UNIQUE, description,
      createdBy, isPublic DEFAULT false, maxMembers DEFAULT 200,
      memberCount, weeklyPoints, createdAt)

GroupMember(id, groupId, userId, role[leader/mod/member], joinedAt)
-- unique(groupId, userId)

GroupAnnouncement(id, groupId, authorId, content, createdAt)

GroupQuizSet(id, groupId, name, questionIds JSON, createdBy, createdAt)
```

### 7.8 Leaderboard
```sql
LeaderboardEntry(id, scope[global/group/daily_challenge], 
                 period[daily/weekly/season/all_time],
                 periodKey, -- "2025-03-25" or "2025-W12" or "season-1"
                 userId, groupId NULL, score, rank,
                 periodStart, periodEnd, updatedAt)
-- index(scope, period, periodKey)
-- unique(scope, period, periodKey, userId)
```

### 7.9 Admin & AI
```sql
ImportBatch(id, createdBy, format, status, statsJSON, createdAt)

AuditLog(id, actorUserId, action, entity, entityId, metaJSON, createdAt)

AIGenerationJob(id, createdBy, provider, modelId, status, prompt,
                scriptureRefJSON, optionsJSON, costUSD, createdAt, completedAt)

AIGeneratedQuestionDraft(id, jobId, draftJSON, validationStatus,
                         validationErrorsJSON, approvedBy, approvedAt)

Feedback(id, userId, type[report/question/general/content_error],
         questionId NULL, content, status[open/in_review/resolved/dismissed],
         createdAt, handledBy NULL)

ShareCard(id, userId, type[session/tier_up/daily], refId, imageUrl,
          views DEFAULT 0, createdAt)
```

---

## 8. API Thiết kế

### 8.1 Chuẩn HTTP
- Base URL: `https://api.biblequiz.app/v1`
- Auth header: `Authorization: Bearer <accessToken>`
- Access token TTL: 15 phút; Refresh token: 30 ngày (rotate)
- Lỗi chuẩn: `{ code, message, requestId, details? }`
- Pagination: cursor-based `{ data[], nextCursor, hasMore }`

### 8.2 Auth
```
POST /auth/oauth/start     { provider }       → { redirectUrl }
POST /auth/oauth/callback  { provider, code, codeVerifier } → { accessToken, refreshToken, user }
POST /auth/login           { email, password } → tokens
POST /auth/refresh         { refreshToken }    → tokens
POST /auth/logout                              → 204
```

### 8.3 User & Profile
```
GET    /me                    → profile + stats + tierProgress
PATCH  /me                    → { name?, username?, avatarUrl?, timezone?, language? }
GET    /me/badges             → list badges
GET    /me/history            query: limit, cursor
GET    /me/history/{id}       → session detail + answers
GET    /me/bookmarks          query: limit, cursor
POST   /me/bookmarks          { questionId }
DELETE /me/bookmarks/{questionId}
GET    /me/ranked-status      → { energyRemaining, questionsCounted, pointsToday,
                                  currentBook, currentBookIndex, isPostCycle,
                                  currentDifficulty, resetAt, streakDays }
GET    /me/friends            → list friends
POST   /me/friends/add        { username }
DELETE /me/friends/{userId}
```

### 8.4 Questions
```
GET  /books                  → list books + chapter counts + pool coverage
GET  /questions              query: book, chapter, difficulty, type, tags, q, limit, cursor, language
GET  /questions/{id}         → detail (explanation nếu ?reveal=true hoặc session đã trả lời)
POST /questions/{id}/feedback { rating, note }

-- Admin
POST   /admin/questions
PUT    /admin/questions/{id}
DELETE /admin/questions/{id}
POST   /admin/import         multipart: file + { format, dryRun }
GET    /admin/import/{id}
GET    /admin/coverage       → pool size per book per difficulty
```

### 8.5 AI Generator (Admin)
```
POST   /admin/ai/generate    { scripture, prompt?, modelId?, count?, difficulty?, language?, type? }
                             → { jobId }
GET    /admin/ai/jobs/{id}   → { status, drafts[], costUSD }
POST   /admin/ai/drafts/{id}/approve → { questionId }
PUT    /admin/ai/drafts/{id}
DELETE /admin/ai/drafts/{id}
```

### 8.6 Sessions (Quiz)
```
POST /sessions               { mode, ranked?, config } → { session, questions[], rankedStatus? }
POST /sessions/{id}/answer   { questionId, answer, clientElapsedMs }
                             → { isCorrect, correctAnswer, explanation?, scoreDelta,
                                 energyRemaining, questionsCounted, comboCount,
                                 newBadge? }
GET  /sessions/{id}          → status + score + progress
GET  /sessions/{id}/review   → answers + explanations

-- Retry
POST /sessions/{id}/retry    → { newSessionId }
POST /sessions/practice/retry-last → { newSessionId }
```

### 8.7 Daily Challenge
```
GET  /daily-challenge        → { date, questions[], alreadyCompleted, globalStats }
POST /daily-challenge/start  → { sessionId }
-- Dùng POST /sessions/{id}/answer để trả lời
GET  /daily-challenge/result → { score, rank, betterThanPercent, shareCardUrl }
```

### 8.8 Share Cards
```
GET /share/session/{sessionId}  → PNG image (server-rendered)
GET /share/tier-up/{tierId}     → PNG image
GET /share/daily/{date}         → PNG image
POST /share/{id}/view           → 204 (track view count)
```

### 8.9 Rooms
```
POST /rooms               { timePerQuestionSec, maxPlayers, filters, visibility }
GET  /rooms/{id}
POST /rooms/{id}/join
POST /rooms/{id}/start    (host)
POST /rooms/{id}/kick     { userId }  (host)
GET  /rooms/{id}/leaderboard
```

### 8.10 Tournaments
```
POST /tournaments              { roomId?, groupId?, name, maxPlayers, config }
GET  /tournaments/{id}
POST /tournaments/{id}/join
POST /tournaments/{id}/start   (host/leader)
GET  /tournaments/{id}/bracket
GET  /tournaments/{id}/matches/{matchId}
POST /tournaments/{id}/matches/{matchId}/forfeit
```

### 8.11 Groups (Church Group)
```
POST   /groups                  { name, description, isPublic, maxMembers }
GET    /groups/{id}
PATCH  /groups/{id}             (leader)
DELETE /groups/{id}             (leader)
GET    /groups/{id}/members
POST   /groups/join             { code }
DELETE /groups/{id}/leave
DELETE /groups/{id}/members/{userId}  (leader)
POST   /groups/{id}/announcements     { content }
GET    /groups/{id}/announcements
GET    /groups/{id}/leaderboard       query: period
GET    /groups/{id}/analytics         (leader) → member activity, top players
POST   /groups/{id}/quiz-sets         { name, questionIds[] }
GET    /groups/{id}/quiz-sets
```

### 8.12 Leaderboard
```
GET /leaderboard/global      query: period[daily/weekly/season/all_time], tierId?, limit, cursor
GET /leaderboard/friends     query: period
GET /leaderboard/daily-challenge query: date
GET /leaderboard/around-me   query: period → 5 người trên, bạn, 5 người dưới
```

### 8.13 Notifications
```
GET    /notifications         query: unread?, limit, cursor
PATCH  /notifications/read-all
PATCH  /notifications/{id}/read
POST   /notifications/push-token   { token, platform }
DELETE /notifications/push-token/{token}
```

### 8.14 Feedback
```
POST /feedback                { type, questionId?, content }
GET  /admin/feedback          query: type, status, limit, cursor
PATCH /admin/feedback/{id}    { status, note? }
```

---

## 9. Realtime (WebSocket)

### 9.1 Kết nối
```
wss://api.biblequiz.app/ws
Headers: Authorization: Bearer <accessToken>
```

### 9.2 Room channel: `/room/{roomId}`
```
Client → Server:
  join:   { roomId }
  ready:  {}
  answer: { questionId, answer, clientElapsedMs }
  leave:  {}

Server → Client:
  state:        { status, players[], currentQuestion?, remainingMs }
  question:     { id, content, options, timeLimitSec, order, totalQuestions }
  answer_result:{ userId, isCorrect, scoreDelta, currentScore }
  scoreboard:   { rankings[{ userId, name, avatar, score, rank }] }
  player_joined:{ userId, name, avatar }
  player_left:  { userId }
  ended:        { finalRankings, shareCardUrl }
  error:        { code, message }
```

### 9.3 Tournament channel: `/tournament/{tournamentId}`
```
Client → Server:
  tournament_join:   { tournamentId }
  tournament_ready:  {}
  match_answer:      { matchId, questionId, answer, clientElapsedMs }
  forfeit:           { matchId }

Server → Client:
  tournament_state:  { status, participants[], bracket? }
  match_start:       { matchId, round, p1, p2, timePerQuestionSec }
  match_question:    { matchId, id, content, options, timeLimitSec, order }
  match_update:      { matchId, p1Lives, p2Lives, lastAnswer }
  match_end:         { matchId, winnerUserId, reason, shareCardUrl? }
  bracket_update:    { round, matches[] }
  tournament_end:    { winnerId, finalBracket, shareCardUrl }
```

### 9.4 Reliability
- Reconnect tự động: exponential backoff (1s, 2s, 4s, tối đa 30s)
- Resume state: khi reconnect gửi `{ lastEventId }` để server replay missed events
- Redis Pub/Sub cho fan-out multi-instance
- Heartbeat: ping/pong mỗi 30s

---

## 10. Kiến trúc & Hạ tầng

### 10.1 Stack
| Layer | Tech |
|---|---|
| Frontend | React (Vite) + React Router + Zustand + TanStack Query |
| Backend | Spring Boot 3.3 (Java 17) + Spring Security + Spring Data JPA |
| Database | MySQL (AWS RDS) + Flyway migrations |
| Cache | Redis (AWS ElastiCache) — session, leaderboard ZSET, room state |
| Realtime | Spring WebSocket (STOMP) + Redis Pub/Sub |
| Queue | AWS SQS — import jobs, AI generation, analytics events |
| File | AWS S3 — imports, share card images, avatars |
| AI | AWS Bedrock (Claude) — question generation |
| Share card | Puppeteer (headless) hoặc Canvas API — render PNG |
| Push notif | Firebase FCM (web + mobile) |
| CDN | CloudFront (frontend + assets) |
| Infra | ECS Fargate + ALB + RDS + ElastiCache |
| CI/CD | GitHub Actions → ECR → ECS |
| Observability | CloudWatch + X-Ray + OpenTelemetry |

### 10.2 Module hoá
```
api/src/main/java/com/biblequiz/
├── auth/         OAuth2, JWT, refresh token
├── user/         profile, tier, streak, badge
├── quiz/         question, session, answer, scoring
├── ranked/       daily progress, energy, book pointer
├── daily/        daily challenge logic
├── room/         multiplayer room state machine
├── tournament/   bracket, match, lives
├── group/        church group, leaderboard, announcement
├── leaderboard/  aggregation, Redis ZSET
├── share/        card generation (Puppeteer/Canvas)
├── content/      import/export, AI draft management
├── notification/ FCM, in-app notification
├── analytics/    event tracking, admin dashboard
└── admin/        CRUD, AI generator, feedback handling
```

### 10.3 State machines
**Room:** `lobby → in_progress → ended`
Events: `host_start`, `question_timeout`, `all_answered`, `host_end`

**Tournament:** `lobby → seeding → in_progress → completed`
**Match:** `pending → in_progress → ended`
**Session:** `active → completed | abandoned`

### 10.4 Caching strategy
- Leaderboard: Redis ZSET, update real-time, recompute batch mỗi 5 phút
- Room state: Redis Hash, TTL 2 giờ sau khi ended
- Question pool per book/difficulty: Redis Set, invalidate khi admin thêm/sửa câu
- Daily challenge: cache 24h theo date key
- Share card image: S3 + CloudFront, generate 1 lần rồi cache

---

## 11. Bảo mật & Chống gian lận

### 11.1 Auth & transport
- OAuth2 PKCE cho web/mobile
- JWT: access 15 phút, refresh 30 ngày (rotate on use)
- HTTPS only, HSTS
- CORS: whitelist domain frontend
- Secrets: AWS Secrets Manager, rotate định kỳ

### 11.2 Chống gian lận quiz
- Tính điểm hoàn toàn server-side
- Client chỉ gửi `answer` + `clientElapsedMs`; server tự tính `scoreDelta`
- Server đo timestamp nhận request (`serverElapsedMs`) — dùng min(client, server+buffer) để tránh manipulate
- Idempotency: `Answer` unique `(sessionId, questionId, userId)` — submit 2 lần không cộng điểm 2 lần
- Energy update + answer scoring trong 1 transaction
- Rate limit: `/sessions/{id}/answer` → 1 req/câu/2s per user
- Debounce nộp đáp án: ignore request thứ 2 trong cùng câu cùng session

### 11.3 Rate limiting
| Endpoint group | Limit |
|---|---|
| `/auth/*` | 10 req/phút/IP |
| `/sessions/*/answer` | 30 req/phút/user |
| `/admin/ai/generate` | 20 req/giờ/admin |
| `/share/*` (GET image) | 100 req/phút/IP |
| Tất cả còn lại | 300 req/phút/user |

### 11.4 Anti-abuse
- reCAPTCHA v3 cho đăng ký email, form feedback
- Velocity rules: cùng IP tạo >5 account/giờ → block tạm thời
- Leaderboard anomaly detection: tăng điểm >500 điểm/phút → flag review
- Spam sharing: >20 share card request/giờ → throttle

---

## 12. Monetization

> Spec hiện tại chưa có monetization — bổ sung định hướng để tránh design debt sau này.

### 12.1 Freemium model (đề xuất)

**Free tier:**
- Tất cả tính năng cơ bản
- Practice + Ranked + Daily Challenge
- Tham gia Room/Tournament
- Tham gia 1 Group

**Premium (BibleQuiz Pro):**
- Tham gia nhiều Group (tối đa 10)
- Streak Freeze không giới hạn (Free: 1/tuần)
- Analytics cá nhân chi tiết (weakness by book/chapter)
- Export lịch sử ra PDF
- Offline mode (pre-cache câu hỏi)
- Badge và avatar frame độc quyền
- Không quảng cáo (nếu sau này có)

**Group Premium:**
- Group size >200 thành viên
- Advanced analytics cho group leader
- Custom quiz set không giới hạn
- Priority support

### 12.2 Thiết kế để sẵn sàng
- Thêm `User.isPremium`, `User.premiumUntil` vào schema ngay từ đầu
- Feature flag cho tính năng premium
- Không lock core experience sau paywall

---

## 13. Kiểm thử

### 13.1 Unit test
- Scoring engine: base + bonus + multiplier
- Energy deduction + idempotency
- Book pointer progression + post-cycle logic
- Streak calculation + freeze logic
- Share card metadata generation
- Tier upgrade detection

### 13.2 Integration test
- OAuth callback flow (Google, Facebook)
- Full ranked session: start → answer (đúng/sai) → verify energy/score/leaderboard
- Daily challenge: same 5 câu cho 2 user khác nhau cùng ngày
- Group: join → leaderboard update
- Tournament: bracket tạo đúng với 4/7/8 người (edge case số lẻ → bye)
- Share card: POST session → GET PNG trả về đúng content-type

### 13.3 WebSocket test
- Room: 5 client join, host start, câu đồng bộ đúng, timeout → next question
- Tournament: 2 client in match, sai → lives giảm, 0 lives → match_end
- Reconnect: drop connection mid-game, rejoin, nhận lại state đúng

### 13.4 Load test
- 100 user đồng thời trong 1 room, 10 room song song
- Leaderboard read: 1000 req/s
- WebSocket: 500 concurrent connections

### 13.5 E2E (Playwright)
- Luồng đăng ký → ranked → lên tier → share card
- Daily challenge → hoàn thành → kết quả hiển thị đúng
- Tạo group → mời người → leaderboard group hiển thị

---

## 14. Roadmap thực tế

### v1.0 — Core loop (8-10 tuần)
**Mục tiêu:** App có thể dùng được, có retention cơ bản.
- Auth (Google OAuth) + Profile
- Practice Mode
- Ranked Mode (energy, book progression, leaderboard)
- Daily Challenge + Share card cơ bản
- Tier system (all-time rank)
- Leaderboard global (daily/weekly/all-time)
- Admin: CRUD câu hỏi + import CSV
- Push notification (daily reminder, streak warning)

### v1.5 — Social (4-6 tuần)
**Mục tiêu:** Viral growth, retention tăng.
- Church Group (tạo group, join, leaderboard group)
- Friend system + friend leaderboard
- Share card đẹp (server-rendered PNG)
- Streak system đầy đủ + badges
- Season system (lần đầu)
- Multiplayer Room cơ bản

### v2.0 — Competition (6-8 tuần)
**Mục tiêu:** Engagement sâu hơn, tournament.
- Tournament 1v1 bracket
- Group tournament
- Season finale + special badges
- Leaderboard around-me
- Notification thông minh hơn (ML-based timing)

### v2.5 — Learning depth (4-6 tuần)
**Mục tiêu:** Giữ user lâu dài qua học tập thực sự.
- Spaced Repetition System (SRS) — ôn câu sai sau 1/3/7 ngày
- Lộ trình học theo chủ đề
- Context note: bản đồ địa lý, bối cảnh lịch sử
- Câu hỏi loại ordering + matching

### v3.0 — Scale & Premium (on-going)
- AI Question Generator (admin)
- Monetization (Premium)
- Mobile app (React Native)
- Đa ngôn ngữ câu hỏi (EN, KR, ZH)

---

## 15. Scaffold thư mục

```
apps/
  web/
    src/
      app/
        (marketing)/       # Landing page, about
        (auth)/            # Login, register
        admin/
          questions/       # CRUD
          ai-generator/    # AI draft review
          groups/          # Group management
          analytics/       # Dashboard
        player/
          ranked/          # Ranked mode UI
          practice/        # Practice mode UI
          daily/           # Daily challenge UI
          room/            # Multiplayer room
          tournament/      # Tournament bracket UI
          profile/         # Profile, badges, tier
          groups/          # Church group UI
          leaderboard/     # All leaderboard views
      components/
        quiz/              # Question card, timer, answer
        leaderboard/       # Leaderboard table, tier badge
        group/             # Group card, announcement
        share/             # Share card preview
        ui/                # Base UI components
      hooks/
      store/               # Zustand stores
      services/            # API fetchers
      ws/                  # WebSocket client
      styles/
    package.json
    vite.config.ts

  api/
    src/main/java/com/biblequiz/
      config/
      auth/
      user/
      quiz/
      ranked/
      daily/
      room/
      tournament/
      group/
      leaderboard/
      share/
      content/
      notification/
      analytics/
      admin/
      common/              # exceptions, DTOs, utils
    src/main/resources/
      application.yml
      db/migration/        # Flyway scripts
    pom.xml

infra/
  terraform/               # RDS, ElastiCache, S3, ECS, ALB
  docker/
    api.Dockerfile
    web.Dockerfile
    share-renderer.Dockerfile   # Puppeteer container
  compose.yml              # local: mysql, redis, api, web

.github/workflows/
  ci.yml
  cd.yml
```

---

## 16. Biến môi trường

```env
# App
SPRING_PROFILES_ACTIVE=dev
APP_BASE_URL=https://biblequiz.app
API_BASE_URL=https://api.biblequiz.app

# Database
DB_URL=jdbc:mysql://localhost:3306/biblequiz?useSSL=false
DB_USER=root
DB_PASS=changeme

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth
JWT_SECRET=change_me_in_prod
JWT_ACCESS_TTL_MINUTES=15
JWT_REFRESH_TTL_DAYS=30
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...

# AWS
AWS_REGION=ap-southeast-1
S3_BUCKET=biblequiz-dev
SQS_QUEUE_URL=...
CLOUDFRONT_URL=https://cdn.biblequiz.app

# AI
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
AI_MAX_GENERATE_COUNT=200
AI_DAILY_COST_ALERT_USD=10

# Push notification
FCM_SERVER_KEY=...

# Share card renderer
SHARE_RENDERER_URL=http://localhost:3001

# Game config
DAILY_QUESTION_CAP=100
DAILY_ENERGY=100
ENERGY_REGEN_PER_HOUR=20
RANKED_RESET_CRON=0 0 0 * * *
STREAK_FREEZE_PER_WEEK=1
SEASON_DURATION_MONTHS=3
MIN_POOL_SIZE_EASY=30
MIN_POOL_SIZE_MEDIUM=20
MIN_POOL_SIZE_HARD=10
```

---

## 17. Definition of Done (DoD)

Một feature chỉ được coi là hoàn thành khi:
- [ ] Unit test coverage ≥ 80% cho logic nghiệp vụ
- [ ] Integration test pass
- [ ] API response time P95 < 200ms (đọc), < 500ms (ghi)
- [ ] Không có TypeScript/Java compile error
- [ ] Flyway migration chạy clean trên DB trống
- [ ] Feature flag tắt được nếu cần rollback
- [ ] Admin có thể monitor qua CloudWatch dashboard
- [ ] Code review approved bởi ít nhất 1 người

---

*Tài liệu này là living spec — cập nhật theo từng milestone. Ưu tiên build v1.0 trước, mọi thứ khác là backlog.*