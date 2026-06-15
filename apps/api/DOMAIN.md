# apps/api — Tri thức nghiệp vụ (BibleQuiz Backend)

> **Backend Spring Boot 3 / Java 17.** Đây là tài liệu domain **CANONICAL** của BibleQuiz: nơi business rule
> được *enforce* (nguồn sự thật). Frontend ([apps/web/DOMAIN.md](../web/DOMAIN.md)) chỉ mirror một phần và
> trỏ ngược về đây. *Ý đồ* canonical nằm ở [docs/spec/](../../docs/spec/); file này ghi code **thực sự làm gì**,
> mọi chỗ lệch spec đều được gắn cờ.
>
> **Nhãn tin cậy:** `[OBS]` quan sát trực tiếp trong code (file + symbol) · `[CANDIDATE]` suy luận / chỉ có ở spec ·
> `[?]` chưa rõ → Open Questions · `[✔]` đã xác nhận (người/log).
> Draft 2026-06-11, branch `feat/liturgical-coverage`. **LOCAL-ONLY — không commit.**
>
> ⚠️ Số dòng dễ trôi; khi nav hãy bám theo **symbol/method** (Serena project `api`).

---

## 0. Stack & bố cục

- **Java 17 + Spring Boot 3**, Maven (`./mvnw`). Entry: `com.biblequiz.ApiApplication`. Profile mặc định `dev`.
- **DB:** MySQL 8 + Flyway (`src/main/resources/db/migration`, head hiện tại V63). Dev → `localhost:3307`.
- **Cache / realtime:** Redis (session, cache leaderboard, state ephemeral của room, TTL bên dưới). STOMP/WebSocket cho room.
- **Bản đồ package** (`com.biblequiz`):
  - `api/` — REST controller + `api/websocket/` STOMP controller + `api/dto`.
  - `modules/` — module nghiệp vụ: `ranked`, `room`, `daily`, `season`, `coverage`, `group`, `lifeline`, `quiz`, `user`, `userquiz`, `tournament`, `achievement`, `auth`, `adminai`, `feedback`, `notification`, `share`.
  - `infrastructure/` — `time/GameClock`, `security/`, `auth/`, `feature/` (feature flag), `config`, `audit`, `seed`, `service/`.
- **Deploy:** `[CANDIDATE]` — chưa verify từ log hạ tầng; nhờ ops xác nhận nếu cần.

## 1. Domain là gì

Ứng dụng "chơi mà học" Kinh Thánh. Các bề mặt: **Ranked** (ladder cá nhân giới hạn ngày, tiến theo sách),
**Practice/Basic quiz**, **Multiplayer room** (5+ mode, host/"Quản trò"), **Daily Challenge + Mission**,
**Liturgical Coverage** (coverage sách theo mùa + badge), **Church Group** (quiz set, scheduled quiz, group leaderboard),
**Tournament** (1v1). Validate phía server rất chặt (anti-cheat). Ràng buộc đặt tên canonical C1–C9 ở
[CLAUDE.md](CLAUDE.md) / spec gốc.

---

## 2. ⭐ Trục thời gian — `GameClock` [OBS]

Mọi thứ theo ngày/tuần đều quy chiếu qua `infrastructure/time/GameClock`.

- `[OBS]` `GameClock.GAME_ZONE = Asia/Ho_Chi_Minh` (UTC+7). `today()` = nửa đêm giờ VN; `weekStart()` = thứ Hai ISO (giờ VN).
- `[OBS]` Dùng bởi: Daily Challenge, Daily Mission, Streak, key dòng `UserDailyProgress`, cửa sổ leaderboard.
- ⚠️ **Nguy cơ lệch zone:** một số *scheduler* và vài chỗ đọc dùng **UTC** trong khi logic game dùng giờ VN:
  - `RankedController.recoverEnergy()` tính khoảng thời gian từ `lastUpdatedAt` (UTC) nhưng reset-ngày lại theo `GameClock.today()` (VN) → xem **F-api-1**.
  - `BadgeAwardScheduler` chạy theo giờ UTC; cap ngày của quickmatch reset lúc nửa đêm UTC; `ChurchGroupService.listMyGroupsWithSummary` dùng `ZoneOffset.UTC` còn `GroupStreakService` dùng giờ VN.
- `[CANDIDATE]` Một zone toàn cục = sản phẩm hiện chỉ phục vụ VN; đa vùng sẽ cần zone theo từng user.

---

## 3. ⭐ Ranked play & scoring (luồng nặng nhất) [OBS]

Entry: `RankedController` (`/ranked/...`), `modules/ranked/service/*`.

### 3.1 Công thức tính điểm
- `[OBS]` `ScoringService.calculateWithTier()`:
  `final = base × tier.xpMultiplier × (xpSurge ? 1.5 : 1) × (seasonFocusBook ? 1.5 : 1)`.
  - **Base** = điểm độ khó (`easy 8 / medium 12 / hard 18`) + **bonus tốc độ**.
  - **Bonus tốc độ** (bậc hai): `floor(base × 0.5 × speedRatio²)`, `speedRatio = max(0,(30000 − clientElapsedMs)/30000)`. `TIME_LIMIT_MS = 30_000`.
  - **Combo**: chuỗi 5 ×1.2, chuỗi 10+ ×1.5 (trần ×1.5).
  - Nhánh `isDailyFirst` ×2 có tồn tại nhưng **chưa wire** ở ranked (luôn `false`) → **F-api-4**.
