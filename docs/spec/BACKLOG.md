# BACKLOG — Code Gaps vs Canonical Spec

**Last updated:** 2026-05-09
**Purpose:** Mọi điểm code chưa khớp canonical spec (SPEC_USER_v3.1 / SPEC_ADMIN_v3.1 / SPEC_GROUP_v1.2 / SPEC_MULTIPLAYER) hoặc tech debt cần fix.

> **Quy tắc:** Mỗi item có ID `BL-N`, status, owner placeholder, references. Khi fix xong → đánh ✅ DONE + ghi commit hash + xoá item sau 1 sprint.

---

## Critical (chặn user-visible feature parity với spec)

### BL-1 — Bible version: BTT 1926 → BTTHĐ 2011
- **Spec canonical (Q1):** BTTHĐ 2011 (Bản Truyền Thống Hiệu Đính 2011).
- **Code reality:** Seed comments + question text dùng BTT 1926 (public domain).
- **Cần làm:**
  - Thẩm định license cho BTTHĐ 2011 (có cần permission từ UBS/Vietnamese Bible Society?)
  - Re-seed `apps/api/src/main/resources/seed/questions/*_quiz*.json` với verse text BTTHĐ 2011
  - Update `scripts/sql_to_json.py` reference table nếu cần
  - Audit: ~664 câu hỏi cần check (xem CLAUDE.md Question Seeding)
- **Status:** ⬜ TODO
- **Ref:** AUDIT_SUMMARY Q1, AUDIT_CONSTRAINTS C4

### BL-2 — Q-A scoring: filter group leaderboard by source
- **Spec canonical (Q2):** Group leaderboard chỉ cộng điểm từ group-room + scheduled-quiz; KHÔNG cộng solo Practice/Ranked/Daily Challenge.
- **Code reality:** `ChurchGroupService.getLeaderboard()` (lines 86-127) sums ALL `UserDailyProgress` (no source filter). Group members scope ✅ nhưng score sources ❌.
- **Cần làm:**
  - Thêm column `source` vào `UserDailyProgress` (ENUM: SOLO_PRACTICE/SOLO_RANKED/SOLO_DAILY/GROUP_ROOM/SCHEDULED_QUIZ) hoặc tạo bảng `group_score_contribution` riêng
  - Migration mới (V49) để add column + backfill historical data với rule: rooms.group_quiz_set_id != null → GROUP_ROOM, scheduled_quiz_attempts → SCHEDULED_QUIZ, còn lại → SOLO_*
  - `ChurchGroupService.getLeaderboard()` filter `source IN (GROUP_ROOM, SCHEDULED_QUIZ)`
  - Unit test cho cả 2 trường hợp (member chơi solo + member chơi group)
- **Status:** ⬜ TODO
- **Ref:** AUDIT_SUMMARY Q2, AUDIT_CONSTRAINTS C8 Q-A, SPEC_GROUP_v1.2 §10.4

### BL-3 — Wire XP Surge bonus (Milestone Burst)
- **Spec canonical (Q5):** Khi user đạt 90% tier progress → trigger XP surge `xp_surge_until = now + 2h`, trong 2h đó mọi điểm Ranked × 1.5.
- **Code reality:**
  - `User.xp_surge_until` (V24) field tồn tại
  - `MilestoneBanner.tsx` UI tồn tại
  - **NHƯNG** `ScoringService.java` không consume `xp_surge_until` — bonus là dead code
- **Cần làm:**
  - Trong `ScoringService.calculateScore()`: nếu `user.xp_surge_until > now` → multiply final score × 1.5
  - Trigger logic: trong `TierProgressService` (hoặc nơi update XP), khi cross 90% threshold lần đầu trong tier → set `xp_surge_until = now + 2h`, fire notification, reset on tier-up
  - Edge case: nếu user đã có xp_surge_until active → KHÔNG re-trigger (1 lần/tier)
  - Unit test
- **Status:** ⬜ TODO
- **Ref:** AUDIT_SUMMARY Q5, AUDIT_UNDOCUMENTED feature 2

### BL-4 — i18n wording normalize: "Đấu Hạng"
- **Spec canonical (Q4):** Mode names = "Luyện Tập" + "Đấu Hạng" (Vietnamese-only).
- **Code reality (không nhất quán):**
  - `apps/web/src/i18n/vi.json:37-38` — "Luyện tập" (l thường) + "Leo Rank"
  - `apps/mobile/src/i18n/vi.json:63-65` — "Luyện Tập" + "Thi Đấu"
  - Một số string khác trong vi.json dùng "Ranked" trực tiếp
