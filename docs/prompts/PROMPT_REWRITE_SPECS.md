# PROMPT: Audit + Rewrite SPECs (Single Source of Truth)

> **Goal:** Tạo bộ spec mới phản ánh **state THỰC TẾ** của BibleQuiz hiện tại. SPECs hiện có nhiều divergence so với code đã ship + decisions đã lock. Cần audit code trước, sau đó rewrite.
>
> **Output dir:** `/mnt/user-data/outputs/`
> **Workflow:** Phase 1 audit → Bui review findings → Phase 2 rewrite. **DO NOT** rewrite specs ngay lập tức. Audit xong thì stop và confirm.

---

## Bối cảnh

Hiện có 3 spec files chính:
- `SPEC_USER_v3.md` — outdated (tier names sai, 4 mùa chỉ ghi 2, sprint mới chưa vào)
- `SPEC_ADMIN_v3.md` — phần lớn còn đúng nhưng cần cross-check
- `SPEC_GROUP_v1.1.md` — canonical, locked decisions Q-A...Q-O, nhưng cần verify implementation status

Code đã ship rất nhiều feature kể từ khi specs viết lần cuối. Không thể trust spec — phải đọc code làm ground truth.

---

## Constraints CANONICAL (KHÔNG được drift)

Đây là rules đã lock — nếu code/spec nói khác là code/spec sai:

### C1. Tier names (hệ CŨ — duy nhất đúng)
```
Tier 1: Tân Tín Hữu
Tier 2: Người Tìm Kiếm
Tier 3: Môn Đồ
Tier 4: Hiền Triết
Tier 5: Tiên Tri
Tier 6: Sứ Đồ
```
**KHÔNG** dùng hệ Light-based (Tia Sáng / Ánh Bình Minh / Ngọn Đèn / Ngọn Lửa / Ngôi Sao / Vinh Quang). Nếu thấy hệ này trong `SPEC_USER_v3.md §3.1` → spec sai, phải patch.

### C2. Mode names canonical
- **Luyện Tập** (KHÔNG "Practice Mode" trong UI VN)
- **Thi Đấu Ranked** (KHÔNG "Ranked Mode" trong UI VN)
- Layout: **Option Y** — Practice + Ranked là 2 core featured cards trên Home

### C3. Liturgical calendar (4 mùa, KHÔNG phải 2)
```
Mùa Phục Sinh    (T2–T4)
Mùa Ngũ Tuần     (T5–T7)
Mùa Cảm Tạ       (T8–T10)
Mùa Giáng Sinh   (T11–T1)
```
Bonus ×1.5 score trong Ranked Mode + Daily Challenge cho câu hỏi tagged season-relevant. `SPEC_USER_v3.md §5.6.5` chỉ ghi Christmas + Easter → **patch để đủ 4 mùa**.

### C4. Bible content
- Bản dịch chính: **BTTHĐ 2011** (Bản Truyền Thống Hiệu Đính 2011)
- 50/50 VN/EN ratio trong question pool

### C5. Answer color mapping (tất cả game modes)
- A = Coral
- B = Sky
- C = Gold
- D = Sage

### C6. Role hierarchy trong Group
- 👑 Leader (gold)
- 🛡️ Mod (blue)
- Member (plain)

### C7. Room lifecycle 5 rules (canonical, đã confirmed bug live trong dev DB)
- **R1:** Empty lobby → DELETE ngay + broadcast `ROOM_ENDED`
- **R2:** Idle > `ROOM_IDLE_TIMEOUT_MIN` (default 30 phút) → DELETE
- **R3:** Status `ENDED` retention 24h
- **R4:** Host disconnect 60s grace → promote next member
- **R5:** All disconnect > 60s OR stuck `IN_PROGRESS` > 90 phút → auto-end
- Status `CANCELLED` **deprecated**, mọi terminal path qua `ENDED`

### C8. SPEC_GROUP locked decisions (đừng đụng)
- Q-A: solo quiz KHÔNG vào group leaderboard
- Q-B: sequential mode dùng manual advance
- Q-C: bỏ dedup live + solo path
- Q-D: giữ Mod role v1
- Q-N: rename `/live-quiz` → `/live-rooms`
- Q-O: DB schema dùng JSON list `questionIds`
- Multi-leader system **defer v1.5**

### C9. Defer list (KHÔNG document như feature hiện có)
- TV Host Mode (Kahoot pattern, two-screen) → v1.5
- Multi-leader system → v1.5
- Seasonal UI theming → v3.0
- Friend System → v2.5
- Premium tier → v3.0
- Offline mode → v3.0

