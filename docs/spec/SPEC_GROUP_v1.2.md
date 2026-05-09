# SPEC_GROUP v1.2 — Church Group Features

**Last updated**: 2026-05-09
**Updates**: [SPEC_GROUP_v1.1.md](../../archive/SPEC_GROUP_v1.1.md) (archived 2026-05-09)
**Locked decisions**: Q-A through Q-O preserved (Q-A clarified — see §2)

---

## Changelog v1.1 → v1.2

| # | Section | Thay đổi |
|---|---|---|
| 1 | §2, §10 | **Q-A clarified (Bui 2026-05-09)**: group leaderboard = group-play-only. Solo Practice/Ranked/Daily KHÔNG đóng góp. Code hiện tại còn sum `UserDailyProgress` → ghi BACKLOG. |
| 2 | §3 | Tách entity model rõ ràng: ChurchGroup + GroupMember + GroupQuizSet + GroupAnnouncement + GroupKickLog (V41) + GroupReport (V41) + ScheduledQuiz (V40) + ScheduledQuizAttempt. |
| 3 | §4 | Permission matrix dựa trên enum thật `LEADER/MOD/MEMBER` trong code (`GroupMember.GroupRole:14-16`). |
| 4 | §7 | Q-N clarified: BE rename `/live-quiz` → `/live-rooms` đã ship (`ChurchGroupController.java:670-741`); FE KHÔNG có route `/live-rooms` riêng — list inline trong `GroupDetail.tsx`. |
| 5 | §9 | Scheduled quizzes (V40) chi tiết: create/attempt/leaderboard, cron deadline. |
| 6 | §13 | Reports (V41): member → admin queue. |
| 7 | §17 | Known Issues consolidated, link → BACKLOG.md. |
| 8 | §18 | Multi-leader REMOVED khỏi spec → SPEC_ROADMAP.md (per Bui lock). |

**Backward compatibility**: v1.2 align hoàn toàn với code đã ship. Chỉ 1 BACKLOG mới: refactor leaderboard query để filter group-play-only.

---

## Mục lục

1. Mục đích
2. Locked Decisions (Q-A...Q-O)
3. Group Model
4. Roles & Permissions
5. Group Lifecycle
6. Group Quiz Sets (Q-O)
7. Live Rooms (Q-N)
8. Sequential mode (Q-B)
9. Scheduled Quizzes (V40)
10. Group Leaderboard (Q-A clarified)
11. Group Analytics
12. Announcements
13. Reports (V41)
14. Streak (GroupStreakService)
15. API Endpoints
16. WebSocket events
17. Known Issues
18. Cross-references

---

## 1. Mục đích

Church Group là **feature differentiator** của BibleQuiz. Trong khi solo modes (Practice / Ranked / Daily) phục vụ học cá nhân, Church Group phục vụ **ministry hội thánh**: nhóm tế bào, Trường Chúa Nhật, ban thanh niên, ban giáo phẩm.

**3 use cases chính**:

| Use case | Activity type | Group size |
|---|---|---|
| Ôn bài sau buổi nhóm tế bào | Live "Chơi cùng nhau" sequential | 8-15 |
| Quiz tuần Trường Chúa Nhật | Scheduled quiz async | 15-30 |
| Bible challenge cả hội thánh | Scheduled quiz + Group Leaderboard | 100-200 |

**Spec này định nghĩa**: data model + roles + lifecycle + leaderboard semantics + API contract cho v1.2 (hậu beta cleanup).

---

## 2. Locked Decisions (Q-A...Q-O — verbatim from v1.1)

| ID | Decision | Status v1.2 | Source |
|---|---|---|---|
| **Q-A** | **Group leaderboard scope** | 🔒 **LOCKED — group-play-only** (Bui 2026-05-09 clarification) | AUDIT_SUMMARY.md Bui Q2 |
| Q-B | Sequential live mode = leader manual advance (KHÔNG auto, KHÔNG pause config) | 🔒 LOCKED ✅ shipped | v1.1 §8.4 |
| Q-C | Concurrent live rooms — mỗi click "Chơi cùng nhau" tạo room mới, KHÔNG dedup | 🔒 LOCKED ✅ shipped | v1.1 §8.2 |
| Q-D | Mod role giữ trong v1+ (LEADER/MOD/MEMBER enum) | 🔒 LOCKED ✅ shipped | `GroupMember.GroupRole:14-16` |
| Q-E | Backend max-2-groups-owned constraint | 🔒 LOCKED — gap, track BACKLOG | v1.1 §4.2 |
| Q-F | Backend max-5-groups-joined constraint | 🔒 LOCKED — gap, track BACKLOG | v1.1 §4.3 |
| Q-G | Soft delete grace 7 ngày, restore qua email link | 🔒 LOCKED | v1.1 §3.4 |
| Q-H | Auto-detect Inactive sau 30 ngày no activity | 🔒 LOCKED | v1.1 §3.3 |
| Q-I | Welcome flow: push noti + banner 24h + welcome message | 🔒 LOCKED | v1.1 §4.4 |
| Q-J | 1 user chỉ trong 1 active live room tại 1 thời điểm | 🔒 LOCKED — gap | v1.1 §8.7 |
| Q-K | Push notifications (11 events) — incremental implement | 🔒 LOCKED — gap | v1.1 §11 |
| Q-L | 7-day re-join cooldown sau kick | 🔒 LOCKED — gap, V41 GroupKickLog ready | v1.1 §12.2 |
| Q-M | Member report group endpoint (V41 GroupReport ready) | 🔒 LOCKED | v1.1 §12.4 |
| Q-N | Endpoint name `/api/groups/{id}/live-rooms` (rename từ `/live-quiz`) | 🔒 LOCKED ✅ BE shipped (`ChurchGroupController.java:677,741`); FE KHÔNG có route SPA riêng — inline GroupDetail.tsx | v1.1 §13.5 |
| Q-O | Quiz Set lưu `question_ids` JSON (KHÔNG dùng join table) | 🔒 LOCKED ✅ shipped | `GroupQuizSet.java` (`question_ids JSON NOT NULL`) |