- **Cần làm:**
  - Find/replace toàn bộ `apps/web/src/i18n/vi.json` + `apps/mobile/src/i18n/vi.json`:
    - "Luyện tập" → "Luyện Tập" (capital T)
    - "Leo Rank" → "Đấu Hạng"
    - "Thi Đấu" (mode name) → "Đấu Hạng"
    - "Ranked" (đứng độc lập trong VN UI) → "Đấu Hạng"
  - Re-run `cd apps/web && npm run validate:i18n`
  - Update unit tests assert text mới
  - Snapshot test mobile screens
- **Status:** ⬜ TODO
- **Ref:** AUDIT_SUMMARY Q4

### BL-5 — Liturgical Seasons: ship 2 mùa thiếu + wire ×1.5 bonus
- **Spec canonical (Q3):** 4 mùa Liturgical (Phục Sinh / Ngũ Tuần / Cảm Tạ / Giáng Sinh) + ×1.5 bonus trong Ranked + Daily Challenge.
- **Code reality:**
  - `VarietyQuizController.java:184-212` chỉ detect Christmas (Dec 1-25) + Easter (Mar + Apr 1-20)
  - Pentecost (Ngũ Tuần T5-7) — KHÔNG có
  - Thanksgiving (Cảm Tạ T8-10) — KHÔNG có
  - ×1.5 multiplier — dead code (controller comment `:24-43` nói "no XP, no leaderboard")
- **Cần làm:**
  - Thêm date detection cho Pentecost (May-July) + Thanksgiving (Aug-Oct)
  - Mỗi mùa: define books filter + description (consult với product/team về books relevant)
  - Wire ×1.5 trong `ScoringService` khi season active + question tagged seasonal
  - Add `seasonal_tag` column vào questions (hoặc seasonal_books config map)
  - Unit test (mock date trong từng mùa)
- **Status:** ⬜ TODO (large — chia 3 sub-tasks: detection, books config, scoring wire)
- **Ref:** AUDIT_SUMMARY Q3, AUDIT_CONSTRAINTS C3, SPEC_USER_v3.1 §5.6, SPEC_ROADMAP §2.3

---

## High (cleanup — small but visible)

### BL-6 — Drop CANCELLED Room status (deprecated per C7)
- **Code reality:**
  - `Room.java:93` enum value `CANCELLED` defined
  - `RoomPresenceListener.java:140` defensive check `status == CANCELLED || status == ENDED`
  - `setStatus(CANCELLED)` — 0 hits trong code
- **Cần làm:**
  - Migration V?: nếu có row nào status='CANCELLED' → update thành 'ENDED' (chắc không có nhưng safety)
  - Remove enum value khỏi `Room.RoomStatus`
  - Remove defensive checks (chỉ còn `== ENDED`)
  - Update specs/docs nếu còn mention
- **Status:** ⬜ TODO
- **Ref:** SPEC_MULTIPLAYER §2.2, AUDIT_CONSTRAINTS C7

### BL-7 — Sentry: remove placeholder mentions
- **Spec canonical (Q6):** Sentry chưa ship → KHÔNG document trong current spec; move to ROADMAP.
- **Code reality:**
  - `apps/web/package.json` — không có `@sentry/*`
  - `apps/api/pom.xml` — không có `sentry-spring-boot`
  - Spec_user_v3 cũ + 2 prompt files mention Sentry
- **Cần làm:**
  - Đã làm (Phase 2): SPEC_USER_v3.1.md không nhắc Sentry, đã đưa vào SPEC_ROADMAP.md §2.9
  - Cleanup: prompt files (`docs/prompts/release-readiness-verify-and-plan.md`, `archive/PROMPT_*.md`) — archive, không cần update
- **Status:** ✅ DONE (xử lý trong Phase 2 spec rewrite)

---

## Medium (tech debt)

### BL-8 — i18n hardcoded VN strings (baseline 116 lines)
- **Source:** CLAUDE.md i18n Coverage section
- **Status:** Tracked, chưa close.
- **Validator:** `cd apps/web && npm run validate:i18n` (fails CI nếu count tăng)
- **Accepted debt** (không count):
  - data/verses.ts (30 lines) — Bible verse content
  - PrivacyPolicy + TermsOfService (57 lines) — bilingual via isVi ternary
  - LandingPage (10 lines) — marketing copy
  - AIQuestionGenerator DEFAULT_PROMPT (8 lines) — literal AI prompt
  - Mock sample data (11 lines) — placeholder