- `[OBS]` Tier XP multiplier (`TierRewardsConfig`): T1 ×1.0, T2 ×1.1, T3 ×1.2, T4 ×1.3, T5 ×1.5, T6 ×2.0.
- `[OBS]` XP Surge: `User.xpSurgeUntil > now()` → ×1.5 (`RankedController.submitRankedAnswer`). Admin set qua `AdminTestController.xpSurgeHoursFromNow`. Auto-trigger theo ngưỡng tier vẫn pending (BL-3-trigger).
- `[OBS]` Season Focus ×1.5: khi sách câu hỏi ∈ focus books của mùa hiện tại, gated bởi `featureFlagService.isLiturgicalCoverageEnabled(userId)`. Xem §6.

### 3.2 Cap ngày & năng lượng (server enforce)
- `[OBS]` **`DAILY_QUESTION_CAP = 100`** câu/ngày (KHÔNG phải 50 như spec — xem **F-api-3**), check trong `submitRankedAnswer` (`p.questionsCounted >= cap` → trả `blocked:true`). Counter vẫn persist kể cả câu bị block.
- `[OBS]` **Năng lượng/lives**: `MAX_ENERGY = 100`, `ENERGY_COST_WRONG = 5` (trả lời đúng không tốn); block khi `livesRemaining <= 0`. Regen `+20/giờ` (`recoverEnergy()`), trần 100, áp dụng lúc bắt đầu session.
  > **Đối chiếu:** năng lượng **CÓ** bị trừ/enforce trong luồng *ranked* (`RankedController`, quan sát trực tiếp). Nó **không** bị đụng bởi `LifelineService` hay luồng practice — năng lượng là cổng chặn riêng cho mode ranked, không phải toàn cục. Field backing là `UserDailyProgress.livesRemaining` (tên cũ).
- `[OBS]` **Reset ngày**: mỗi `(user, GameClock.today())` có một dòng `UserDailyProgress` mới; sách/độ khó carry over, lives & điểm reset. Tạo lazy ở `getRankedStatus()` — xem **F-api-2** (nếu không bao giờ gọi thì sao).

### 3.3 Ladder tier & rank
- `[OBS]` Tier tính theo **điểm all-time**, **chỉ tăng (không xuống hạng)**: `RankTier.fromPoints()` / `UserTierService.getTierLevel()`. Ngưỡng (tên C1): **Tân Tín Hữu 0 / Người Tìm Kiếm 1.000 / Môn Đồ 5.000 / Hiền Triết 15.000 / Tiên Tri 40.000 / Sứ Đồ 100.000**.
- `[OBS]` Sao sub-tier (chỉ T1–5): `TierProgressService.STAR_XP = {0,200,800,2000,5000,12000,0}`; đủ 5 sao → lên tier. T6 không có sao (luôn 100%).
- `[OBS]` **Phân bổ độ khó theo tier + timer** (`TierDifficultyConfig.getDistribution()`): T1 70/25/5 @30s → T6 5/35/60 @18s (mặc định tier-không-rõ 50/35/15 @30s).
- `[OBS]` **Cổng mở Ranked**: `User.basicQuizPassed` (qua Bible Basics 8/10) mở Ranked vĩnh viễn (DECISIONS 2026-04-29), thay cổng XP/accuracy cũ; `earlyRankedUnlock` (legacy) còn tồn tại tới V32.

### 3.4 Tiến theo sách (Sáng Thế → Khải Huyền)
- `[OBS]` Tự tiến tuần tự qua `bookProgressionService.shouldAdvanceToNextBook()` (count + tỉ lệ đúng); tiến thay thế khi mastery theo sách (`answeredCount ≥ 100 && correctCount ≥ 70`, `UserBookProgress`). Tới Khải Huyền → mode **post-cycle**, độ khó ép `hard`.
- `[OBS]` **Chọn câu hỏi** `selectRankedQuestions()` → `SmartQuestionSelector` áp phân bổ theo tier; overfetch để đệm câu lặp trong ngày. Guest → random đều, không lịch sử.

### 3.5 Anti-cheat (quyền lực server)
- `[OBS]` **Server validate đúng/sai**: MC-single so với `Question.correctAnswer[0]`, fill-in-blank so chuỗi không phân biệt hoa-thường + trim (`ScoringService.validateMultipleChoiceSingle/validateFillInBlank`). Cờ `isCorrect` của client không bao giờ được tin.
- `[OBS]` **Session ownership (SCD-6)**: `session.userId` phải khớp user auth → nếu lệch trả 403 `SESSION_OWNERSHIP` (session legacy null được miễn).
- `[OBS]` UQH dual-write (`recordRankedQuestionHistory`) mirror practice để Profile đếm cả ranked; SRS: đúng→`min(30, timesCorrect×3)` ngày, sai→1 ngày. Best-effort (lỗi không làm fail câu trả lời).
- ⚠️ **`clientElapsedMs` KHÔNG bị clamp ở server** → vector lạm phát bonus tốc độ → **F-api-5**.

---

## 4. ⭐ Multiplayer room (STOMP) [OBS]