### 2.1 Q-A clarification (Bui 2026-05-09) — IMPORTANT

**Câu hỏi gốc**: Có tính score của solo Practice / Ranked / Daily Challenge vào Group Leaderboard không?

**Bui lock 2026-05-09**: **KHÔNG. Group leaderboard = group-play-only.**

| Activity | Đóng góp Group Leaderboard? |
|---|---|
| ✅ Group live room ("Chơi cùng nhau") score | **CÓ** (sum across rooms) |
| ✅ Scheduled quiz attempts (best per quiz) | **CÓ** |
| ❌ Solo Practice mode (kể cả từ group quiz set "Tự ôn solo") | **KHÔNG** |
| ❌ Ranked Mode | **KHÔNG** (đã có global leaderboard riêng) |
| ❌ Daily Challenge | **KHÔNG** |

**Rationale**:
- Group leaderboard reflect **group activity** (cùng nhau chơi). Solo là activity cá nhân, không có group context.
- Member chăm chỉ tự ôn solo sẽ leo top dù không tham gia group → unfair với người tham gia thật.
- Anti-farm: prevent member spam solo để leo rank giả tạo.

**Code reality (BACKLOG)**:
- `ChurchGroupService.java:227,511,518,523,572,578,582` hiện đang query `UserDailyProgressRepository` (sum tất cả progress, bao gồm solo).
- → Code KHÔNG match Q-A lock.
- → **BACKLOG action**: refactor leaderboard query → chỉ aggregate từ `group_live_room_score` + `scheduled_quiz_attempt`. Track trong BACKLOG.md.
- → Spec v1.2 là source of truth; code phải catch up.

---

## 3. Group Model

### 3.1 ChurchGroup entity

**File**: `apps/api/src/main/java/com/biblequiz/modules/group/entity/ChurchGroup.java`

| Field | Type | Migration | Notes |
|---|---|---|---|
| `id` | BIGINT PK | V1 | |
| `name` | VARCHAR(50) | V1 | required, 3-50 chars |
| `description` | VARCHAR(200) | V1 | optional |
| `code` | VARCHAR(6) UNIQUE | V1 | A-Z 0-9, auto-gen |
| `privacy` | ENUM(PUBLIC, PRIVATE) | V1 | default PUBLIC |
| `status` | ENUM(ACTIVE, INACTIVE, ARCHIVED, LOCKED, SOFT_DELETED) | V1 | |
| `creator_user_id` | BIGINT FK | V1 | |
| `created_at`, `last_activity_at` | TIMESTAMP | V1 | |
| `deleted_at` | TIMESTAMP NULL | **V13** | soft delete tombstone |
| `locked_at` | TIMESTAMP NULL | **V19** | admin lock timestamp |
| `locked_reason` | TEXT | V19 | admin note |
| `orphan_at` | TIMESTAMP NULL | V1 | grace timer (Q-G) |

**State transitions**: ACTIVE ↔ INACTIVE (auto Q-H) → ARCHIVED (leader) | LOCKED (admin V19) | SOFT_DELETED (V13 deleted_at) → hard delete sau 7d.

### 3.2 GroupMember entity

**File**: `apps/api/src/main/java/com/biblequiz/modules/group/entity/GroupMember.java:14-16`

```java
public enum GroupRole {
    LEADER, MOD, MEMBER
}
```

| Field | Type | Migration | Notes |
|---|---|---|---|
| `id` | BIGINT PK | V1 | |
| `group_id`, `user_id` | BIGINT FK | V1 | UNIQUE(group_id, user_id) |
| `role` | ENUM(LEADER, MOD, MEMBER) | V1 | default MEMBER (Q-D locked) |
| `status` | ENUM(ACTIVE, LEFT, KICKED, BANNED) | V1 | |
| `joined_at`, `promoted_at`, `left_at` | TIMESTAMP | V1 | |
| `promoted_by_user_id` | BIGINT FK | V1 | audit |
| `kick_reason` | TEXT | V1 | populated khi status=KICKED |
| `last_active_at` | TIMESTAMP | **V32** | for analytics + Inactive auto-detect |

