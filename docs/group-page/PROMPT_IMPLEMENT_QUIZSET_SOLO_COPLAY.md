# PROMPT — Implement Quiz Set Solo Replay + Co-Play

> **References**:
> - `AUDIT_QUIZSET_COPLAY.md` — BE line numbers + branch points đã verify
> - `MOCKUP_QUIZSET_CARDS.html` — 🎨 **Card design spec** (open in browser trước khi code P1.4)
>
> **Scope**: Phase 1 (Solo Replay + Card redesign) + Phase 2 (Co-Play). Scheduled mode → Prompt B (defer).
> **Effort estimate**: 5-6 ngày (Solo 1.5-2 ngày + Co-play 3-4 ngày)
> **Risk**: MEDIUM — security gap (joinRoom membership check) là critical, KHÔNG được skip.

---

## Decisions locked (KHÔNG cần hỏi lại)

| Decision | Value |
|---|---|
| Quiz set status cho co-play | **PUBLISHED only** (DRAFT/ARCHIVED reject) |
| Co-play game mode | **Speed Race only** (host KHÔNG chọn 4 modes) |
| Question count co-play | Host chọn "Tất cả N câu" hoặc "Random K câu" (default 15) |
| Solo attempts per set | **Max 3 lần** (lấy điểm cao nhất — per SPEC §9.1.4) |
| Co-play score → quiz set leaderboard | **KHÔNG ghi** (Q-A spirit, chỉ room_players one-shot) |
| Solo score → quiz set leaderboard | **CÓ ghi** (per-set leaderboard track best) |
| Member-only access | **Required** cho cả 2 modes |
| Sprint 4 dependency | **NONE** (baseline đã DONE) |

---

## ⚠️ Phase 0 — Pre-flight verification (verify-first, ~30 phút)

> Audit cover Co-play kỹ nhưng KHÔNG cover Solo Replay infrastructure. Verify trước khi code.

### Task P0.1: Grep solo replay infrastructure

Run các grep sau và **report findings vào `IMPL_NOTES.md`** trước khi tiếp:

```bash
# Check if SessionService supports custom questionIds (like Practice with fixed list)
grep -rn "questionIds" apps/api/src/main/java/com/biblequiz/modules/quiz/service/ | head -30

# Check if any UserQuizSetAttempt or similar entity exists
find apps/api/src/main/java -name "*QuizSetAttempt*" -o -name "*QuizSetSession*" -o -name "*QuizSetPlay*"

# Check existing quiz set play endpoints
grep -rn "quiz-sets" apps/api/src/main/java/com/biblequiz/api/ | grep -i "play\|session"

# Check existing quiz set leaderboard
grep -rn "QuizSetLeaderboard\|quiz_set_leaderboard" apps/api/src/main/java
```

### Task P0.2: Decision based on findings

**Report `IMPL_NOTES.md`** với:
- Path SessionService + signature `createSession()` hiện tại
- SessionService có hỗ trợ pre-defined questionIds list chưa?
- Có entity `UserQuizSetAttempt` (hoặc tương đương) chưa?
- Có quiz set leaderboard table chưa?

**Branch decision**:
- Nếu SessionService support questionIds → **wire qua SessionService** (cleaner)
- Nếu chưa → **extend SessionService** thêm option `predefinedQuestionIds` (TASK P1.0)

**STOP và confirm với Bui** trước khi proceed Phase 1 nếu findings unclear.

---

## Phase 1 — Solo Replay (~1.5-2 ngày)

### Commit P1.1: Migration V51 — quiz set attempt tracking

**File**: `apps/api/src/main/resources/db/migration/V51__quiz_set_solo_attempts.sql`

```sql
-- Track solo replay attempts per (user, quiz_set)
CREATE TABLE quiz_set_solo_attempts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  group_quiz_set_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL,
  attempt_number INT NOT NULL,  -- 1, 2, or 3
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_qssa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_qssa_quiz_set FOREIGN KEY (group_quiz_set_id) REFERENCES group_quiz_sets(id) ON DELETE CASCADE,
  CONSTRAINT fk_qssa_session FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,

  INDEX idx_qssa_user_set (user_id, group_quiz_set_id),
  INDEX idx_qssa_set_score (group_quiz_set_id, score DESC)  -- for leaderboard
);
```