Entry: `RoomController` (REST), `api/websocket/RoomWebSocketController` (STOMP), `modules/room/service/*`.

> **Refactor 2026-06-12 (structure-only, hành vi giữ nguyên):** logic theo mode giờ nằm trong
> `modules/room/service/mode/*` — một `RoomModeStrategy` mỗi mode (SpeedRace/BattleRoyale/TeamVsTeam/
> SuddenDeath/Sequential) sau `RoomModeRegistry`; đường xử lý câu trả lời tách ra `RoomAnswerProcessor`
> (validate → chấm điểm qua strategy → persist), `RoomWebSocketController` chỉ còn STOMP concerns.
> `[✔]` SPEED_RACE end-to-end đã được user test OK trên dev 2026-06-12 (sau refactor + redesign).

### 4.1 Máy trạng thái
```
LOBBY (R1) ──/start (status=LOBBY, ≥2 người, non-host ready)──▶ IN_PROGRESS (R2–R3)
   │  join/leave→ROOM_STATE, ready→PLAYER_READY,                    │ mỗi vòng: QUESTION_START→answers→ROUND_END
   │  idle>30 phút hoặc kick người cuối → ENDED                     │ cho rejoin (LEFT→ACTIVE)
   │                                                                │ host pause/skip/broadcast/end-early
   └────────────────────────────────────────────────────────────  │ host mất kết nối→promote hoặc end
                                                                    ▼
                                              ENDED (R5): broadcast ROOM_ENDED(reason), clear Redis,
                                              chỉ xoá nếu lobby rỗng, ngược lại giữ cho analytics
```
- `[OBS]` Enum: `RoomStatus{LOBBY,IN_PROGRESS,ENDED,CANCELLED}`, `PlayerStatus{ACTIVE,ELIMINATED,SPECTATOR,LEFT}`, `RoomMode{SPEED_RACE,BATTLE_ROYALE,TEAM_VS_TEAM,SUDDEN_DEATH,GROUP_LIVE_SEQUENTIAL}`.
- `[OBS]` Tối đa **1 room active/user** (`joinRoom` → 422 `ALREADY_IN_ANOTHER_ROOM`). Rời giữa game → `LEFT` (giữ dòng để rejoin); người mới bị chặn sau khi đã start. Host mất kết nối → `promoteNextHost()` (non-host ACTIVE lâu nhất) nếu không có thì `HOST_GONE`+end.
  - `[✔ fix 2026-06-12]` **Quản trò rejoin**: host của phòng (`hostPlaysGame=false`, không có RoomPlayer row) được vào lại phòng IN_PROGRESS của chính mình (`joinRoom` carve-out, không tạo row); `computeJoinable` cũng trả `true` cho host → card lobby hiện "Vào lại". Trước đó host bị khóa vĩnh viễn (`"Phòng đã bắt đầu"`).
  - `[✔ fix V64]` Cột DB `player_status` (V10) thiếu giá trị `LEFT` → mọi ghi LEFT bị "Data truncated", luồng reconnect LEFT→ACTIVE **hỏng trên MySQL thật** (test H2 không bắt được). Đã vá bằng migration V64.
- `[OBS]` Idle timeout `biblequiz.room.idle-timeout-minutes` (mặc định 30), enforce lazy lúc join + bởi `RoomCleanupScheduler`.
- `[OBS]` **Vòng đời sau restart**: quiz loop chạy trong thread `@Async` in-memory → JVM restart làm mọi phòng IN_PROGRESS thành "zombie". `RoomAbandonmentScheduler`: (a) sweep định kỳ 5' cho phòng kẹt >90' (`STUCK_THRESHOLD_MINUTES`); (b) `[✔ fix 2026-06-12]` `recoverOrphansOnStartup` (ApplicationReadyEvent) end **tất cả** phòng IN_PROGRESS ngay lúc boot (cutoff=now, giả định single-instance).

### 4.2 "Quản trò" (host-tổ chức) vs host thường
- `[OBS]` `Room.hostPlaysGame` — **nợ đặt tên**: `true` = legacy (host có chơi); `false` = Quản trò (host KHÔNG trả lời; `RoomWebSocketController` từ chối câu trả lời của host). Quyền riêng của host (`HostControlService`, `/host/pause|resume|skip-question|broadcast|end-early`) yêu cầu `!hostPlaysGame && host==user`.

### 4.3 Các mode
- `[OBS]` **SPEED_RACE** — đua mặc định; `SpeedRaceScoringService`; kết thúc sớm khi tất cả active đã trả lời (`waitForRoundEnd` poll 250ms).
- `[OBS]` **BATTLE_ROYALE — "Sinh tồn"** (label VN ở form Tạo Phòng, `room.modes.battle_royale`) — chi tiết §4.3.1.
- `[OBS]` **TEAM_VS_TEAM** — auto-balance vào đội ít người hơn lúc join, đổi đội chỉ trong lobby; điểm đội mỗi vòng; bonus Perfect Round.
- `[OBS]` **SUDDEN_DEATH** (`SuddenDeathMatchService`) — 1v1 king-of-hill; hàng đợi theo joinedAt; cả hai đúng trong 200ms → tối đa `MAX_CONTINUES=3` rồi ai nhanh hơn thắng / champion giữ ngôi; xếp hạng `winningStreak`.
- `[OBS]` **GROUP_LIVE_SEQUENTIAL** (co-play) — host bấm sang câu thủ công (`/room/{id}/advance`, chỉ host); điểm 100/0 (không bonus thời gian); timeout an toàn 10 phút (`LEADER_ADVANCE_MAX_WAIT_SECONDS=600`).
- `[?]` **SURVIVAL** có trong spec nhưng **không thấy code server**; `CLASSIC` nhiều khả năng ≡ SPEED_RACE. (Đừng nhầm: UI "Sinh tồn" = BATTLE_ROYALE, không phải mode SURVIVAL của spec.)