- **Action:** Khi PR mới chạm các file ngoài accepted-debt list → phải dùng `t()`.

### BL-9 — Verify TanStack Query coverage in admin pages
- **Status:** TanStack Query confirmed shipped (web ^5.56.2, mobile ^5.96.2, 71 web files use it). Audit phát hiện ít nhất 70+ files use `@tanstack/react-query`. Admin Dashboard.tsx confirmed dùng.
- **Action:** Spec đã document. Nếu phát hiện admin page mới dùng `useEffect + fetch` thủ công → fix theo CLAUDE.md Frontend rules.

### BL-10 — AI Question Generator: verify quota + provider
- **Spec claim:** 200/day quota, 3-layer dedup, draft approval, batch explanations.
- **Code:** `AIQuestionGenerator.tsx` + `AIGenerationService` exist; quota field NOT verified deeply.
- **Action:** Đọc kỹ `AIGenerationService` — confirm:
  - AI provider (Gemini? OpenAI? — `GEMINI_API_KEY` mention trong CLAUDE.md hint là Gemini cho translation script; GenAI cho question gen có thể khác)
  - Daily quota implementation (DB column? Config?)
  - 3-layer dedup actually wired
- **Status:** ⬜ TODO (verify-then-spec-update)
- **Ref:** SPEC_ADMIN_v3.1 §7

---

## Lower priority

### BL-11 — Mobile feature parity gaps vs web
| Gap | Where | Notes |
|---|---|---|
| Multiplayer realtime (STOMP) | `apps/mobile/src/screens/multiplayer/` | Stub only — comment nói sẽ tích hợp |
| Cosmetics page | none | Chưa expose |
| Tournament match scoring detail | partial | Chỉ có bracket view |
| SetEditor | none | Chưa có UI |
| Scheduled quizzes | none | Chưa có routes |

- **Action:** Discuss với product timeline cho mobile parity.

### BL-12 — Group Leaderboard endpoint test for Q-A fix
- **Phụ thuộc:** BL-2
- **Action:** E2E test: tạo group, member A play solo + member A play group room → leaderboard chỉ count group room điểm.

---

## Added 2026-05-09 (Phase 2 spec refinement)

### BL-13 — Comeback Bridge: wire xpMultiplier rewards
- **Spec:** [SPEC_USER_v3.1.md §12.4](SPEC_USER_v3.1.md)
- **Code:** `ComebackService.java:117-126` TODO comment xác nhận: rewardTier persists vào DB nhưng `XP_BOOST +50 XP`, `2X_XP_DAY`, `RECOVERY_PACK`, `STARTER_PACK` xpMultiplier KHÔNG wire ScoringService.
- **Cần làm:** (giống pattern BL-3 XP surge)
  - Thêm `User.comeback_active_until` (nullable LocalDateTime) — khi claim → set tùy theo tier (XP_BOOST=instant, 2X_XP_DAY=24h, RECOVERY_PACK=24h+freeze, STARTER_PACK=48h)
  - `ScoringService.calculateScore()`: nếu `now < comeback_active_until` → multiply × `comebackMultiplier`
  - XP_BOOST one-shot +50 → call `dailyProgress.addBonusPoints(50)` ngay khi claim
  - Migration mới (V49 hoặc gộp với BL-3)
  - Unit test
- **Status:** ⬜ TODO

### BL-14 — Sequential Mode: host "Skip idle player" button
- **Spec:** [SPEC_MULTIPLAYER.md §3.5 Edge cases / Appendix B MP-6](SPEC_MULTIPLAYER.md)
- **Code:** `SequentialScoringService.java:27` — hiện 10 phút timeout buộc 9 player đợi nếu 1 idle.
- **Cần làm:**
  - Add STOMP handler `/room/{roomId}/skip-player { userId }` — host-only check
  - Mark target player as ABSENT cho round hiện tại; đếm tiếp như đã trả lời sai
  - UI button "Bỏ qua" trong RoomQuiz Sequential variant — show after 30s nếu player chưa answer
  - Broadcast `PLAYER_SKIPPED { userId }`
  - Unit test
- **Status:** ⬜ TODO