### 3.3 GroupQuizSet entity (Q-O)

**File**: `apps/api/src/main/java/com/biblequiz/modules/group/entity/GroupQuizSet.java`

| Field | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `group_id` | BIGINT FK | CASCADE delete |
| `creator_user_id` | BIGINT FK | LEADER/MOD only |
| `name` | VARCHAR(100) | required |
| `question_ids` | **JSON NOT NULL** | Q-O locked: JSON array, KHÔNG join table |
| `total_questions` | INT | derived from question_ids length |
| `language` | ENUM(VI, EN) | default VI |
| `status` | ENUM(ACTIVE, ARCHIVED, SOFT_DELETED) | |
| `archived_at`, `deleted_at` | TIMESTAMP | |

**Q-O rationale**: Always need full question list khi serve quiz set → JSON simpler than JOIN, atomic update, no N+1.

### 3.4 GroupAnnouncement entity

**File**: `apps/api/src/main/java/com/biblequiz/modules/group/entity/GroupAnnouncement.java`

| Field | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `group_id`, `author_user_id` | BIGINT FK | |
| `title` | VARCHAR(50) | |
| `content` | TEXT | markdown supported |
| `is_pinned` | BOOLEAN | max 3 pinned per group |
| `created_at` | TIMESTAMP | |

### 3.5 GroupKickLog + GroupReport (V41) — feature 14

**Files**:
- `apps/api/src/main/java/com/biblequiz/modules/group/entity/GroupKickLog.java`
- `apps/api/src/main/java/com/biblequiz/modules/group/entity/GroupReport.java`
- Migration: `V41__group_kick_log_and_reports.sql`

**GroupKickLog** — audit trail cho mọi kick action; cũng là source cho 7-day cooldown enforcement (Q-L).

| Field | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `group_id`, `kicked_user_id`, `kicker_user_id` | BIGINT FK | |
| `reason` | TEXT | required |
| `kicked_at` | TIMESTAMP | |

Q-L cooldown query: `WHERE kicked_user_id = X AND group_id = Y AND kicked_at > NOW() - INTERVAL 7 DAY`.

**GroupReport** — member báo cáo group (Q-M).

| Field | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `group_id`, `reporter_user_id` | BIGINT FK | |
| `reason` | ENUM(SPAM, INAPPROPRIATE, HARASSMENT, OTHER) | |
| `note` | TEXT | optional |
| `status` | ENUM(OPEN, REVIEWED, ACTIONED, DISMISSED) | default OPEN |
| `created_at` | TIMESTAMP | |

Admin queue: `WHERE status = 'OPEN' ORDER BY created_at`.

### 3.6 ScheduledQuiz + ScheduledQuizAttempt (V40) — feature 13

**Files**:
- `apps/api/src/main/java/com/biblequiz/modules/group/entity/ScheduledQuiz.java`
- `apps/api/src/main/java/com/biblequiz/modules/group/entity/ScheduledQuizAttempt.java`
- Service: `apps/api/src/main/java/com/biblequiz/modules/group/service/ScheduledQuizService.java`
- Cron: `apps/api/src/main/java/com/biblequiz/modules/group/service/ScheduledQuizScheduler.java`
- Migration: `V40__scheduled_quizzes.sql`

**ScheduledQuiz**:

| Field | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `group_id`, `quiz_set_id`, `creator_user_id` | BIGINT FK | |
| `name`, `description` | VARCHAR / TEXT | |
| `deadline` | TIMESTAMP | required |
| `attempts_per_user` | INT | default 3 |
| `show_public_leaderboard` | BOOLEAN | default TRUE |
| `status` | ENUM(ACTIVE, ENDED, CANCELLED) | |
| `winner_user_id` | BIGINT FK NULL | populated by cron khi ENDED |

**ScheduledQuizAttempt**:

| Field | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `scheduled_quiz_id`, `user_id` | BIGINT FK | |
| `attempt_number` | INT | 1..attempts_per_user |
| `score` | INT | best per user used for leaderboard |
| `correct_count`, `total_time_ms` | INT / BIGINT | |
| `completed_at` | TIMESTAMP | |

Index: `(scheduled_quiz_id, user_id, score DESC)` cho fast leaderboard query.

---

## 4. Roles & Permissions

### 4.1 Leader 👑 (gold) — C6 visual

- Người tạo group; auto-promote khi `creator_user_id` join lần đầu.
- Visual: gold crown 👑 + gold name color.
- Quyền tối cao: edit group, lock, delete, kick, promote/demote mod.

### 4.2 Mod 🛡️ (blue) — C6 visual

- Co-helper được leader cấp quyền (Q-D locked, KHÔNG remove).
- Visual: blue shield 🛡️ + blue name color.
- Quyền tạo content: quiz set, live room, scheduled quiz, announcement.
- KHÔNG được: kick, lock, promote khác.