#### 4.3.1 ⭐ Sinh tồn (BATTLE_ROYALE) — đào sâu 2026-06-12 [OBS]

> `[✔]` User test OK trên dev 2026-06-12 — sau canonical ranking + gate LEFT + UI "X/Y đúng".

Code: `modules/room/service/BattleRoyaleEngine` (luật loại) + `mode/BattleRoyaleStrategy` (vòng đời) +
`RoomAnswerProcessor` (gate trả lời). Spec intent: SPEC_MULTIPLAYER §3.2.

**Vòng đời một trận:**
1. `beforeLoop`: đếm ACTIVE làm `totalPlayers` (snapshot, giữ trong `ctx.modeState`), broadcast `BATTLE_ROYALE_UPDATE(total,total)`.
2. Mỗi vòng chạy chung `runStandardLoop` (QUESTION_START → thu câu trả lời → ROUND_END).
3. `afterRound` → `BattleRoyaleEngine.processRoundEnd`:
   - Lấy mọi player **ACTIVE** + tập userId trả lời **đúng** trong round.
   - **Loại**: ACTIVE mà không nằm trong tập đúng (tức **sai HOẶC không trả lời/hết giờ**) → `ELIMINATED` + `finalRank = số người sống sót + 1` (mọi người bị loại cùng vòng nhận **cùng rank**).
   - **Ân xá (amnesty)**: nếu *tất cả* ACTIVE đều sai → **không ai bị loại** (áp dụng lại mỗi vòng, không giới hạn số lần).
   - Broadcast `PLAYER_ELIMINATED{userId, username, rank, activeRemaining}` từng người + `BATTLE_ROYALE_UPDATE{activeCount, totalCount}`.
4. Dừng khi `shouldStopBeforeRound`: **≤1 ACTIVE**, hoặc hết `questionCount` câu.
5. `finishGame` → `assignFinalRanks`: ai còn ACTIVE được xếp `finalRank` theo **correctAnswers DESC → averageReactionTime ASC** (nhanh hơn thắng); leaderboard cuối sort `ORDER_BY_FINAL_RANK_ASC`.

**Luật & invariant:**
- `[OBS]` **Điểm số dùng công thức Speed Race** (legacy quirk, `BattleRoyaleStrategy.calculateScore`) — điểm chỉ để hiển thị/tie-break gián tiếp; **thắng thua quyết bởi `finalRank`**, không phải tổng điểm.
- `[OBS]` Gate trả lời (`RoomAnswerProcessor`): `ELIMINATED`/`SPECTATOR` bị từ chối im lặng — người bị loại không thể tiếp tục ghi answer.
- `[OBS]` `LEFT` ≠ `ELIMINATED` (quyết định canonical Bùi 2026-05-09, spec §3.2): rớt mạng giữa trận = `LEFT`, **được rejoin** (LEFT→ACTIVE); thua vòng = `ELIMINATED`, vĩnh viễn. Spec §5.4.5 từng muốn disconnect = ELIMINATED — đã bị bác (audit G9).
- `[OBS]` Người `LEFT` không bị tính trong vòng loại (không ACTIVE) → **rejoin sau vài vòng vẫn sống** trong khi người ở lại trả lời sai đã chết. Đây là hệ quả được chấp nhận của quyết định trên (`[CANDIDATE]` có thể bị lạm dụng làm "né vòng khó" — chưa thấy guard).
- `[OBS]` FE defaults (modeMeta): 20 câu × 20s × max 8 người; spec cho phép 3–100 player (cap nâng 2026-05-22).

**Đính chính & lệch spec↔code:**
- ✏️ **Đính chính bản draft 2026-06-11**: claim "tối đa vòng `min(qCount×2, 50)`" là **SAI as-implemented** — `shouldEndGame` là dead code, **đã xoá 2026-06-12** (cùng tests của nó). Trận chỉ chạy đúng `questionCount` vòng, không có vòng phụ.
- `[✔ chốt 2026-06-12]` Xếp hạng survivors: canonical = **correctAnswers DESC → avgReactionTime ASC** (user quyết, DECISIONS 2026-06-12; spec §3.2 đã sửa theo code). Lý do: sinh tồn = đúng là sống, score (speed-bonus phi tuyến) không đơn điệu theo số câu đúng. Wrap-up Quản trò hiển thị "X/Y đúng" làm số chính cho BR.
- `[✔ fix 2026-06-12]` Gate trả lời thêm `LEFT`: trước đây người LEFT (STOMP còn sống) vẫn submit được → cộng `correctAnswers` (chính là tie-break xếp hạng). Giờ `RoomAnswerProcessor` reject cả LEFT; rejoin không vỡ (joinRoom flip ACTIVE trước khi trả lời).

