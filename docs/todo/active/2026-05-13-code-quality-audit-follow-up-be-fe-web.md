# 2026-05-13 — Code Quality Audit follow-up (BE + FE Web)

> **Source**: Fullstack audit 2026-05-13 (3 Explore agents song song). Mobile gác lại — session này chỉ làm BE + FE Web.
> **Scope**: 24 task chia 6 phase. Mỗi task 1 commit, <100 LOC, format `feat|fix|refactor|test|chore: ...`.
> **Branch**: `chore/code-quality-improvements`.
> **Strategy mapping**: Hầu hết task là refactor / hygiene → `[no-spec-impact]`. Riêng CQ-2 (XP surge) chạm BL-3, CQ-3 chạm BL-15 → cập nhật `docs/spec/BACKLOG.md`.

### Phase 1 — Quick wins (Critical, ~1 ngày)

- CQ-1 BE — Thay 4× `System.out.println` bằng Slf4j
  - Status: `[x]` DONE · Files: [OAuth2FailureHandler.java](apps/api/src/main/java/com/biblequiz/infrastructure/security/OAuth2FailureHandler.java), [RankedController.java](apps/api/src/main/java/com/biblequiz/api/RankedController.java) · Test: RankedControllerTest 43/43 pass, full JUnit 963/966 (3 pre-existing flakies unrelated)
  - **Spec impact**: `[x]` None (CLAUDE.md §KHÔNG được làm rule)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Outcome: grep `System.out.println` apps/api/src → 0 hit (was 4). Also fixed `exception.printStackTrace()` in OAuth2FailureHandler (same anti-pattern, same method). 3 println → 1 idiomatic `log.warn(..., exception)` with structured fields.

- CQ-2a BE — Wire XP surge consume + tier multiplier (BL-3)
  - Status: `[x]` DONE · Files: [RankedController.java](apps/api/src/main/java/com/biblequiz/api/RankedController.java) (swap call site + inject UserTierService), [UserController.java](apps/api/src/main/java/com/biblequiz/api/UserController.java) (relax honesty contract), [User.java](apps/api/src/main/java/com/biblequiz/modules/user/entity/User.java) (refresh TODO comment), [ScoringService.java](apps/api/src/main/java/com/biblequiz/modules/ranked/service/ScoringService.java) (refresh javadoc), tests [RankedControllerTest](apps/api/src/test/java/com/biblequiz/api/RankedControllerTest.java) + [UserControllerTest](apps/api/src/test/java/com/biblequiz/api/UserControllerTest.java)
  - **Spec impact**: `[x]` SPEC_USER §4.7 + §29 Known Issues row · BL-3 DONE, BL-3-trigger split out
  - **Spec strategy**: `[x]` (a) update inline — SPEC_USER §4.7 changed status, BACKLOG.md BL-3 DONE + BL-3-trigger added
  - **Decision**: Option B (wire cả surge + tier) per user 2026-05-13. Justified vì tier mult dead code = same anti-pattern, cùng method signature. Tier 1 users không impacted; tier 2-6 nhận điểm đúng spec §4.6 lần đầu kể từ V24.
  - Outcome: 112/112 tests pass scope (RankedController + UserController + ScoringService + TierConfig). Compile clean. FE `MilestoneBanner.SurgeCountdown` giờ sẽ honestly show real surge countdown.

- CQ-2b BE — XP surge auto-trigger detection (BL-3-trigger) [SPINOFF]
  - Status: `[ ]` TODO · Files: `TierProgressService.java`, possibly `RankedController.submitRankedAnswer` (sau scoring), tests
  - **Spec impact**: `[x]` SPEC_USER §4.7 + BL-3-trigger entry
  - **Spec strategy**: `[x]` (a) update inline
  - Scope: detect cross 90% threshold lần đầu trong tier → set `xpSurgeUntil = now + 2h` + fire notification + edge case (1 lần/tier). Currently admin set manual qua `xpSurgeHoursFromNow`.
  - Checklist: helper trong TierProgressService · hook vào post-scoring update XP path · unit test threshold detection + idempotency · spec sync · commit `feat(BL-3-trigger): auto-trigger Milestone Burst XP surge`

