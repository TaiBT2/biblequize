# 2026-05-05 — Group Page redesign: Feature A "Chơi cùng nhau" + Feature B "Đặt lịch chơi" [TODO]

> **Source:** `docs/group-page/feature_A_chơi_cùng_nhau.html` + `feature_B_dat_lich_choi.html` (3-tab mockup mỗi feature).
> **Branch:** `feature/group-live-and-scheduled`
> **Survey baseline (2026-05-05):**
> - Group module BE đầy đủ: `ChurchGroup`, `GroupMember` (roles LEADER/MOD/MEMBER), `GroupAnnouncement`, `GroupQuizSet` (column `question_ids` JSON).
> - Room module BE đầy đủ: `Room` entity với enum `RoomMode {SPEED_RACE, BATTLE_ROYALE, TEAM_VS_TEAM, SUDDEN_DEATH}` (Room.java:102), V37 đã thêm `group_quiz_set_id` vào rooms table.
> - Cron pattern: `NotificationScheduler`, `SessionAbandonmentScheduler` dùng `@Scheduled`.
> - FE pages: `Groups.tsx`, `GroupDetail.tsx`, `GroupAnalytics.tsx`, `RoomLobby.tsx`, `RoomQuiz.tsx`, hook `useStomp`.
> - **Latest migration: V38** → Feature A bắt đầu V39, Feature B nối tiếp.
>
> **Decisions Bui (2026-05-05):**
> - **PN-1:** Push notification = **in-app DB only** cho v1 (reuse `NotificationService`, không build FCM/Web Push). 3 events: publish, 24h-remaining, ended.
> - **PN-2:** Discussion pause Feature A = **leader-controlled manual** (không countdown tự động). Sau reveal → leader bấm "Sang câu tiếp" → next question. UX phù hợp nhóm tế bào (discussion dài/ngắn tự nhiên).
> - **PN-3:** Max 3 active scheduled quiz per group = **enforce ở cả BE + FE** (FE disable button khi >=3 active, BE reject create thứ 4 với 400 error như safety net).

---

## Feature A — "Chơi cùng nhau" (Live Multiplayer Sequential) [Estimate: M, 4-5 ngày]

> **Reuse:** Room infra (entity, RoomService, RoomQuizService, WebSocket, RoomLobby/RoomQuiz UI).
> **Build new:** RoomMode enum value, SequentialScoringService, pause logic, lobby/quiz UI conditional, Group Home section.

### Task A-1: BE — V39 migration + RoomMode enum [ ] TODO
- File(s):
  - `apps/api/src/main/resources/db/migration/V39__add_group_live_sequential_mode.sql` (NEW)
  - `apps/api/src/main/java/com/biblequiz/modules/room/entity/Room.java` (add enum value)
- Spec: Thêm enum value `GROUP_LIVE_SEQUENTIAL` vào RoomMode. Migration nếu cần update enum CHECK constraint (verify cách V3__rooms.sql định nghĩa column `mode`).
- Checklist:
  - [ ] Đọc V3__rooms.sql để xem `mode` column type (VARCHAR enum vs CHECK)
  - [ ] V39 migration update constraint (nếu có)
  - [ ] Add `GROUP_LIVE_SEQUENTIAL` vào enum Room.java line 102
  - [ ] Compile pass: `./mvnw compile -q`
  - [ ] Commit: `feat(room): add GROUP_LIVE_SEQUENTIAL room mode`

### Task A-2: BE — SequentialScoringService [ ] TODO
- File(s):
  - `apps/api/src/main/java/com/biblequiz/modules/room/service/SequentialScoringService.java` (NEW)
  - `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomQuizService.java` (wire mới)
