# BibleQuiz — Code Review Report

**Ngày**: 2026-05-08
**Phạm vi**: Full audit FE (`apps/web`) + BE (`apps/api`)
**Focus**: Code quality & patterns · Performance & scaling · Test coverage & quality
**Reviewer**: Automated audit dựa trên CLAUDE.md rules

---

## 0. Tóm tắt điều hành (Executive Summary)

| Dimension | Score | Note |
|---|---|---|
| Code quality FE | 🟠 4/10 | Pages quá lớn (>300 LOC limit), useEffect+fetch thay vì TanStack Query, empty catch blocks |
| Code quality BE | 🟡 6/10 | Package structure tốt; nhưng có god controllers, manual mapping, hardcoded VN strings |
| Performance | 🟠 5/10 | N+1 queries trong scheduler, eager-load 26 pages FE, missing indexes, no code-splitting |
| Test coverage | 🟢 8/10 | 2,323 test cases (>>733 baseline) — nhưng 19 BE services thiếu test, BE dùng mock thay Testcontainers |
| Security & i18n | 🟢 7/10 | SecurityConfig solid, GlobalExceptionHandler tốt; nhưng errorResponse thiếu `requestId`, vài chỗ hardcoded VN |

**Verdict**: ⚠️ **Request Changes** trước khi đi production hoặc scale > 10k users.

**Top 5 việc phải fix sớm**:
1. **Tách 5 mega-page > 500 LOC** — vi phạm rule cứng "≤300 LOC" của CLAUDE.md
2. **Fix N+1 trong `NotificationScheduler.findAll()` và `ScheduledQuizScheduler:110`** — sẽ chết khi scale
3. **Thêm `requestId` vào `ErrorResponse`** — vi phạm contract `{ code, message, requestId, details? }`
4. **Lazy-load 26 pages FE** — bundle hiện tại tải hết upfront
5. **Fix empty catch blocks** ở `RankedController` và `pages/GroupDetail.tsx` (16+ chỗ)

**Findings đã loại bỏ sau verify**:
- ~~F7 routing bug `\room\${joined.id}\lobby`~~ — false positive: code thực tế dùng forward slash đúng
- ~~F8 `console.log` không guard~~ — false positive: đã bọc trong `if (isDebug())`

---

## 1. Frontend — Code Quality & Patterns

### 1.1 Critical (fix ngay)

| # | File:Line | Issue | Vi phạm rule |
|---|---|---|---|
| F1 | `pages/GroupDetail.tsx` (2,663 LOC) | File 8.8× giới hạn 300 LOC; chứa form CRUD, leaderboard, scheduled quiz, modal chat... trong một file | "Component không quá 300 LOC" |
| F2 | `pages/RoomLobby.tsx` (1,160 LOC) | 3.8× giới hạn — chứa state machine multiplayer, mode selection, member list | "≤300 LOC" |
| F3 | `pages/Quiz.tsx` (1,027 LOC) | 3.4× giới hạn — timer, scoring, lifeline, animations, share card đều inline | "≤300 LOC" + "Business logic không trong component" |
| F4 | `pages/Profile.tsx`, `RoomQuiz.tsx`, `Groups.tsx`, `DailyChallenge.tsx`, `TournamentDetail.tsx` | Tất cả 750-989 LOC | "≤300 LOC" |
| F5 | `pages/Quiz.tsx:146,275,332,345` · `pages/Achievements.tsx:100-103` · `pages/GroupDetail.tsx` (450+ LOC chains) | Direct `api.get/post()` trong useEffect, không dùng TanStack Query | "Mọi API call qua TanStack Query — không dùng useEffect + fetch thủ công" |
| F6 | `pages/GroupDetail.tsx:100,107,393-449` (16+ chỗ) | Empty catch blocks `catch { /* ignore */ }` | "Không swallow errors silently" |

### 1.2 High Priority

