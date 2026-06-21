# 2026-05-23 — MP audit P1+P2: Contracts + Scale + Observability

> **Source**: Lead-tester audit 2026-05-23 (multiplayer coverage gap analysis).
> **Scope**: P1 #15–#20 contracts + P2 #21–#28 scale/observability/UX. Lower priority than lifecycle (MPL) và mode-edge (MPM) — làm sau khi 2 task kia clear.
> **Status**: TODO

### Code prefix: `MPC` (Multiplayer Contracts)

### Tasks

- MPC-1 Question source QUIZ_SET
  - Status: `[ ]` TODO · Spec: §8 POST /api/rooms (`questionSetId` field)
  - Detail: create room với saved quiz set ID → câu hỏi pull từ set thay vì DATABASE random; verify order/content; questionSetId không hợp lệ → 404
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-quiz-set-source.spec.ts`

- MPC-2 AI generation full path (Tier 4+)
  - Status: `[ ]` TODO · Spec: QP-2 (QuickMatchQuestionSourceService)
  - Detail: Tier 4+ POST AI_GENERATED với chapter/verse scope → expect 200 với câu hỏi AI-generated; verify language honored (vi/en); env tolerance như L2-004 hiện có.
  - Files: bổ sung `W-M06-quickmatch.spec.ts` happy-path

- MPC-3 Public/private visibility + viewer-aware `joinable`
  - Status: `[x]` DONE — commit 56362fbd (2 cases): private hidden, public visible + joinable=true.
  - Detail: `isPublic=false` room KHÔNG xuất hiện trong `/public`; full room → `joinable=false`; IN_PROGRESS room → `joinable=false`; current viewer trong room → status reflect
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-visibility.spec.ts`

- MPC-4 Speed Race scoring boundary
  - Status: `[ ]` TODO · Spec: §3.1 ([SpeedRaceScoringService:17](apps/api/src/main/java/com/biblequiz/modules/quiz/service/SpeedRaceScoringService.java))
  - Detail: `responseMs <= 0` → coerce 100 (đúng nhưng max bonus); `responseMs >= timeLimitMs` (timeout sát) → 100 (đúng, no bonus); sai bất kỳ → 0
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-scoring-boundary.spec.ts`

- MPC-5 ROOM_FULL trên Quick Match
  - Status: `[x]` DONE — commit 56362fbd (1 case). Annotates finding if BE accepts >10 (current spec §3.1 says 2-10).
  - Detail: SPEED_RACE max=10, 10 player join → 11th nhận error code phù hợp; same cho BR cap nâng 100
  - Files: bổ sung `W-M06-quickmatch.spec.ts`

- MPC-6 Reconnect rehydrate `/current-question`
  - Status: `[ ]` TODO · Spec: §6.1 ([RoomController:230-235](apps/api/src/main/java/com/biblequiz/api/RoomController.java#L230))
  - Detail: late-join hoặc reconnect mid-question → GET endpoint trả full `QuestionStartData`; ROUND_END giữa 2 câu → 204; payload consistency với WS `QUESTION_START` event
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-question-rehydrate.spec.ts`

- MPC-7 Scheduled quiz (V40)
  - Status: `[ ]` TODO · Spec: SPEC_GROUP §9
  - Detail: create scheduled quiz → cron deadline → attempt window → submit → leaderboard endpoint `/api/groups/{id}/scheduled-quiz/{qId}/leaderboard`. Cần group fixture + admin time-shift.
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-scheduled-quiz.spec.ts`

- MPC-8 Performance: 100-player BR
  - Status: `[ ]` TODO · Spec: §3.2 (cap raised 2026-05-22)
  - Detail: extend `W-M06-survival-50p.spec.ts` lên 100; assert no timeout, all PLAYER_ELIMINATED delivered, final leaderboard có 100 entries. Note: cần beefier CI resource.
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-survival-100p.spec.ts`

- MPC-9 Race conditions
  - Status: `[ ]` TODO
  - Sub-cases: 2 players cùng bấm `/start` đồng thời → 1 success, 1 idempotent reject; rapid join/leave loop (10 cycles) → state không drift (`currentPlayers` vs `RoomPlayer.count()` consistent)
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-race.spec.ts`

- MPC-10 Sound/haptic event triggers (P2)
  - Status: `[ ]` TODO
  - Detail: spy `playSound`/`haptic` calls (mock window.Audio + navigator.vibrate); assert trigger trên QUESTION_START, ROUND_END, ELIMINATED. Mobile parity check.
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-audio-haptic.spec.ts`

- MPC-11 i18n EN cho WS errors
  - Status: `[ ]` TODO
  - Detail: set lang=en → trigger các error scenarios (full room, wrong code, kick) → assert message tiếng Anh, không leak raw key
  - Files: bổ sung `W-M06-multiplayer.spec.ts` smoke

- MPC-12 Mobile parity Maestro `APP-M06-multiplayer`
  - Status: `[ ]` TODO
  - Detail: tạo `tests/e2e/maestro/specs/{smoke,happy-path}/APP-M06-multiplayer.md` MVP — card render, create room, join by code, navigate to lobby. Realtime gameplay defer.
  - Files: 2 spec md file

- MPC-13 Admin tools
  - Status: `[ ]` TODO
  - Detail: admin force-end stuck room; admin view active rooms; metrics endpoint nếu có. Cần `adminPage` fixture (đã có).
  - Files: `apps/web/tests/e2e/happy-path/web-admin/A-M*-multiplayer-ops.spec.ts`

- MPC-14 STOMP heartbeat + auto-reconnect
  - Status: `[ ]` TODO
  - Detail: simulate WS disconnect (network throttle/offline) → client auto-reconnect; subscribe re-established; missed events backfill (nếu có); UI status indicator chuyển "Mất kết nối → Đã kết nối"
  - Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-ws-reconnect.spec.ts`

### Notes
- Task này low-priority; chỉ start sau khi MPL + MPM clear.
- Một số case (admin time-shift, scheduled quiz cron) cần BE expose test endpoints → có thể block; document blocker khi gặp.