### 4.3 Member (plain) — C6 visual

- Default role khi join.
- Visual: không icon, name màu thường.
- Quyền: chơi activities, xem leaderboard, leave, report group.

### 4.4 Permission matrix

| Action | Leader 👑 | Mod 🛡️ | Member |
|---|---|---|---|
| **Group Management** | | | |
| Edit group info | ✅ | ❌ | ❌ |
| Toggle privacy | ✅ | ❌ | ❌ |
| Lock/unlock group | ✅ (admin lock V19 separate) | ❌ | ❌ |
| Soft delete group (V13) | ✅ | ❌ | ❌ |
| Invite via code | ✅ | ✅ | ❌ |
| Kick member (log to GroupKickLog) | ✅ | ❌ | ❌ |
| Promote member to mod | ✅ | ❌ | ❌ |
| Demote mod | ✅ | ❌ | ❌ |
| **Quiz Sets** | | | |
| Create quiz set | ✅ | ✅ | ❌ |
| Edit/delete own quiz set | ✅ | ✅ | ❌ |
| Edit/delete others' quiz set | ✅ | ❌ | ❌ |
| Archive quiz set | ✅ | ✅ | ❌ |
| **Live Rooms (Q-N)** | | | |
| Create live room (`POST /live-rooms`) | ✅ | ✅ | ❌ |
| Join live room | ✅ | ✅ | ✅ |
| Manual advance (Q-B) | ✅ (host) | ✅ (host) | ❌ |
| Force end room | ✅ (host) | ✅ (host) | ❌ |
| **Scheduled Quizzes** | | | |
| Create scheduled quiz | ✅ | ✅ | ❌ |
| Cancel before deadline | ✅ | ✅ (own) | ❌ |
| Attempt scheduled quiz | ✅ | ✅ | ✅ |
| **Communications** | | | |
| Post announcement | ✅ | ✅ | ❌ |
| Pin announcement | ✅ | ✅ (own) | ❌ |
| **Member actions** | | | |
| View leaderboard | ✅ | ✅ | ✅ |
| View member list | ✅ | ✅ | ✅ |
| Leave group | ❌ (must transfer/delete) | ✅ | ✅ |
| Report group (V41) | ❌ | ✅ | ✅ |

**Backend enforcement**: Mọi POST/PATCH/DELETE qua `@PreAuthorize` helper trong `ChurchGroupController.java`. Client check chỉ là UX hint.

---

## 5. Group Lifecycle

### 5.1 Create

```
POST /api/groups { name, description, privacy, welcomeMessage, avatar }
  ↓
Backend:
  - Check creator group count (Q-E gap — chưa enforce)
  - Generate unique 6-char code (A-Z 0-9, retry on collision)
  - Create ChurchGroup (status=ACTIVE)
  - Create GroupMember (role=LEADER, status=ACTIVE)
  - Set last_activity_at = NOW()
  ↓
Return group detail
```

### 5.2 Join

**Public**: `POST /api/groups/{id}/join` → check status=ACTIVE → check Q-J/Q-F limits → insert GroupMember.

**By code**: `POST /api/groups/join-by-code { code }` → lookup group → same checks → insert.

**Welcome flow (Q-I)**: push noti to leader/mod + banner 24h cho member mới + auto-send welcome_message.

### 5.3 Leave

`POST /api/groups/{id}/leave`:
- Member/Mod: status → LEFT, left_at = NOW(). Score history giữ với tag "(đã rời)".
- Leader: BLOCK với message "Bạn là leader cuối, hãy transfer hoặc delete group".
  - **v1.2 (current)**: KHÔNG có transfer ownership UI/endpoint → leader buộc phải `DELETE /api/groups/{id}` (soft delete). Members mất group → join group khác.
  - **Decision (Bui canonical 2026-05-09)**: Defer transfer-ownership đến v1.5 (đi kèm Multi-leader system trong [SPEC_ROADMAP.md](SPEC_ROADMAP.md) §2.1). Rationale: transfer ownership single-leader cần permission UI riêng; gộp với multi-leader rollout để 1 lần ship tránh re-design.
  - Workaround v1.2: leader đề bạt 1 MOD lên LEADER trước khi delete? **KHÔNG** — chỉ có 1 LEADER per group ở v1.2 (`leader_id` foreign key ChurchGroup, không phải role enum). MOD không thể "promote" thành LEADER.
  - **Hard fact**: muốn handover → leader đành delete + member mới tạo lại + invite cũ trở lại.

### 5.4 Kick (with V41 GroupKickLog)

`DELETE /api/groups/{id}/members/{userId} { reason }`:
1. Check caller is LEADER.
2. Update GroupMember status=KICKED, kick_reason=...
3. **Insert GroupKickLog** (audit trail).
4. Push noti to kicked user.
5. **Q-L**: future joins blocked qua GroupKickLog query (gap).

### 5.5 Lock (admin action V19)