| # | File:Line | Issue |
|---|---|---|
| F9 | `components/ui/SearchableSelect.tsx:42,48-56,71-77` | Heavy inline styles thay vì Tailwind (đã ghi trong Known Issues #15 nhưng chưa fix) |
| F10 | `pages/RoomLobby.tsx:49-70` | Hardcoded hex `#fbbf24, #f87171, #60a5fa, #c084fc, #a78bfa` — không phải design tokens |
| F11 | `components/GameModeGrid.tsx:49,56,63,70,76,274` | Hardcoded `#a855f7, #d4537e, #ff8c42, #4a9eff` trong config |
| F12 | `pages/RoomLobby.tsx:372,392,406,425,463,489,509,570,574,620` | Inline `style={{ ... rgba(...) }}` thay vì Tailwind classes |
| F13 | `pages/RoomQuiz.tsx:45` | `location.state as RoomQuizLocationState` không null-check — crash khi refresh page |
| F14 | `pages/GroupDetail.tsx:88-107` | `localStorage.setItem/getItem` trực tiếp, không qua helper, không có `try` validation |
| F15 | `hooks/useStomp.ts:43,67,72` | Empty catch blocks ở WebSocket setup — silently fail STOMP, không có reconnection log |
| F16 | `store/authStore.ts:60-74` | Logic ranked progress sync trong store thay vì `useRankedDataSync` hook (vi phạm separation) |

### 1.3 Medium Priority

| # | File:Line | Issue |
|---|---|---|
| F17 | `pages/Quiz.tsx:162` · `pages/Achievements.tsx:108` | `console.error()` không guard env |
| F18 | `pages/Quiz.tsx:976` | `api.post(...).catch {}` cho bookmark — user không biết fail |
| F19 | Multiple | Color sourcing inconsistent: vài chỗ dùng design tokens (`#e8a832`), vài chỗ dùng Figma palette tự thêm |

### 1.4 Patterns / Architectural Smells

- **Mega-pages**: 17 pages > 480 LOC (xem table ở section 1.1). Cần extract sub-components: form, list, modal, header thành riêng.
- **useEffect + raw API endemic**: Vi phạm CLAUDE.md ở 20+ files. Pattern đúng (TanStack Query) đã có ở `Home.tsx`, `DailyChallenge.tsx` — chỉ cần consistent hóa.
- **Empty catch endemic**: 16 chỗ trong `GroupDetail.tsx` swallow errors. Đã ghi trong Known Issues nhưng không fix.
- **Color management chaos**: Hardcoded hex ở 40+ files. Design tokens có nhưng không enforce.
- **localStorage không kiểm soát**: Components access trực tiếp; CLAUDE.md có table whitelist nhưng không có lint rule guard.

### 1.5 Positive

- ✅ TanStack Query adoption tốt ở Home, DailyChallenge, một số list pages
- ✅ `api/client.ts` response interceptor đúng pattern: 401 refresh, i18n error, `error.userMessage`
- ✅ `useStomp.ts` sophisticated: token refresh qua query param, reconnect với backoff
- ✅ Zustand store structure clean (authStore, onboardingStore)
- ✅ Test coverage cho large pages có (Quiz: 37 cases, Home: 37 cases)
- ✅ Không phát hiện `useState<any>` hay `as any` lan tràn

---

## 2. Backend — Code Quality & Patterns

### 2.1 Critical

| # | File:Line | Issue | Vi phạm rule |
|---|---|---|---|
| B1 | `api/RankedController.java:187-210, 214-226, 331-336` | 5+ empty catch blocks (`catch (Exception ignore)`) ẩn lỗi auth, energy recovery, group tracking | "Không swallow errors silently" |
| B2 | `api/RankedController.java:347-349` | N+1: `udpRepository.findByUserIdOrderByDateDesc()` rồi stream sum mỗi lần submit answer | Performance |
| B3 | `api/ChurchGroupController.java:74-98` | Trả về `Map<String, Object>` thay vì DTO — không dùng MapStruct | "Dùng MapStruct để map Entity ↔ DTO" |
| B4 | `api/ChurchGroupController.java:82,96,98` | Hardcoded VN error: `"Ten nhom khong duoc de trong"` trong response | "Mọi API lỗi trả về `{ code, message, requestId, details? }`" + i18n |
| B5 | `infrastructure/exception/GlobalExceptionHandler.java:155-200` | `ErrorResponse` thiếu field `requestId` — vi phạm contract bắt buộc | "Mọi API lỗi `{ code, message, requestId, details? }`" |
| B6 | `modules/quiz/service/SessionService.java:82-88` | Empty catch khi touch group membership timestamp | "Silent error swallow" |

### 2.2 High Priority

| # | File:Line | Issue |
|---|---|---|
| B7 | `api/RankedController.java` (857 LOC) | Controller chứa 50%+ business logic (energy calc, scoring, book progression) — phải đẩy về Service layer |
| B8 | `api/RankedController.java:182-236` | 1 method 50+ LOC làm: validate, deduct energy, track streak, sync DB, invalidate cache |
| B9 | `api/AdminTestController.java` (850 LOC) | Có `@Profile` gate (dev/staging/docker) → OK ngoài prod, nhưng `@PreAuthorize` dùng string literal thay vì hằng số chung |
| B10 | `api/UserController.java:44-80` | 743 LOC, 14 autowired dependencies — god controller |
| B11 | `api/RankedController.java:143,182` | `@RequestBody Map<String, Object>` không có `@Valid` — không validate input |
| B12 | `infrastructure/security/SecurityConfig.java:83-113` | `/api/me/bootstrap-admin` `permitAll()` — hint là test endpoint, prod phải gate ADMIN |
| B13 | `application.yml:65-66` | `JWT_SECRET` có default value hardcoded (base64) — dev cũng nên đọc từ env-only |

### 2.3 Medium Priority

| # | File:Line | Issue |
|---|---|---|
| B14 | `modules/group/service/ChurchGroupService.java:76-79` | `throw new RuntimeException("MAX_GROUPS_OWNED")` — phải là `BusinessLogicException` riêng |
| B15 | `modules/user/entity/User.java:64-73` | TODO `xpSurgeUntil` — code có nhưng không wire vào scoring → dead code |
| B16 | `apps/api/src/main/resources/db/migration` | 45 V-files + 2 R-files — count cao nhưng không out-of-order; xem xét consolidate vào V1 reset |

### 2.4 Architectural Smells

- **God controllers**: RankedController, UserController, ChurchGroupController, AdminTestController đều > 700 LOC. Vi phạm CLAUDE.md "Controller chỉ gọi Service, không có business logic".
- **Error contract drift**: `requestId` không được trả về. Frontend log không trace ngược được tới server log.
- **Manual mapping**: Multiple controllers trả `Map<String, Object>` thay vì DTOs với MapStruct.
- **Custom exception thưa thớt**: Throw `RuntimeException(code)` ở vài nơi thay vì hierarchy `BusinessLogicException` chung.
- **i18n inconsistent**: Vài controllers có hardcoded VN strings — cần migrate qua message bundle.

### 2.5 Positive

- ✅ Package structure (`api/`, `infrastructure/`, `modules/{domain}`, `shared/`) đúng layout CLAUDE.md
- ✅ `SecurityConfig` đầy đủ: HSTS, CSP, referrer policy, frames denied
- ✅ `GlobalExceptionHandler`: 11 handler methods, **không leak stack trace** trong response
- ✅ `@PreAuthorize("hasRole('ADMIN')")` được apply nhất quán trên admin endpoints
- ✅ Entity dùng `String id` (UUID), không có auto-increment Long
- ✅ Flyway migrations sequential, không gap, không duplicate
- ✅ Constructor injection ở các Service quan trọng (testable)
- ✅ Logging dùng `@Slf4j` — không phát hiện `System.out.println`

---

## 3. Performance & Scaling

### 3.1 Backend

| # | File:Line | Issue | Impact @ scale | Fix |
|---|---|---|---|---|
| P1 | `NotificationScheduler.java:41` | `userRepository.findAll()` cho daily reminder, no paging | 🔴 CRITICAL: load 10k+ rows mỗi lần chạy | Paginate (chunk 500); query `findUsersOptedInDaily()` |
| P2 | `modules/group/service/ScheduledQuizScheduler.java:110` | N+1: `for (uid : recipientIds) userRepository.findById(uid)` | 🔴 100 recipient = 100 queries | `userRepository.findAllById(recipientIds)` |
| P3 | `modules/room/service/RoomService.java:136-137` | N+1: `for (roomId : activeRoomIds) roomRepository.findById(roomId)` cho cleanup khi join | 🟠 10 stale rooms = 10 queries / mỗi lần join | `findAllById` |
| P4 | `modules/group/service/ScheduledQuizScheduler.java:144` | `memberRepository.findByGroupId()` rồi loop access lazy `m.getUser()` | 🟠 N+1 lazy fetch | `@EntityGraph` hoặc query có join |
| P5 | `api/RankedController.java:347-349` | Aggregate sum points by streaming all UserDailyProgress rows mỗi answer submit | 🔴 user submit answer chậm dần theo lịch sử | Single SUM query hoặc cache per-user |
| P6 | `api/LeaderboardController.java:70,88` | Cache 5 phút nhưng không invalidate khi UserDailyProgress update | 🟠 Stale leaderboard 5 phút | Add `@PostUpdate` invalidation |
| P7 | `api/AdminGroupController.java:30`, `AdminSeasonController.java:30`, `BookController.java:26` | Unbounded `findAll()` admin endpoints | 🟡 Admin-only nhưng UX kém | `Pageable` |
| P8 | `infrastructure/service/CacheService.java:79-82` | `redisTemplate.keys(pattern)` block Redis lúc invalidate | 🟡 Block khác ops nếu key set lớn | Migrate sang Redis SCAN cursor |
| P9 | `application.yml:47` | Hikari `max-active: 8` — quá nhỏ | 🟠 Ngạt connection ở 100+ concurrent | Tăng lên 16-32 |

### 3.2 Frontend

| # | File:Line | Issue | Impact | Fix |
|---|---|---|---|---|
| P10 | `main.tsx:13-73` | All 26 pages eager imported — bundle ban đầu lớn | 🔴 ~500KB+ initial bundle vs 150KB target | `React.lazy()` + `Suspense` route-level |
| P11 | `vite.config.ts:60-63` | Chỉ `manualChunks` cho vendor + router; không page-level chunking | 🟠 Quiz mode tải cả group bundle | Per-feature chunks |
| P12 | `main.tsx:75-86` (QueryClient) | `staleTime: 5*60*1000` global — leaderboard/multiplayer thấy data cũ 5 phút | 🟠 Live leaderboard sai | Per-query staleTime: 1 phút cho leaderboard, on-focus refetch |
| P13 | `pages/Quiz.tsx:142-168` | useEffect không dependency array đầy đủ — re-run mỗi parent render | 🟡 Lãng phí API call | Add `[isQuizCompleted, settings?.sessionId]` |
| P14 | `pages/GroupDetail.tsx:507,531,536` | 4+ useEffect chains gọi fetchGroup → fetchMembers → fetchAnalytics → fetchLeaderboard sequential | 🟠 Waterfall 4-5 round-trips | Batch via TanStack Query parallel |
| P15 | `pages/Leaderboard.tsx:128,221` | Render 1000+ entries không virtualization | 🟠 500+ ms layout thrash mobile | `react-window` hoặc `TanStack Virtual` |
| P16 | `components/GameModeGrid.tsx:143`, `FeaturedDailyChallenge.tsx:102`, `MilestoneBanner.tsx:67` | 3+ `setInterval(..., 1000)` chạy song song | 🟡 3 re-render/sec, mobile battery | Shared timer context |
| P17 | `components/NotificationBell.tsx:96` | `setInterval(fetchNotifications, 30_000)` không backoff | 🟠 10k users = 333 req/sec baseline | Migrate sang STOMP (đã có `useStomp`) |

### 3.3 Database / Schema

- **Missing indexes**: Không thấy `@Index` trên các cột hot:
  - `User.email` (login)
  - `UserDailyProgress(userId, date)` (leaderboard filter)
  - `ScheduledQuiz(groupId, status)` (scheduler)
  - `Room(roomCode)` (join lookup)
  - `RoomPlayer(roomId, userId)` (membership check)
  - `GroupMember(groupId)` (bulk load scheduler)
- **Connection pool nhỏ**: Hikari 8 → 16-32

### 3.4 Caching opportunities

- **User tier/progress**: Đang compute mỗi RankedController call → cache 30-60s
- **Group members**: Reload mỗi GroupDetail fetch → cache 1-5 phút với invalidation khi add/remove
- **Daily challenge / QOTD**: Đã có `QUESTION_OF_DAY_CACHE` nhưng chưa thấy hit thực sự — verify

### 3.5 Positive

- ✅ Redis + CacheService infrastructure sẵn sàng
- ✅ TanStack Query đã setup với retry + staleTime
- ✅ Vite code-splitting đã có config (chỉ thiếu route opt-in)
- ✅ STOMP/WebSocket có sẵn — sẵn sàng thay polling
- ✅ Pagination support có ở repository (chỉ chưa enforce ở controller)

---

## 4. Test Coverage & Quality

### 4.1 Inventory (vượt baseline 733 đáng kể)

| Layer | Files | Test Cases |
|---|---|---|
| Vitest (FE unit) | 92 | 1,154 |
| JUnit (BE) | 77 | 833 |
| Playwright (E2E) | 52 | 336 |
| **Total** | **221** | **2,323** |

### 4.2 Coverage Gaps

**FE Pages thiếu unit test (10 pages)**:
- Regular: Journey, MySets, Register, ScheduledQuizCreate, ScheduledQuizDetail, ScheduledQuizPlay, SetEditor
- Admin: AIQuestionGenerator, Questions, TestPanel

**BE Services thiếu unit test (19 services)**:
AccountDeletion, AuthCode, BookMastery, Cache, Challenge, DuplicateDetection, LifelineConfig, MobileAuth, OAuth2, Online, QuestionSet, RankedSession, RoomQuiz, RoomState, ScheduledQuiz, SequentialScoring, TokenBlacklist, UserQuestion, UserTier

**BE Controllers thiếu integration test (15)**:
AIAdmin, AdminAudit, AdminDashboard, BasicQuiz, Challenge, HealthCheck, MobileAuth, Public, QuestionSet, ScheduledQuiz, SessionLifeline, SimpleTest, Test, TestDataSeed, UserQuestion

**E2E gaps**: ScheduledQuiz flow (Create/Detail/Play), SetEditor — không có spec

### 4.3 Quality Issues

| # | Issue | Evidence |
|---|---|---|
| T1 | **70 E2E tests bị skipped** (block trên external API hoặc data state) | A-M05 AI generator, A-M07 feedback, A-M08 seasons |
| T2 | **BE service tests dùng `@Mock`, không Testcontainers** | AuthServiceTest, RoomServiceTest, BaseControllerTest dùng `@ExtendWith(MockitoExtension)` — vi phạm rule "Unit test không dùng H2 — dùng Testcontainers MySQL" (đúng là không dùng H2 nhưng cũng không dùng Testcontainers — chỉ mock) |
| T3 | Quiz.test.tsx có 37 cases cho 1027 LOC — coverage tốt theo số nhưng vẫn shallow ở business logic depth | Cần thêm scoring edge cases |

### 4.4 Positive

- ✅ 2,323 test cases >> 733 baseline → đầu tư test cao
- ✅ Không tìm thấy `page.waitForTimeout()` trong E2E — follow best practice
- ✅ `vitest.config.ts` đúng (happy-dom + setup files)
- ✅ Playwright config production-ready (env-based, global setup, HTML report)
- ✅ Test files co-located với source — dễ navigate
- ✅ Không tìm thấy H2 in-memory — infrastructure sẵn cho Testcontainers

---

## 5. Đề xuất ưu tiên (Roadmap)

### Sprint 1 (1 tuần) — Critical fixes

1. ⚠️ **B5**: Thêm `requestId` vào `ErrorResponse` + `GlobalExceptionHandler` — fix vi phạm contract
2. ⚠️ **P1, P2, P3**: Fix N+1 queries trong `NotificationScheduler`, `ScheduledQuizScheduler`, `RoomService`
3. ⚠️ **B1, F6**: Replace empty catch blocks bằng `log.warn(...)` ở `RankedController` + `GroupDetail.tsx`

### Sprint 2 (2 tuần) — High Priority

6. **F1-F4**: Tách 5 mega-pages (`GroupDetail`, `RoomLobby`, `Quiz`, `Profile`, `RoomQuiz`) — extract sub-components, mỗi component ≤ 300 LOC
7. **B7, B8**: Refactor `RankedController` → `RankedAnswerService` + `EnergyService` + `BookProgressionOrchestrator`
8. **P10**: Lazy-load 26 pages bằng `React.lazy()` + `Suspense`
9. **DB indexes**: Thêm `@Index` trên `User.email`, `UserDailyProgress(userId, date)`, `ScheduledQuiz(groupId, status)`, `Room(roomCode)`, `GroupMember(groupId)` — Flyway V46
10. **B3, B4**: Migrate `ChurchGroupController` về DTOs + MapStruct + i18n message bundle

### Sprint 3 (2 tuần) — Medium Priority

11. **F5**: Migrate raw `useEffect+api.get/post` về TanStack Query ở GroupDetail, Quiz, Achievements
12. **P9**: Tăng Hikari pool 8 → 24
13. **P12**: Per-query staleTime cho leaderboard/multiplayer
14. **P15**: Virtualization cho Leaderboard (react-window)
15. **P17**: Migrate notification polling sang STOMP
16. **T2**: Migrate BE service tests sang Testcontainers MySQL (chí ít cho top 5 services)
17. **F10-F12**: Migrate hardcoded colors → CSS variables/design tokens
18. Add unit tests cho 7 FE pages + 10 high-priority BE services

### Sprint 4 (1 tuần) — Polish

19. Replace `RuntimeException(code)` bằng `BusinessLogicException` hierarchy
20. Move TODO `xpSurgeUntil` ra (dead code) hoặc wire vào scoring
21. Consolidate `R__*_questions.sql` files (TODO GA-7 đang track)
22. Add E2E specs cho ScheduledQuiz + SetEditor

---

## 6. Verdict

**Request Changes** trước khi:
- Scale > 10k users (P1, P2 sẽ knock out backend)
- Đi production với contract `requestId` (B5 vi phạm explicit contract)
- Add tính năng mới ở `GroupDetail.tsx` (file đã quá lớn để safely modify)

**Sau khi xong Sprint 1 + 2**, codebase sẽ đáp ứng được scale-up + thêm features.

**Strengths to preserve**:
- Package structure backend đúng layout
- Test investment cao (2,323 cases)
- Security headers + JWT chain solid
- TanStack Query / Zustand stack đúng

**Lessons học được từ audit**:
- "Vibe coding" pattern (đã ghi trong CLAUDE.md) thực sự là gốc của 5 mega-pages
- Known Issues table trong CLAUDE.md hữu ích nhưng chỉ giải quyết được khi có owner & deadline cho từng issue
- E2E Test Gate đúng pattern nhưng 70 skip blocks là red flag — cần unblock hoặc remove

---

*Generated by automated audit. Findings dựa trên file:line quan sát thực tế từ codebase. Không thay thế peer review thủ công.*