- Spec: Logic chờ tất cả player answer trước khi advance question. Sau khi all-answered → broadcast `question_revealed` (đáp án + explanation + per-player answers). **Leader bấm nút "Sang câu tiếp" thủ công** (PN-2) → broadcast `next_question`. Score = correct? 100 : 0 (no time bonus, không speed-based).
- Checklist:
  - [ ] Service method `recordAnswer(roomId, userId, questionId, answer)` returns `{allAnswered: bool, answeredCount, totalPlayers}`
  - [ ] Method `advanceToNextQuestion(roomId, leaderId)` — authorize caller phải là host, broadcast `next_question`
  - [ ] Wire trong RoomQuizService: nếu `room.mode == GROUP_LIVE_SEQUENTIAL` → dùng SequentialScoringService thay SpeedRaceScoringService
  - [ ] Compile pass
  - [ ] Commit: `feat(room): SequentialScoringService for group live mode`

### Task A-3: BE — WebSocket events `question_revealed` + leader-advance command [ ] TODO
- File(s): `apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java`
- Spec:
  - Broadcast `QUESTION_REVEALED` qua `/topic/room/{roomId}` payload `{questionId, correctAnswer, explanation, perPlayerAnswers: [{userId, answer, isCorrect}]}` — sau khi all-answered
  - Inbound STOMP message `/app/room/{roomId}/advance` (leader-only) → trigger `advanceToNextQuestion` → broadcast `NEXT_QUESTION` payload `{questionIndex, question}`
- Checklist:
  - [ ] Add 2 message types vào RoomMessage.MessageType enum (`QUESTION_REVEALED`, `NEXT_QUESTION`)
  - [ ] Broadcast `QUESTION_REVEALED` trong SequentialScoringService callback (when allAnswered=true)
  - [ ] @MessageMapping handler cho `/advance` — authorize host, reject nếu chưa all-answered
  - [ ] Compile pass
  - [ ] Commit: `feat(ws): question_revealed + leader advance events`

### Task A-4: BE — Endpoint `POST /api/groups/{id}/live-quiz` [ ] TODO
- File(s):
  - `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` (add endpoint)
  - `apps/api/src/main/java/com/biblequiz/modules/group/service/ChurchGroupService.java` (createLiveQuiz method)
- Spec: Body `{quizSetId, questionsCount?}` → tạo Room với `mode=GROUP_LIVE_SEQUENTIAL`, `groupQuizSetId=...`, host = caller. Response `{roomId, roomCode}`. Authorize: caller phải là LEADER hoặc MOD của group. (Không cần `discussionPauseSeconds` — PN-2 leader-controlled).
- Checklist:
  - [ ] Authorize check (LEADER/MOD)
  - [ ] Create Room reuse RoomService
  - [ ] Compile pass + Postman test
  - [ ] Commit: `feat(group): POST /api/groups/{id}/live-quiz endpoint`

### Task A-5: BE — Tests [ ] TODO
- File(s):
  - `apps/api/src/test/java/com/biblequiz/modules/room/service/SequentialScoringServiceTest.java` (NEW)
  - `apps/api/src/test/java/com/biblequiz/api/ChurchGroupControllerTest.java` (extend)
- Test cases:
  - [ ] recordAnswer returns allAnswered=false khi 2/5 đã trả lời
  - [ ] recordAnswer returns allAnswered=true khi 5/5
  - [ ] advanceAfterDiscussion broadcast next_question event
  - [ ] POST live-quiz reject nếu caller chỉ là MEMBER
  - [ ] POST live-quiz success cho LEADER + MOD
  - [ ] Tests pass: `./mvnw test -Dtest="SequentialScoringServiceTest,ChurchGroupControllerTest"`
  - [ ] Commit: `test(room,group): SequentialScoring + live-quiz endpoint`

### Task A-6: FE — TypeScript types + API client [ ] TODO
- File(s):
  - `apps/web/src/api/groups.ts` (extend) hoặc `apps/web/src/api/rooms.ts`
  - `apps/web/src/types/room.ts` (nếu có) — add `GROUP_LIVE_SEQUENTIAL`
