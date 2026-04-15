# BibleQuiz — SPEC USER (v3)
> Spec cho phần user-facing (player, group leader, guest).
> Phần admin xem SPEC_ADMIN.md.
> Last updated: 2026-04-07
> Replaces: SPEC-v2.md (USER sections) + SPEC_ROOM_MODES.md + applicable ERRATA fixes

---

## Mục lục

1. Tầm nhìn & đối tượng
2. Onboarding & First Experience
3. Hệ thống Tier Progression
4. Game Mechanics & Scoring
5. Chế độ chơi
6. Bible Journey Map
7. Smart Question Selection
8. Sound, Haptics & Feel
9. Social Features
10. Multi-language (i18n)
11. Mobile App
12. Notifications
13. User Profile & Settings
14. Privacy, Terms & Account Deletion
15. Error Handling & Offline
16. WebSocket Events
17. API Endpoints

---

## 1. Tầm nhìn & đối tượng

### 1.1 Tầm nhìn
BibleQuiz là nền tảng học Kinh Thánh qua gamification. Người dùng học Lời Chúa tự nhiên thông qua cạnh tranh lành mạnh, cộng đồng hội thánh, và phần thưởng có ý nghĩa tâm linh.

**Differentiator chính:**
- Tier system Bible-themed (không Diamond/Platinum chung chung)
- Church Group — nhà thờ, nhóm tế bào thi đua nhau
- Bible Journey Map — chinh phục 66 sách
- AI question generation chính xác từ Kinh Thánh
- Realtime multiplayer 4 game modes

### 1.2 Personas

| Persona | Mô tả | Nhu cầu |
|---|---|---|
| **Tín hữu trẻ** | 18–35, dùng smartphone | Học vui, share kết quả, cạnh tranh |
| **Người học Kinh Thánh** | Mọi lứa tuổi | Hiểu sâu, lộ trình có hệ thống |
| **Mục sư / Group Leader** | Lãnh đạo nhóm hội thánh | Tạo quiz, theo dõi tiến độ thành viên |
| **Khách (guest)** | Tò mò, chưa đăng ký | Chơi thử ngay không cần account |

### 1.3 User roles

| Vai trò | Quyền |
|---|---|
| `guest` | Onboarding try-quiz (3 câu), Daily Challenge xem-only |
| `user` | Tất cả game modes, lưu lịch sử, tham gia 1 group, gửi feedback |
| `group_leader` | Tạo/quản lý 1+ Church Group, xem analytics nhóm, tạo quiz set, tổ chức tournament |
| Premium (v3.0) | Tham gia nhiều groups, freeze unlimited, analytics chi tiết |

---

## 2. Onboarding & First Experience

> Bắt buộc trước khi launch — 70% users bỏ app trong 3 phút đầu nếu không biết làm gì.

### 2.1 Flow lần đầu mở app

```
Lần 1:
  Language Selection (VN/EN) 
    ↓
  Welcome Slides (3 screens, swipe)
    ↓
  Try Quiz (3 câu KHÔNG cần login)
    ↓
  "Bạn đúng X/3! Đăng ký để tiếp tục" 
    ↓
  Login (Google OAuth)
    ↓
  Home + Tutorial Tooltips (3 tooltips)
    ↓
  Bình thường

Lần sau:
  Đã login? → Home
  Chưa login? → Login screen (không lặp lại onboarding)
```

### 2.2 Welcome Slides (3 screens)

| Slide | Icon | Title | Description |
|-------|------|-------|-------------|
| 1 | ✝ | Chào mừng đến BibleQuiz | Học Kinh Thánh qua quiz tương tác mỗi ngày |
| 2 | ⚔️ | Thi đấu cùng nhau | 4 chế độ chơi nhóm. Thách đấu anh chị em |
| 3 | 🗺️ | Hành trình 66 sách | Chinh phục từng sách. Theo dõi tiến trình |

UI: full screen, swipe between, dots indicator, "Bỏ qua" góc phải, "Bắt đầu" ở slide cuối.

### 2.3 Try Quiz (3 câu, không login)

- Lấy 3 câu DỄ random từ public endpoint `GET /api/public/sample-questions`
- Backend: SecurityConfig permit `/api/public/**`
- Sau câu cuối → "Bạn đúng X/3! Đăng ký để tiếp tục hành trình"
- 2 buttons: [Đăng ký miễn phí] [Để sau]
- Mục đích: user trải nghiệm trước → conversion rate cao hơn

### 2.4 Tutorial Tooltips (sau login lần đầu)

3 tooltips trên Home page:
1. Daily Challenge card → "Thử thách hàng ngày — 5 phút mỗi ngày!"
2. Streak counter → "Chơi mỗi ngày để giữ chuỗi liên tục!"
3. Game modes → "Nhiều chế độ chơi — khám phá ngay!"

User tap anywhere → next tooltip → done. Lưu flag `tutorialCompleted=true`.

### 2.5 Onboarding flags (storage)

```typescript
// AsyncStorage (mobile) / localStorage (web)
hasSeenOnboarding: boolean
hasDoneTutorial: boolean
preferredLanguage: 'vi' | 'en'
quizLanguage: 'vi' | 'en'
```

---

## 3. Hệ thống Tier Progression

### 3.1 Tier names (Light-based)

| Tier | Tên VN | Tên EN | Điểm cần | Màu | Icon |
|---|---|---|---|---|---|
| 1 | **Tia Sáng** | Spark | 0–999 | Xám | ✨ |
| 2 | **Ánh Bình Minh** | Dawn | 1,000–4,999 | Xanh nhạt | 🌅 |
| 3 | **Ngọn Đèn** | Lamp | 5,000–14,999 | Xanh dương | 🪔 |
| 4 | **Ngọn Lửa** | Flame | 15,000–39,999 | Tím | 🔥 |
| 5 | **Ngôi Sao** | Star | 40,000–99,999 | Vàng | ⭐ |
| 6 | **Vinh Quang** | Glory | 100,000+ | Đỏ san hô | 👑 |

**Quy tắc:**
- Tier chỉ tăng, không giảm (all-time points)
- Đạt tier mới → full screen celebration + badge + push notification
- Profile hiển thị tier icon + tier name
- Progress bar "X / Y điểm đến [tier tiếp theo]"

### 3.2 Tier benefits — Trải nghiệm khác biệt theo tier

> KHÔNG chỉ là badge khác nhau. Mỗi tier mở ra trải nghiệm thực sự khác.

#### 3.2.1 Difficulty distribution + Timer