**Edge cases (từ spec, code khớp):**
- Còn 2 người, cả 2 sai → ân xá, chơi tiếp vòng kế.
- Còn 2 người, cả 2 đúng → cả 2 sống, chơi tới hết `questionCount` rồi `assignFinalRanks` phân thắng bại.
- `[?]` Tất cả ACTIVE rời phòng giữa trận (toàn LEFT) → `processRoundEnd` trả rỗng (activePlayers empty); vòng lặp tiếp tục phát câu cho phòng trống tới hết câu hoặc tới khi all-DC watchdog xử — chưa trace hết nhánh này.

### 4.4 Quickmatch (Đấu Nhanh)
- `[OBS]` Luôn tạo mới (không find-or-create), người tạo chơi như player, max 10, điều khiển Quản trò bị **từ chối** (422 `QUICK_MATCH_NO_HOST_CONTROLS`, chỉ ở REST). Bất kỳ player nào cũng start được khi ≥2 ready.
- `[OBS]` Cap ngày **3/user/ngày** (nửa đêm UTC) → 422 `DAILY_CAP_REACHED` (`DailyQuickMatchCounter`). Câu hỏi AI yêu cầu **tier ≥ 4 (Hiền Triết)** → 422 `AI_TIER_LOCKED`; payload AI ephemeral ở `Room.aiQuestionsPayload` (không persist vào `questions`).
- `[✔ fix V65, 2026-06-12]` **Ngôn ngữ câu hỏi**: phòng thường chọn câu hỏi DATABASE lúc *start* (`RoomQuizService.loadQuestionsFromDatabase`) trước đây **không lọc language** → trộn vi/en trong cùng trận (quickmatch không dính vì pre-pick có language). V65 thêm cột `rooms.language` (default `vi`), `createRoom` persist từ request, cả 4 nhánh chọn câu hỏi đều lọc theo `room.language`.

### 4.5 Catalog STOMP (sub `/topic/room/{id}`, send `/app/room/{id}/{action}`)
- `[OBS]` Lobby: `PLAYER_JOINED/LEFT/KICKED`, `PLAYER_READY/UNREADY`, `ROOM_STATE`, `ROOM_STARTING/GAME_STARTING`.
- `[OBS]` Vòng chơi: `QUESTION_START`, `ANSWER_SUBMITTED`, `ROUND_END`, `SCORE_UPDATE`, `QUIZ_END`.
- `[OBS]` Theo mode: `BATTLE_ROYALE_UPDATE`, `PLAYER_ELIMINATED`, `TEAM_ASSIGNMENT`, `TEAM_SCORE_UPDATE`, `PERFECT_ROUND`, `MATCH_START/END`, `SD_QUEUE_UPDATE`, `SEQUENTIAL_PROGRESS`, `QUESTION_REVEALED`, `NEXT_QUESTION`.
- `[OBS]` Host/hệ thống: `HOST_CHANGED`, `ROOM_ENDED(reason)`, `GAME_PAUSED/RESUMED`, `QUESTION_SKIPPED`, `HOST_BROADCAST`, `CHAT_MESSAGE`, `ERROR`.
- `[OBS]` Anti-cheat trong room: 1 câu trả lời/player/vòng (`existsByRoundIdAndUserId`); chỉ player ACTIVE được trả lời (BR/Team); server validate `answerIndex`.

---

## 5. ⭐ Daily Challenge + Mission [OBS]

### 5.1 Daily Challenge — đào sâu 2026-06-12 [OBS]

Code: `modules/daily/` (`DailyChallengeService` + `DailyCompletion` entity) + `api/DailyChallengeController`
(`/api/daily-challenge`). Intent: DECISIONS 2026-04-20 "Daily Challenge as secondary XP path"
(20 ngày Daily liên tiếp = 1.000 XP = mở Tier-2 cho người không qua nổi early-unlock).

**Chọn câu hỏi (tất định, chung cho mọi người):**
- `[OBS]` **5 câu/ngày** (`DAILY_QUESTION_COUNT=5`), seed `date.toEpochDay()*31 + lang.hashCode()` → cùng ngày + cùng ngôn ngữ = cùng đề cho tất cả user. Lọc `language` + `isActive`; chọn theo **offset ngẫu nhiên** vào danh sách (PageRequest từng câu). Cache Redis 24h key `daily_challenge:{lang}:{date}`.
- `[OBS]` "Hôm nay" của đề + completion = `GameClock.today()` (**giờ VN**).
- `[CANDIDATE]` Đề trong ngày có thể lệch nếu admin thêm/tắt câu hỏi giữa ngày (offset trượt) — cache 24h che hầu hết, multi-instance dùng chung Redis nên nhất quán.