`PATCH /api/admin/groups/{id}/lock { reason }`:
- Set status=LOCKED, locked_at=NOW(), locked_reason=reason.
- Member thấy banner đỏ "🔒 Nhóm bị khóa: [reason]".
- Read-only mode: không tạo activity, không post.
- Member có thể leave tự do.

### 5.6 Soft delete (V13 deleted_at)

`DELETE /api/groups/{id}`:
- Leader-only.
- Confirm modal với input tên group.
- Set status=SOFT_DELETED, **deleted_at=NOW()**, orphan_at=NOW().
- Push noti tất cả member.
- Cron daily: `WHERE deleted_at < NOW() - INTERVAL 7 DAY` → hard delete CASCADE.
- Restore qua email link trong 7d (Q-G).

---

## 6. Group Quiz Sets (Q-O)

**Ownership**: thuộc group, không phải user. Tạo bởi LEADER/MOD, dùng được bởi tất cả LEADER/MOD trong cùng group. MEMBER không tạo.

**Lifecycle**: ACTIVE → ARCHIVED → SOFT_DELETED → hard delete (30d grace).

**Constraints**:
- Max 20 active quiz sets per group.
- Min 5, max 50 questions per set.
- Q-O: `question_ids` JSON array (NOT join table). Đổi câu = update JSON atomic.

**Tự ôn solo (member)**: vào Practice mode với câu hỏi từ quiz set. **KHÔNG tính XP, KHÔNG vào group leaderboard** (Q-A clarified). Mục đích: cho member ôn cá nhân giữa các activities.

**Edge cases**:
- Quiz set bị archive khi live room đang dùng → tiếp tục bình thường (đã load vào memory).
- Quiz set bị delete khi scheduled quiz đang chạy → BLOCK delete.

---

## 7. Live Rooms (Q-N)

**Endpoint**: `/api/groups/{id}/live-rooms` (Q-N: rename từ `/live-quiz` đã ship, `ChurchGroupController.java:677,741`).

### 7.1 Create live room (LEADER/MOD only)

```
POST /api/groups/{id}/live-rooms
Body: { quizSetId, name, questionCount, timePerQuestionSec, maxPlayers }
  ↓
Backend (ChurchGroupController.java:670-735):
  - @PreAuthorize: LEADER or MOD
  - Validate quiz set thuộc group
  - Create RoomEntity (status=LOBBY, mode=GROUP_SEQUENTIAL)
  - Insert host as RoomPlayer
  - Generate 6-char room code
  ↓
Return { roomCode, roomId }
Push notification → all group members (Live Call Banner)
```

**Concurrent rooms (Q-C)**: Mỗi click tạo room mới, KHÔNG dedup. 1 group có thể có nhiều rooms cùng lúc (vd: 2 nhóm tế bào con parallel).

### 7.2 List active live rooms

```
GET /api/groups/{id}/live-rooms
  ↓
Backend (ChurchGroupController.java:735-...):
  - Return rooms WHERE group_id = X AND status IN (LOBBY, IN_PROGRESS)
  ↓
FE: GroupDetail.tsx tab "Bộ câu hỏi" hiện inline banner
   (KHÔNG có route /live-rooms riêng — Q-N FE clarification)
```

### 7.3 Cleanup (cross-ref → SPEC_MULTIPLAYER.md §R1-R5)

Group live rooms tuân theo cleanup rules trong SPEC_MULTIPLAYER:
- R1: Idle lobby >10min → cancel
- R2: Stuck IN_PROGRESS >2h → force-end
- R3: ENDED >24h → purge (commit a1a8620)
- R4: Empty room → cancel ngay
- R5: RoomAbandonmentScheduler recovery (commit 7a43b0f)

---

## 8. Sequential mode (Q-B manual advance)

Live "Chơi cùng nhau" dùng **sequential format** (chờ tất cả trả lời mới sang câu kế).

**Q-B locked behavior**:
1. Host (leader/mod) bấm "Bắt đầu".
2. Câu 1 hiện đồng thời cho tất cả players.
3. Player chọn đáp án → submit (timer 20/30/45s).
4. **KHÔNG đổi answer sau submit** (anti-cheat).
5. Waiting strip "Chờ X người trả lời..." cho đến khi tất cả xong hoặc timeout.
6. Reveal đáp án + explanation + scriptureRef.
7. **Host bấm "Sang câu tiếp"** (manual advance, KHÔNG auto, KHÔNG pause config).
8. Member thấy waiting state "Đang chờ trưởng nhóm sang câu...".
9. Lặp đến hết quiz.

**Endpoint**: `POST /api/rooms/{roomCode}/advance` (host only).

**Disconnect handling**:
- Player disconnect: 60s grace, rejoin OK; ngoài grace → marked LEFT.
- Host disconnect: 60s grace; ngoài grace → broadcast `ROOM_ENDED` reason=`host_disconnected` (commit 5aef216).

**Scoring trong room**: 100 đ đúng + speed bonus max +50. Score này (sum across rooms) đóng góp Group Leaderboard (Q-A locked).

---