| Tier | Easy% | Medium% | Hard% | Timer |
|------|-------|---------|-------|-------|
| 1 (Tia Sáng) | 70% | 25% | 5% | 30s |
| 2 (Bình Minh) | 55% | 35% | 10% | 28s |
| 3 (Ngọn Đèn) | 35% | 45% | 20% | 25s |
| 4 (Ngọn Lửa) | 20% | 50% | 30% | 23s |
| 5 (Ngôi Sao) | 10% | 40% | 50% | 20s |
| 6 (Vinh Quang) | 5% | 35% | 60% | 18s |

#### 3.2.2 Rewards multipliers

| Tier | XP × | Energy regen/giờ | Freeze/tuần |
|------|------|------------------|-------------|
| 1 | 1.0× | 20 | 1 |
| 2 | 1.1× | 22 | 1 |
| 3 | 1.2× | 25 | 2 |
| 4 | 1.3× | 28 | 2 |
| 5 | 1.5× | 30 | 3 |
| 6 | 2.0× | 35 | 3 |

#### 3.2.3 Game mode unlocks

| Mode | Unlock tier | Tier name |
|------|------------|-----------|
| Practice | 1 | Tia Sáng (mở sẵn) |
| Daily Challenge | 1 | Tia Sáng (mở sẵn) |
| Ranked | 2 | Ánh Bình Minh |
| Multiplayer Speed Race | 2 | Ánh Bình Minh |
| Battle Royale | 3 | Ngọn Đèn |
| Tournament | 4 | Ngọn Lửa |
| Team vs Team | 4 | Ngọn Lửa |
| Sudden Death | 5 | Ngôi Sao |

UI: Locked card hiện lock icon + "Đạt [tier name] để mở khóa" → motivation lên tier.

### 3.3 Season system

- Mỗi season **3 tháng** (4 seasons/năm, đặt tên theo sự kiện)
- Điểm season reset về 0 đầu mỗi mùa
- Tier season riêng biệt với tier all-time
- Top 3 mỗi tier nhận badge độc quyền "Vinh Quang Mùa 1 🏆"
- Season leaderboard chia theo tier → người mới vẫn có cơ hội top trong tier mình

### 3.4 Streak system

| Streak | Thưởng |
|---|---|
| 3 ngày | +10% điểm ngày thứ 3 |
| 7 ngày | Badge "Chuyên cần" + +15% điểm |
| 30 ngày | Badge "Trung tín" + avatar frame đặc biệt |
| 100 ngày | Badge "Kiên nhẫn như Gióp" + theme đặc biệt |

**Streak Freeze:** số lượng theo tier (xem 3.2.2). Dùng khi bận → bảo vệ streak 1 ngày. Lưu `User.freezeUsedThisWeek` reset Chủ Nhật.

---

## 4. Game Mechanics & Scoring

### 4.1 Điểm cơ bản

| Difficulty | Điểm/câu đúng |
|---|---|
| Easy | 8 |
| Medium | 12 |
| Hard | 18 |

### 4.2 Speed bonus

```
speedRatio = (timeLimitMs - elapsedMs) / timeLimitMs   // 0.0 → 1.0
speedBonus = floor(basePoints × 0.5 × speedRatio²)
```

Ví dụ: câu Medium 12 điểm, trả lời trong 20% thời gian → bonus = floor(12 × 0.5 × 0.8²) = 3 điểm. Tổng tối đa: 18 điểm/câu medium.

### 4.3 Multipliers

- **Streak combo (trong 1 phiên):** 5 đúng liên tiếp → ×1.2; 10 đúng → ×1.5
- **Daily bonus:** câu đầu tiên mỗi ngày → ×2
- **Tier multiplier:** xem mục 3.2.2 (×1.0 → ×2.0)
- **Mystery mode:** ×1.5
- **Speed round:** ×2.0

### 4.4 Energy system

- Mỗi user có **100 energy/ngày**
- Sai → -5 energy
- Đúng → 0 energy cost
- Hết energy: vẫn chơi được Practice/Daily, KHÔNG vào Ranked leaderboard
- Auto regen theo tier (xem 3.2.2)
- Refill mỗi 0:00 UTC

**Abandoned session rules (FIX-002):**
- Hết timer câu hỏi → server auto-submit "no_answer" → -5 energy
- User thoát giữa session → status `abandoned` sau 2 phút inactivity
- Abandoned: tất cả câu chưa trả lời → tính sai → trừ energy
- Practice mode: abandoned không ảnh hưởng (không có energy)

### 4.5 Wrong answer explanations

> Biến quiz từ "game" thành "learning tool".

Mỗi câu hỏi BẮT BUỘC có:
- `explanation`: 1-2 câu giải thích tại sao đáp án đúng (max 150 từ)
- `scriptureRef`: format "Sáng Thế Ký 1:1" hoặc "Genesis 1:1"

Khi user trả lời SAI:
- Slide-down panel hiện đáp án đúng
- 📖 Verse reference
- 💡 Explanation
- [🔖 Đánh dấu ôn lại] [Tiếp tục →]
- Auto dismiss sau 4s hoặc tap

Khi đúng → KHÔNG hiện explanation (giữ nhịp nhanh).

### 4.6 Weakness tracking

```
GET /api/me/weaknesses
→ {
    weakBooks: [{ book, accuracy }],   // 3 sách yếu nhất
    strongBooks: [{ book, accuracy }], // 3 sách mạnh nhất
    suggestedPractice: "Romans"         // Sách yếu nhất
  }
```

Hiện trên Home page: "📊 Bạn cần ôn: Rô-ma (40%) — [Ôn ngay →]"

---

## 5. Chế độ chơi

### 5.1 Practice Mode (Tự luyện)

- Không giới hạn, không ảnh hưởng leaderboard
- Chọn: sách / nhóm sách / toàn bộ / quiz set
- Chọn: difficulty, số câu, language, bật/tắt explanation
- Lưu lịch sử cá nhân
- **Retry mode:** chơi lại bộ câu sai của phiên vừa rồi (1 click)

### 5.2 Ranked Mode

- Server chọn câu theo Smart Question Selection (mục 7) + Tier difficulty (mục 3.2.1)
- Cap: 100 câu/ngày, 100 energy/ngày
- Điểm vào leaderboard daily/weekly/season/all-time
- Hiện: book đang chơi, energy còn lại, X/100 câu hôm nay
- Post-cycle: sau Khải Huyền → tăng độ khó hard, random mọi sách

### 5.3 Daily Challenge