**Vòng đời một lượt chơi:**
1. `GET /api/daily-challenge` (public, guest OK) — trả 5 câu **đã strip đáp án** (anti-spoiler); chỉ khi `alreadyCompleted=true` mới kèm `correctAnswer`+`explanation` (phục vụ modal "Xem lại").
2. `POST /start` — sessionId chỉ là chuỗi client-side tracking (`daily-{date}-{ts}`), **không có QuizSession thật**.
3. `POST /answer` từng câu (public) — server chấm (`checkAnswer`), trả isCorrect + đáp án + giải thích; nếu đã đăng nhập thì wire vào mission tracker (`answer_correct` + `answer_combo`).
4. `POST /complete` (cần auth) — client gửi `{score, correctCount}`; idempotent qua `hasCompletedToday`. **≥4/5 đúng → +50 XP** (`DAILY_COMPLETION_XP`, cố định — score gửi lên KHÔNG được cộng).
5. `GET /result` · `GET /history` (heatmap ≤90 ngày, ngày thiếu trả `completed:false`) · `GET /yesterday-summary` (recap hero card).

**XP & tích hợp:**
- `[OBS]` `creditCompletionXp` cộng +50 vào `UserDailyProgress.pointsCounted` (cùng sổ cái với Ranked — "one canonical per-day points ledger") + `invalidateLeaderboards()` → Daily XP **có** lên leaderboard daily/weekly/season/all-time.
- `[OBS]` Hoàn thành → `streakService.recordActivity()` (nối streak, idempotent) + mission `complete_daily_challenge`. Cả hai best-effort (fail không chặn XP).
- `[OBS]` Lưu trữ 2 tầng: Redis 48h (key `completed:{user}:{date}`, phục vụ idempotency + result) + bảng `daily_completions` (unique `(user_id, completion_date)`, phục vụ heatmap/recap dài hạn).

**⚠️ verify-gỡ-oan — client-claimed score:**
- `[OBS]` `POST /complete` **tin client** về `score`/`correctCount` — server không chấm lại cả bài. Nhưng đây là **trade-off có chủ ý, ghi ngay trong javadoc `CompleteDailyChallengeRequest`**, và bị chặn biên: `correctCount ≤ 5`, `score ≤ 10.000`, phần thưởng leaderboard duy nhất là **+50 XP cố định** (score tự khai chỉ vào display/history, không vào pointsCounted). Trần lạm dụng = +50 XP/ngày — đúng bằng chơi thật điểm cao → không phải lỗ hổng leaderboard đáng kể. Khác hẳn Ranked (server-recompute SCD-3) vì ở đây phần thưởng phẳng.

**Findings (phát hiện + fix cùng ngày 2026-06-12):**
- **F-api-13 ✔ FIXED** — `nextResetAt` từng dán nhãn nửa đêm VN thành instant UTC (countdown lệch tới 07:00 VN); giờ dùng `atStartOfDay(GameClock.GAME_ZONE)`.
- **F-api-14 ✔ FIXED** — controller từng dùng `LocalDate.now(UTC)` cho field `date`/sessionId trong khi service key theo GameClock VN (lệch trong khung 00:00–07:00 VN); controller giờ dùng `GameClock.today()` toàn bộ.
- **F-api-15 ✔ FIXED** — idempotency +50 XP từng chỉ dựa Redis (flush giữa ngày → cộng đôi); giờ row `daily_completions` hôm nay cũng chặn re-credit (pin trong `markCompleted_shouldSkipInsertWhenAlreadyPersistedToday`).
- `[OBS]` **Daily Mission** (`DailyMissionService`): **3/ngày, template theo tier** (T1–T6). Loại gồm `answer_correct`, `answer_combo`, `play_any_mode`, `ranked_score`, `win_multiplayer_room`, `complete_speed_round`, v.v. Mission combo lưu target = độ dài chuỗi. Hoàn thành cả 3 → **+50 XP bonus** (`checkAndGrantBonus` set `bonusClaimed=true` atomic).
  - ⚠️ `[?]` việc **cộng** XP bonus được ủy thác cho caller (luồng scored-session) — verify +50 có thực sự được cộng → **F-api-6**.

---

## 6. ⭐ Liturgical Coverage (Mùa + Badge) [OBS]

- `[OBS]` **4 mùa/năm dương lịch, theo quý** (`SeasonSeeder`, idempotent id `season-{year}-q{1-4}`): **Mùa Phục Sinh** (Q1 Jan–Mar), **Mùa Ngũ Tuần** (Q2 Apr–Jun), **Mùa Cảm Tạ** (Q3 Jul–Sep), **Mùa Giáng Sinh** (Q4 Oct–Dec). (C3.)
- `[OBS]` Mùa active resolve theo **khoảng ngày, không theo cờ `isActive`** (`SeasonService`, tiebreak `OrderByIsActiveDescStartDateDesc` sau sự cố rò test-data 2026-05-14, DECISIONS).
- `[OBS]` **Focus books** mỗi mùa (3–5) vừa drive Climax tuần 9–11 vừa cho **×1.5 điểm** (`LiturgicalSeasonService.isInSeasonFocus(date, book)` → tiêu thụ bởi `ScoringService`). Migration V63 đổi tên "Song of Solomon" → tên sách canonical.
- `[OBS]` **Coverage** (`LiturgicalCoverageService`, `UserSeasonCoverage` unique `(user,season)`): ngưỡng **4 câu/sách**; tuần hoàn thành khi đủ 6 sách covered; **13 tuần** (11 thường + 2 mastery). Mở tuần kế cần tuần hiện tại đã xong, chưa ở tuần 13, lệch ≤1 tuần. Người vào trễ bắt đầu ở tuần dương lịch. Pool = sách của tuần trừ sách đã covered; tuần mastery (12–13) = mọi sách chưa covered (không có mốc hoàn thành). Cạn pool → fallback 3 tầng (bỏ loại trừ trong-ngày → bỏ filter độ khó → `poolExhausted + UNLOCK_NEXT_WEEK` cho FE).
- `[OBS]` **Badge** (`BadgeAwardService`/`BadgeTierCalculator`, `UserSeasonBadge` unique): theo **kết thúc mùa dương lịch** (không phải tuần 13). Hạng theo số sách covered: `66→TOÀN_THƯ`, `51–65→TẬN_TÂM`, `21–50→HÀNH_HƯƠNG`, `≤20→NONE`. Scheduler 00:05 UTC hằng ngày + 02:00 UTC reconcile cửa sổ 7 ngày. Accuracy là **all-time, không theo mùa** (xấp xỉ có chủ ý) → **F-api-7**.

