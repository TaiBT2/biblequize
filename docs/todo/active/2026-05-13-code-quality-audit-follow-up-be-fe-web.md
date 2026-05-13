# 2026-05-13 — Code Quality Audit follow-up (BE + FE Web)

> **Source**: Fullstack audit 2026-05-13 (3 Explore agents song song). Mobile gác lại — session này chỉ làm BE + FE Web.
> **Scope**: 24 task chia 6 phase. Mỗi task 1 commit, <100 LOC, format `feat|fix|refactor|test|chore: ...`.
> **Branch**: `chore/code-quality-improvements`.
> **Strategy mapping**: Hầu hết task là refactor / hygiene → `[no-spec-impact]`. Riêng CQ-2 (XP surge) chạm BL-3, CQ-3 chạm BL-15 → cập nhật `docs/spec/BACKLOG.md`.

### Phase 1 — Quick wins (Critical, ~1 ngày)

- CQ-1 BE — Thay 4× `System.out.println` bằng Slf4j
  - Status: `[ ]` TODO · Files: [OAuth2FailureHandler.java](apps/api/src/main/java/com/biblequiz/infrastructure/security/OAuth2FailureHandler.java), [RankedController.java](apps/api/src/main/java/com/biblequiz/api/RankedController.java) · Test: existing slice tests pass
  - **Spec impact**: `[x]` None (CLAUDE.md §KHÔNG được làm rule)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: grep `System.out.println` BE → 0 hit · Tầng 1+2 pass · commit `chore: replace System.out.println with Slf4j [no-spec-impact]`

- CQ-2 BE — Wire XP surge multiplier hoặc xóa dead code (BL-3)
  - Status: `[ ]` TODO · Files: [ScoringService.java](apps/api/src/main/java/com/biblequiz/modules/ranked/service/ScoringService.java#L86-L113), [RankedController.java](apps/api/src/main/java/com/biblequiz/api/RankedController.java), [User.java](apps/api/src/main/java/com/biblequiz/modules/user/entity/User.java) (xpSurgeUntil field) · Test: `ScoringServiceTest` + `RankedControllerTest` (xpSurgeActive=true case)
  - **Spec impact**: `[x]` SPEC_USER §Tier bonuses · BL-3 trong BACKLOG
  - **Spec strategy**: `[x]` (a) update inline — cập nhật BACKLOG.md BL-3 status DONE/REMOVED + SPEC_USER nếu wire
  - **Decision điểm**: User chọn `wire` (kéo xpSurgeActive vào `calculate()`) hoặc `delete` (xóa overload + field). Khi tới task này, cần hỏi user.
  - Checklist: decision · impl · test mới cho xpSurgeActive path · Tầng 3 pass · spec/BACKLOG updated · commit `fix(BL-3): wire XP surge multiplier`

- CQ-3 FE — Xóa `hooks/useWebSocket.ts` deprecated (BL-15)
  - Status: `[ ]` TODO · Files: [hooks/useWebSocket.ts](apps/web/src/hooks/useWebSocket.ts) (delete), BACKLOG.md · Test: `grep "useWebSocket"` apps/web → 0 caller (verify trước khi xóa)
  - **Spec impact**: `[x]` None · BL-15 close
  - **Spec strategy**: `[x]` (a) update BACKLOG BL-15 DONE
  - Checklist: grep verify no caller · delete file · BACKLOG updated · Tầng 3 pass · commit `chore(BL-15): remove deprecated useWebSocket hook`

### Phase 2 — FE Web type safety + lint (Major, ~1 ngày)

- CQ-4 FE — Setup ESLint config cho `apps/web`
  - Status: `[ ]` TODO · Files: `apps/web/.eslintrc.cjs` (new), `apps/web/package.json` (lint script + deps) · Test: `npm run lint` pass (cho phép warnings ban đầu)
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Rules cốt lõi: `@typescript-eslint/no-explicit-any` (warn), `react-hooks/exhaustive-deps` (warn), `no-console` (warn except `console.error|warn`), Tailwind plugin nếu được — không add nhiều deps mới, hỏi user trước (CLAUDE.md §Dependencies)
  - Checklist: hỏi user về deps · impl · `npm run lint` exit 0 · CI script update · commit `chore: enable ESLint for apps/web`

- CQ-5 FE — Fix 3× `useState<any>` ở admin pages
  - Status: `[ ]` TODO · Files: [admin/Questions.tsx](apps/web/src/pages/admin/Questions.tsx), [admin/QuestionQuality.tsx](apps/web/src/pages/admin/QuestionQuality.tsx) · Test: type-check + existing admin tests
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: định nghĩa `ImportDryResult`, `ImportResult`, `DuplicateWarning`, `CoverageMetrics` interface gần BE DTO · `tsc --noEmit` clean · Tầng 1+2 pass · commit `refactor: type admin import/coverage state [no-spec-impact]`

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