- **5 câu cố định mỗi ngày**, giống nhau cho tất cả user (cùng seed theo UTC date)
- Guest được phép chơi (không cần login)
- Sau khi xong: "X/5 đúng — bạn giỏi hơn Y% người chơi"
- Share card auto generated
- Daily KHÔNG dùng Smart Selection (random cho công bằng)

**Timezone (FIX-010):** Daily seed theo **UTC date**. User UTC+7 → challenge mới lúc 7:00 sáng VN. Countdown hiển thị theo local time.

### 5.4 Multiplayer Room

> 4 chế độ chi tiết — đã merge từ SPEC_ROOM_MODES.md

#### 5.4.0 Tổng quan

- Mã phòng: 6 ký tự auto-generate
- 2–20 người/phòng (tùy mode)
- Host config: mode, số câu, time/câu, difficulty, sách, visibility
- Realtime via WebSocket (STOMP)
- Lifecycle: `LOBBY → IN_PROGRESS → ENDED` hoặc `CANCELLED`
- State: DB entities + Redis (TTL 2 giờ)

#### 5.4.1 Speed Race ⚡

> Ai nhanh nhất, giỏi nhất thắng. Mode mặc định.

**Scoring:**
```
Đúng:   100 + floor((timeLimit - response) / timeLimit × 50)   // 100-150
Sai:    0
Timeout: 0
```

**Win:** Tổng điểm cao nhất. Tie-break: tổng responseMs (nhanh hơn thắng).
**Elimination:** Không.
**Config defaults:** 15 câu, 30s/câu, max 4 người.

#### 5.4.2 Battle Royale ❤️

> Sai = bị loại. Sống sót cuối cùng thắng.

**Rules:**
- Đúng → ACTIVE
- Sai → ELIMINATED → spectator
- Timeout → ELIMINATED
- **Ngoại lệ:** Nếu TẤT CẢ active đều sai → KHÔNG ai bị loại (tránh end vô nghĩa)

**Win:** Người cuối cùng còn ACTIVE.
**Max rounds:** `min(questionCount × 2, 50)`. Quá → rank theo số round survived.
**Config defaults:** 20 câu, 20s/câu, max 8 người.

#### 5.4.3 Team vs Team 👥

> 2 đội thi đấu, phối hợp để thắng.

**Scoring:**
- Cá nhân: 100 + speedBonus (giống Speed Race)
- Team score = tổng điểm cá nhân
- **Perfect Round Bonus:** TẤT CẢ thành viên 1 đội đều đúng 1 câu → +50 cho mỗi thành viên

**Chia đội:**
- Chẵn: chia đều A/B
- Lẻ: A nhiều hơn 1
- Auto (alternating) hoặc manual (host swap)

**Win:** Đội tổng điểm cao hơn.
**Tie-break:** Perfect Rounds → tổng responseMs → HÒA (cả 2 đội cùng thắng).
**Config defaults:** 15 câu, 30s/câu, max 8 người.

#### 5.4.4 Sudden Death — King of the Hill 👑

> 1v1 thay phiên. Giữ ngôi vương lâu nhất thắng.

**Flow:**
1. Player đầu queue = Champion
2. Player thứ 2 = Challenger
3. Mỗi round: 1 câu, cả 2 trả lời
4. Resolve → winner giữ Champion, loser → SPECTATOR
5. Challenger tiếp từ queue
6. Lặp đến hết queue

**Round resolution:**
| Champion | Challenger | Result |
|----------|------------|--------|
| Đúng | Sai | Champion giữ |
| Sai | Đúng | Challenger thành Champion |
| Đúng | Đúng | Faster (>200ms diff) wins. <200ms → CONTINUE |
| Sai | Sai | CONTINUE |
| Timeout | Timeout | CONTINUE |

CONTINUE max 3 câu. Sau 3 → Champion advantage.

**Win:** Highest `winningStreak` (số challengers đánh bại liên tiếp). Tie → champion cuối cùng rank cao hơn.
**Config defaults:** 20 câu, 15s/câu, max 8 người.

#### 5.4.5 Disconnect & Reconnect

- Grace period: **60 giây** để reconnect
- Trong grace period: câu mới → auto-skip
- Reconnect → resume current question
- Không reconnect 60s:
  - Speed Race: score frozen
  - Battle Royale: → ELIMINATED
  - Team vs Team: tiếp tục, team mất 1 thành viên
  - Sudden Death: nếu Champion/Challenger → thua round

### 5.5 Tournament

- Bracket elimination 4/8/16/32 người
- Mỗi match: 3 lives/người, sai → -1 life, hết lives → thua

**Seeding (FIX-003):**
- Group tournament: seed theo group leaderboard
- Public: seed theo all-time tier points
- Bằng → random

**Bye rules:**
- Bracket luôn power of 2
- Bye chỉ ở Round 1
- Seed cao nhất bye trước
- Min 4 người để start

**Tie-break Sudden Death (FIX-004):** Xem chi tiết trong section Sudden Death (5.4.4) — same logic.

### 5.6 Variety Modes (Mới)

#### 5.6.1 Weekly Themed Quiz

- 10 themes xoay vòng (Miracles, Kings, Prophecy, Creation, Women, Parables, Prayers, Journeys, Love, Courage)
- Cycle theo `weekOfYear % 10`
- 10 câu/tuần, leaderboard riêng
- Badge "Người theo đuổi" — hoàn thành 4 tuần liên tiếp

#### 5.6.2 Mystery Mode

- Random hoàn toàn: không biết sách, difficulty, chủ đề
- 10 câu, timer 25s
- **Bonus 1.5× XP**
- Sau mỗi câu → reveal book name
- "Tôi đủ can đảm! →" entry

#### 5.6.3 Speed Round

- 10 câu × 10 giây
- Chỉ câu DỄ
- **Bonus 2× XP**
- 1 lần/ngày (như Daily Challenge nhưng khác format)
- Timer đỏ, screen flash, rapid ticks

#### 5.6.4 Daily Bonus (Random)

- 1/7 ngày random → user nhận surprise bonus
- Types: 2× XP cả ngày, +50 energy, free freeze, +1 streak
- Deterministic per user per day (`seed = userId + dayOfYear`)

#### 5.6.5 Seasonal Content

- Christmas (1-25 tháng 12): câu hỏi Nativity, books = Matthew/Luke/Isaiah, ×1.5 XP
- Easter (tháng 3-4): câu hỏi resurrection, books = 4 Phúc Âm
- UI seasonal (snow effect, etc.)

---

## 6. Bible Journey Map

> Tạo mục tiêu dài hạn: chinh phục 66 sách.

### 6.1 Concept

User hoàn thành từng sách → mở khóa sách tiếp → thấy progress trên map. Tạo narrative xuyên suốt thay vì grind điểm vô hồn.

