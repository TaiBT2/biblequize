# 2026-05-06 — Group → Live Room flow audit fixes [DONE]

> **Source:** Static code audit của user journey Groups → GroupDetail → Quiz → Live Room (xem báo cáo audit trong Claude conversation).
> **Branch:** `feature/group-live-and-scheduled` (current).
> **Scope:** 15 fixes chia 3 PR — Batch 1 (P0), Batch 2 (P1), Batch 3 (P2). P0-2 (leader-leaves auto-promote/cancel) tạm hoãn theo quyết định Bui 2026-05-06.

### Batch 1 — P0 critical

#### Task GFA-1: P0-3 — BE thêm `myUserId` vào RoomDetailsDTO [x] DONE
- File(s):
  - `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` (DTO + getRoomDetails(id, userId) overload)
  - `apps/api/src/main/java/com/biblequiz/api/RoomController.java` (3 endpoints pass Principal)
- Why: hiện FE match player bằng `username` (localStorage userName) — 2 user trùng tên = wrong host detection.
- Checklist:
  - [ ] RoomDetailsDTO thêm field `myUserId`
  - [ ] RoomService.getRoomDetails(roomId, viewerUserId) — overload mới
  - [ ] Old getRoomDetails(roomId) giữ nguyên (backward-compat trong các call site khác)
  - [ ] RoomController: getRoomDetails / createRoom / joinRoom / switchTeam pass Principal
  - [ ] Compile pass: `./mvnw compile -q`
  - [ ] Commit: `fix(room): expose myUserId in RoomDetails for reliable host/player identity`

#### Task GFA-2: P0-3 — FE switch from myUsername to myUserId [x] DONE
- File(s):
  - `apps/web/src/pages/RoomLobby.tsx` (5 sites: line 137, 147, 219, 767, 990)
  - `apps/web/src/pages/__tests__/RoomLobby.test.tsx` (mockRoom thêm myUserId)
- Checklist:
  - [ ] RoomDetails type thêm `myUserId?: string`
  - [ ] Replace `p.username === myUsername()` với `p.userId === room?.myUserId` ở mọi player matching
  - [ ] PlayerCard prop nhận `myUserId` thay vì check qua myUsername
  - [ ] Test mockRoom thêm `myUserId: 'host-1'`
  - [ ] Vitest scope: `npx vitest run src/pages/__tests__/RoomLobby.test.tsx`
  - [ ] Commit: `fix(room): match player by userId instead of username (P0-3)`

#### Task GFA-3: P0-1 — BE filter solo room reuse by mode [x] DONE
- File(s):
  - `apps/api/src/main/java/com/biblequiz/modules/room/repository/RoomRepository.java` (add findFirstByGroupQuizSetIdAndStatusAndMode)
  - `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` (playQuizSet line 567)
- Why: "Tự ôn solo" hiện reuse ANY LOBBY room sharing quizSetId → joins live multiplayer room instead.
- Checklist:
  - [ ] New repo method filter mode=SPEED_RACE
  - [ ] playQuizSet dùng method mới
  - [ ] Compile pass
  - [ ] Commit: `fix(group): solo play must not join live multiplayer room (P0-1)`

#### Task GFA-4: Batch 1 — full regression
- Checklist:
  - [ ] `cd apps/web && npx vitest run`
  - [ ] `cd apps/api && ./mvnw test -Dtest="com.biblequiz.api.**,com.biblequiz.modules.room.**,com.biblequiz.modules.group.**"`
  - [ ] PR Batch 1

### Batch 2 — P1 cluster

#### Task GFA-5: P1-1 — GroupDetail error state distinguishes 404/403 [x] DONE
#### Task GFA-6: P1-7 — Member-facing copy on disabled Start button [-] SKIP (already correctly differentiated in both mobile/desktop layouts)
#### Task GFA-7: P1-2 — SequentialLobbyView reconnect/error props [x] DONE
#### Task GFA-8: P1-3 — RoomQuiz advance gated on all-answered [x] DONE
#### Task GFA-9: P1-4 — RoomQuiz prevent double-submit [-] SKIP (already guarded by canAnswer check `selected===null && !submitting`)
#### Task GFA-10: P1-5 — Drop group code from localStorage [x] DONE
#### Task GFA-11: P1-6 — Validate correctAnswer index in createCustomQuizSet [x] DONE

### Batch 3 — P2 polish

#### Task GFA-12: P2-1 — "Đang diễn ra" empty state in GroupDetail [-] SKIP (member empty state already exists at line 1850; section hide-when-empty for leader is acceptable)
#### Task GFA-13: P2-2 — Hide ready-status copy in SEQUENTIAL mode [-] SKIP (sequential never reaches that code path — early return to SequentialLobbyView at line 262)
#### Task GFA-14: P2-3 — Optimistic UI on ready toggle [x] DONE (throttle approach instead — simpler)
#### Task GFA-15: P2-4 — Differentiate "Chơi cùng nhau" / "Tự ôn" buttons [-] SKIP (already differentiated via icons + tooltips + colors)
#### Task GFA-16: P2-5 — SecureRandom for room code [x] DONE

---