---

## Phase 1: AUDIT (VERIFICATION-FIRST)

> **Quy tắc:** KHÔNG đoán. KHÔNG tin spec. Đọc code để biết ground truth.

### Step 1.1: Inventory features đã ship

Grep code để build inventory thực tế:

```bash
# Backend services
find apps/api/src/main/java -name "*Service.java" | xargs grep -l "@Service"
find apps/api/src/main/java -name "*Controller.java"

# Backend entities
find apps/api/src/main/java -name "*.java" -path "*/entity/*"

# Frontend pages + components
find apps/web/src/pages -name "*.tsx"
find apps/mobile/src/screens -name "*.tsx"

# Flyway migrations (ground truth schema)
ls apps/api/src/main/resources/db/migration/
```

Output: `AUDIT_INVENTORY.md` với danh sách:
- Tất cả entities + key fields
- Tất cả API endpoints (method + path + auth requirement)
- Tất cả pages (web) + screens (mobile)
- Tất cả services + key business methods
- Latest migration version (V?? cao nhất)

### Step 1.2: Verify CANONICAL constraints

Cho mỗi C1–C9 ở trên, grep code để verify:

| Constraint | Verify command | Expected |
|---|---|---|
| C1 (tier names) | `grep -r "Tia Sáng\|Tân Tín Hữu" apps/web apps/mobile apps/api` | Chỉ có "Tân Tín Hữu..." |
| C2 (mode names) | `grep -r "Luyện Tập\|Thi Đấu" apps/web apps/mobile` | Có cả 2 trong UI VN |
| C3 (4 mùa) | `grep -r "Mùa Phục Sinh\|Mùa Ngũ Tuần\|Mùa Cảm Tạ\|Mùa Giáng Sinh\|Christmas\|Easter" apps/api` | Có code cho 4 mùa hoặc chưa implement |
| C5 (answer colors) | `grep -r "Coral\|Sky\|Gold\|Sage" apps/web/src apps/mobile/src` | Mapping nhất quán A/B/C/D |
| C7 (room lifecycle) | `grep -r "ROOM_IDLE_TIMEOUT_MIN\|ROOM_ENDED\|CANCELLED" apps/api` | R1–R5 implemented; CANCELLED deprecated? |
| C8 (questionIds JSON) | Check schema migration cho group_quiz_set | Field type JSON/TEXT |

Output bảng trong `AUDIT_CONSTRAINTS.md`:

```
| Constraint | Status | Evidence | Divergence |
|---|---|---|---|
| C1 Tier names | ✅ Match | apps/web/src/data/tiers.ts:5 | None |
| C3 4 Liturgical seasons | ❌ Diverged | Only Christmas+Easter in SeasonalContentService.java:23 | Missing Phục Sinh, Ngũ Tuần, Cảm Tạ |
| C7 Room lifecycle R1 | ⚠️ Partial | Empty delete in RoomService:142 but no ROOM_ENDED broadcast | Missing broadcast |
...
```

### Step 1.3: Cross-check spec vs code

Cho mỗi section của 3 specs hiện có, verify với code:

**SPEC_USER_v3.md sections cần verify:**
- §3.1 Tier names → check `tiers.ts`, `User.java tier_level`
- §3.2.1 Difficulty distribution → check `SmartQuestionSelector.java`, `TierConfig`
- §3.2.2 Rewards multipliers → check `ScoringService.java`, `EnergyService.java`
- §3.2.3 Game mode unlocks → check `GameModeService.java` hoặc tier gate logic
- §4.1 Base points → check `ScoringService.java`
- §4.2 Speed bonus formula → check code
- §4.4 Energy system → check `EnergyService.java`
- §5.1–5.6 Game modes → check controllers + frontend pages
- §5.4.1–5.4.4 Multiplayer modes → check `BattleRoyaleEngine`, `TeamScoringService`, `SuddenDeathMatchService`
- §5.4.5 Disconnect/reconnect → check WebSocket handlers
- §5.6.5 Seasonal content → **KNOWN DIVERGENCE (chỉ 2/4 mùa)**
- §6 Bible Journey Map → check `JourneyService.java`
- §7 Smart Question Selection → check `SmartQuestionSelector.java`
- §8 Sound + haptics → check `soundManager.ts`, `haptics.ts`
- §9.1.4 Group Quiz Set → check `GroupQuizSetService`, `Q-O` JSON schema
- §11 Mobile app → check `apps/mobile/`
- §16 WebSocket events → check `WebSocketConfig`, STOMP handlers
- §17 API endpoints → cross-check với inventory ở Step 1.1