### BL-15 — Deprecate `useWebSocket.ts` (legacy raw WS hook)
- **Spec:** [SPEC_MULTIPLAYER.md §5.1 + Appendix B MP-7](SPEC_MULTIPLAYER.md)
- **Code:** `apps/web/src/hooks/useWebSocket.ts` (raw WS, query-param JWT) vs `apps/web/src/hooks/useStomp.ts` (STOMP, header JWT). Rooms đã migrate sang useStomp; còn callers nào không?
- **Cần làm:**
  - `grep "useWebSocket" apps/web/src` — list remaining callers
  - Migrate từng caller sang `useStomp` (nếu cần STOMP) hoặc native `WebSocket` API (nếu raw)
  - Khi count = 0 → delete `useWebSocket.ts`
  - Update Known Issues row #7 trong CLAUDE.md
- **Status:** ⬜ TODO

### BL-AD-1 — AI Quota: persist via Redis sorted-set
- **Spec:** [SPEC_ADMIN_v3.1.md §20.1 AD-1](SPEC_ADMIN_v3.1.md)
- **Code:** `AIAdminController.java:38-45` in-memory `ConcurrentHashMap<adminId, AtomicInteger>` — restart mất count.
- **Cần làm:** Redis key `ai:quota:{adminId}:{YYYY-MM-DD}` ZINCRBY 1 cho mỗi request; TTL 48h tự cleanup. Check trước khi generate.
- **Status:** ⬜ TODO

### BL-AD-2 — Configuration: build `app_config` table + admin CRUD
- **Spec:** [SPEC_ADMIN_v3.1.md §13 + §20.1 AD-2](SPEC_ADMIN_v3.1.md)
- **Cần làm:** Migration V?: `app_config(key VARCHAR PK, value TEXT, value_type ENUM, updated_by FK, updated_at)`. `AdminConfigController` GET/PUT. `ConfigService` với Caffeine 5min cache. Sample keys: `biblequiz.room.idle-timeout-minutes`, `biblequiz.room.ended-retention-hours`, `biblequiz.room.reconnect-grace-seconds`, `biblequiz.ai.daily-quota`, etc.
- **Status:** ⬜ TODO

### BL-AD-3 — Notification broadcast: lightweight campaign system
- **Spec:** [SPEC_ADMIN_v3.1.md §12 + §20.1 AD-3](SPEC_ADMIN_v3.1.md)
- **Cần làm:** Migration V?: `notification_campaigns(id, target_audience JSON, content TEXT, sent_count INT, opened_count INT, sent_by FK, sent_at)`. Endpoint `POST /api/admin/notifications/broadcast`. Spawn batch insert vào `notifications` table. Track `opened` qua existing `read_at`.
- **Status:** ⬜ TODO

### BL-AD-4 — Audit log: standardize via `AuditEventService.record(...)`
- **Spec:** [SPEC_ADMIN_v3.1.md §14 + §20.1 AD-4](SPEC_ADMIN_v3.1.md)
- **Cần làm:** Tạo `AuditEventService.record(actorId, action, targetType, targetId, before JSON, after JSON, metadata JSON)` — write `audit_events` (V4 table). Wire từ mọi admin write controller (ban user, lock group, edit question, end season, etc.).
- **Status:** ⬜ TODO

### BL-AD-5 — Question soft delete (30-day retention)
- **Spec:** [SPEC_ADMIN_v3.1.md §5 + §20.1 AD-5](SPEC_ADMIN_v3.1.md)
- **Cần làm:** Migration V?: `questions.deleted_at` nullable. `DELETE` admin endpoint set `deleted_at = now`. Active queries filter `WHERE deleted_at IS NULL`. Cron purge sau 30 days. Admin Trash tab cho restore.
- **Status:** ⬜ TODO

### BL-AD-6 — CONTENT_MOD UI label switch in AdminLayout
- **Spec:** [SPEC_ADMIN_v3.1.md §20.1 AD-6](SPEC_ADMIN_v3.1.md)
- **Cần làm:** `AdminLayout.tsx` — đọc `useAuthStore` user.role, render header text "Moderation Dashboard" vs "Admin Panel". Hide sidebar items: Configuration / Test Panel / Notifications campaign nếu role = CONTENT_MOD. Unit test cả 2 roles.
- **Status:** ⬜ TODO

---

## Done (recent — keep until next sprint review)