- CQ-3 FE — Xóa `hooks/useWebSocket.ts` deprecated (BL-15)
  - Status: `[x]` DONE · Files: `apps/web/src/hooks/useWebSocket.ts` (deleted, 285 LOC), `apps/web/src/hooks/__tests__/useWebSocket.test.ts` (deleted, 256 LOC / 15 tests), [BACKLOG.md](docs/spec/BACKLOG.md) BL-15 DONE, [CLAUDE.md](CLAUDE.md) §Known Issues Critical row removed, `apps/web/.test-baseline` 1227 → 1212
  - **Spec impact**: `[x]` None · BL-15 closed
  - **Spec strategy**: `[x]` (a) update BACKLOG BL-15 DONE + CLAUDE.md known issues
  - Outcome: `grep "useWebSocket" apps/web/src` → 0 hit. TypeScript type-check không có error mới từ deletion (pre-existing TS errors không liên quan). 114 Vitest failures pre-existing (không phải do deletion — none mention useWebSocket).

### Phase 2 — FE Web type safety + lint (Major, ~1 ngày)

- CQ-4 FE — Setup ESLint config cho `apps/web`
  - Status: `[x]` DONE · Files: [.eslintrc.cjs](apps/web/.eslintrc.cjs) (new), [package.json](apps/web/package.json) (`lint`/`lint:fix`/`lint:errors-only` scripts + 5 devDeps), 7 test files auto-fixed `let` → `const`
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Deps added (user-approved 2026-05-13): `eslint@^8.57`, `@typescript-eslint/parser@^7.18`, `@typescript-eslint/eslint-plugin@^7.18`, `eslint-plugin-react-hooks@^4.6`, `eslint-plugin-react-refresh@^0.4`
  - Outcome: `npm run lint:errors-only` → 0 errors. `npm run lint` → 0 errors / 294 warnings (baseline for CQ-5, CQ-6 to drain). Warnings are mostly `no-explicit-any`, `no-console` (debug-guarded), `react-hooks/exhaustive-deps`, `react-refresh/only-export-components`.

- CQ-5 FE — Fix 3× `useState<any>` ở admin pages
  - Status: `[x]` DONE · Files: [admin/Questions.tsx](apps/web/src/pages/admin/Questions.tsx), [admin/QuestionQuality.tsx](apps/web/src/pages/admin/QuestionQuality.tsx)
  - **Spec impact**: `[x]` None · **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Outcome: định nghĩa `ImportError`, `ImportDryResult`, `ImportResult`, `SimilarQuestion`, `DuplicateWarning`, `BookCoverage`, `CoverageResponse`. Replace 4× `useState<any>` + 3× `(x: any)` map callbacks. ESLint warnings 294 → 286 (-8). Type-check clean cho 2 file.

