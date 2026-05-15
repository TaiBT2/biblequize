# BACKLOG — Code Gaps vs Canonical Spec

**Last updated:** 2026-05-12
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

### BL-3 — Wire XP Surge bonus (Milestone Burst) — Consume
- **Spec canonical (Q5):** Khi `user.xp_surge_until > now`, mọi điểm Ranked × 1.5.
- **Wired 2026-05-13** (commit on `chore/code-quality-improvements`):
  - `RankedController.submitRankedAnswer` calls `scoringService.calculateWithTier(..., tierLevel, xpSurgeActive)` per [SPEC_USER §4.6](SPEC_USER_v3.1.md) formula. Both tier multiplier AND surge multiplier now applied.
  - `GET /api/me/tier-progress` returns honest `surgeActive` / `surgeUntil` / `surgeMultiplier` (Bui 2026-05-02 honesty contract relaxed). FE `MilestoneBanner.SurgeCountdown` shows real countdown.
  - Unit tests: `RankedControllerTest` 43/43 pass with new stub signature; `UserControllerTest` 16/16 pass with two surge-state cases.
  - **Side effect:** Tier 2-6 user điểm tăng theo `TierRewardsConfig` (1.1× → 2.0×) lần đầu kể từ V24. Leaderboard mid-season sẽ shift cho high-tier users.
- **Status:** ✅ DONE
- **Ref:** AUDIT_SUMMARY Q5, AUDIT_UNDOCUMENTED feature 2

### BL-3-trigger — XP Surge auto-trigger (Milestone Burst)
- **Spec canonical (Q5):** Khi user cross 90% tier progress lần đầu trong tier → backend set `xp_surge_until = now + 2h`, fire notification.
- **Code reality (sau BL-3 consume wired):**
  - Consume path đã hoạt động — admin có thể test bằng `xpSurgeHoursFromNow` ([SPEC_ADMIN §622](SPEC_ADMIN_v3.1.md))
  - Auto-trigger từ user gameplay vẫn dead — `TierProgressService` không có 90% threshold detection
- **Cần làm:**
  - `TierProgressService` thêm helper detect cross 90% threshold lần đầu trong tier
  - Khi cross → `userRepository.save(user.setXpSurgeUntil(now + 2h))`, fire `NotificationService` event
  - Edge case: nếu user đã có `xpSurgeUntil > now` (active) → KHÔNG re-trigger (1 lần/tier)
  - Reset on tier-up: khi user lên tier mới, reset surge flag eligibility
  - Unit test cho threshold detection + edge cases
- **Status:** ⬜ TODO
- **Ref:** Spinoff từ BL-3 consume wire 2026-05-13

### BL-4 — i18n wording normalize: "Đấu Hạng"
- **Spec canonical (Q4):** Mode names = "Luyện Tập" + "Đấu Hạng" (Vietnamese-only).
- **Code reality (không nhất quán):**
  - ~~`apps/web/src/i18n/vi.json:37-38` — "Luyện tập" (l thường) + "Leo Rank"~~ → **2026-05-13 web fix**: line 37 → "Luyện Tập", line 38 → "Đấu Hạng"
  - `apps/mobile/src/i18n/vi.json:63-65` — "Luyện Tập" + "Thi Đấu" ⬜ (mobile out of scope HR sprint)
  - ~~Một số string khác trong vi.json dùng "Thi Đấu Xếp Hạng" trực tiếp~~ → **2026-05-13 web fix**: replace_all "Thi Đấu Xếp Hạng" → "Đấu Hạng" (passUnlock, rankedHeader, unlockHeader, ranked.title + ~6 FAQ sentences). 1 test updated (`Ranked.test.tsx:117`).
- **Cần làm:**
  - ✅ `apps/web/src/i18n/vi.json`: "Leo Rank" → "Đấu Hạng" + "Luyện tập" → "Luyện Tập" + "Thi Đấu Xếp Hạng" → "Đấu Hạng" (DONE 2026-05-13)
  - ⬜ `apps/mobile/src/i18n/vi.json`: "Thi Đấu" → "Đấu Hạng"
  - ⬜ Re-run `cd apps/web && npm run validate:i18n` (chạy 2026-05-13 — count 1002 hardcoded / 16 missing keys; pre-existing debt, không tăng từ BL-4)
  - Update unit tests assert text mới — web 1 test done; mobile TBD
