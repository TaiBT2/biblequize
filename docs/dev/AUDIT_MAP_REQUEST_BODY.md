# Audit: `Map<String, Object>` request bodies in BE controllers

**Date:** 2026-05-13 (CQ-19 investigation output)
**Source:** `chore/code-quality-improvements` branch · Code Quality Audit Phase 5
**Goal:** Catalog every `@RequestBody Map<String, Object>` parameter across BE controllers so the CQ-20/21 migration work can prioritise typed Request DTOs + Bean Validation.

---

## Summary

| Metric | Count |
|---|---|
| Controllers with raw-Map params | **17** |
| `@RequestBody Map<String, Object>` endpoints | **39** |
| `@SuppressWarnings("unchecked")` in scope | **12+** |

This is a larger surface than the original TODO scope (CQ-20 = ChurchGroupController alone). Recommend re-scoping CQ-20/21 into batched migrations by priority tier.

---

## Top-3 priority migrations (recommended commit order)

### Batch 1 — Auth + Room + Ranked hot-path (HIGH)
6 endpoints. Type mismatches here block login or break game state.

| Endpoint | DTO | Line ref |
|---|---|---|
| `AuthController.exchangeCode` POST `/api/auth/exchange` | `ExchangeCodeRequest` | [AuthController.java:87](apps/api/src/main/java/com/biblequiz/api/AuthController.java#L87) |
| `AuthController.register` POST `/api/auth/register` | `RegisterRequest` | [AuthController.java:196](apps/api/src/main/java/com/biblequiz/api/AuthController.java#L196) |
| `AuthController.loginLocal` POST `/api/auth/login` | `LoginRequest` | [AuthController.java:233](apps/api/src/main/java/com/biblequiz/api/AuthController.java#L233) |
| `RoomController.createRoom` POST `/api/rooms` | `CreateRoomRequest` | [RoomController.java:52](apps/api/src/main/java/com/biblequiz/api/RoomController.java#L52) |
| `RoomController.joinRoom` POST `/api/rooms/join` | `JoinRoomRequest` | [RoomController.java:111](apps/api/src/main/java/com/biblequiz/api/RoomController.java#L111) |
| `RankedController.submitRankedAnswer` POST `/api/ranked/sessions/{id}/answer` | `SubmitRankedAnswerRequest` | [RankedController.java:188](apps/api/src/main/java/com/biblequiz/api/RankedController.java#L188) |

### Batch 2 — ChurchGroup core workflow (HIGH-MEDIUM)
5 endpoints covering group discovery + membership + quiz set scaffolding.

| Endpoint | DTO | Line ref |
|---|---|---|
| `ChurchGroupController.createGroup` POST `/api/groups` | `CreateGroupRequest` | [L97](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L97) |
| `ChurchGroupController.joinGroup` POST `/api/groups/join` | `JoinGroupRequest` | [L194](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L194) |
| `ChurchGroupController.createQuizSet` POST `/api/groups/{id}/quiz-sets` (1× SuppressWarnings) | `CreateGroupQuizSetRequest` | [L337](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L337) |
| `ChurchGroupController.updateQuizSet` PATCH `/api/groups/{id}/quiz-sets/{setId}` (1× SuppressWarnings) | `UpdateGroupQuizSetRequest` | [L363](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L363) |
| `ChurchGroupController.changeMemberRole` PATCH `/api/groups/{id}/members/{userId}/role` | `ChangeMemberRoleRequest` | [L273](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L273) |

### Batch 3 — User questions + scheduled quiz (MEDIUM)
4 endpoints. Drains 4× `@SuppressWarnings("unchecked")`.

| Endpoint | DTO | Line ref |
|---|---|---|
| `UserQuestionController.generate` POST `/api/user-questions/generate` (1× supp) | `GenerateUserQuestionsRequest` | [L41](apps/api/src/main/java/com/biblequiz/api/UserQuestionController.java#L41) |
| `UserQuestionController.create` POST `/api/user-questions` (1× supp) | `CreateUserQuestionRequest` | [L71](apps/api/src/main/java/com/biblequiz/api/UserQuestionController.java#L71) |
| `UserQuestionController.update` PUT `/api/user-questions/{id}` (1× supp) | `UpdateUserQuestionRequest` | [L105](apps/api/src/main/java/com/biblequiz/api/UserQuestionController.java#L105) |
| `ScheduledQuizController.submitAttempt` POST `/api/groups/{groupId}/scheduled-quizzes/{quizId}/submit` (1× supp) | `SubmitAttemptRequest` | [L108](apps/api/src/main/java/com/biblequiz/api/ScheduledQuizController.java#L108) |

---

## Remaining lower-priority endpoints (Batch 4+)

### ChurchGroupController (residual — 12 more)
- `changeQuizSetStatus` (L741), `changeVisibility` (L758), `rateQuizSet` (L818), `kickMember` (L876), `transferLeadership` (L908), `bulkKickMembers` (L968), `broadcastMessage` (L1032), `updateGroupSettings` (L1197), `setModerationPolicy` (L1384), `importQuestions` (L1420), `scheduleQuizReminder` (L1489), `reorderQuizSetQuestions` (L1528)

### Admin moderation (4)
- `AdminUserController.changeRole` (L70) → `ChangeUserRoleRequest`
- `AdminUserController.banUser` (L98) → `BanUserRequest`
- `AdminGroupController.lockGroup` (L45) → `LockGroupRequest`
- `AdminQuestionController.checkDuplicate` (L139) → `CheckDuplicateRequest`

### Misc (low-frequency / single-field)
- `ScheduledQuizController.create` (L32) → `CreateScheduledQuizRequest`
- `FeedbackController.submitFeedback` (L56) → `SubmitFeedbackRequest`
- `FeedbackController.updateStatus` (L151) → `UpdateFeedbackStatusRequest`
- `TournamentController.createTournament` (L55) → `CreateTournamentRequest`
- `QuestionSetController.create` (L45) / `update` (L116) / `setVisibility` (L133) / `replaceItems` (L199)
- `ChallengeController.createChallenge` (L29) → `CreateChallengeRequest`
- `DailyChallengeController.checkAnswer` (L102) → `CheckAnswerRequest`
- `UserController.updateCurrentUser` (L126) → `UpdateUserRequest`
- `UserController.bootstrapAdmin` (L241) → `BootstrapAdminRequest`
- `AdminSeasonController.createSeason` (L36) → `CreateSeasonRequest`
- `AdminTestController.seedGroup` (L543) + `seedTournament` (L628) — test-only fixtures, lowest priority

---

## Common patterns to apply

1. **DTO location**: `apps/api/src/main/java/com/biblequiz/api/dto/` (one file per request, mirror endpoint).
2. **Validation annotations**: `@NotBlank`, `@Size(min=, max=)`, `@Min`, `@Max`, `@Pattern`, `@NotNull`, `@Email`. Use Lombok-free explicit getters/setters or use `record` (Java 17) for immutability.
3. **Controller signature change**: `@RequestBody Map<String, Object> body` → `@Valid @RequestBody CreateXRequest req`. Replace `body.get("...")` casts with `req.getX()` / `req.x()`.
4. **GlobalExceptionHandler** already maps `MethodArgumentNotValidException` to a structured 400 response with `validationErrors: { field: message }` map — no controller-level error wiring needed.
5. **Remove `@SuppressWarnings("unchecked")`** as the typed accessor replaces casts.
6. **Tests**: existing `@WebMvcTest` slices keep working — just update request body JSON serialization (already typical pattern via `ObjectMapper`).

---

## Re-scoping recommendation for CQ-20 / CQ-21

Original TODO scope was too narrow. Recommend:

- **CQ-20** = Batch 1 (Auth + Room + Ranked, 6 endpoints, drains 0 suppress but unblocks hot-path safety) — ~1 commit
- **CQ-21** = Batch 2 (ChurchGroup core, 5 endpoints, drains 2 suppress) — ~1 commit
- **CQ-21b** (new) = Batch 3 (UserQuestion + Scheduled, 4 endpoints, drains 4 suppress) — ~1 commit
- Batch 4–5 (residual admin + misc, ~14 endpoints) → defer to next sprint, can drain incrementally per "fix-on-touch" rule

**Total in this sprint**: 15 endpoints in 3 commits, drains ~6 suppress. Remaining ~24 endpoints punted to future fix-on-touch.

Alternative aggressive scope: do all 39 in 5–6 commits = full ~1 week of dedicated migration work.

---

## Open questions for user

1. Confirm 3-commit scope above (15 of 39 endpoints) vs. full scrub (39 endpoints, 5–6 commits).
2. Java `record` vs class for DTOs — project doesn't have an existing pattern; both work with Bean Validation. Recommend `record` for terse immutable request DTOs (no setters needed since Spring injects via constructor).
3. After migration, should we add a custom ArchUnit / Checkstyle rule banning `Map<String, Object>` in controller params to prevent regression?