## 9. Scheduled Quizzes (V40) — feature 13

### 9.1 Create

```
POST /api/groups/{id}/scheduled-quiz
Body: {
  quizSetId, name, description,
  deadline (ISO timestamp),
  attemptsPerUser (1/3/unlimited, default 3),
  showPublicLeaderboard (bool)
}
  ↓
Backend (ScheduledQuizService.java):
  - @PreAuthorize: LEADER or MOD
  - Check active scheduled count < 3 per group
  - Validate deadline > NOW()
  - Insert ScheduledQuiz (status=ACTIVE)
  ↓
Push noti tất cả member: "Quiz tuần mới: '[name]' - hạn chót [date]"
```

**Constraint**: max 3 active scheduled quizzes per group. Vượt → block.

### 9.2 Attempt (with submit window)

```
POST /api/groups/{id}/scheduled-quiz/{quizId}/play
  ↓
Backend:
  - Check deadline > NOW()
  - Check user attempt count < attempts_per_user
  - Create QuizSession (mode=SCHEDULED) với câu hỏi từ quiz set
  - Return sessionId
  ↓
Member chơi như Practice mode
  ↓
Submit answer → score recorded
On complete: Insert ScheduledQuizAttempt { score, correct_count, total_time_ms, attempt_number }
  ↓
Best score per user used for leaderboard (max query)
```

### 9.3 Results & deadline cron

**ScheduledQuizScheduler** (cron mỗi phút):
```
WHERE deadline < NOW() AND status = 'ACTIVE'
  ↓
For each:
  - status → ENDED
  - Compute winner: MAX(score), tie-break MIN(total_time_ms)
  - Set winner_user_id
  - Auto-create GroupAnnouncement: "🏆 [Winner] đã thắng Quiz tuần '[name]' với X điểm!"
  - Push noti tất cả member
```

**Leaderboard endpoint**: `GET /api/groups/{id}/scheduled-quiz/{quizId}/leaderboard` → sorted by best score.

---

## 10. Group Leaderboard (Q-A clarified: group-play-only)

### 10.1 Scope

**Members only**. Người không trong group không xuất hiện. Member LEFT/KICKED giữ history với tag "(đã rời)".

### 10.2 Score sources (Q-A locked)

✅ **CÓ đóng góp**:
- Group live room scores (sum across all rooms member tham gia trong period).
- Scheduled quiz attempts (best score per quiz, sum across quizzes).

❌ **KHÔNG đóng góp**:
- Solo Practice mode (kể cả "Tự ôn solo" từ group quiz set).
- Ranked Mode (đã có global leaderboard riêng).
- Daily Challenge.

### 10.3 Periods

3 tabs: Tuần (7d) / Tháng (30d) / Tất cả thời gian. Tự reset weekly/monthly. All-time không reset.

**Around-me pattern**: Top 3 + 2 trên + me + 2 dưới. "Xem tất cả" → full paginated.

### 10.4 Known Issue: code currently sums all UserDailyProgress

**Reality**: `ChurchGroupService.java:227,511,518,523,572,578,582` đang query `UserDailyProgressRepository` — sum **tất cả** activity (kể cả solo Practice/Ranked/Daily). KHÔNG match Q-A lock.

**Required refactor (BACKLOG)**:
1. Tạo bảng `group_live_room_score` (denormalized): `(group_id, user_id, room_id, score, played_at)`. Insert khi room ENDED.
2. Tạo query mới: aggregate từ `group_live_room_score` + `scheduled_quiz_attempt` only (filter by period).
3. Replace `UserDailyProgressRepository` calls trong `getGroupLeaderboard()`, `getMemberStats()`, `getAroundMe()`.
4. Migration: backfill từ existing room/attempt history.

→ Tracked trong `BACKLOG.md` (item: "Refactor Group Leaderboard query — Q-A compliance").

---

## 11. Group Analytics (leader-only) — feature 20

**Endpoint**: `GET /api/groups/{id}/stats` (LEADER only).
**FE**: `apps/web/src/pages/GroupAnalytics.tsx`.

**Engagement metrics**:
- Active members tuần / tháng (dùng `last_active_at` V32).
- Activity curve 30 ngày (line chart).
- Top 5 active members.
- Members chưa active 7+ ngày (warning section, để leader nhắc nhở).

**Content metrics**:
- Quiz sets used most.
- Average accuracy by quiz set.
- Difficulty distribution.

**Activity metrics**:
- Tổng số live rooms tổ chức.
- Tổng số scheduled quizzes hoàn thành.
- Average participation rate per activity.

---

## 12. Announcements

**Endpoint**: `POST /api/groups/{id}/announcements { title, content }` (LEADER/MOD).

**Behavior**:
- Push noti tất cả member.
- Hiện banner trên Group Detail header 7 ngày.
- Pin: max 3 pinned, hiện đầu list.
- Auto-create khi scheduled quiz end (winner announcement).

---

## 13. Reports (V41)

**Endpoint**: `POST /api/groups/{id}/report { reason, note }` (member/mod, KHÔNG cho leader self-report).