### 6.2 Book Mastery

```
Mastery % = (số câu user đã trả lời ĐÚNG ít nhất 1 lần) / (tổng câu sách đó) × 100

Status:
  COMPLETED:   mastery >= 80%
  IN_PROGRESS: mastery > 0% hoặc unlocked
  LOCKED:      sách trước chưa COMPLETED
```

### 6.3 Visual

```
🗺️ Hành trình Kinh Thánh
Đã chinh phục: 8/66 sách (12%)
████░░░░░░░░░░░░░░░░░░░░ 12%

── CỰU ƯỚC (39 sách) ──
✅ Sáng Thế Ký     85% ██████████░
✅ Xuất Hành        82% █████████░
📖 Lê-vi Ký        45% █████░░░░░    ← đang chơi
🔒 Dân Số Ký       --  ░░░░░░░░░░
...

── TÂN ƯỚC (27 sách) ──
🔒 Ma-thi-ơ        --  ░░░░░░░░░░
...
```

Click sách → Practice mode với book đã chọn.

### 6.4 Book Completion Celebration

Khi đạt 80% mastery 1 sách:
- Full screen celebration + confetti
- "🎉 Chinh phục Sáng Thế Ký!"
- "🔓 Mở khóa: Xuất Hành"
- Badge "Người chinh phục [Book Name]"
- Share card auto generated
- Sound: bookComplete

### 6.5 Milestone Badges

- 📖 **Khởi Hành** — sách đầu tiên
- 📚 **Ngũ Thư** — 5 sách Môi-se
- ⚔️ **Chinh Phục** — 10 sách
- 🏛️ **Cựu Ước** — 39 sách
- ✝️ **Phúc Âm** — 4 sách Phúc Âm
- 📮 **Thư Tín** — 21 thư tín
- 🌟 **Tân Ước** — 27 sách
- 👑 **Toàn Thư** — 66 sách (ultimate)

### 6.6 API

```
GET /api/me/journey?language=vi
→ {
    summary: {
      totalBooks: 66,
      completedBooks: 8,
      inProgressBooks: 1,
      lockedBooks: 57,
      overallMasteryPercent: 12.3,
      currentBook: "Leviticus"
    },
    books: [
      { book, order, testament, totalQuestions, masteredQuestions, masteryPercent, status }
    ]
  }
```

---

## 7. Smart Question Selection

> Hiện tại random → user gặp lại câu cũ → nhàm chán. Cần selection thông minh.

### 7.1 4 Pool Priority

```
Pool 1 (60%): Câu CHƯA BAO GIỜ gặp        → highest priority
Pool 2 (20%): Câu đã sai + quá hạn ôn (SRS) → review
Pool 3 (15%): Câu đã đúng nhưng > 30 ngày  → refresh
Pool 4 (fallback): Câu đã đúng gần đây    → last resort
```

### 7.2 Spaced Repetition

```
Sau khi answer:
  Đúng → next review = +3, +6, +9... ngày (max 30)
  Sai  → next review = +1 ngày
```

### 7.3 Apply cho

| Mode | Smart Selection? |
|------|-----------------|
| Practice | ✅ |
| Ranked | ✅ |
| Daily Challenge | ❌ (random cho công bằng) |
| Multiplayer | ❌ (cùng câu cho cả room) |
| Mystery Mode | ✅ |
| Speed Round | ✅ |

### 7.4 Database

```sql
user_question_history (
  id, user_id, question_id,
  times_seen, times_correct, times_wrong,
  last_seen_at, last_correct_at, last_wrong_at,
  next_review_at,
  UNIQUE(user_id, question_id)
)
```

### 7.5 Coverage stats API

```
GET /api/me/question-coverage
→ {
    totalQuestions: 4000,
    seenQuestions: 1250,
    coveragePercent: 31.25,
    byBook: [...],
    needReview: 35,
    masteredQuestions: 800
  }
```

Hiện trên Profile: "Đã khám phá 31% Kinh Thánh"

---

## 8. Sound, Haptics & Feel

> Khác biệt giữa app "đúng kỹ thuật" và app "nghiện được".

### 8.1 Sound Effects

| Sound | Khi nào | Volume |
|-------|---------|--------|
| `correctAnswer` | Trả lời đúng | 0.7 |
| `wrongAnswer` | Trả lời sai | 0.7 |
| `timerTick` | <5s còn lại | 0.5 |
| `timerWarning` | <3s còn lại | 0.7 |
| `combo3` | Streak 3 | 0.7 |
| `combo5` | Streak 5 | 0.8 |
| `combo10` | Streak 10 | 0.9 |
| `quizComplete` | Hết quiz | 0.7 |
| `perfectScore` | 100% accuracy | 0.9 |
| `tierUp` | Lên tier | 1.0 |
| `badgeUnlock` | Nhận badge | 0.8 |
| `bookComplete` | Hoàn thành 1 sách | 0.9 |
| `dailyReady` | Daily mới available | 0.6 |
| `buttonTap` | Tap nút | 0.4 |

Format MP3, mỗi file <50KB. Settings có volume slider + on/off toggle.

### 8.2 Haptic Feedback (Mobile)

| Haptic | Strength | Khi nào |
|--------|----------|---------|
| `correct` | Light | Trả lời đúng |
| `wrong` | Heavy | Trả lời sai |
| `select` | Selection | Chọn đáp án |
| `combo` | Medium | Streak 3+ |
| `tierUp` | Success notification | Lên tier |
| `timerWarning` | Warning notification | <3s |
| `tap` | Light | Button tap |

Web fallback: `navigator.vibrate()` (limited support).

### 8.3 Animations

| Element | Animation |
|---------|-----------|
| Answer button đúng | Flash xanh + scale 1.05 |
| Answer button sai | Flash đỏ + horizontal shake |
| Combo banner | Slide in từ trên + pulse |
| Score number | Pop 1.3× với gold color |
| Timer (<5s) | Pulse + đổi vàng |
| Timer (<3s) | Critical pulse + đổi đỏ |
| Quiz results | Score counting up từ 0 |
| Grade text | Scale in với cubic bezier |
| XP gained | Float up + fade out |
| Perfect score | Confetti burst |
| Tier up | Full screen celebration với crown animation |
| Book complete | Confetti + book icon scale |

### 8.4 Settings

```
Settings → Sound & Haptics
  Volume slider (0-100)
  ☐ Bật âm thanh
  ☐ Bật rung phản hồi
  ☐ Tắt animations (cho slow devices)
```

---

## 9. Social Features