- **Status:** 🟡 PARTIALLY DONE (web ✅, mobile ⬜)
- **Ref:** AUDIT_SUMMARY Q4 · prereq cho HR-4 HeroRankedCard 2026-05-13

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
- **Closed 2026-05-13** (CQ-3, commit on `chore/code-quality-improvements`):
  - `grep "useWebSocket" apps/web/src` → 0 production callers (only the hook's own test file referenced it).
  - Migration was already done previously — Rooms use `useStomp.ts` (STOMP CONNECT header) for all WebSocket needs.
  - Deleted `apps/web/src/hooks/useWebSocket.ts` (285 LOC) + `apps/web/src/hooks/__tests__/useWebSocket.test.ts` (256 LOC, 15 tests).
  - CLAUDE.md §Known Issues "Critical" row removed.
- **Status:** ✅ DONE

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

### BL-16 — Group leaderboard endpoint `410 Gone` (Q-A sunset)
- **Spec:** [SPEC_GROUP_v1.3.md §10 (DEPRECATED in v1.4 changelog)](SPEC_GROUP_v1.3.md)
- **Code:** `ChurchGroupController.java:272 getLeaderboard(...)` + `ChurchGroupService.getLeaderboard(...)` — backend query still sums `UserDailyProgressRepository` (Q-A drift: counts solo/ranked/daily activity, not group-play-only).
- **Cần làm:**
  - Sprint 6 or later: keep endpoint `200 OK` for ~2 sprints (mobile compat). Then return `410 Gone` with `{ code: "LEADERBOARD_DEPRECATED", message: "... use /activity instead" }`.
  - When endpoint is gone, drop `ChurchGroupService.getLeaderboard` + `UserDailyProgressRepository` group-scoped queries — drift becomes irrelevant.
  - Remove FE callers (already done in GD-1; verify after mobile catches up).
- **Status:** ⬜ DEFER Sprint 7+ (waiting on mobile FE)
- **Cause:** GD-1 / 2026-05-10 leaderboard sunset

### BL-17 — Group Activity Feed (Sprint 6)
- **Spec:** [SPEC_GROUP_v1.3.md §12 (NEW in v1.4 changelog)](SPEC_GROUP_v1.3.md)
- **Code:** `apps/web/src/components/group/ActivityFeedPlaceholder.tsx` is the placeholder shipped GD-1; replace with real feed.
- **Cần làm:**
  - Migration V53: `group_activity (id UUID PK, group_id FK, actor_id FK, type ENUM, metadata JSONB, created_at TIMESTAMP, INDEX (group_id, created_at DESC))`
  - Recorder: `GroupActivityService.record(group, actor, type, metadata)` called from QuizSetMasteryService (MASTERY_COMPLETED), GroupQuizSetService (QUIZ_SET_CREATED), RoomService (LIVE_ROOM_STARTED/ENDED), GroupAnnouncementService (ANNOUNCEMENT_POSTED), ChurchGroupService (MEMBER_JOINED/LEFT), ScheduledQuizService (SCHEDULED_QUIZ_CREATED).
  - API: `GET /api/groups/{id}/activity?type=&limit=20&before=<ISO>` (paginated by created_at).
  - FE: replace ActivityFeedPlaceholder with paginated list + 30s refetchInterval (future: STOMP push).
  - Retention: delete > 90 days nightly cron.
- **Status:** ⬜ DEFER Sprint 6
- **Cause:** GD-1 / 2026-05-10 (placeholder shipped, real feed deferred)

### BL-18 — Cell Group Pulse heuristic (Sprint 6, leader-only)
- **Spec:** [SPEC_GROUP_v1.3.md §13 (NEW in v1.4 changelog)](SPEC_GROUP_v1.3.md)
- **Code:** `apps/web/src/components/group/CellGroupPulseCard.tsx` is the placeholder shipped GD-9; wire backend.
- **Cần làm:**
  - Migration V54: `group_pulse_snapshot (id UUID PK, group_id FK, snapshot_date DATE, score DECIMAL(3,2), status ENUM(STRONG,MEDIUM,WEAK), active_ratio DECIMAL, live_rooms_per_week INT, new_content_per_week INT, UNIQUE (group_id, snapshot_date))`
  - Heuristic: `score = activeRatio×0.5 + min(1, liveRoomsPerWeek/2)×0.3 + min(1, newContentPerWeek/1)×0.2`. Status STRONG ≥0.7, MEDIUM 0.4–0.7, WEAK <0.4. Expectations configurable per group (`expectedLiveRooms`, `expectedContent`).
  - Cron: `@Scheduled(cron = "0 0 1 * * *")` daily 1am — compute snapshots for all groups.
  - API: `GET /api/groups/{id}/pulse` — leader/mod-only (`@PreAuthorize`); returns latest snapshot + 7-day trend for sparkline.
  - FE: replace CellGroupPulseCard placeholder with real strong/medium/weak banner + sparkline mini-chart.
- **Status:** ⬜ DEFER Sprint 6
- **Cause:** GD-9 / 2026-05-10 (placeholder shipped, heuristic deferred)

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
- **Status:** ✅ DONE 2026-05-10

### BL-S5-2 — i18n keys cho 3 FE pages Sprint 5
- **Issue:** QuizSetCreate/Detail/List ship với hardcoded VN strings (~50-80 lines). Tăng debt từ 648 → ~700 hardcoded.
- **Cần làm:**
  1. Tạo `quizSet:` block trong vi.json + en.json
  2. Refactor 3 pages dùng `useTranslation()`
  3. Run `npm run validate:i18n` — verify count giảm ≤ 648 baseline
- **Status:** ✅ DONE 2026-05-10

### BL-S5-3 — Auto-derive Difficulty cho quiz set
- **Issue:** Q-5 publishQuizSet hiện fallback `Difficulty.MEDIUM`. Logic auto-derive từ Question.difficulty được defer vì enum mismatch (Question lowercase `easy/medium/hard`, GroupQuizSet uppercase `EASY/MEDIUM/HARD/MIXED`).
- **Cần làm:** Implement `computeDifficulty()` per Q-0 P-D patch sample (map lowercase → uppercase với MIXED rule).
- **Status:** ✅ DONE 2026-05-10

### BL-S5-4 — Folder UI trong QuizSetList + QuizSetCreate
- **Issue:** Folder CRUD endpoints đã ship nhưng FE list page chưa render group-by-folder header + folder selector trong create form.
- **Cần làm:** QuizSetList: load folders + render section headers; QuizSetCreate: thêm `<FolderSelector>` (existing folders + "Tạo mới" inline).
- **Status:** ✅ DONE 2026-05-10

### BL-S5-5 — Pixel-perfect mockup match
- **Issue:** 3 FE pages ship functional baseline với inline Tailwind. Mockup `docs/mockups/MOCKUP_QUIZ_SET_V2_PROFESSIONAL.html` có chi tiết design tokens (Be Vietnam Pro 800/900, gradient cards, exact spacing) chưa được apply.
- **Cần làm:** Stitch sync workflow — verify mockup, refine spacing/typography/animations.
- **Status:** ✅ DONE 2026-05-10

### BL-AD-7 — DeepSeek V3.2 Bedrock integration
- **Issue:** Add DeepSeek V3.2 (AWS Bedrock, ap-northeast-1 Tokyo) as default AI provider, with Gemini + Claude as fallbacks. Refactor in-memory per-admin quota → Redis shared-global quota (admin + group leaders).
- **Spec impact:** SPEC_ADMIN §7.3, §7.4, §7.5, §7.6 (updated inline); SPEC_GROUP §6.A new (Group AI Question Generation).
- **Decisions locked (D1-D6):** see `docs/prompts/PROMPT_DEEPSEEK_BEDROCK_INTEGRATION.md`.
- **Delivered:**
  - `AIProvider` interface + 3 implementations (BedrockDeepSeek, Gemini, Claude wrappers).
  - `AIProviderRouter` with auto + explicit modes (auto = default→fallback chain; explicit = no fallback).
  - `AIQuotaService` Redis-backed shared global 200/day, fail-open on Redis errors.
  - Admin AI Generator FE: 3-tab selector with DeepSeek "DEFAULT" badge.
  - Group leader `/ai-generate` endpoint wired through router + shared quota guard.
  - 30 new unit/integration tests; pre-existing FE baseline failures (Ranked, DailyChallenge) untouched.
- **Deferred follow-up:** `AuditLogService` integration (`ai.generate.deepseek`, `ai.fallback.triggered`, `group.ai_generate`); cost tracking; CloudWatch monthly-spend alarm; manual verify Bedrock pricing constants before prod.
- **Status:** ✅ DONE 2026-05-12 — commits `d4f2f42` (Phase B BE), `c88d465` (Phase C FE), `1a2980a` (Phase D tests).

### BL-19 — Personal Quiz Set parity with Group (Phase 1 + Phase 2 shipped)
- **Issue:** Personal sets (MySets + SetEditor) shipped pre-Sprint-5 with only `{name, description, visibility}` and no DRAFT→PUBLISHED workflow, while group sets (Sprint 5) gained 15 metadata fields + workflow + AI-on-set. Users creating bộ câu hỏi from the multiplayer page got a much weaker editor than the group flow.
- **Spec impact:** SPEC_USER §19 updated inline (Phase 1) — file paths, V56 schema, DRAFT/PUBLISHED workflow, AI on personal sets.
- **Delivered (Phase 1 MVP, 2026-05-14):**
  - V56 migration: 10 new cols on `question_sets` (cover, tags, scripture, authorNote, difficulty, duration, suggestedMode, language, publishStatus, publishedAt); existing rows backfilled to PUBLISHED so CreateRoom keeps working.
  - `QuestionSetController`: POST + new PATCH accept full Sprint 5 metadata; new PATCH `/publish` (≥5 câu, ≥3 char name, must be DRAFT); new GET `/full` returning EditorQuestion-shape questions; GET list accepts `?status=PUBLISHED` filter.
  - `apps/web/src/pages/group/QuizSetEditor.tsx` refactored to receive an injectable API adapter + ownership flag; `apps/web/src/pages/group/GroupQuizSetEditor.tsx` wrapper preserves the existing /groups route unchanged.
  - New `apps/web/src/api/personalQuizSets.ts` adapter + `apps/web/src/pages/PersonalQuizSetEditor.tsx` wrapper + routes `/my-sets/new` and `/my-sets/:setId/edit`; legacy 553-LOC SetEditor.tsx removed.
  - `MySets` shows DRAFT/PUBLISHED chips, scripture/tag previews; inline create form gone — button goes straight to the editor.
  - `CreateRoom` custom-set picker queries `?status=PUBLISHED` so DRAFTs aren't playable.
- **Delivered (Phase 2 AI, 2026-05-15):**
  - `POST /api/question-sets/{id}/ai-generate` — set-scoped AI generation, persists UserQuestion(source=AI), attaches to set; shares 200/day `AIQuotaService` bucket with group.
  - `POST /api/question-sets/{id}/questions/{qid}/ai-rewrite` — returns fresh draft, FE accepts via existing PUT `/api/user-questions/{qid}`.
  - `GET /api/question-sets/ai-quota` — quota snapshot for the personal editor top-bar badge.
  - FE adapter (`personalQuizSets.ts`) wires the 3 endpoints; `QuizSetEditor` gains optional `aiEnabled` prop, `PersonalQuizSetEditor` opts in. AI Generate + Rewrite + quota badge now show for personal sets too.
- **Still deferred (Phase 3):**
  - Personal folder entity + UI (group has `GroupQuizSetFolder`, personal does not).
  - Difficulty / estimatedDurationMin auto-derive on publish (group has `computeDifficulty()`).
- **Status:** ✅ DONE 2026-05-15.
- **Ref:** task files `docs/todo/archive/2026-05-14-personal-quiz-set-parity-phase-1.md`, `docs/todo/archive/2026-05-15-personal-quiz-set-ai-phase-2.md`.

### BL-AD-8 — Quiz Set Editor unified page
- **Issue:** Modal 2-tab "AI tạo / Tự soạn" + metadata-only `QuizSetCreate.tsx` thay bằng 1 trang editor thống nhất — AI là tool button, không phải mode tách biệt. Question list sidebar 260px + main editor body.
- **Spec impact:** SPEC_GROUP §6.B new (Quiz Set Editor Page); §6.A workflow paragraph reduced (delegates to §6.B).
- **Decisions locked (D1-D10):** see `docs/prompts/PROMPT_QUIZ_SET_EDITOR_PAGE.md`. Q1-Q4 confirmed in `docs/audit/AUDIT_REPORT_QUIZSET_EDITOR.md`.
- **Delivered:**
  - 7 new endpoints in `ChurchGroupController.java` (per-question CRUD + reorder + set-scoped AI gen + per-question AI rewrite).
  - New page `apps/web/src/pages/group/QuizSetEditor.tsx` + 9 sub-components in `pages/group/quizset-editor/`.
  - API client extended (`api/quizSets.ts`): getQuizSetFull, addQuestion, updateQuestion, deleteQuestion, reorderQuestions, aiGenerateForSet, aiRewriteQuestion.
  - Auto-save: debounce 2s + force 30s + tab-close + React Router blocker.
  - Mobile responsive (CSS media queries < 768px).
  - Deleted: `CreateQuizSetModal.tsx` (774 LOC) + `QuizSetCreate.tsx` (510 LOC); GroupDetail.tsx modal state/handlers (~280 LOC) removed.
- **Question.source convention:** `ai-group` (AI in group editor), `group-custom` (manual in group editor).
- **Deferred follow-up:**
  - BL-AD-9: Bible verse preview card under scripture ref input (requires new `BookController` endpoint to return verse text). Mockup desktop shows italic gold card but ships without preview.
  - "AI sinh tương tự" + "AI gợi ý đáp án nhiễu" (D8 v2).
  - RN port of editor (mobile parity beyond responsive web).
- **Status:** ✅ DONE 2026-05-13 — commits `58c05c7` (Phase A+B), `e4de3e4` (Phase C-H), this commit (Phase I).

---

## Multiplayer Lobby Redesign (2026-05-15) — Deferred items

### BL-MP-QM — Quick Match (Đấu Nhanh) — 🚧 ACTIVE SPRINT (2026-05-15)
- **Status:** 🚧 IN PROGRESS — pivoted from BL-MP-SOLO after concept misinterpretation. Implementation tracked as QP-1..QP-REGRESSION in `docs/todo/active/2026-05-15-multiplayer-quickmatch-pivot.md`.
- **Effort:** ~3 days
- **Why active:** "Solo" was misinterpreted as single-player. Real intent = multiplayer without Quản trò, server soft-coordinates. See `docs/new-multiplayer/PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT.md`.
- **Scope (locked 2026-05-15 after 4 corrections):**

#### BE
- Migration **V57**: `ALTER TABLE rooms ADD COLUMN quick_match BOOLEAN NOT NULL DEFAULT FALSE, ADD COLUMN ai_questions_payload JSON NULL` + index `(quick_match, status)`.
- `POST /api/rooms/quick-match` — body `{ mode, bookScope, questionCount, timePerQuestion, source }`. **Always-create** (Liên Quân custom lobby pattern, no matchmaking). Daily cap 3/user/day + AI tier-lock (Tier 4+) + anti-cheat (not in another room).
- `QuickMatchQuestionSourceService` — DB random with book/chapter/verse filter (30/50/20 difficulty mix) OR AI gen one-shot. **AI questions persist ONLY in `Room.aiQuestionsPayload` JSON** — not saved to `Question` table. Purged with R5 room cleanup.
- `DailyQuickMatchCounter` (Redis SETEX 24h TTL, key `quickmatch:daily:{userId}:{yyyymmdd}`).
- Soft-host: `hostPlaysGame=true` forced, `hostId` = creator (no privilege). Any player can `POST /api/rooms/{id}/start` when ≥2 ready.
- 5 host control endpoints (pause/resume/skip/broadcast/end-early) reject quick-match with 422 `QUICK_MATCH_NO_HOST_CONTROLS`.

#### FE
- Rename `SoloArenaEntryCard.tsx` → `QuickMatchEntryCard.tsx` (git mv), copy update per mockup v3 (rocket icon, "Vào ngay · Không cần host" kicker, daily quota indicator).
- **NEW** `QuickMatchConfigModal.tsx` — modal popup with 5 sections: mode picker (4 cards) · scope select · count chips · time chips · source toggle (AI disabled+badge if Tier < 4). Click EntryCard CTA → opens this modal → submit → `triggerQuickMatch(config)`.
- Delete `SoloArenaPlaceholder.tsx` + `/solo-arena` route (replaced by Quick Match flow).
- `EmptyRoomsState`: 4-mode-grid + Solo soft-link → **2 CTAs** (Đấu Nhanh indigo opens modal · Tạo phòng Quản trò gold).
- `QuickMatchRoomCard.tsx` — distinct variant: indigo accent, "Đấu Nhanh" badge, room code title, mode+scope kicker, source icon (cpu/auto_awesome).
- `RoomsSection` filter chip "Đấu Nhanh" first.
- `RoomLobby` variant: indigo info banner thay Quản trò gold, start visible to all when 2+ ready, hide host control panel.
- `triggerQuickMatch(config)` + error handler trong `api/rooms.ts`.

#### Locked decisions (LOCK 2026-05-15)
- Naming: "Đấu Nhanh" (VI) / `quickMatch` field / `QUICK_MATCH_NO_HOST_CONTROLS` error code
- Match policy: **always-create** (creator chooses config)
- Source: DATABASE default / AI_GENERATED Tier 4+ unlock
- AI storage: ephemeral `Room.aiQuestionsPayload JSON` — NO save to `Question` pool
- Daily cap: 3 trận/ngày/user — Redis backed
- Color: indigo `#6366f1` → `#818cf8` gradient
- Config UI: modal popup (`QuickMatchConfigModal`)
- XP/Leaderboard: NONE (variety-style)

- **Ref:** `docs/new-multiplayer/PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT.md` + `docs/new-multiplayer/MOCKUP_MULTIPLAYER_LOBBY_v3.html`

### BL-MP-QM-CUSTOM — Quick Match v2 user preferences (deferred)
- **Status:** ⬜ Deferred (v2)
- **Effort:** ~1 day FE + 0.5 day BE
- **Trigger:** After BL-MP-QM v1 ships + user feedback indicates demand
- **Scope:**
  - Persistent user preferences for default Quick Match config (source / count / scope)
  - Sticky in user profile, not query param
  - Sidebar gear button on `QuickMatchEntryCard` to open settings
  - BE: add user preference fields to `User` entity or new `UserPreferences` table
- **Ref:** `docs/new-multiplayer/PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT.md` §0.2

### BL-MP-SOLO — Solo Arena (CLOSED 2026-05-15)
- **Status:** ❌ CANCELLED — concept pivoted to BL-MP-QM (Quick Match)
- **Reason:** "Solo" was misinterpreted as single-player. Intent was multiplayer-without-host (Quick Match pattern). MPP-3/4 shipped Solo Arena placeholder + entry card; QP-6/7 will rename/replace those with Quick Match equivalents.
- **Replacement:** All scope absorbed into BL-MP-QM above.

### BL-MP-PALETTE — Multiplayer palette canonical patch (2026-05-15, shipped)
- **Issue:** MLR commit 77165a9 đã ship palette mode khác với canonical PROMPT_MULTIPLAYER_LOBBY_REDESIGN §0.1.
- **Delivered:** commit `c71506c` realigns `apps/web/src/pages/create-room/modeMeta.ts` palette: speed=#38bdf8 (was #60a5fa), battle=#ef4444 (was #f87171), team=#a855f7 (was #4ade80), sudden=#fbbf24 AMBER (was #c084fc, never #fb923c streak). Sudden icon `workspace_premium` → `target`.
- **Status:** ✅ DONE 2026-05-15 — commits c71506c (palette), 64d01ca (Solo Arena hero), 60988f7 (sidebar widget), 510df61 (Solo soft-link).

---

## Cross-references
- Canonical specs: [SPEC_USER_v3.1.md](SPEC_USER_v3.1.md), [SPEC_MULTIPLAYER.md](SPEC_MULTIPLAYER.md), [SPEC_ADMIN_v3.1.md](SPEC_ADMIN_v3.1.md), [SPEC_GROUP_v1.3.md](SPEC_GROUP_v1.3.md) (Sprint 5)
- Roadmap (defer features): [SPEC_ROADMAP.md](SPEC_ROADMAP.md)
- Audit findings: [../audit/](../audit/)