**SPEC_ADMIN_v3.md sections cần verify:**
- §3 User management → check `AdminUserController`
- §4 Question CRUD → check `AdminQuestionController`
- §5 Duplicate detection 3-layer → check `DuplicateDetectionService`
- §6 AI Question Generator → check `AIQuestionService`, `AIGenerationJob`
- §7 Review Queue → check `ReviewQueueController`
- §13 Configuration keys → check `app_config` table data + `ConfigService`
- §17 Test Panel → check `@Profile({"dev","staging"})` controllers

**SPEC_GROUP_v1.1 sections cần verify:**
- Locked decisions Q-A...Q-O implementation status
- Inline gap markers (Q-E, Q-F, Q-J, Q-K, Q-L, Q-M)

Output: `AUDIT_DIVERGENCES.md` với format:

```markdown
## SPEC_USER_v3.md §3.1 Tier names

**Spec says:** Tia Sáng / Ánh Bình Minh / Ngọn Đèn / Ngọn Lửa / Ngôi Sao / Vinh Quang
**Code says:** apps/web/src/data/tiers.ts → Tân Tín Hữu / Người Tìm Kiếm / Môn Đồ / Hiền Triết / Tiên Tri / Sứ Đồ
**Verdict:** SPEC SAI. Canonical = code (matches C1).
**Action:** Rewrite §3.1 với tier names canonical.

---

## SPEC_USER_v3.md §5.6.5 Seasonal content

**Spec says:** Christmas (12/1-25) + Easter (T3-4) → ×1.5 XP
**Code says:** apps/api/.../SeasonalContentService.java:23 — chỉ check Christmas + Easter range
**Verdict:** Cả spec lẫn code thiếu. Canonical (C3) = 4 mùa.
**Action:** (1) Patch spec để document 4 mùa; (2) Ghi nhận code cần update — KHÔNG fix code trong audit, chỉ list ra `BACKLOG.md`.
```

### Step 1.4: Find features đã ship NHƯNG chưa có trong spec

Grep code tìm features không reference trong spec:
- TanStack Query patterns
- Sentry monitoring
- i18n (vi/en)
- Lighthouse perf optimizations
- Mobile auth (3 endpoints)
- Test data seeder
- Daily Mission system (V23 migration)
- Tier Progress + Star popup
- Milestone Burst (V24)
- Comeback Bridge (V25)
- Tier Cosmetics (V26)
- Prestige System (V27)
- ... (whatever else)

Output: `AUDIT_UNDOCUMENTED.md` — list features đã ship cần document mới.

### Step 1.5: Find spec content không có trong code

List sections của spec describe features không tồn tại:
- "Friend System v2.5" (defer — đúng theo C9)
- "Offline mode v3.0" (defer)
- ... (whatever)

Output: `AUDIT_VAPORWARE.md` — list spec sections cần move sang Roadmap section.

### Step 1.6: STOP — Bui review

**KHÔNG tiến hành Phase 2 cho đến khi Bui xác nhận audit findings.**

Output từ Phase 1:
- `AUDIT_INVENTORY.md`
- `AUDIT_CONSTRAINTS.md`
- `AUDIT_DIVERGENCES.md`
- `AUDIT_UNDOCUMENTED.md`
- `AUDIT_VAPORWARE.md`
- `AUDIT_SUMMARY.md` — TLDR + recommendation cho Phase 2

Stop. Wait for review.

---

## Phase 2: REWRITE SPECs (sau khi Bui approve audit)

### Deliverables

```
SPEC_USER_v3.1.md       — user-facing features, rules
SPEC_ADMIN_v3.1.md      — admin panel
SPEC_GROUP_v1.2.md      — group features (update v1.1, KHÔNG đụng locked decisions)
SPEC_MULTIPLAYER.md     — tách riêng nếu user spec quá dài (multiplayer modes + room lifecycle)
SPEC_ROADMAP.md         — defer list + version timeline
BACKLOG.md              — spec items chưa implement, technical debt
```

### Style requirements