### 9.1 Church Group ⭐ (Differentiator)

#### 9.1.1 Tạo group

- Group leader tạo, đặt tên, upload ảnh
- Mã 6 ký tự + QR code để join
- Tối đa 200 thành viên/group (configurable per-group)

#### 9.1.2 Tính năng

- **Leaderboard riêng** (weekly / all-time)
- **Group analytics** (leader): ai active, tiến độ thành viên
- **Group announcement**: leader gửi thông báo
- **Group quiz set** (xem 9.1.4)
- **Group tournament**: leader tổ chức nội bộ
- **Group streak**: "Nhóm chúng ta đang có streak 14 ngày!"

#### 9.1.3 Roles trong group

| Role | Quyền |
|------|-------|
| `leader` | Tất cả: edit group, manage members, create quiz set, ban member |
| `mod` | Approve members, create announcement, create quiz set |
| `member` | Xem leaderboard, chơi quiz set, đọc announcements |

#### 9.1.4 Group Quiz Set lifecycle (FIX-012)

**Tạo:**
- Leader/mod chọn câu từ full pool (KHÔNG chỉ bookmarked)
- Max 50 câu/set, 20 sets/group
- Đặt tên (vd: "Bài học Chúa Nhật 30/03")

**Chơi:**
- Member → tab "Quiz nhóm" → chọn set → chơi
- Mode: như Practice (không vào ranked)
- CÓ leaderboard riêng per quiz set
- Mỗi member tối đa 3 lần/set (lấy điểm cao nhất)

**Lifecycle:**
- `Active`: chơi được
- `Archived`: leader archive sau buổi học → vẫn xem kết quả
- `Deleted`: soft delete, hard delete sau 30 ngày
- Không expire tự động — leader quyết định

### 9.2 Multiplayer Reactions

> Vui nhộn cho multiplayer rooms.

#### 9.2.1 Reactions Real-time

```
Reactions: 👏 😂 😱 🔥 💪 🙏

Reaction bar dưới quiz screen → tap → broadcast cho room
Float animation từ sender position → up → fade
Rate limit: 3 reactions/10s per user
```

#### 9.2.2 Live Feed

```
Khi player trả lời → notification cho room:
  ✅ "An trả lời đúng! (3s)"
  🎯 "An chính xác!"
  ❌ "Bui trả lời sai"
  😅 "Bui nhầm rồi"
  
Auto dismiss sau 3s, max 3 messages cùng lúc
```

#### 9.2.3 Victory Celebration

```
End game:
  👑 An chiến thắng!
  
  1. 👑 An    950 điểm
  2. 🥈 Bui   820 điểm
  3. 🥉 Chi   750 điểm
  
  [🔄 Chơi lại] [🏠 Trang chủ] [⚔️ Thách đấu winner]
```

Winner: confetti + crown animation + victory sound.

### 9.3 Challenge Friend (1v1)

> Defer Friend System → nhưng challenge từ Leaderboard/Profile vẫn được.

```
Từ Leaderboard hoặc Profile người khác:
  [⚔️ Thách đấu] button
    ↓
  Confirm: "Thách đấu An? Speed Race × 10 câu. An có 5 phút để chấp nhận."
    ↓
  Tạo Challenge entity (PENDING, expires 5 phút)
    ↓
  Push notification + WebSocket cho người được thách
    ↓
  Accept → tạo private room 2 người → cả 2 join
  Decline → notify challenger
  Expire → remove
```

### 9.4 Online Indicator

```
GET /api/friends/online
→ [{ userId, name, status: "playing_quiz" | "in_lobby" | "browsing" }]

Hiện trên Groups page:
  👥 Đang online (3)
  🟢 An — đang chơi Daily Challenge
  🟢 Bình — đang ở trang chủ
  🟢 Chi — đang trong room #ABC
```

Implementation: Redis set `online:users` với TTL 5 phút.

### 9.5 Share Card (Viral)

#### 9.5.1 Khi nào generate

- Sau quiz completion
- Sau Daily Challenge
- Khi lên tier
- Khi hoàn thành 1 sách (Journey Map)
- Victory multiplayer

#### 9.5.2 Architecture (FIX-006)

**Phase 1 (current):**
- Frontend: ShareCard.tsx preview component
- Backend: ShareCardController → URL + Open Graph metadata
- Bot detection (Facebook, Zalo, Twitter, Google) → trả HTML với OG tags
- Regular user → redirect SPA

**Phase 2 (scale):**
- Backend Puppeteer container render PNG server-side
- CDN cache

### 9.6 Friend System (v2.5 — Defer) (FIX-005)

> ⚠️ Chưa implement. Sẽ có trong roadmap v2.5.
> Khi implement: Friend entity, FriendRequest entity, FriendController, friend leaderboard tab.

---

## 10. Multi-language (i18n)

### 10.1 Strategy

| Phase | Languages | Trạng thái |
|-------|-----------|-----------|
| 1 (current) | Tiếng Việt | ✅ Default |
| 2 (next) | + English | 🚧 In progress |
| 3 (future) | + Korean, Chinese | Backlog |

### 10.2 Quiz Language vs UI Language

**Quan trọng:** 2 ngôn ngữ riêng biệt:
- **Quiz language** (`quizLanguage`): câu hỏi tiếng gì
- **UI language** (`uiLanguage`): giao diện tiếng gì

User có thể chọn UI tiếng Anh nhưng quiz tiếng Việt (hoặc ngược lại).

### 10.3 Question content

```sql
Question (id, content, ..., language, scriptureVersion)
-- Mỗi câu hỏi có language riêng (không dùng QuestionLocale)
-- Tách biệt vì câu hỏi VN và EN khác nhau hoàn toàn (không phải dịch)
```

Default language theo user setting. Filter mọi query: `WHERE language = ?`.

### 10.4 UI i18n

- React: `react-i18next` + `i18next-browser-languagedetector`
- Files: `src/i18n/vi.json`, `src/i18n/en.json` (~200 strings each)
- Detect browser language ở lần đầu, sau đó dùng user choice
- Lưu `localStorage.i18nextLng`

### 10.5 Bible book names

```typescript
BOOK_NAMES = {
  "Genesis": { vi: "Sáng Thế Ký", en: "Genesis" },
  // ... 66 books
}

getBookName(bookKey, language)
```

### 10.6 Date/Number formatting

```typescript
const locale = language === 'en' ? 'en-US' : 'vi-VN'
date.toLocaleDateString(locale)
number.toLocaleString(locale)
new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
```

### 10.7 Layout considerations