- Spec: Function `createGroupLiveQuiz(groupId, {quizSetId, ...})` → POST endpoint A-4. Add WS message types cho `QUESTION_REVEALED`, `DISCUSSION_PAUSE`.
- Checklist:
  - [ ] API function + types
  - [ ] Vitest mock pass
  - [ ] Commit: `feat(api): client for group live-quiz`

### Task A-7: FE — Group Home "Quiz nhóm" section [ ] TODO
- File(s): `apps/web/src/pages/GroupDetail.tsx`
- Spec: Thêm section "Quiz nhóm" trên Group Home (theo mockup A annotation). 2 CTA buttons:
  - "Chơi cùng nhau" (Feature A) → mở dialog chọn QuizSet → POST /live-quiz → navigate `/rooms/:roomId`
  - "Đặt lịch chơi" (Feature B placeholder, disable trước khi B ship)
- Checklist:
  - [ ] Section UI match mockup tokens (glass-card, gold-gradient CTA)
  - [ ] QuizSet picker dialog (reuse existing list từ GroupQuizSet API)
  - [ ] Create-and-navigate flow
  - [ ] **E2E Gate**: TC spec mới trong `tests/e2e/playwright/specs/happy-path/W-M{xx}-group.md` — TC "Leader tạo live-quiz từ Group Home → vào RoomLobby"
  - [ ] Vitest cho section
  - [ ] Commit: `feat(group): Quiz nhóm section + live-quiz launcher`

### Task A-8: FE — RoomLobby support GROUP_LIVE_SEQUENTIAL [ ] TODO
- File(s): `apps/web/src/pages/RoomLobby.tsx`
- Spec: Khi `room.mode === 'GROUP_LIVE_SEQUENTIAL'`:
  - Header show group name + room name (mockup: "Phòng 'Ôn bài tối thứ Sáu' · FMC Đà Nẵng")
  - Config strip 3 cells (questions count / time per question / "Tuần tự — Có pause")
  - Players grid với host crown 👑, status badges (Trưởng/Sẵn sàng/Đang vào)
  - Hint text "Người vào sau sẽ không tham gia được"
- Checklist:
  - [ ] Conditional rendering match mockup pixel-perfect
  - [ ] Vitest cho conditional branch
  - [ ] Commit: `style(room): RoomLobby support group live mode`

### Task A-9: FE — RoomQuiz waiting strip + question_revealed handling [ ] TODO
- File(s): `apps/web/src/pages/RoomQuiz.tsx`
- Spec:
  - Sau khi user submit answer trong GROUP_LIVE_SEQUENTIAL → show **waiting strip tím** (mockup tab 2): icon hourglass + "Chờ N người trả lời..." + dots progress (done/pending)
  - Receive WS `QUESTION_REVEALED` → show correct answer overlay + explanation + per-player answers
  - **Leader-only nút "Sang câu tiếp →"** (PN-2) hiện sau reveal → click → send STOMP `/app/room/{id}/advance`
  - Member thấy text "Đang chờ trưởng phòng tiếp tục..."
  - Receive WS `NEXT_QUESTION` → render câu mới
- Checklist:
  - [ ] Waiting strip component
  - [ ] Reveal overlay component (correct answer + explanation + per-player answers list)
  - [ ] Leader advance button (conditional render khi `isHost && state === 'revealed'`)
  - [ ] Member waiting-for-leader hint
  - [ ] WS handlers cho `QUESTION_REVEALED` + `NEXT_QUESTION`
  - [ ] STOMP send `/advance` action
  - [ ] Vitest cho từng state (answering / waiting / revealed / waiting-for-leader)
  - [ ] **E2E**: TC "2 player live-quiz: cả 2 trả lời → reveal → leader advance → next question" (Playwright 2 browser context)
  - [ ] Commit: `feat(room): waiting strip + reveal + leader advance UI`