**Commit message**: `feat: V51 quiz_set_solo_attempts table for solo replay tracking`

**STOP**. Verify migration run OK trước khi proceed.

### Commit P1.2: BE — `QuizSetPlayService.startSoloPlay()` + 3-attempt limit

**Files**:
- New: `apps/api/src/main/java/com/biblequiz/modules/group/entity/QuizSetSoloAttempt.java`
- New: `apps/api/src/main/java/com/biblequiz/modules/group/repository/QuizSetSoloAttemptRepository.java`
- New: `apps/api/src/main/java/com/biblequiz/modules/group/service/QuizSetPlayService.java`

**`QuizSetPlayService.startSoloPlay(userId, quizSetId)`** logic:
1. Fetch GroupQuizSet → verify status == PUBLISHED (else throw 400)
2. Verify user is member of `quizSet.groupId` (else throw 403)
3. Count existing attempts: `repo.countByUserIdAndGroupQuizSetId(userId, quizSetId)`
4. If >= 3 → throw 409 "Bạn đã chơi đủ 3 lần. Xem điểm cao nhất tại bảng xếp hạng."
5. Extract questionIds from quiz set (List<String>)
6. Call `SessionService.createSession()` với mode=SOLO_QUIZ_SET, predefinedQuestionIds=questionIds
7. Return `{ sessionId, attemptNumber: count + 1, remainingAttempts: 3 - count - 1 }`

**Hook completion**: Khi session complete → SessionService gọi callback `quizSetPlayService.recordAttempt(userId, quizSetId, sessionId)` để insert row vào `quiz_set_solo_attempts`.

**Tests** (min 6):
- Start solo: PUBLISHED quiz set + member → success, attempt_number=1
- Start solo: DRAFT → 400
- Start solo: ARCHIVED → 400
- Start solo: non-member → 403
- Start solo: already 3 attempts → 409
- Record attempt: insert correctly, score persisted

**Commit message**: `feat: QuizSetPlayService for solo replay with 3-attempt limit`

**STOP**. Verify tests pass.

### Commit P1.3: BE — API endpoints

**File**: `apps/api/src/main/java/com/biblequiz/api/QuizSetPlayController.java`

```
POST /api/groups/{groupId}/quiz-sets/{setId}/play-solo
  Auth: required
  Response: { sessionId, attemptNumber, remainingAttempts }
  Errors: 400 (status invalid), 403 (not member), 409 (max attempts)

GET /api/groups/{groupId}/quiz-sets/{setId}/my-attempts
  Auth: required
  Response: {
    attempts: [{ attemptNumber, score, correctAnswers, totalQuestions, completedAt }],
    bestScore: number,
    remainingAttempts: number
  }

GET /api/groups/{groupId}/quiz-sets/{setId}/leaderboard
  Auth: required (member only)
  Query: limit=20
  Response: {
    entries: [{ userId, displayName, avatarUrl, bestScore, attemptCount, lastPlayedAt }]
  }
  Note: Aggregate MAX(score) per user from quiz_set_solo_attempts
```

**Tests** (min 4):
- POST play-solo: 200 + sessionId returned
- POST play-solo: 4th attempt → 409
- GET my-attempts: empty list when none, populated after play
- GET leaderboard: 200 + entries sorted by bestScore DESC

**Commit message**: `feat: quiz set solo play API endpoints`

**STOP**.

### Commit P1.4: FE — **Quiz Set card redesign** + Solo replay wired

> **🎨 SPEC reference**: `MOCKUP_QUIZSET_CARDS.html` — Bui đã approve mockup này, code phải match pixel-perfect.
>
> Đây là commit **first-touch** trên Quiz Set card. Refactor full layout theo mockup TRONG commit này — KHÔNG defer sang P2.5. Card sẽ touch tổng 2 lần (P1.4 layout + P2.5 wire co-play), KHÔNG phải 3 lần.

**Files**:
- Edit: `apps/web/src/pages/groups/GroupDetail.tsx` (quiz set list location)
- New: `apps/web/src/components/groups/QuizSetCard.tsx` (extract card thành component riêng, ~250 LOC dự kiến)
- New: `apps/web/src/components/groups/QuizSetCard.test.tsx`