- **Vietnamese-first** (technical terms tiếng Anh OK trong code blocks)
- **Concise** — không lặp prose, dùng bảng nhiều
- **Verify-able** — mỗi rule có file reference (vd: "xem `ScoringService.java:42`")
- **Versioned** — mỗi spec có header `Last updated: YYYY-MM-DD` + `Replaces: SPEC_X_v3.md`
- **Markdown structure:**
  - H1 = title
  - H2 = major sections
  - H3 = subsections
  - Tables cho rules/configs
  - Code blocks cho schemas/API examples
  - **NO emoji headers** (giữ professional cho spec docs)

### Content rules

1. **Bám sát code thực tế** — nếu code khác canonical, dùng canonical (C1–C9) làm nguồn, ghi note "code chưa match, xem BACKLOG.md".
2. **Mỗi rule có rationale ngắn** — giải thích WHY, không chỉ WHAT.
3. **Tách roadmap khỏi current spec** — current spec describe ONLY shipped features. Future = `SPEC_ROADMAP.md`.
4. **Group bug masking & known issues** — section riêng "Known Issues" cuối mỗi spec với link tới `BACKLOG.md`.
5. **API endpoints** — table format: method, path, auth, request, response, errors.
6. **WebSocket events** — section riêng với client→server vs server→client tách rõ.

### Cross-references

Specs phải link nhau:
- USER spec link tới ADMIN cho admin actions
- USER spec link tới GROUP cho group features
- GROUP spec link tới USER cho shared mechanics
- Tất cả link tới ROADMAP cho defer features

### Section template (cho mỗi major feature)

```markdown
## X. [Feature Name]

### X.1 Mục đích
[1-2 câu — feature giải quyết vấn đề gì]

### X.2 Rules
[Bảng rules canonical]

### X.3 Implementation
- **Backend:** `path/to/Service.java`, `path/to/Controller.java`
- **Frontend:** `path/to/Page.tsx`, `path/to/components/`
- **Mobile:** `path/to/Screen.tsx` (nếu có)
- **DB:** migration V?? — table/column names

### X.4 API
[Bảng endpoints]

### X.5 Edge cases
[List edge cases + behavior]

### X.6 Known issues
[Link BACKLOG.md nếu có]
```

---

## Output rules

1. **Audit phase output** vào `/mnt/user-data/outputs/audit/` (subdirectory)
2. **Spec phase output** vào `/mnt/user-data/outputs/specs/` (subdirectory)
3. Mỗi file < 2,500 dòng — split nếu vượt
4. Commit progress trong git theo phase, mỗi phase 1 commit:
   - `docs: spec audit findings (Phase 1)`
   - `docs: rewrite SPEC_USER v3.1 (Phase 2)`
   - `docs: rewrite SPEC_ADMIN v3.1 (Phase 2)`
   - ...

---

## Anti-patterns (đừng làm)

- ❌ Rewrite spec dựa vào trí nhớ hoặc spec cũ
- ❌ Bỏ qua canonical constraints (C1–C9) vì "code đang khác"
- ❌ Document features chưa ship như đã ship
- ❌ Document defer features (C9) như current
- ❌ Copy-paste lớn từ spec cũ mà không verify
- ❌ Skip Phase 1, nhảy thẳng sang Phase 2
- ❌ Tạo spec mới mà không link/replace spec cũ
- ❌ Chỉ liệt kê API mà không có rationale/edge cases

---

## Verify-checklist trước khi nộp Phase 2

- [ ] Tất cả tier name references = canonical (C1)
- [ ] Liturgical calendar = 4 mùa (C3)
- [ ] Room lifecycle = 5 rules R1–R5 (C7)
- [ ] CANCELLED status không xuất hiện như terminal state
- [ ] SPEC_GROUP locked decisions Q-A...Q-O preserved
- [ ] Defer features (C9) chỉ trong ROADMAP, không trong current specs
- [ ] Mỗi feature section có file reference
- [ ] Mỗi API table đầy đủ method/path/auth/request/response
- [ ] Cross-references giữa specs hoạt động
- [ ] BACKLOG.md liệt kê tất cả known divergences từ audit

---

## Khi gặp ambiguity

Stop. Document trong `QUESTIONS.md`:

```
## Q1: [Question]
**Context:** [What you saw in code]
**Options:**
  A. [Interpretation 1]
  B. [Interpretation 2]
**Recommendation:** [Your suggestion + why]
```

Wait for Bui clarification trước khi continue. Không guess.

---

*End of prompt. Read `/mnt/project/SPEC_USER_v3.md`, `/mnt/project/SPEC_ADMIN_v3.md`, và any `SPEC_GROUP*.md` để bắt đầu Phase 1.*