---

## 7. Streak, Group, Quiz Set, Lifeline, Leaderboard [OBS]

### 7.1 Streak (theo user)
- `[OBS]` `StreakService`: tăng khi hoạt động ngày liên tiếp (cùng ngày idempotent); đứt khi cách ≥2 ngày → reset về 1 **trừ khi** dùng freeze tuần tự động (1/tuần, khi `daysSinceLastPlay==2`). Bonus: 3+ ngày ×1.10, 7+ ngày ×1.15. `lastPlayedAt` theo **UTC** (lệch zone, nhỏ).
- `[?]` `resetWeeklyStreakFreeze()` có tồn tại nhưng **không tìm thấy `@Scheduled` nào gọi** → freeze có thể không bao giờ reset → **F-api-8**.

### 7.2 Church Group (`modules/group`, `ChurchGroupController`)
- `[OBS]` `ChurchGroupService`: tối đa **2 owned / 5 joined** mỗi user; group code 6 ký tự unique; tối đa **200** thành viên; **cooldown kick 7 ngày** (`KICK_COOLDOWN_DAYS`); **LEADER không được rời**. Role `GroupRole{LEADER(1), MOD(*), MEMBER}`. Soft-delete (`deletedAt`), admin lock (`isLocked`).
- `[OBS]` `GroupMember.lastActiveAt` khởi tạo = `joinedAt` (V32); cập nhật hoạt động thật (Phase 0.5) **hoãn** → filter "inactive" hiện key theo ngày join → **F-api-9**.
- `[OBS]` **Group leaderboard** (`getLeaderboard()`): sum `UserDailyProgress.pointsCounted` theo từng member theo period; **không cache** (O(members×ngày)) → **F-api-10**. **Group streak** (`GroupStreakService`): ngày active nếu ≥1 member `questionsCounted>0` (zone VN).

### 7.3 Quiz Set & Mastery
- `[OBS]` `GroupQuizSet` (`PublishStatus DRAFT→PUBLISHED→ARCHIVED/SOFT_DELETED`), `questionIds` JSON, folder (`GroupQuizSetFolder`), MOD/LEADER quản lý.
- `[OBS]` **Mastery** (`GroupQuizSetMasteryService`, "Q-A SAFE"): dedup ID đã học, best score/accuracy, `completedMastery` khi học hết. **Cô lập** khỏi group leaderboard & `UserDailyProgress` (chỉ solo-practice). Prestige **không** xoá mastery.
- `[OBS]` **Scheduled quiz** (`ScheduledQuizService`, Feature B): snapshot câu hỏi bất biến lúc tạo; tối đa **3 ACTIVE/group**; `maxAttempts` mặc định 3 (best score tính); deadline ≥5 phút sau; `ACTIVE→ENDED(cron)/CANCELLED`; notification tùy chọn (PN-1). Snapshot có thể treo nếu một `Question` bị xoá → **F-api-11**.

### 7.4 Lifeline (`modules/lifeline`)
- `[OBS]` **HINT** (đã ship): loại 1 đáp án sai; quota theo mode (`LifelineConfigService`: practice −1/không giới hạn, ranked/single/weekly/mystery 2, speed_round 0). Thuật toán `HintAlgorithmService`: COMMUNITY_INFORMED (pick-rate thấp nhất trong cửa sổ 90 ngày nếu ≥10 mẫu) ngược lại RANDOM. Idempotent qua `LifelineUsage` unique `(session,question,user,type,eliminatedIdx)`. Không cho true_false/fill_in_blank. Enum `ASK_OPINION` có nhưng **hoãn** (cold-start) — luôn `askOpinionAvailable=false`.

### 7.5 Leaderboard (`LeaderboardController`, `CacheService`)
- `[OBS]` Phạm vi: daily / weekly (T2–CN giờ VN, clamp tới hôm nay) / monthly / all-time / season — đều trên `UserDailyProgress.pointsCounted`. Cache Redis `LEADERBOARD_TTL=60s`, invalidate khi submit ranked/daily. My-rank = usersAhead+1.

### 7.6 Prestige
- `[OBS]` `PrestigeService.executePrestige()`: yêu cầu T6, ≥30 ngày ở T6, `prestigeLevel<3`. `[✔ fix 2026-06-12, V66]` Reset XP bằng **offset** (`users.prestige_xp_offset` = tổng sổ cái lúc prestige); tier/progression đọc `SUM − offset` clamp ≥0 (`UserTierService.getTotalPoints`), leaderboard đọc sổ cái thô nên **không còn bị viết lại hồi tố** (trước đây set 0 mọi dòng lịch sử — F-api-12).