### Task A-10: FE — Final screen với podium [ ] TODO
- File(s): `apps/web/src/pages/RoomQuiz.tsx` hoặc tách `RoomFinal.tsx`
- Spec: Match mockup tab 3 — 🎉 banner + podium top 3 + full leaderboard (rank/avatar/name/accuracy/avg time/score) + actions "Chia sẻ kết quả" + "Tạo phòng mới" (chỉ leader).
- Checklist:
  - [ ] Podium 3-col grid với medals
  - [ ] Leaderboard list highlight "Bạn"
  - [ ] "Tạo phòng mới" reuse same QuizSet → POST /live-quiz
  - [ ] Vitest
  - [ ] Commit: `feat(room): final screen group live with podium`

### Task A-11: Full regression Feature A [ ] TODO
- Checklist:
  - [ ] `./mvnw test -Dtest="com.biblequiz.api.**,com.biblequiz.service.**,com.biblequiz.modules.**"`
  - [ ] `cd apps/web && npx vitest run`
  - [ ] `cd apps/web && npx playwright test tests/e2e/happy-path/web-user/W-M{xx}-group*.spec.ts`
  - [ ] Số test >= baseline 733
  - [ ] Manual smoke: 2 browser, 1 leader + 1 member, full live-quiz flow
  - [ ] Update TC-TODO.md: A's TCs ✅
  - [ ] Commit: `test: full regression Feature A pass`

---

## Feature B — "Đặt lịch chơi" (Async Scheduled Quiz) [Estimate: L, 9-11 ngày]

> **Reuse:** GroupQuizSet (question source), GroupAnnouncement (auto-post winner), Scheduler pattern.
> **Build new:** 2 tables, full lifecycle (create/play/freeze), cron job, FE pages 3-state.

### Task B-1: BE — V40 migration scheduled_quizzes + attempts [ ] TODO
- File(s):
  - `apps/api/src/main/resources/db/migration/V40__scheduled_quizzes.sql` (NEW)
- Schema:
  ```
  scheduled_quizzes (
    id BINARY(16) PK,
    group_id BINARY(16) FK,
    quiz_set_id BINARY(16) FK,
    snapshot_question_ids JSON,  -- snapshot lúc create để Quiz Set bị xóa cũng OK
    name VARCHAR(255),
    description TEXT,
    deadline TIMESTAMP,
    status ENUM('ACTIVE','ENDED','CANCELLED'),
    max_attempts INT DEFAULT 3,
    is_leaderboard_public BOOLEAN DEFAULT TRUE,
    send_notifications BOOLEAN DEFAULT TRUE,
    noti_24h_sent_at TIMESTAMP NULL,  -- PN-1: để cron 24h-remaining idempotent
    winner_user_id BINARY(16) NULL,
    winner_score INT NULL,
    created_by BINARY(16),
    created_at, updated_at, ended_at NULL
  )
  scheduled_quiz_attempts (
    id BINARY(16) PK,
    scheduled_quiz_id BINARY(16) FK,
    user_id BINARY(16) FK,
    attempt_number INT,  -- 1/2/3
    score INT,
    correct_count INT,
    total_questions INT,
    time_seconds INT,
    started_at, completed_at,
    UNIQUE (scheduled_quiz_id, user_id, attempt_number)
  )
  ```
- Index: `(group_id, status, deadline)` cho cron query.
- Checklist:
  - [ ] V40 SQL idempotent (`IF NOT EXISTS`)
  - [ ] Apply migration trên DB local pass
  - [ ] Commit: `feat(db): V40 scheduled_quizzes + attempts`

### Task B-2: BE — Entities + Repositories [ ] TODO
- File(s):
  - `apps/api/src/main/java/com/biblequiz/modules/group/entity/ScheduledQuiz.java` (NEW)
  - `.../entity/ScheduledQuizAttempt.java` (NEW)
  - `.../repository/ScheduledQuizRepository.java` (NEW)
  - `.../repository/ScheduledQuizAttemptRepository.java` (NEW)
- Repo methods cần:
  - `findByGroupIdAndStatus(groupId, ACTIVE)`
  - `findByStatusAndDeadlineBefore(ACTIVE, now)` — cron query
  - `findByScheduledQuizIdAndUserId(quizId, userId)` — list attempts
  - `findTopByScheduledQuizIdAndUserIdOrderByScoreDesc(quizId, userId)` — best attempt