English thường dài hơn tiếng Việt 20-30%. Test layout:
- Buttons không bị tràn
- Navigation labels không cắt
- Tables không wrap xấu
- Mobile responsive

---

## 11. Mobile App

### 11.1 Tech stack

- React Native (Expo)
- TypeScript strict mode
- React Navigation (bottom tabs + stacks)
- Zustand + TanStack Query (reuse từ web)
- AsyncStorage (replace localStorage)

### 11.2 Code reuse từ web

| Layer | Reuse | Notes |
|-------|-------|-------|
| Types/interfaces | 100% | Copy nguyên |
| API client | 90% | Replace localStorage → AsyncStorage |
| Zustand stores | 90% | Replace storage adapter |
| TanStack Query hooks | 80% | Adjust imports |
| Business logic (scoring, tiers, journey) | 100% | Pure functions |
| i18n files | 100% | Copy nguyên |
| **JSX markup** | **0%** | Rewrite: div→View, span→Text |
| **Styling** | **0%** | Rewrite: Tailwind→StyleSheet |

### 11.3 Architecture

```
src/
├── logic/        ← Business logic (pure, testable)
├── hooks/        ← Custom hooks
├── api/          ← API client + queries
├── stores/       ← Zustand
├── components/   ← Reusable UI
├── screens/      ← Screen components
├── navigation/   ← React Navigation
├── theme/        ← Colors, typography, spacing
├── i18n/         ← Translations
└── App.tsx
```

### 11.4 Auth flow (Mobile-specific)

Web dùng OAuth Authorization Code → redirect.
Mobile dùng Google Sign-In SDK → ID Token trực tiếp.

**Backend mobile endpoints (xem 17.2):**
```
POST /api/auth/mobile/login    — email/password, refreshToken trong body
POST /api/auth/mobile/refresh  — refreshToken trong body (không cookie)
POST /api/auth/mobile/google   — Google ID Token verification
```

### 11.5 Push Notifications

- Firebase Cloud Messaging (FCM) — Android + iOS
- Backend đăng ký device token: `POST /api/me/devices`
- Triggers: streak warning, daily ready, group invite, tournament start, challenge

### 11.6 Deep Links

```typescript
prefixes: ['biblequiz://', 'https://biblequiz.app']
config: {
  Main: {
    screens: {
      DailyTab: 'daily',
      GroupsTab: { screens: { GroupDetail: 'groups/:id' } }
    }
  }
}
```

### 11.7 Native features

- Haptics (expo-haptics)
- Sound effects (expo-av)
- Push notifications (expo-notifications hoặc Firebase)
- App icon + splash screen
- Sentry crash monitoring

### 11.8 Offline mode (v3.0 Premium) (FIX-007)

- Pre-cache 50 câu random per book
- Practice mode chơi offline
- Sync khi có mạng
- Multiplayer/Daily vẫn cần internet
- Hiện toast "Cần kết nối internet" khi offline ở online-only modes

---

## 12. Notifications

### 12.1 Automated (system-triggered)

| Notification | Trigger | Default |
|-------------|---------|---------|
| Streak warning | Hourly check, streak sắp gãy < 2h | ✅ On |
| Daily challenge ready | 8:00 AM local time | ✅ On |
| Tier up celebration | Khi đạt tier mới | ✅ On |
| Group invite | Khi được mời vào group | ✅ On |
| Tournament start | 5 phút trước start | ✅ On |
| Challenge received | Khi nhận challenge 1v1 | ✅ On |
| Welcome new user | Sau signup | ✅ On |
| Weekly summary | Monday 9:00 AM | ❌ Off |

### 12.2 Manual broadcast (Admin)

Xem SPEC_ADMIN.md mục 11.

### 12.3 Notification settings (User)

```
Settings → Notifications
  ☑ Streak warnings
  ☑ Daily challenge
  ☑ Group activities
  ☑ Tournament & challenges
  ☐ Weekly summary
  
  Quiet hours: [22:00] - [07:00]
```

---

## 13. User Profile & Settings

### 13.1 Profile page

- Avatar + name + tier badge
- Stats grid: total points, current streak, longest streak, sessions played, accuracy
- Activity heatmap (12 tháng, GitHub-style)
- Badges grid (unlocked + locked)
- Bible Journey progress (66 sách)
- Recent activity feed

### 13.2 Settings page

```
Account
  Profile (name, avatar)
  Email (read-only)
  
Language
  Interface language: Tiếng Việt / English
  Quiz language: Tiếng Việt / English
  
Sound & Haptics
  Volume slider
  Sound effects on/off
  Haptic feedback on/off
  
Notifications
  (xem 12.3)
  
Privacy
  Profile visibility: public / friends only
  Show in leaderboard: on/off
  
Legal
  Privacy Policy
  Terms of Service
  Open source licenses
  
Danger Zone
  Delete account
  
About
  Version
  Build number
  Liên hệ
```

---

## 14. Privacy, Terms & Account Deletion

### 14.1 Privacy Policy

> Bắt buộc cho App Store. Path: `/privacy` (public route).

Nội dung gồm:
1. Thông tin thu thập (email, name, avatar từ Google; quiz data; group data; device data)
2. Cách sử dụng
3. Chia sẻ thông tin (KHÔNG bán; chỉ trong group/leaderboard)
4. Lưu trữ (AWS Asia Pacific, encrypted)
5. Quyền user (xem, sửa, xóa data)
6. Trẻ em (không thu thập <13 tuổi mà không có consent)
7. Liên hệ: privacy@biblequiz.app

### 14.2 Terms of Service

Path: `/terms` (public route).

Nội dung:
1. Chấp nhận điều khoản
2. Tài khoản người dùng
3. Nội dung và hành vi
4. Quyền sở hữu trí tuệ (Kinh Thánh public domain, câu hỏi thuộc BibleQuiz)
5. Miễn trừ trách nhiệm
6. Chấm dứt
7. Thay đổi điều khoản

### 14.3 Delete Account (Apple bắt buộc)

```
Settings → Danger Zone → Delete Account
  ↓
Modal: "Xóa tài khoản"
  ⚠️ Hành động KHÔNG THỂ hoàn tác
  Sẽ xóa: điểm số, streak, tier, lịch sử quiz, nhóm, dữ liệu cá nhân
  
  Nhập "XÓA TÀI KHOẢN" để xác nhận: [____]
  
  [Hủy] [Xóa vĩnh viễn]
```

Backend: `DELETE /api/me/account` với confirm phrase.