---

## 8. Findings / Risks

- **F-api-1 ⚪ GỠ OAN 2026-06-12 (từng gắn 🔴 nhầm)** — verify bằng DB thật: `lastUpdatedAt` (`@UpdateTimestamp`) lưu **UTC** (chơi 11:55 VN → DB ghi 04:55), cùng đồng hồ với `LocalDateTime.now(ZoneOffset.UTC)` trong `recoverEnergy()` → phép đo regen **tự nhất quán, không lệch**. Reset nửa đêm VN cũng không đi qua regen — dòng `UserDailyProgress` mới theo `(user, ngày-VN)` cấp 100 lives ngay khi `GameClock.today()` lật. Kịch bản "khóa sớm 7 tiếng" không xảy ra. **Nợ còn lại (hardening)**: luồng trộn 3 nguồn giờ (@UpdateTimestamp / now(UTC) hardcode / GameClock VN) đang *tình cờ* khớp — đổi JVM TZ hoặc JDBC serverTimezone sẽ làm regen lệch −7h im lặng (elapsed âm → không hồi). Fix rẻ khi tiện: chuyển cặp đo sang `Instant`.
- **F-api-2 🟡 Reset ngày là lazy** — `UserDailyProgress` tạo ở `getRankedStatus()`. `[?]` Nếu client không bao giờ gọi endpoint status thì cap/lives có bị kẹt? Xác nhận không entry nào khác tạo dòng này.
- **F-api-3 ⚪ GỠ OAN 2026-06-12** — code cap=100 **đã khớp SPEC_USER_v3.2** ("Cap 100 câu/ngày, 100 energy/ngày"). Con số 50 chỉ sót ở README.md (đã sửa). Không phải lỗi logic.
- **F-api-4 ⚪ Bonus `isDailyFirst` ×2 chết** — nhánh có trong `ScoringService`, hardcode `false` ở ranked. Nợ logic.
- **F-api-5 ✔ FIXED 2026-06-12** — `clientElapsedMs` giờ clamp `[0, TIME_LIMIT_MS]` đầu `ScoringService.calculate`; trước đây thiếu cận trên → forged âm đẩy speedRatio>1, bonus ~18× (inflate điểm ranked/tier/leaderboard). Pin 2 test (negative + over-time).
- **F-api-6 🟡 Cộng XP bonus daily-mission** — `checkAndGrantBonus` set `bonusClaimed` nhưng ủy thác việc cộng +50 cho caller; verify thực sự được cộng.
- **F-api-7 ⚪ Accuracy badge all-time** — không theo mùa (xấp xỉ đã thừa nhận).
- **F-api-8 ✔ FIXED 2026-06-12** — streak-freeze reset giờ **lazy** trong `StreakService.recordActivity` (khi activity sang tuần ISO mới so với lần chơi trước, VN) thay vì cần scheduler; trước đây `resetWeeklyStreakFreeze` không có caller → freeze "1/tuần" tụt thành "1/đời". Pin test.
- **F-api-9 🟡 Group `lastActiveAt` = joinedAt** — cập nhật hoạt động thật (Phase 0.5) hoãn; filter "inactive" không đáng tin.
- **F-api-10 ⚪ Group leaderboard không cache** — tính lại mỗi request; chậm khi gần 200 member.
- **F-api-11 🟡 Snapshot scheduled-quiz treo FK** — `Question` bị xoá để lại ID mồ côi; submission phải null-guard (chưa verify).
- **F-api-12 ✔ FIXED 2026-06-12 (V66)** — prestige chuyển từ tẩy sổ cái sang offset (DECISIONS 2026-06-12): `prestige_xp_offset` + `getTotalPoints = max(0, ledger − offset)`; leaderboard/lịch sử bất biến.

## 9. Open Questions [?]

1. Spec 50 vs code 100 cap ranked — cái nào canonical hiện tại? (F-api-3)
2. Có path nào ngoài `getRankedStatus()` tạo dòng `UserDailyProgress` ngày không? (F-api-2)
3. XP bonus daily-mission thực sự được cộng ở đâu? (F-api-6)
4. Freeze tuần có bao giờ được reset (cron ngoài)? (F-api-8)
5. ~~Prestige có ý xoá sạch điểm all-time không?~~ `[✔ chốt 2026-06-12]` Không — chỉ reset XP hiệu dụng qua offset (V66).
6. Mode multiplayer `SURVIVAL` — kế hoạch hay đã bỏ? `CLASSIC` == `SPEED_RACE`?
7. Cap ngày quickmatch reset lúc nửa đêm **UTC** trong khi các daily khác dùng VN — có chủ ý?

---

> **Liên kết:** spec ý đồ [docs/spec/](../../docs/spec/) (SPEC_USER, SPEC_MULTIPLAYER, SPEC_GROUP, SPEC_ADMIN, BACKLOG) ·
> companion FE [apps/web/DOMAIN.md](../web/DOMAIN.md) · quyết định [DECISIONS.md](../../DECISIONS.md).