- Checklist:
  - [ ] 2 entities với UUID v7 + audit fields
  - [ ] 2 repositories
  - [ ] JsonListConverter cho `snapshot_question_ids`
  - [ ] Compile pass
  - [ ] Commit: `feat(group): ScheduledQuiz entities + repos`

### Task B-3: BE — ScheduledQuizService (CRUD + play logic) [ ] TODO
- File(s): `apps/api/src/main/java/com/biblequiz/modules/group/service/ScheduledQuizService.java` (NEW)
- Methods:
  - `create(groupId, creatorId, dto)` — authorize LEADER/MOD, snapshot questionIds, **enforce max-3-active per group (PN-3 BE safety net)**: count ACTIVE quizzes for group, reject với 400 + code `MAX_ACTIVE_QUIZZES_REACHED` nếu >=3
  - `list(groupId, statusFilter)`
  - `getDetail(quizId, viewerId)` — include myAttempts, myBest
  - `startAttempt(quizId, userId)` — validate deadline + attempts < max, return questions từ snapshot
  - `submitAttempt(quizId, userId, attemptDto)` — score + persist attempt, return result
  - `getLeaderboard(quizId, viewerId)` — aggregate best score per user; respect `is_leaderboard_public`
- Checklist:
  - [ ] Service methods + authorize
  - [ ] Snapshot logic (clone questionIds at create time)
  - [ ] Compile pass
  - [ ] Commit: `feat(group): ScheduledQuizService CRUD + play`

### Task B-4: BE — Endpoints (5 routes) [ ] TODO
- File(s): `apps/api/src/main/java/com/biblequiz/api/ScheduledQuizController.java` (NEW)
- Endpoints:
  - `POST /api/groups/{id}/scheduled-quizzes` — create (LEADER/MOD)
  - `GET  /api/groups/{id}/scheduled-quizzes?status=ACTIVE|ENDED` — list
  - `GET  /api/groups/{id}/scheduled-quizzes/{quizId}` — detail (with myStatus)
  - `POST /api/groups/{id}/scheduled-quizzes/{quizId}/attempts` — start + submit (atomic)
  - `GET  /api/groups/{id}/scheduled-quizzes/{quizId}/leaderboard`
- Checklist:
  - [ ] Controller + DTO request/response
  - [ ] @PreAuthorize cho create/cancel
  - [ ] Compile pass
  - [ ] Commit: `feat(api): scheduled-quiz endpoints`

### Task B-5: BE — Cron job freeze + auto-announcement [ ] TODO
- File(s): `apps/api/src/main/java/com/biblequiz/modules/group/service/ScheduledQuizScheduler.java` (NEW)
- Spec:
  - `@Scheduled(cron = "0 * * * * *")` — chạy mỗi phút
  - Query `findByStatusAndDeadlineBefore(ACTIVE, now())`
  - Per quiz: compute winner (top score), set status=ENDED, ended_at=now, winner_user_id, winner_score
  - Auto-create GroupAnnouncement: "🎊 Quiz '{name}' đã kết thúc! Người chiến thắng: {winnerName} với {winnerScore} điểm"
  - **In-app notifications (PN-1) qua existing NotificationService**: 3 events
    - On `create()` trong B-3: gửi notification cho all group members ("Quiz mới: '{name}' deadline {date}")
    - **24h-remaining job** (riêng cron `0 0 * * * *` mỗi giờ): query quizzes ACTIVE deadline trong 24-25h tới + chưa gửi 24h-noti (cần thêm column `noti_24h_sent_at`?) → gửi noti
    - On scheduler END: gửi noti "Quiz '{name}' đã kết thúc! Winner: {name}"
  - **Idempotency**: chỉ process status=ACTIVE → set ENDED atomic (không double-fire)