**Thứ tự xóa (FK constraints):**
1. user_question_history
2. session_answer
3. quiz_session
4. group_member
5. tournament_participant
6. user_badge
7. user_streak
8. notification + device_token
9. feedback
10. user record (hard delete hoặc anonymize)
11. Redis sessions/tokens

---

## 15. Error Handling & Offline

### 15.1 Error Boundary

Wrap toàn bộ app trong React Error Boundary:
- Catch unhandled errors
- Hiện friendly fallback UI thay vì màn hình trắng
- Log to Sentry
- Button "Về trang chủ" để reset

### 15.2 API error handling

**TanStack Query global config:**
- Retry: 3 lần với exponential backoff
- StaleTime: 5 phút
- Use cache cho stale data (không hiện error)

**Axios interceptor — friendly messages:**
| HTTP | Message |
|------|---------|
| Network error | "Không thể kết nối server" |
| 401 | "Phiên đăng nhập hết hạn" → auto logout |
| 403 | "Bạn không có quyền" |
| 404 | "Nội dung không tìm thấy" |
| 429 | "Bạn thao tác quá nhanh" |
| 500 | "Lỗi hệ thống" |

### 15.3 Offline detection

```typescript
// Web: navigator.onLine + online/offline events
// Mobile: @react-native-community/netinfo

const isOnline = useOnlineStatus()

{!isOnline && (
  <div className="offline-banner">
    📡 Mất kết nối — Một số tính năng có thể không hoạt động
  </div>
)}
```

### 15.4 Empty states

Mỗi list/page cần empty state:
- Icon + title + description + action button
- Components: EmptyState, NoGroups, NoActivity, etc.

### 15.5 Loading states (Skeleton)

> Thay spinner bằng skeleton UI cho perceived performance tốt hơn 30-40%.

Components:
- `Skeleton` (basic)
- `SkeletonCard`
- `SkeletonText` (lines)
- `SkeletonAvatar` (circle)
- `SkeletonLeaderboardRow`

Áp dụng cho mọi page có loading state.

### 15.6 Crash monitoring (Sentry)

- Frontend: `@sentry/react`
- Backend: `sentry-spring-boot-starter`
- Free tier: 5K errors/month đủ cho khởi đầu
- Environment: dev / staging / production
- Sample rate: 10% transactions

---

## 16. WebSocket Events

### 16.1 Connection

```
wss://api.biblequiz.app/ws
Headers: Authorization: Bearer <accessToken>
Protocol: STOMP
```

### 16.2 Reliability

- Reconnect: exponential backoff (1s, 2s, 4s... max 30s)
- Resume: gửi `{ lastEventId }` khi reconnect → server replay missed events
- Heartbeat: ping/pong mỗi 30s
- Redis Pub/Sub cho fan-out multi-instance

### 16.3 Room channel: `/room/{roomId}`

**Client → Server:**
```
join:    {}
ready:   {}
answer:  { questionId, answerIndex, clientElapsedMs }
chat:    { message }
leave:   {}
reaction: { reaction: "👏" }
```

**Server → Client (all modes):**
```
room_state:        { status, players[], currentQuestion?, config }
question:          { id, content, options, timeLimitSec, order, totalQuestions }
answer_result:     { userId, isCorrect, score?, responseMs }
round_end:         { rankings[], correctAnswer, explanation? }
game_end:          { finalRankings[], mvp?, shareCardUrl }
player_joined:     { userId, name, avatar }
player_left:       { userId }
player_reconnected: { userId }
reaction_received: { senderId, senderName, reaction, timestamp }
live_feed:         { type: "CORRECT"|"WRONG", playerName, questionNumber, timeUsed }
error:             { code, message }
```

**Battle Royale specific:**
```
player_eliminated: { userId, roundNumber, remainingCount }
```

**Team vs Team specific:**
```
team_scores:    { teamA, teamB }
perfect_round:  { team: "A"|"B", bonusPerMember: 50 }
```

**Sudden Death specific:**
```
champion_set:    { userId, name, streak }
challenger_set:  { userId, name }
match_result:    { winnerId, loserId, reason, newChampion }
queue_update:    { remaining, nextChallenger? }
```

### 16.4 Tournament channel: `/tournament/{tournamentId}`

```
Server → Client:
  tournament_state:  { status, participants[], bracket? }
  match_start:       { matchId, round, p1, p2, timePerQuestionSec }
  match_question:    { matchId, id, content, options, timeLimitSec, order }
  match_update:      { matchId, p1Lives, p2Lives, lastAnswer }
  match_end:         { matchId, winnerUserId, reason, shareCardUrl? }
  bracket_update:    { round, matches[] }
  tournament_end:    { winnerId, finalBracket, shareCardUrl }
  
  -- Sudden death tie-break
  sudden_death_start:    { matchId, message: "Sudden Death!" }
  sudden_death_question: { matchId, questionId, content, options, timeLimitSec: 10 }
  sudden_death_result:   { matchId, p1Answer, p2Answer, p1ElapsedMs, p2ElapsedMs, winnerId? }
```

### 16.5 Rate limits (FIX-011)

| Event | Limit |
|-------|-------|
| `answer` | 1/câu/2s per user |
| `chat` | 10 msg/phút per user |
| `reaction` | 3/10s per user |
| `join` | 5/phút per user |
| `ready` | 3/phút per user |
| Total events | 60/phút per connection → disconnect + ban 5 phút |

---

## 17. API Endpoints

### 17.1 Public (no auth)

```
POST /api/auth/oauth/google      → OAuth callback
GET  /api/public/sample-questions → 3 câu cho onboarding
GET  /api/daily-challenge        → daily questions
GET  /api/share/{token}          → share card OG metadata
GET  /privacy                    → privacy policy page
GET  /terms                      → terms page
```

### 17.2 Auth

**Web:**
```
POST /api/auth/login        { email, password } → accessToken in body, refreshToken in httpOnly cookie
POST /api/auth/refresh      → reads cookie
POST /api/auth/exchange     { code }            → opaque code from Redis
POST /api/auth/logout
```

**Mobile (separate path):**
```
POST /api/auth/mobile/login    { email, password }    → both tokens in body
POST /api/auth/mobile/refresh  { refreshToken }       → reads body
POST /api/auth/mobile/google   { idToken }            → verify Google ID Token
```

### 17.3 User & Profile