| ID | Item | Commit |
|---|---|---|
| (Pre-Phase 2) | Idle-lobby threshold unification (G4, G8) | 1f40e6a |
| (Pre-Phase 2) | RoomAbandonmentScheduler stuck recovery (R5, G1) | 7a43b0f |
| (Pre-Phase 2) | Purge ENDED rooms 24h (R3) | a1a8620 |
| (Pre-Phase 2) | Rehydrate current question for mid-game rejoiners | 0e65bd9 |
| (Pre-Phase 2) | Broadcast ROOM_ENDED with reason from all cleanup paths (G5) | 5aef216 |
| BL-7 | Sentry: remove from current specs | Phase 2 spec rewrite |

---

## Added 2026-05-09 (First spec-audit run — `tools/spec-audit/`)

> Source: `tools/spec-audit/REPORT.md` (first run). Top-priority items only;
> full broken/orphan/undocumented lists in REPORT.md.
>
> First-run baseline: 38 broken refs · 304 orphan sections · 200 undocumented
> business-logic files. Coverage: BE Controller 5%, BE Service 6%, FE User Page 4%,
> FE Admin Page 11%.

### BL-AUDIT-1 — Spec refs use partial paths (e.g. `pages/Multiplayer.tsx`)
- **Issue:** SPEC_MULTIPLAYER §7.x references `pages/Multiplayer.tsx`, `pages/CreateRoom.tsx`, `pages/JoinRoom.tsx`, `pages/RoomLobby.tsx`, `pages/RoomQuiz.tsx`, etc. — partial paths that fail audit's filesystem check (must be `apps/web/src/pages/...`).
- **Cần làm:** Bulk replace partial paths → full repo-rooted paths in SPEC_MULTIPLAYER (and any other spec hit by this).
- **Status:** ⬜ TODO
- **Ref:** REPORT.md §Broken Refs (≈10 of 38 broken)

### BL-AUDIT-2 — `RoomQuizHost.tsx` / `RoomQuizPlayer.tsx` referenced but not implemented
- **Issue:** SPEC_MULTIPLAYER §7.5 documents Sprint 4 split routes (`pages/RoomQuizHost.tsx`, `pages/RoomQuizPlayer.tsx`), code still has single `pages/RoomQuiz.tsx`. Sprint 4 in-progress (S4-1...S4-4 merged, split route not yet).
- **Cần làm:** Either (a) add deferral note in SPEC_MULTIPLAYER §7.5 ("Split deferred to Sprint 4 closeout") or (b) defer entire split to ROADMAP until ship.
- **Status:** ⬜ TODO

### BL-AUDIT-3 — Migration filename refs in SPEC_USER use bare names
- **Issue:** SPEC_USER §3.5/§4.7/§5.3 reference `add_basic_quiz_unlock.sql`, `add_xp_surge_to_users.sql`, `add_daily_completions.sql` (bare). Actual Flyway files use `V{n}__` prefix and don't match basename search.
- **Cần làm:** Update spec to reference actual `apps/api/src/main/resources/db/migration/V{n}__...sql` filenames.
- **Status:** ⬜ TODO

### BL-AUDIT-4 — Variety mode pages referenced but don't exist (`MysteryMode.tsx`, `SpeedRound.tsx`, `WeeklyQuiz.tsx`)
- **Issue:** SPEC_USER §5.4 Variety Modes references `pages/MysteryMode.tsx`, `pages/SpeedRound.tsx`, `pages/WeeklyQuiz.tsx`. None exist in `apps/web/src/pages/`. Either vaporware or planned.
- **Cần làm:** Verify with user — ship status? If not shipped → move to ROADMAP. If shipped under different name → fix refs.
- **Status:** ⬜ TODO

### BL-AUDIT-5 — `Groups.tsx` ambiguous (admin vs user page)
- **Issue:** SPEC_ADMIN_v3.1 §2 references `Groups.tsx`. Two files match: `apps/web/src/pages/admin/Groups.tsx` AND `apps/web/src/pages/Groups.tsx`. Audit flags as ambiguous.
- **Cần làm:** Use full path in spec ref (`apps/web/src/pages/admin/Groups.tsx`).
- **Status:** ⬜ TODO

### BL-AUDIT-6 — Coverage critically low across all concerns
- **Issue:** First-run coverage stats: BE Controller 5% (2/37), BE Service 6% (3/51), FE User Page 4% (4/90), FE Admin Page 11% (4/35). 200 business-logic files have zero spec ref.
- **Cần làm:** Plan systematic spec coverage push — minimum target: every Controller + Service mentioned in at least one spec section. Track via REPORT.md coverage table over sprints.
- **Status:** ⬜ TODO

