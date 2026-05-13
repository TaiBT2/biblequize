# 2026-05-06 — Spec compliance follow-ups (sau review SPEC_GROUP_v1) [SUPERSEDED by v1.1]

> **Source:** Cross-reference giữa SPEC_GROUP_v1.md (1192 dòng, last updated 2026-05-06) và codebase hiện tại sau khi ship audit fixes Batch 1+2+3.
> **Scope:** Gaps + conflicts giữa spec và implementation. KHÔNG phải bugs runtime — code hiện tại chạy được, chỉ chưa khớp spec target state.
> **Branch strategy:** Mỗi task = 1 PR riêng. Không bundle vì impact phân tán.
> **Status legend:** `[ ] TODO` · `[?] DECISION PENDING` (cần Bui confirm trước khi code) · `[v1.5]` (defer ngoài beta).

### Decisions còn pending (block một số tasks bên dưới)

#### Q-A: "Tự ôn solo" có vào Group Leaderboard không? [?] DECISION PENDING
- **Spec self-conflict**: Section 7.5 line 459 nói "không vào group leaderboard"; Section 10.2 line 677 nói "✅ đóng góp"
- **Block**: GFA-17 (refactor flow) cần biết để wire scoring đúng
- **Bui pick**: yes / no → cập nhật spec rồi unblock

#### Q-B: Sequential mode advance — manual hay auto? [?] DECISION PENDING
- **Spec 8.4 line 532-534**: auto next sau pause 5/10/15s
- **Code hiện tại + audit fix P1-3**: leader manual click "Sang câu tiếp"
- **Block**: nếu spec đúng → revert P1-3 commit `497c1d3` + làm GFA-31 (timer auto-advance)
- **Bui pick**: keep manual (sửa spec) / change to auto (revert + new task)

#### Q-C: Concurrent live rooms cho cùng quiz set? [?] DECISION PENDING
- **Spec 8.7 line 571-573**: cho phép nhiều rooms parallel
- **Code hiện tại** (`createLiveQuiz` line 639-647): dedup, leader thứ 2 click sẽ join phòng đã có
- **Block**: nếu spec đúng → bỏ dedup trong `createLiveQuiz` (~5 LOC)
- **Bui pick**: keep dedup (sửa spec) / remove dedup (immediate fix)

#### Q-G: Multi-leader system v1 hay v1.5? [?] DECISION PENDING
- **Spec section 6** (toàn bộ): multi-leader + creator special demote right + 7-day eligibility
- **Code hiện tại**: 1 LEADER per group, không có `is_creator` flag, không có promotion endpoint
- **Impact lớn**: ảnh hưởng Q-D (Mod role), Q-I (host disconnect promotion), permission flow chung
- **Bui pick**: v1 (3-5 days work) / v1.5 (defer, keep current) → mặc định defer

### Tasks (immediate khi unblock)

#### Task GFA-17: Refactor "Tự ôn solo" sang Practice session [ ] TODO
- **Source**: SPEC_GROUP_v1 section 7.5 (line 450-464): "Member vào Practice mode"
- **Why**: hiện `playQuizSet` tạo SPEED_RACE Room (multiplayer mode) cho solo intent → 2 members click cùng lúc có thể vào chung phòng (P0-1 fix bandage dedup nhưng concept vẫn sai)
- **Block by**: Q-A (scoring contribution decision)
- **File(s)**:
  - `apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java` — `playQuizSet` refactor
  - `apps/api/src/main/java/com/biblequiz/modules/quiz/service/SessionService.java` (or equivalent)
  - `apps/web/src/pages/GroupDetail.tsx` — `handlePlayQuizSet` → navigate to Practice page thay vì RoomLobby
- **Estimated**: ~50 LOC + new endpoint signature
- **After done**: drop `findFirstByGroupQuizSetIdAndStatusAndMode` repo method (no longer used)

#### Task GFA-31: Sequential mode auto-advance after pause [ ] TODO (block by Q-B)
- **Source**: SPEC_GROUP_v1 section 8.2 (config) + 8.4 (auto next)
- **Scope**: BE add `pauseSec` field to Room entity + createLiveQuiz body; FE timer countdown after reveal then auto-fire QUESTION_START
- **Revert needed first**: commit `497c1d3` (P1-3 manual gate) — manual button no longer applies
- **Estimated**: ~80 LOC across BE entity + service + FE quiz screen

#### Task GFA-33: Bỏ dedup trong createLiveQuiz [ ] TODO (block by Q-C)
- **Source**: SPEC_GROUP_v1 section 8.7 line 571-573
- **File**: `ChurchGroupController.java` line 639-647 (delete dedup block, always create new room)
- **Estimated**: ~5 LOC