```
GET    /api/me                    → profile + stats + tier progress
PATCH  /api/me                    → update profile
DELETE /api/me/account            → delete account
GET    /api/me/badges
GET    /api/me/history            → quiz history
GET    /api/me/bookmarks
POST   /api/me/bookmarks          { questionId }
DELETE /api/me/bookmarks/{id}
GET    /api/me/ranked-status      → energy, daily progress
GET    /api/me/journey            → Bible Journey Map (66 books)
GET    /api/me/question-coverage  → coverage stats
GET    /api/me/weaknesses         → weak/strong books
GET    /api/me/devices            → push notification devices
POST   /api/me/devices            { fcmToken, platform }
DELETE /api/me/devices/{token}
PATCH  /api/me/settings           → user preferences
```

### 17.4 Questions

```
GET  /api/books              → list 66 books + coverage
GET  /api/questions          → query: book, difficulty, type, language, limit, cursor
GET  /api/questions/{id}     → detail (with explanation if reveal=true)
POST /api/questions/{id}/feedback  { rating, note }
```

### 17.5 Sessions (Quiz)

```
POST /api/sessions               { mode, ranked?, config } → { session, questions, rankedStatus? }
POST /api/sessions/{id}/answer   { questionId, answer, clientElapsedMs }
                                 → { isCorrect, correctAnswer, explanation?, scoreDelta,
                                     energyRemaining, comboCount, newBadge? }
GET  /api/sessions/{id}          → status + score
GET  /api/sessions/{id}/review   → answers + explanations
POST /api/sessions/{id}/retry    → { newSessionId }
POST /api/sessions/practice/retry-last → { newSessionId }
```

### 17.6 Daily Challenge

```
GET  /api/daily-challenge           → { date, questions, alreadyCompleted, globalStats }
POST /api/daily-challenge/start     → { sessionId }
POST /api/daily-challenge/complete  → { completed, alreadyCompleted, score, correct, total }
                                      body: { score: 0-10000, correctCount: 0-5 }
                                      auth required; idempotent same-day
GET  /api/daily-challenge/result    → { score, rank, betterThanPercent, shareCardUrl }
```

**Completion tracking**: Client calls `POST /complete` after finishing all 5 questions.
Server records via Redis key `daily_challenge:completed:{userId}:{date}` (TTL 48h).
Second call same-day returns `{ alreadyCompleted: true }` without overwrite.
Unknown fields in body → HTTP 400 `Field 'xxx' is not allowed`.

### 17.7 Variety modes

```
GET  /api/quiz/weekly       → weekly themed quiz
POST /api/quiz/mystery      → start mystery mode
GET  /api/quiz/speed-round  → speed round (1/day)
GET  /api/me/daily-bonus    → check daily bonus
```

### 17.8 Rooms (Multiplayer)

```
POST /api/rooms              { mode, config } → { room, roomCode, shareLink }
GET  /api/rooms/{id}         → details + players + config
POST /api/rooms/{id}/join
POST /api/rooms/{id}/leave
POST /api/rooms/{id}/start   (host)
POST /api/rooms/{id}/kick    { userId } (host)
GET  /api/rooms/{id}/leaderboard

-- Team mode only
POST /api/rooms/{id}/swap-team { userId, targetTeam } (host, lobby only)
```

### 17.9 Tournaments

```
POST /api/tournaments              { roomId?, groupId?, name, maxPlayers, config }
GET  /api/tournaments/{id}
POST /api/tournaments/{id}/join
POST /api/tournaments/{id}/start
GET  /api/tournaments/{id}/bracket
GET  /api/tournaments/{id}/matches/{matchId}
POST /api/tournaments/{id}/matches/{matchId}/forfeit
```

### 17.10 Groups

```
POST   /api/groups              { name, description, isPublic, maxMembers }
GET    /api/groups/{id}
PATCH  /api/groups/{id}         (leader)
DELETE /api/groups/{id}         (leader)
GET    /api/groups/{id}/members
POST   /api/groups/join         { code }
DELETE /api/groups/{id}/leave
DELETE /api/groups/{id}/members/{userId}  (leader)
POST   /api/groups/{id}/announcements     { content }
GET    /api/groups/{id}/announcements
GET    /api/groups/{id}/leaderboard       query: period
GET    /api/groups/{id}/analytics         (leader)

-- Quiz Sets
POST   /api/groups/{id}/quiz-sets         { name, questionIds[] }
GET    /api/groups/{id}/quiz-sets
PATCH  /api/groups/{id}/quiz-sets/{setId} { status: 'archived' }
DELETE /api/groups/{id}/quiz-sets/{setId}
GET    /api/groups/{id}/quiz-sets/{setId}/leaderboard
POST   /api/groups/{id}/quiz-sets/{setId}/play → { sessionId }
```

### 17.11 Leaderboard

```
GET /api/leaderboard/global      → period[daily/weekly/season/all_time], tierId?, limit, cursor
GET /api/leaderboard/daily-challenge → query: date
GET /api/leaderboard/around-me   → 5 trên + bạn + 5 dưới
GET /api/leaderboard/weekly-themed → weekly quiz leaderboard
```

### 17.12 Challenges (1v1)

```
POST /api/challenges              { challengedUserId } → create
POST /api/challenges/{id}/accept  → { roomId, roomCode }
POST /api/challenges/{id}/decline
GET  /api/challenges/pending
```

### 17.13 Notifications

```
GET    /api/notifications         → unread, paginated
PATCH  /api/notifications/read-all
PATCH  /api/notifications/{id}/read
```

### 17.14 Feedback

```
POST /api/feedback                { type, questionId?, content }
```

### 17.15 Online status

```
GET /api/users/online             → list online users (group members or friends)
```

---

## Phụ lục: Roadmap user-facing

### v1.0 — Core Loop ✅
Auth, Profile, Practice, Ranked, Daily Challenge, Tier system, Leaderboard, Push notifications

### v1.5 — Social ✅
Church Group, Share card, Streak system, Multiplayer rooms (basic), Season system

### v2.0 — Competition ✅
Tournament, Group tournament, Season finale, Around-me leaderboard

### v2.5 — Polish & Engagement (current)
- ✅ Tier progression (smart selection, difficulty scaling, rewards, unlocks)
- ✅ Bible Journey Map
- ✅ Sound + Haptics + Animations
- ✅ Wrong answer explanations
- ✅ Variety modes (weekly themed, mystery, speed round)
- ✅ Multiplayer reactions + challenges
- ✅ Onboarding flow
- ✅ Pre-launch fixes (error handling, privacy, delete account)
- 🚧 Mobile app (React Native)
- 🚧 English language (i18n)

### v3.0 — Scale (future)
- Premium tier
- Friend System
- More languages (KR, ZH)
- Offline mode
- Spaced Repetition System (SRS) advanced
- Context notes (bản đồ địa lý, bối cảnh lịch sử)

---

*Living spec — cập nhật theo từng milestone.*