### BL-AUDIT-7 — 304 orphan spec sections (no code refs)
- **Issue:** 304 of 426 spec sections (71%) have zero file:line refs. Could be section overhead (intro/headers) or genuine vaporware.
- **Cần làm:** Filter via `node tools/spec-audit/parse-spec-refs.js --orphans`. Triage: prose-only sections OK, "behavior X happens at Y" sections need refs.
- **Status:** ⬜ TODO

---

## Sprint 5 (Quiz Set Professional) — Deferred items

### BL-S5-1 — Mastery hook into QuizSession.completeSession
- **Issue:** Q-4 shipped `GroupQuizSetMasteryService.recordPracticeSession()` but caller wiring chưa có. Mastery KHÔNG tự động cập nhật khi user complete solo practice từ group quiz set.
- **Cần làm:**
  1. V53 migration: `ALTER TABLE quiz_sessions ADD COLUMN group_quiz_set_id VARCHAR(36) NULL` + index
  2. Update QuizSession entity + add field setter
  3. Update 2-3 session-creation paths (Practice page, group quiz set "Tự ôn solo" flow) để set `groupQuizSetId`
  4. Hook trong `SessionService.completeSession`: nếu `session.groupQuizSetId != null` → call `masteryService.recordPracticeSession(...)`
  5. Compute `correctQuestionIds` từ session answers (Answer entity)
- **Q-A guard:** đảm bảo KHÔNG insert vào UserDailyProgress cho group leaderboard purposes
- **Status:** ⬜ TODO (deferred Sprint 6)

### BL-S5-2 — i18n keys cho 3 FE pages Sprint 5
- **Issue:** QuizSetCreate/Detail/List ship với hardcoded VN strings (~50-80 lines). Tăng debt từ 648 → ~700 hardcoded.
- **Cần làm:**
  1. Tạo `quizSet:` block trong vi.json + en.json
  2. Refactor 3 pages dùng `useTranslation()`
  3. Run `npm run validate:i18n` — verify count giảm ≤ 648 baseline
- **Status:** ⬜ TODO (deferred i18n sprint)

### BL-S5-3 — Auto-derive Difficulty cho quiz set
- **Issue:** Q-5 publishQuizSet hiện fallback `Difficulty.MEDIUM`. Logic auto-derive từ Question.difficulty được defer vì enum mismatch (Question lowercase `easy/medium/hard`, GroupQuizSet uppercase `EASY/MEDIUM/HARD/MIXED`).
- **Cần làm:** Implement `computeDifficulty()` per Q-0 P-D patch sample (map lowercase → uppercase với MIXED rule).
- **Status:** ⬜ TODO (Sprint 6)

### BL-S5-4 — Folder UI trong QuizSetList + QuizSetCreate
- **Issue:** Folder CRUD endpoints đã ship nhưng FE list page chưa render group-by-folder header + folder selector trong create form.
- **Cần làm:** QuizSetList: load folders + render section headers; QuizSetCreate: thêm `<FolderSelector>` (existing folders + "Tạo mới" inline).
- **Status:** ⬜ TODO (Sprint 6)

### BL-S5-5 — Pixel-perfect mockup match
- **Issue:** 3 FE pages ship functional baseline với inline Tailwind. Mockup `docs/mockups/MOCKUP_QUIZ_SET_V2_PROFESSIONAL.html` có chi tiết design tokens (Be Vietnam Pro 800/900, gradient cards, exact spacing) chưa được apply.
- **Cần làm:** Stitch sync workflow — verify mockup, refine spacing/typography/animations.
- **Status:** ⬜ TODO (Sprint 6)

---

## Cross-references
- Canonical specs: [SPEC_USER_v3.1.md](SPEC_USER_v3.1.md), [SPEC_MULTIPLAYER.md](SPEC_MULTIPLAYER.md), [SPEC_ADMIN_v3.1.md](SPEC_ADMIN_v3.1.md), [SPEC_GROUP_v1.3.md](SPEC_GROUP_v1.3.md) (Sprint 5)
- Roadmap (defer features): [SPEC_ROADMAP.md](SPEC_ROADMAP.md)
- Audit findings: [../audit/](../audit/)