- Checklist:
  - [ ] Scheduler class + cron
  - [ ] Atomic transition logic (use @Transactional + status check trong query)
  - [ ] Tích hợp AnnouncementService.create
  - [ ] Compile pass
  - [ ] Commit: `feat(group): scheduled-quiz freeze cron + auto-announcement`

### Task B-6: BE — Tests [ ] TODO
- File(s):
  - `.../ScheduledQuizServiceTest.java` (NEW)
  - `.../ScheduledQuizSchedulerTest.java` (NEW)
  - `.../ScheduledQuizControllerTest.java` (NEW)
- Test cases:
  - [ ] Create reject nếu đã có 3 active quizzes (PN-3 enforcement)
  - [ ] Create reject nếu MEMBER (chỉ LEADER/MOD)
  - [ ] startAttempt reject nếu past deadline
  - [ ] startAttempt reject nếu đã đạt 3 attempts
  - [ ] getLeaderboard returns best score per user
  - [ ] Scheduler ENDS quiz đúng deadline + post announcement
  - [ ] Scheduler idempotent (chạy 2 lần = 1 announcement)
  - [ ] Tests pass
  - [ ] Commit: `test(group): scheduled-quiz coverage`

### Task B-7: FE — TypeScript types + API client [ ] TODO
- File(s): `apps/web/src/api/scheduledQuiz.ts` (NEW), `apps/web/src/types/scheduledQuiz.ts` (NEW)
- Spec: 5 functions tương ứng 5 endpoints. TanStack Query hooks.
- Checklist:
  - [ ] API client + types
  - [ ] `useScheduledQuizzes(groupId)`, `useScheduledQuizDetail(quizId)`, `useCreateScheduledQuiz()`, `useSubmitAttempt()` hooks
  - [ ] Vitest mock
  - [ ] Commit: `feat(api): scheduled-quiz client + hooks`

### Task B-8: FE — Tab 1 "Tạo lịch" form [ ] TODO
- File(s): `apps/web/src/pages/ScheduledQuizCreate.tsx` (NEW), routing trong main.tsx
- Spec match mockup: form-card với name + description + Quiz Set selector + deadline preset chips (24h/7 ngày/14 ngày/Tùy) + 3 toggles + nút "Đặt lịch & Thông báo".
- Checklist:
  - [ ] Form fields + validation
  - [ ] QuizSet picker (reuse existing)
  - [ ] Deadline preset → compute timestamp
  - [ ] **PN-3 FE**: query active count, disable submit + show banner "Đã đạt tối đa 3 quiz đang diễn ra" khi >=3
  - [ ] Handle BE error `MAX_ACTIVE_QUIZZES_REACHED` (toast)
  - [ ] Vitest 8 cases (gồm test disabled state khi 3 active)
  - [ ] **E2E**: TC "Leader tạo scheduled quiz → list shows ACTIVE" + TC "Leader thấy disabled button khi đã có 3 active"
  - [ ] Commit: `feat(group): scheduled-quiz create form`

### Task B-9: FE — Tab 2 "Đang diễn ra" — detail page [ ] TODO
- File(s): `apps/web/src/pages/ScheduledQuizDetail.tsx` (NEW)
- Spec match mockup: active-banner (pulse green + countdown card) + my-status (3 attempt cells ✓✓3 + best score + "Chơi lần cuối") + live-leaderboard (medals top 3 + highlight bạn).
- Checklist:
  - [ ] Active banner + smart countdown ("2 ngày 14h" / "5 giờ 23 phút" / "12 phút")
  - [ ] My status với attempt cells visual (done/available/disabled)
  - [ ] Live leaderboard real-time (poll 30s hoặc WS nếu thêm)
  - [ ] "Chơi lần cuối" button → navigate quiz play
  - [ ] Vitest 8+ cases
  - [ ] **E2E**: TC "Member chơi lần 1 → score show ở leaderboard"
  - [ ] Commit: `feat(group): scheduled-quiz active state UI`