**Flow**:
```
Member → GroupDetail "..." menu → "Báo cáo nhóm"
  ↓
Modal chọn reason (SPAM, INAPPROPRIATE, HARASSMENT, OTHER) + note
  ↓
Insert GroupReport (status=OPEN)
  ↓
Admin queue: GET /api/admin/reports?status=OPEN
  ↓
Admin review → action (warn / lock V19 / soft-delete V13) → status=ACTIONED/DISMISSED
```

Cross-ref: SPEC_ADMIN.md §11 Report Moderation.

---

## 14. Streak (GroupStreakService)

**File**: `apps/api/src/main/java/com/biblequiz/modules/group/service/GroupStreakService.java`

**Concept**: Group streak = số ngày liên tiếp group có ít nhất 1 activity contribute leaderboard.

**Activity sources** (Q-A scope — chỉ count group-play):
- Live room kết thúc (`Room.status = ENDED` AND `room.group_id == group.id`)
- Scheduled quiz attempt completed (`ScheduledQuizAttempt.completedAt != null`)
- Solo Practice/Ranked/Daily Challenge KHÔNG count (per Q-A 2026-05-09 lock)

**Tracking** (canonical contract):
- Cron job hoặc event listener: sau mỗi activity → update `church_groups.last_activity_at = now`.
- Streak counter = số ngày liên tiếp có ≥ 1 activity. Nếu hôm nay không có activity AND yesterday có → streak = streak (chưa reset). Nếu cả today + yesterday đều không → reset 0.
- Hiển thị trong Group Detail header: "🔥 Group streak 12 ngày".

**Reset rule**: `(today - last_activity_at) > 1 day` → streak = 0 vào midnight UTC.

**Known Issue**: Algorithm chính xác trong `GroupStreakService` chưa verify deeply (Phase 1 audit không inspect deep). Spec mô tả intended contract; nếu code lệch → BACKLOG follow-up.

---

## 15. API Endpoints

### 15.1 Group CRUD

| Method | Path | Auth | Note |
|---|---|---|---|
| POST | `/api/groups` | User | create |
| GET | `/api/groups/{id}` | Member | detail (with userRole) |
| PATCH | `/api/groups/{id}` | Leader | update info |
| DELETE | `/api/groups/{id}` | Leader | soft delete (V13) |
| POST | `/api/groups/{id}/restore` | Leader | restore within 7d |
| GET | `/api/groups` | User | list user's groups |
| GET | `/api/groups/discover` | User | public discovery |

### 15.2 Membership

| Method | Path | Auth | Note |
|---|---|---|---|
| POST | `/api/groups/{id}/join` | User | join public |
| POST | `/api/groups/join-by-code` | User | `{ code }` |
| POST | `/api/groups/{id}/leave` | Member | |
| GET | `/api/groups/{id}/members` | Member | list |
| DELETE | `/api/groups/{id}/members/{userId}` | Leader | kick + GroupKickLog (V41) |

### 15.3 Mods (Q-D locked, KHÔNG remove)

| Method | Path | Auth | Note |
|---|---|---|---|
| GET | `/api/groups/{id}/mods` | Member | list mods |
| POST | `/api/groups/{id}/mods` | Leader | promote member |
| DELETE | `/api/groups/{id}/mods/{userId}` | Leader | demote |

### 15.4 Quiz Sets

| Method | Path | Auth | Note |
|---|---|---|---|
| GET | `/api/groups/{id}/quiz-sets` | Member | list active+archived |
| POST | `/api/groups/{id}/quiz-sets` | Leader/Mod | create |
| PATCH | `/api/groups/{id}/quiz-sets/{setId}` | Leader/Mod own | update |
| DELETE | `/api/groups/{id}/quiz-sets/{setId}` | Leader/Mod | soft delete |
| PATCH | `/api/groups/{id}/quiz-sets/{setId}/archive` | Leader/Mod | |
| POST | `/api/groups/{id}/quiz-sets/{setId}/play` | Member | solo practice (KHÔNG vào leaderboard) |

### 15.5 Live Rooms (Q-N)

| Method | Path | Auth | Note |
|---|---|---|---|
| POST | `/api/groups/{id}/live-rooms` | Leader/Mod | create (`ChurchGroupController.java:677`) |
| GET | `/api/groups/{id}/live-rooms` | Member | list active (`ChurchGroupController.java:741`) |
| GET | `/api/rooms/{roomCode}` | User | room detail |
| POST | `/api/rooms/{roomCode}/join` | User | join lobby |
| POST | `/api/rooms/{roomCode}/leave` | Player | |
| POST | `/api/rooms/{roomCode}/start` | Host | |
| POST | `/api/rooms/{roomCode}/advance` | Host | Q-B manual advance |
| POST | `/api/rooms/{roomCode}/end` | Host | force end |

### 15.6 Scheduled Quizzes (V40)