**🎨 Card structure per mockup** (3-section layout):

1. **Header strip** (border-bottom):
   - Status badge (color-coded): `Đã xuất bản` (green #4ade80) / `Bản nháp` (gray #9ba0ad) / `Đã lưu trữ` (copper #c89968) / `Đã đặt lịch` (blue #5b8df0)
   - Book pill (gold tint #e8a832) — book name từ first question
   - Menu button `⋯` (leader only — actions: Sửa / Lưu trữ / Xóa)

2. **Body**:
   - Card title (Sora 17px 700) — `quizSet.name`
   - Topic text (Be Vietnam Pro 13px) — `quizSet.description` hoặc fallback "Chưa có mô tả" italic
   - **Difficulty pills row**: 3 pills (Dễ green / TB gold / Khó red) hiển thị count câu mỗi mức
   - **Stats row**: pill bg `rgba(0,0,0,0.2)` chứa: `📋 X câu` · `👥 Y lượt chơi` · `🕐 N giờ trước`
   - **Conditional banners**:
     - Schedule info banner (blue) — only if scheduled (Phase B sẽ wire — for now P1.4 KHÔNG render banner này)
     - Personal best banner (gold) — only if user đã chơi solo (`bestScore != null`): `🏆 Điểm cao nhất: 6/7 · 86%`

3. **Action footer** (border-top, bg `rgba(0,0,0,0.15)`):
   - **Primary CTA** (full-width gold button): `▶ Chơi cùng nhau`
   - **Secondary icon buttons** (40×40dp): 
     - `📅 Đặt lịch` (icon `event`)
     - `👤 Chơi solo` (icon `person`) hoặc `🔄` nếu `bestScore != null`

**🎨 Color discipline (CRITICAL — memory rule)**:
- **HARDCODED hex values**, KHÔNG dùng CSS variables (tránh white-background bug)
- Gold `#e8a832`, navy `#11131e`, glass `rgba(50,52,64,0.4)` + `backdrop-blur(12px)`
- Tất cả border/badge colors hardcode theo mockup file

**State-aware action footer** (per mockup card states):

| Status | Primary | Icon 1 | Icon 2 |
|---|---|---|---|
| PUBLISHED, never played | `Chơi cùng nhau` (placeholder) | Đặt lịch (placeholder) | Chơi solo (LIVE) |
| PUBLISHED, has played | `Chơi cùng nhau` (placeholder) | Đặt lịch (placeholder) | Chơi lại (LIVE, icon `refresh`) |
| DRAFT (leader only) | `Tiếp tục soạn` (LIVE, navigate edit) | — | Xóa (LIVE) |
| ARCHIVED | `Xem chi tiết` (LIVE, read-only view) | — | Mở khóa (LIVE, leader only) |

**🚧 Placeholder behavior cho buttons CHƯA wire (co-play + schedule)**:

```tsx
// Co-play button — LIVE sẽ wire ở P2.5
<button
  className="btn-primary"
  disabled={true}
  title="Đang chuẩn bị — sẽ ra mắt trong vài ngày tới"
  aria-label="Chơi cùng nhau (sắp ra mắt)"
>
  <span className="material-symbols-outlined">groups</span>
  Chơi cùng nhau
</button>

// Schedule icon — placeholder cho Prompt B
<button
  className="btn-icon"
  disabled={true}
  title="Tính năng đặt lịch sắp ra mắt"
>
  <span className="material-symbols-outlined">event</span>
</button>
```

**KHÔNG hide co-play button** (build expectation, user thấy feature đang đến). **KHÔNG show generic tooltip "Coming soon"** — dùng tooltip thông tin có giá trị "Đang chuẩn bị — sẽ ra mắt trong vài ngày tới".

**Solo button — LIVE wiring**:
- On click:
  1. Fetch `GET /api/groups/{groupId}/quiz-sets/{setId}/my-attempts` để check remaining
  2. If `remainingAttempts === 0` → modal: "Bạn đã chơi đủ 3 lần. Điểm cao nhất: X/Y. Xem bảng xếp hạng?"
  3. If `remainingAttempts > 0` → modal confirm: "Bắt đầu lượt {N}/3 cho '{quizSetName}'?" với buttons [Hủy] [Bắt đầu]
  4. Confirm → POST `/api/groups/{groupId}/quiz-sets/{setId}/play-solo`
  5. Receive `{ sessionId }` → navigate `/quiz/{sessionId}?mode=solo&quizSetId={id}`

**My-attempts panel** (collapsible inside card body, only shown when `bestScore != null`):
```
▼ Lượt chơi của bạn (2/3)
  Lần 1: 7/10 (70%) · 2 ngày trước
  Lần 2: 8/10 (80%) · 1 ngày trước  ← best (gold highlight)
  ─────────────
  Còn 1 lượt
```

Default collapsed; click chevron để expand. Use existing `<Disclosure>` component nếu có.

**Tests** (min 8):
1. Render PUBLISHED card với full layout (status badge, book pill, difficulty pills, stats row)
2. Render DRAFT card → primary button "Tiếp tục soạn", co-play/solo hidden
3. Render ARCHIVED card → primary "Xem chi tiết"
4. Co-play button rendered with `disabled` + correct tooltip text
5. Schedule icon rendered with `disabled` + tooltip
6. Solo button enabled when `remainingAttempts > 0`
7. Solo button click → confirmation modal with attempt N/3
8. Solo button when 3/3 → modal "Đã hết lượt" với link leaderboard
9. Personal best banner rendered when `bestScore != null`, hidden otherwise
10. My-attempts panel expand/collapse interaction
11. Click solo confirm → POST API + navigate to quiz route
12. Hardcoded hex colors present (snapshot test hoặc inline style assertion — verify NOT using CSS vars)

**Acceptance criteria**:
- Card layout match `MOCKUP_QUIZSET_CARDS.html` (compare side-by-side)
- 0 CSS variables trong card styles (grep `var(--` in card files = 0 hits)
- Co-play + schedule buttons disabled NHƯNG visible với tooltip
- Solo flow end-to-end work: click → modal → POST → navigate → quiz screen → complete → score saved → my-attempts updated

**Commit message**: `feat: quiz set card redesign + solo replay wired (per MOCKUP_QUIZSET_CARDS.html)`

**STOP**. Phase 1 milestone — Bui manual test:
1. Open mockup HTML side-by-side với app → visual diff
2. Solo replay end-to-end (3 attempts → 4th blocked)
3. DRAFT card chỉ leader thấy
4. Co-play button disabled tooltip xuất hiện đúng
5. Personal best banner xuất hiện sau attempt đầu tiên

---

## Phase 2 — Co-Play (~3-4 ngày)

### Commit P2.1: Migration V52 — FK + index for groupQuizSetId

**File**: `apps/api/src/main/resources/db/migration/V52__rooms_group_quiz_set_fk.sql`

```sql
-- Audit Gap 2: groupQuizSetId existed since V37 but no FK
ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_group_quiz_set
  FOREIGN KEY (group_quiz_set_id) REFERENCES group_quiz_sets(id)
  ON DELETE SET NULL;

CREATE INDEX idx_rooms_group_quiz_set ON rooms(group_quiz_set_id);
```

**Commit message**: `feat: V52 FK constraint for rooms.group_quiz_set_id`

**STOP**.

### Commit P2.2: BE — RoomQuizService quiz set question loader

**File**: `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomQuizService.java`

**Branch point: line 481** (per audit). Insert Priority 0a check BEFORE existing customQuestionIds check.

```java
// Priority 0a: Group quiz set co-play (NEW)
if (room.getGroupQuizSetId() != null) {
    GroupQuizSet quizSet = groupQuizSetRepository.findById(room.getGroupQuizSetId())
        .orElseThrow(() -> new IllegalStateException(
            "Quiz set không tồn tại: " + room.getGroupQuizSetId()));

    if (quizSet.getStatus() != PublishStatus.PUBLISHED) {
        throw new IllegalStateException(
            "Chỉ chơi được bộ câu hỏi đã xuất bản. Status hiện tại: " + quizSet.getStatus());
    }

    @SuppressWarnings("unchecked")
    List<String> questionIds = (List<String>) quizSet.getQuestionIds();

    if (questionIds == null || questionIds.isEmpty()) {
        throw new IllegalStateException("Bộ câu hỏi rỗng");
    }

    // Apply room config: random K or all N
    int requestedCount = room.getQuestionCount(); // or default to all
    List<String> selectedIds = (requestedCount >= questionIds.size())
        ? questionIds
        : pickRandomSubset(questionIds, requestedCount);

    return questionRepository.findAllById(selectedIds);
}
```

**Inject dependency**: `@Autowired private GroupQuizSetRepository groupQuizSetRepository;`

**Tests** (min 5):
- Load: PUBLISHED quiz set → returns questions from quiz set
- Load: DRAFT quiz set → throws (defense in depth, even if API checks)
- Load: ARCHIVED → throws
- Load: empty questionIds → throws
- Load: requested count > available → returns all (not throw)

**Commit message**: `feat: RoomQuizService loads questions from group quiz set (Priority 0a)`

**STOP**. CRITICAL — verify tests pass before proceeding to security check.

### Commit P2.3: BE — Group membership check in joinRoom (🚨 SECURITY)

**File**: `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java`

**Branch point: line 125** (per audit). Add check AFTER room lookup, BEFORE other validations.

```java
// 🚨 SECURITY: Audit Gap 1 — co-play rooms restricted to group members
if (room.getGroupQuizSetId() != null) {
    GroupQuizSet quizSet = groupQuizSetRepository.findById(room.getGroupQuizSetId())
        .orElseThrow(() -> new IllegalStateException("Quiz set không tồn tại"));

    String groupId = quizSet.getGroupId();
    boolean isMember = groupMemberRepository.existsByGroupIdAndUserId(groupId, userId);

    if (!isMember) {
        throw new ForbiddenException("Bạn không phải thành viên của nhóm này");
    }
}
```

**Inject dependencies**:
- `@Autowired private GroupQuizSetRepository groupQuizSetRepository;`
- `@Autowired private GroupMemberRepository groupMemberRepository;`

**Tests** (min 4 — SECURITY CRITICAL):
- Join: member of group → success
- Join: non-member with valid room code → 403
- Join: room without quizSet (regular multiplayer) → no membership check (existing behavior)
- Join: removed from group sau khi join → next answer rejected? (out of scope, document only)

**Commit message**: `fix(security): enforce group membership for co-play rooms (Audit Gap 1)`

**STOP**. Run security tests + manual penetration: get room code from member, try join as non-member → verify 403.

### Commit P2.4: BE — RoomDetailsDTO quiz set context

**File**: `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` (lines 651-714 per audit)

Add fields to DTO:
```java
private final String groupQuizSetId;
private final String groupQuizSetName;
private final Integer quizSetTotalQuestions;
```

Constructor (line 679):
```java
this.groupQuizSetId = room.getGroupQuizSetId();
if (room.getGroupQuizSetId() != null) {
    GroupQuizSet qs = groupQuizSetRepository.findById(room.getGroupQuizSetId()).orElse(null);
    this.groupQuizSetName = qs != null ? qs.getName() : null;
    this.quizSetTotalQuestions = qs != null && qs.getQuestionIds() != null
        ? ((List<?>) qs.getQuestionIds()).size() : null;
} else {
    this.groupQuizSetName = null;
    this.quizSetTotalQuestions = null;
}
```

**N+1 alert**: Fetching quiz set inside DTO constructor. If listing rooms (e.g. group room list), batch-fetch instead. For single-room endpoints (lobby), 1 extra query is OK.

**Tests** (min 2):
- DTO: room with quizSet → groupQuizSetId/Name populated
- DTO: room without quizSet → null fields

**Commit message**: `feat: RoomDetailsDTO exposes quiz set context for FE display`

**STOP**.

### Commit P2.5: FE — **Enable co-play placeholder** + lobby quiz set context

> **🎨 Card layout đã DONE từ P1.4** — commit này CHỈ wire button đã có sẵn, KHÔNG redesign card lần 2.

**Files**:
- Edit: `apps/web/src/components/groups/QuizSetCard.tsx` (chỉ remove `disabled` + add onClick handler)
- Edit: `apps/web/src/pages/CreateRoom.tsx` (accept `?quizSetId` query param)
- Edit: `apps/web/src/pages/RoomLobby.tsx` (display quiz set name banner)

**QuizSetCard.tsx changes** (minimal — pattern đã set ở P1.4):

```tsx
// BEFORE (P1.4 placeholder):
<button
  className="btn-primary"
  disabled={true}
  title="Đang chuẩn bị — sẽ ra mắt trong vài ngày tới"
>
  <span className="material-symbols-outlined">groups</span>
  Chơi cùng nhau
</button>

// AFTER (P2.5 wired):
<button
  className="btn-primary"
  onClick={handleCoPlay}
  disabled={!isMember || quizSet.status !== 'PUBLISHED'}
>
  <span className="material-symbols-outlined">groups</span>
  Chơi cùng nhau
</button>
```

**`handleCoPlay` logic**:
1. POST `/api/rooms` body `{ mode: "speed_race", groupQuizSetId: setId, questionCount: 15 }`
2. Receive `{ id, roomCode }`
3. Navigate `/room/{id}/lobby`
4. Error handling: 400 (status invalid) / 403 (not member) → toast notification

**CreateRoom.tsx**: Support `?quizSetId={id}` query param. When present:
- Pre-fill `groupQuizSetId` in form
- Hide book/difficulty/language selectors (questions come from quiz set)
- Show banner "📚 Bộ câu hỏi: [Tên]" để user xác nhận
- Question count selector: chỉ cho chọn "Tất cả X câu" (X = quiz set size) hoặc "Random K câu" với K input default 15, max X

**RoomLobby.tsx**:
- If `room.groupQuizSetId != null`:
  - Replace generic mode info card với "Quiz Set Banner":
    ```
    📚 Đang chơi: [Quiz Set Name]
    [Book pill]  ·  [N câu]  ·  Chế độ Speed Race
    ```
  - Hide book/difficulty selectors (read-only context)
- Else: existing lobby UI unchanged

**Tests** (min 6):
- Co-play button enabled khi `isMember && status === 'PUBLISHED'`
- Co-play button disabled khi `!isMember` (defense in depth — BE cũng check)
- Click co-play → POST với correct payload `{ mode, groupQuizSetId, questionCount }`
- Navigate to `/room/{id}/lobby` after creation
- Lobby renders quiz set banner khi `groupQuizSetId !== null`
- Lobby renders generic mode UI khi `groupQuizSetId === null` (regression — non-quizset rooms unaffected)
- CreateRoom với `?quizSetId={id}` query → form pre-filled, selectors hidden

**Commit message**: `feat: enable co-play button + lobby quiz set context (wires P1.4 placeholder)`

**STOP**.

### Commit P2.5b: FE — Enable schedule placeholder (cosmetic only — full feature in Prompt B)

> Schedule placeholder vẫn `disabled` sau P2.5b — Prompt B sẽ wire actual schedule flow. Commit này CHỈ update tooltip để nhất quán với "Đặt lịch sắp ra mắt".

Skip nếu không có thay đổi cần thiết. Nếu có → 1 LOC tooltip update only.

### Commit P2.6: FE — WebSocket payload + quiz screen quiz set badge

**File**: `apps/web/src/api/websocket.ts` (or room WS hook)

Update `RoomState` type to include:
```typescript
groupQuizSetId?: string | null;
groupQuizSetName?: string | null;
quizSetTotalQuestions?: number | null;
```

Display in quiz screen header (small pill): "📚 [Quiz Set Name]" — distinct from generic "Chế độ Speed Race".

**Tests** (min 2):
- WS state type accepts new fields
- Quiz screen renders pill when quiz set name present

**Commit message**: `feat: WebSocket carries quiz set context to quiz screen`

**STOP**. Phase 2 milestone — Bui manual test co-play flow end-to-end.

---

## Phase 3 — Regression + manual scenarios

### Commit P3.1: Full regression

```bash
cd apps/api && ./mvnw test 2>&1 | tail -30
cd apps/web && npx vitest run --reporter=basic 2>&1 | tail -20
cd apps/web && npx playwright test --reporter=line 2>&1 | tail -20
```

**Acceptance**:
- BE: pass count >= baseline (920 tests, ignore 3 pre-existing failures from audit)
- FE: pass count >= baseline (387 tests)
- Playwright smoke: 4 tiers pass

**Commit message**: `test: regression after quiz set solo + co-play implementation`

### P3.2: Manual test scenarios

Document in `MANUAL_TEST_QUIZSET.md`:

**Solo replay**:
- [ ] Member opens published quiz set card → "Chơi solo" enabled, shows "0/3 lượt"
- [ ] Click → quiz starts với questions từ quiz set (verify exact same as set definition)
- [ ] Complete quiz → score saved, attempt_number=1
- [ ] Replay 2 more times → 3/3 attempts
- [ ] 4th click → modal "Đã hết lượt"
- [ ] My-attempts panel shows 3 entries với best highlighted
- [ ] Leaderboard endpoint returns user's best score
- [ ] DRAFT quiz set → button hidden/disabled
- [ ] Non-member tries direct API call → 403

**Co-play**:
- [ ] Leader opens published quiz set → "Chơi cùng nhau" → room created
- [ ] Lobby shows "📚 Đang chơi: [Quiz Set Name]"
- [ ] Member 2 (same group) joins via room code → success
- [ ] Non-member tries join via room code → 403 "Bạn không phải thành viên của nhóm này"
- [ ] Game starts → questions từ quiz set (verify match)
- [ ] Game ends → final ranking displayed
- [ ] Score NOT in quiz set leaderboard (verify GET leaderboard không có entry mới)
- [ ] Solo attempt counter NOT incremented (co-play không consume solo lives)
- [ ] DRAFT quiz set → button hidden, direct API call → 400

---

## Rules cho Claude Code agent

1. **STOP after each commit** — Bui confirm trước khi proceed.
2. **Verification-first per memory pattern**: grep actual code at line numbers từ audit. Audit có thể stale tại commit boundaries — re-verify nếu mismatch.
3. **Separate commits per task** — không gộp BE migration với FE changes. Rollback safety.
4. **Tests REQUIRED per commit**, không phải gom cuối phase. Commits không có tests = reject.
5. **Security commit P2.3 KHÔNG được skip** — đây là Gap 1 của audit, vulnerability nếu miss.
6. **N+1 awareness**: P2.4 fetch quiz set inside DTO. Nếu thấy có endpoint list rooms → batch-fetch instead. Surface concern thay vì silent slow.
7. **Null safety**: backend gaps (deleted quiz set, null name) → conditional rendering FE, không hardcode placeholders.
8. **Honest pushback**: nếu audit assumption không match code (line numbers shifted, dependency injection conflict) → STOP và report, đừng auto-fix theo guess.
9. **NO scope creep**: Scheduled mode, RSVP, banner countdown → KHÔNG implement (Prompt B sẽ cover). Nếu thấy related code → leave as-is.
10. **Output**: file `IMPL_NOTES.md` ở root project recording findings từ Phase 0 + decisions taken at branch points.
11. **🎨 Mockup is spec for P1.4**: Open `MOCKUP_QUIZSET_CARDS.html` in browser TRƯỚC khi code P1.4. Card layout phải match mockup pixel-perfect. Nếu deviation cần thiết (ví dụ: data nào đó BE chưa expose) → document trong `IMPL_NOTES.md`, không tự ý đổi design.
12. **🎨 HARDCODED hex (memory rule)**: Tất cả màu trong card files phải hardcoded hex (không CSS variables). Verify bằng `grep "var(--" apps/web/src/components/groups/QuizSetCard.tsx` → expect 0 hits. Lý do: white-background bug đã từng xảy ra với CSS variables.

---

## Verification checklist trước final merge

- [ ] All P0-P3 commits merged
- [ ] V51 + V52 migrations run trên dev DB cleanly
- [ ] BE test count >= 920 (ignore 3 pre-existing failures)
- [ ] FE test count >= 387
- [ ] Manual scenarios MANUAL_TEST_QUIZSET.md all checked
- [ ] Security: non-member can't join co-play room (verified với 2 accounts)
- [ ] Q-A boundary: co-play game completion does NOT create entry in quiz_set_solo_attempts
- [ ] Solo 3-attempt limit enforced
- [ ] Co-play game starts với exact questions từ quiz set (verify ID-by-ID)
- [ ] Lobby + Quiz screen hiển thị quiz set name
- [ ] DRAFT/ARCHIVED quiz sets không play được (cả solo lẫn co-play)

---

*Khi cả 2 phases done → Bui review → tạo Prompt B cho Scheduled mode.*