#### Task GFA-N: Rename endpoint `/live-quiz` → `/live-rooms` [ ] TODO
- **Source**: SPEC_GROUP_v1 section 13.5 endpoint naming
- **Safe**: 0 mobile/external consumers, 1 FE call site (`apps/web/src/api/groups.ts:23`)
- **File(s)**:
  - `ChurchGroupController.java` — `@PostMapping`
  - `apps/web/src/api/groups.ts:23`
  - `ChurchGroupControllerTest.java`
- **Estimated**: 4 file edits, ~10 LOC total

### Tasks (gaps — chưa implement, defer post-beta)

#### Task GFA-18: Constraint max 2 groups owned per user [ ] TODO
- **Source**: SPEC 4.2 line 197-209
- **File**: `ChurchGroupService.createGroup` — check `COUNT(groups WHERE creator_user_id = X AND status NOT IN ('soft_deleted')) >= 2` → reject 422 with structured error code

#### Task GFA-19: Constraint max 5 groups joined per user [ ] TODO
- **Source**: SPEC 4.3 line 251
- **File**: `ChurchGroupService.joinGroup` — check membership count → reject 422

#### Task GFA-20: Multi-leader system [v1.5] (block by Q-G)
- **Source**: SPEC section 6 (toàn bộ)
- **Scope**: DB migration `is_creator BOOLEAN`, allow multiple LEADER rows per group, promotion/demotion endpoints, max 5 leaders, 7-day eligibility, FE Settings → "Quản lý leaders" section
- **Estimated**: 3-5 days
- **Depends-on**: Q-G v1 vs v1.5 decision

#### Task GFA-21: pause_sec config cho live room [ ] TODO
- **Source**: SPEC 8.2 line 489-490 — Pause 5/10/15s configurable
- **File(s)**: Room entity + createLiveQuiz body + RoomLobby config UI
- **Bundled-with**: GFA-31 nếu Q-B chọn auto-advance (cùng cần pauseSec field)

#### Task GFA-22: Host disconnect auto-promote co-leader [v1.5] (block by Q-G)
- **Source**: SPEC 8.5 line 549-552
- **Was**: P0-2 deferred (Bui chọn hoãn vì cần Q-G context)
- **Strategy nếu v1.5 GFA-20 done**: auto-promote co-leader trong room
- **Strategy nếu defer GFA-20**: cancel room broadcast `ROOM_CLOSED`, members redirect về `/groups/{id}` (option b cũ)

#### Task GFA-23: Member can't join multiple rooms simultaneously [ ] TODO
- **Source**: SPEC 8.7 line 573 "consecutive, không simultaneous"
- **File**: `RoomService.joinRoom` — check user đã trong active room khác → reject

#### Task GFA-24: Push notifications cho 11 group events [v1.5]
- **Source**: SPEC 11 (toàn bộ table)
- **Events**: member join/leave, leader promotion, room opened, room start, scheduled created, 24h remaining, ended winner, announcement, group locked, group will be deleted
- **Estimated**: cần module notification chung trước (FCM/APNs setup) → defer v1.5

#### Task GFA-25: 7-day re-join cooldown after kick [ ] TODO
- **Source**: SPEC 12.2 line 771
- **File**: `kickMember` ghi `kicked_at` + `joinGroup` check `last_kicked_at < NOW() - 7d` cho user-group pair

#### Task GFA-26: Report group endpoint [v1.5]
- **Source**: SPEC 12.4 + 13.9
- **Scope**: `POST /api/groups/{id}/report` + `group_report` table + admin queue UI
- **Defer**: cần admin moderation flow trước

#### Task GFA-28: DB schema migration `group_quiz_set` → `quiz_set` + `quiz_set_question` [v1.5]
- **Source**: SPEC 14.2 line 962-988
- **Why**: hiện dùng JSON list `questionIds`; spec target dùng join table cho referential integrity + per-question order
- **Impact**: Flyway migration + entity refactor + data backfill
- **Defer**: refactor lớn, không block beta

#### Task GFA-29: Browse Library quiz set source [v1.5]
- **Source**: SPEC 7.3 line 431-435
- **Scope**: Library = template quiz sets share giữa các groups, leader pick + clone
- **Defer**: cần curate library content trước

#### Task GFA-30: Document Q-A decision [ ] TODO (block by Q-A)
- **Action**: sau khi Bui pick, sửa SPEC_GROUP_v1.md để remove conflict (1 trong 7.5 hoặc 10.2 phải đổi)
- **Bonus**: ghi DECISIONS.md

#### Task GFA-32: Mod role removal [v1.5] (block by Q-G)
- **Source**: SPEC 2.1 + 15.1 + 15.2 migration
- **Scope**: DB migration `UPDATE group_member SET role='leader' WHERE role='mod'`, BE `requireLeaderOrMod` → `requireLeader`, FE drop MOD badge
- **Depends-on**: GFA-20 (multi-leader) — phải có multiple LEADER trước mới remove MOD
- **Risk**: existing MODs lose privileges nếu không được promote thành LEADER trước

---