- CQ-6 FE — Type STOMP message ở `RoomQuiz.tsx` (bỏ `msg.data as any`)
  - Status: `[ ]` TODO · Files: [RoomQuiz.tsx#L399](apps/web/src/pages/RoomQuiz.tsx#L399), `apps/web/src/types/stomp.ts` (new) · Test: existing RoomQuiz tests
  - **Spec impact**: `[x]` SPEC_MULTIPLAYER §STOMP events (chuẩn hoá payload type)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]` (type-only, behavior unchanged)
  - Checklist: định nghĩa `StompRoomMessage`, `StompQuestionMessage`, etc. khớp BE DTO · grep `as any` RoomQuiz → 0 hit · Tầng 1+2 pass · commit `refactor: type STOMP frames in RoomQuiz`

### Phase 3 — FE Web admin migration to TanStack Query (Major, ~2 ngày)

- CQ-7 FE — Tạo `apps/web/src/api/queryKeys.ts` central
  - Status: `[ ]` TODO · Files: `api/queryKeys.ts` (new) · Test: smoke test factory functions
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Pattern: `queryKeys.tournaments.list(filters)`, `queryKeys.tournaments.detail(id)`, etc. — tham khảo TkDodo blog
  - Checklist: factory cho 5 admin domain (tournaments, rankings, groups, notifications, reviewQueue) · commit `chore: add central queryKeys factory`

- CQ-8 FE — Migrate [admin/Events.tsx](apps/web/src/pages/admin/Events.tsx) → useQuery
  - Status: `[ ]` TODO · Files: `admin/Events.tsx` · Test: vitest existing + 1 query test mới
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: thay `useEffect+fetch` → `useQuery({ queryKey: queryKeys.tournaments.list(...) })` · loading/error state via query · invalidate sau mutation · Tầng 3 pass · commit `refactor: migrate admin/Events to TanStack Query`

- CQ-9 FE — Migrate `admin/Rankings.tsx` + `admin/Groups.tsx`
  - Status: `[ ]` TODO · Files: [admin/Rankings.tsx](apps/web/src/pages/admin/Rankings.tsx), [admin/Groups.tsx](apps/web/src/pages/admin/Groups.tsx) · Test: vitest
  - **Spec impact**: `[x]` None · **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: 2 commit (mỗi file 1 commit để <100 LOC) hoặc 1 commit nếu cùng pattern

- CQ-10 FE — Migrate `admin/Notifications.tsx` + `admin/ReviewQueue.tsx`
  - Status: `[ ]` TODO · Files: [admin/Notifications.tsx](apps/web/src/pages/admin/Notifications.tsx), [admin/ReviewQueue.tsx](apps/web/src/pages/admin/ReviewQueue.tsx) · Test: vitest
  - **Spec impact**: `[x]` None · **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: 2 commit · grep `useEffect.*fetch` apps/web/src/pages/admin → 0 hit sau cùng

### Phase 4 — FE Web tách RoomQuiz.tsx mega-page (Major, ~1 sprint)

> RoomQuiz hiện 1508 LOC, gộp 5 game mode (Battle Royale / Team vs Team / Classic / Survival / Quick Match) với state machine song song. Target: <800 LOC orchestrator + 5 hook mode-specific.

- CQ-11 FE — Investigation: vẽ proposal `useGameMode` strategy
  - Status: `[ ]` TODO · Files: `IMPL_NOTES.md` (append) — **read-only task, không sửa code**
  - Output: design doc với state shape, event handlers, props contract cho từng mode
  - Checklist: đọc RoomQuiz.tsx full · phân loại branching theo `gameMode` · viết proposal · user review trước CQ-12

- CQ-12 FE — Extract `useGameMode` hook scaffolding + interface
  - Status: `[ ]` TODO · Files: `hooks/useGameMode.ts` (new), `hooks/gameModes/` (folder) · Test: vitest scaffold
  - **Spec impact**: `[x]` None · **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: interface `GameModeStrategy` · factory `useGameMode(mode)` · default impl delegate về current logic · RoomQuiz.tsx import nhưng chưa swap · Tầng 3 pass

- CQ-13 FE — Migrate Battle Royale mode → `useBattleRoyale`
- CQ-14 FE — Migrate Team vs Team mode → `useTeamVsTeam`
- CQ-15 FE — Migrate Classic mode → `useClassicMode`
- CQ-16 FE — Migrate Survival mode → `useSurvivalMode`
- CQ-17 FE — Migrate Quick Match mode → `useQuickMatch`
  - (CQ-13..17 cùng pattern: Status TODO · Files `hooks/gameModes/<mode>.ts` (new) + `RoomQuiz.tsx` (remove inline branch) · Test: existing RoomQuiz integration tests + 1 unit test mới cho hook · Spec strategy `(c) [no-spec-impact]` · Checklist: pull logic ra hook · RoomQuiz call qua `useGameMode(mode).<handler>` · Tầng 3 pass · commit `refactor: extract <mode> logic from RoomQuiz`)

- CQ-18 FE — Cleanup RoomQuiz orchestrator → <800 LOC
  - Status: `[ ]` TODO · Files: `RoomQuiz.tsx` · Test: full Tầng 3
  - Checklist: dead code removal · `wc -l RoomQuiz.tsx` < 800 · all integration tests pass · commit `refactor: shrink RoomQuiz orchestrator below 800 LOC`

### Phase 5 — BE typed DTO migration (Major, ~1 sprint)

- CQ-19 BE — Investigation: audit `Map<String, Object>` request body usage
  - Status: `[ ]` TODO · Files: `AUDIT_MAP_REQUEST_BODY.md` (new) — **read-only**
  - Output: list endpoint + line ref cần migrate, ưu tiên theo độ "nóng"
  - Checklist: grep `Map<String, Object>.*@RequestBody` BE → liệt kê · user review trước CQ-20

- CQ-20 BE — Migrate ChurchGroupController endpoints → typed DTO + `@Valid`
  - Status: `[ ]` TODO · Files: [ChurchGroupController.java](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java), `api/dto/group/*.java` (new) · Test: existing `ChurchGroupControllerTest` + validation case mới
  - **Spec impact**: `[x]` None (API shape giữ nguyên — chỉ thay loại tham số)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: tạo `CreateGroupRequest`, `UpdateGroupRequest`, etc. với Bean Validation annotations · thay signature controller · remove `@SuppressWarnings("unchecked")` · Tầng 3 pass · commit `refactor: typed DTOs for ChurchGroupController`

- CQ-21 BE — Migrate AdminUserController + RankedController endpoints
  - Status: `[ ]` TODO · Files: AdminUserController, RankedController + DTO mới · Test: existing
  - **Spec impact**: `[x]` None · **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: ~5 endpoint · grep `@SuppressWarnings("unchecked")` BE → giảm ≥80% · commit

### Phase 6 — BE test depth (Major, ~1 sprint)

- CQ-22 BE — Setup Testcontainers MySQL profile
  - Status: `[ ]` TODO · Files: `pom.xml` (testcontainers dep nếu chưa có), `src/test/resources/application-it.properties`, `src/test/java/.../IntegrationTestBase.java` · Test: hello-world IT pass
  - **Spec impact**: `[x]` None · **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: hỏi user về Testcontainers version · base class với `@Testcontainers` · 1 smoke test connect DB · commit `chore: add Testcontainers MySQL integration test base`

- CQ-23 BE — `@DataJpaTest` cho RoomRepository + UserRepository + ChurchGroupRepository
  - Status: `[ ]` TODO · Files: 3 file `*RepositoryTest.java` (new) · Test: 3 file × ~5 case mỗi file
  - **Spec impact**: `[x]` None · **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: dùng Testcontainers (KHÔNG H2, CLAUDE.md cấm) · custom query method coverage · commit `test: add @DataJpaTest for top repositories`

- CQ-24 BE — Integration test `RoomService.joinRoom` (5 mode game)
  - Status: `[ ]` TODO · Files: `RoomServiceJoinIT.java` (new) · Test: TX rollback case + LOBBY→LOBBY rejoin + IN_PROGRESS rejoin + capacity boundary
  - **Spec impact**: `[x]` SPEC_MULTIPLAYER §Room lifecycle R1–R5 (verify coverage)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]` (test only)
  - Checklist: ≥4 case · all pass · `.test-baseline` BE update +N · commit `test: add integration coverage for RoomService.joinRoom`

### Definition of Done — toàn bộ phase

- Tầng 3 pass (Vitest + Playwright + JUnit) — số test ≥ baseline mỗi phase
- `bash tools/spec-audit/audit.sh` không thêm broken mới
- `docs/spec/BACKLOG.md` cập nhật BL-3, BL-15 status
- Branch ready để merge `main` qua PR review

### Deferrals (không trong scope session này)

- Tách [GroupDetail.tsx](apps/web/src/pages/GroupDetail.tsx) (1784 LOC) — Sprint sau
- Tách [RoomLobby.tsx](apps/web/src/pages/RoomLobby.tsx) (1611 LOC) — Sprint sau
- Inline-style refactor ([SearchableSelect.tsx](apps/web/src/components/ui/SearchableSelect.tsx), BibleJourneyCard, DailyMissionWidget) — Sprint sau
- `React.memo` cho list components — Sprint sau
- Lazy route splitting toàn FE — Sprint sau
- Idempotency keys cho POST endpoints — Sprint sau (cần spec)
- Mobile parity — bỏ qua trong session này

---