| Method | Path | Auth | Note |
|---|---|---|---|
| POST | `/api/groups/{id}/scheduled-quiz` | Leader/Mod | create |
| GET | `/api/groups/{id}/scheduled-quiz` | Member | list |
| GET | `/api/groups/{id}/scheduled-quiz/{quizId}` | Member | detail |
| DELETE | `/api/groups/{id}/scheduled-quiz/{quizId}` | Leader/Mod own | cancel |
| POST | `/api/groups/{id}/scheduled-quiz/{quizId}/play` | Member | start attempt |
| GET | `/api/groups/{id}/scheduled-quiz/{quizId}/leaderboard` | Member | best scores sorted |

### 15.7 Stats & Leaderboard

| Method | Path | Auth | Note |
|---|---|---|---|
| GET | `/api/groups/{id}/leaderboard?period=week\|month\|all` | Member | Q-A clarified (BACKLOG: query refactor) |
| GET | `/api/groups/{id}/leaderboard/around-me?period=...` | Member | top3 + ±2 |
| GET | `/api/groups/{id}/stats` | Leader | analytics |

### 15.8 Announcements

| Method | Path | Auth |
|---|---|---|
| POST | `/api/groups/{id}/announcements` | Leader/Mod |
| GET | `/api/groups/{id}/announcements` | Member |
| PATCH | `/api/groups/{id}/announcements/{annId}/pin` | Leader/Mod |
| DELETE | `/api/groups/{id}/announcements/{annId}` | Leader/Mod |

### 15.9 Reports (V41)

| Method | Path | Auth |
|---|---|---|
| POST | `/api/groups/{id}/report` | Member/Mod |
| GET | `/api/admin/reports?status=OPEN` | Admin |
| PATCH | `/api/admin/reports/{reportId}` | Admin (action/dismiss) |

---

## 16. WebSocket events (cross-ref → SPEC_MULTIPLAYER.md)

Group live rooms dùng cùng STOMP topics với multiplayer modes. **Spec chi tiết → SPEC_MULTIPLAYER.md §WS**.

Tóm tắt events relevant cho group:

| Topic | Event | Trigger |
|---|---|---|
| `/topic/room/{roomId}` | PLAYER_JOINED | member join lobby |
| `/topic/room/{roomId}` | PLAYER_LEFT | leave / disconnect |
| `/topic/room/{roomId}` | ROOM_STARTED | host bấm "Bắt đầu" |
| `/topic/room/{roomId}` | QUESTION_REVEALED | reveal sau khi tất cả answer |
| `/topic/room/{roomId}` | QUESTION_ADVANCED | host Q-B manual advance |
| `/topic/room/{roomId}` | ROOM_ENDED | normal end / host_disconnected (commit 5aef216) |

---

## 17. Known Issues (link BACKLOG.md)

| ID | Issue | Severity | Status |
|---|---|---|---|
| **Q-A code drift** | `ChurchGroupService.java:227,511,518,523,572,578,582` sum tất cả UserDailyProgress thay vì group-play-only | **HIGH** | 🚧 BACKLOG.md "Refactor Group Leaderboard — Q-A compliance" |
| Q-E | Backend max-2-groups-owned chưa enforce | MEDIUM | 🚧 BACKLOG |
| Q-F | Backend max-5-groups-joined chưa enforce | MEDIUM | 🚧 BACKLOG |
| Q-J | 1-active-room-per-user chưa enforce | MEDIUM | 🚧 BACKLOG |
| Q-K | Push notifications (11 events) chưa implement | MEDIUM | 🚧 BACKLOG, incremental |
| Q-L | 7-day re-join cooldown sau kick chưa enforce (V41 GroupKickLog ready, query missing) | MEDIUM | 🚧 BACKLOG |
| GFA-17 | "Tự ôn solo" hiện tạo SPEED_RACE room (architectural mismatch) thay vì Practice session | LOW | 🚧 BACKLOG, defer |

Chi tiết tracking + acceptance criteria → `BACKLOG.md`.

---

## 18. Cross-references

| Spec | Sections relevant |
|---|---|
| **SPEC_USER_v3.1.md** | User entity, auth, profile (member relationship) |
| **SPEC_MULTIPLAYER.md** | §R1-R5 cleanup rules, §WS WebSocket events, sequential mode engine |
| **SPEC_ADMIN.md** | §11 Report moderation, group lock V19, force soft-delete V13 |
| **SPEC_ROADMAP.md** | Multi-leader system (deferred, KHÔNG include in v1.2 per Bui lock) |
| **AUDIT_SUMMARY.md** | Bui Q2 lock: Q-A group-play-only |
| **AUDIT_CONSTRAINTS.md** | §C8 Q-A...Q-O verification matrix |
| **BACKLOG.md** | All Q-* gaps + Q-A code drift refactor |

---

*Living spec — v1.2 reflects Bui 2026-05-09 Q-A clarification + V40/V41 entity additions.*
*Multi-leader system intentionally OMITTED → see SPEC_ROADMAP.md.*
*Next revision (v1.3) khi Q-A code refactor lands hoặc beta data trigger new locks.*