### Task B-10: FE — Quiz play screen (reuse pattern) [ ] TODO
- File(s): `apps/web/src/pages/ScheduledQuizPlay.tsx` (NEW) hoặc reuse DailyChallenge play structure
- Spec: Quiz UI giống Practice/Daily — render snapshot questions, submit → POST attempts, navigate back to detail.
- Checklist:
  - [ ] Reuse Question component
  - [ ] Submit flow + result modal
  - [ ] Vitest
  - [ ] Commit: `feat(group): scheduled-quiz play screen`

### Task B-11: FE — Tab 3 "Đã kết thúc" state [ ] TODO
- File(s): `apps/web/src/pages/ScheduledQuizDetail.tsx` (extend: state-aware như DailyChallenge)
- Spec match mockup tab 3: ended-banner 🎊 + winner-card prominent (crown 👑 + score gradient) + frozen leaderboard + actions "Chia sẻ" + "Tạo quiz mới" (LEADER/MOD only).
- Checklist:
  - [ ] State-aware rendering (status === 'ENDED')
  - [ ] Winner card với gold gradient
  - [ ] "Tạo quiz mới" navigate /scheduled-quiz/create với prefill quizSetId
  - [ ] Vitest cho ended state
  - [ ] **E2E**: TC "After deadline → see ended banner + winner"
  - [ ] Commit: `feat(group): scheduled-quiz ended state UI`

### Task B-12: FE — Update Group Home "Quiz nhóm" section enable Feature B [ ] TODO
- File(s): `apps/web/src/pages/GroupDetail.tsx` (extend từ A-7)
- Spec: Enable nút "Đặt lịch chơi" → navigate `/groups/:id/scheduled-quizzes/create`. Show list active scheduled quizzes inline (compact card).
- Checklist:
  - [ ] Enable Feature B CTA
  - [ ] List active inline trong section
  - [ ] Vitest
  - [ ] Commit: `feat(group): enable Đặt lịch chơi in Group Home`

### Task B-13: FE — i18n keys vi + en [ ] TODO
- File(s): `apps/web/src/i18n/{vi,en}.json`
- Checklist:
  - [ ] Keys cho Feature A (lobby, gameplay, final, waiting strip)
  - [ ] Keys cho Feature B (form, active, ended, countdown formats)
  - [ ] Run `npm run validate:i18n` — no missing keys
  - [ ] Commit: `i18n: Group features A+B keys`

### Task B-14: Full regression Feature B [ ] TODO
- Checklist:
  - [ ] `./mvnw test -Dtest="com.biblequiz.**"`
  - [ ] `cd apps/web && npx vitest run`
  - [ ] `cd apps/web && npx playwright test tests/e2e/happy-path/web-user/W-M{xx}-scheduled-quiz*.spec.ts`
  - [ ] Số test >= baseline (sau Feature A)
  - [ ] Manual smoke: tạo quiz deadline 2 phút → wait cron → verify auto-announcement + frozen leaderboard
  - [ ] Update TC-TODO.md: B's TCs ✅
  - [ ] Update INDEX.md: thêm module W-M{xx} Group Live + W-M{yy} Scheduled Quiz
  - [ ] Commit: `test: full regression Feature B pass`

### Task B-15: DECISIONS.md entries [ ] TODO
- Ghi:
  - [ ] Snapshot questionIds tại create (lý do: Quiz Set bị xóa không break)
  - [ ] Max 3 attempts lấy max score (lý do: encourage retry, fair)
  - [ ] Cron mỗi phút thay vì @Scheduled fixedRate (lý do: deadline accuracy)
  - [ ] Atomic ENDED transition (lý do: prevent double-announcement)

---

## Implementation order (recommend)

1. **Tuần 1**: Feature A (A-1 → A-11), ship để test với group thật
2. **Tuần 2-3**: Feature B (B-1 → B-15)
3. **Confirm trước khi start**: PN-1 (push noti scope), PN-2 (discussion pause configurable), PN-3 (max-3-active enforcement)
