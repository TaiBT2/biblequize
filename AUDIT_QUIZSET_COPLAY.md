# AUDIT — Quiz Set Co-Play Integration

**Date:** 2026-05-10  
**Branch:** main  
**Latest commit:** 0530cae (refactor(quiz-set): migrate tags + learnedQuestionIds to type-safe converter)

## Summary

- **Risk level:** MEDIUM
- **Estimated effort:** 3–4 days (Sprint 4 dependency + integration testing)
- **Blockers:** Sprint 4 (host-organizer separation) is **PARTIALLY DONE**
- **Sprint 4 status:** DONE (baseline) — feature gate already in Room entity and RoomService.createRoom

---

## Task A1: Room entity & schema

**Finding:** Room entity already has groupQuizSetId field.

### File: `apps/api/src/main/java/com/biblequiz/modules/room/entity/Room.java`

- **Line 61–62:** Field already exists with getters/setters at lines 188–189.
  
### Migration: V37 and V49+

- V37__add_group_quiz_set_id_to_rooms.sql: Column added as nullable VARCHAR(36)
- V49__add_host_plays_game.sql: Sprint 4 baseline field added
- V50__group_quiz_set_metadata.sql: Latest migration (metadata for group_quiz_sets)

### FK Considerations

- **NOT YET ENFORCED:** No foreign key constraint exists.
- **Recommendation:** Add FK + CASCADE DELETE SET NULL to preserve rooms when quiz set is deleted.

---

## Task A2: RoomService question-loading flow

### Method: `loadQuestionsForRoom` (lines 477–521 of RoomQuizService.java)

Current flow:
1. Line 481: Check `room.getCustomQuestionIds()` (direct JSON array)
2. Line 489: If `questionSource == CUSTOM`:
   - Line 495: Check personal `questionSetId`
   - Line 508: Fall back to legacy RoomQuestionSelection
3. Line 520: Fall through to database random selection

**CLEANEST BRANCH POINT: Line 481–487**

Insert co-play check (Priority 0a) BEFORE customQuestionIds:
- Fetch GroupQuizSet by room.groupQuizSetId
- Extract questionIds (JSON list) from quiz set
- Return those questions
- Fall through if none found

### Missing Dependency

- RoomQuizService does NOT inject GroupQuizSetRepository
- Add: `@Autowired private GroupQuizSetRepository groupQuizSetRepository;`

---

## Task A3: GroupQuizSet entity & lifecycle

### File: `apps/api/src/main/java/com/biblequiz/modules/group/entity/GroupQuizSet.java`

- **Line 38–39:** questionIds stored as JSON via JsonListConverter (type is List<?>, cast to List<String> when reading)
- **Line 19:** PublishStatus enum: DRAFT, PUBLISHED, ARCHIVED, SOFT_DELETED

### Status Validity for Co-Play

- PUBLISHED: Yes (intended for play)
- DRAFT: TBD (creator testing?) — **Open question for Bui**
- ARCHIVED/SOFT_DELETED: No

---

## Task A4: Frontend CreateRoom flow

### File: `apps/web/src/pages/CreateRoom.tsx`

Current form (lines 48–59) does NOT include groupQuizSetId field.

### API Flexibility

- POST payload accepts arbitrary Record<string, unknown> — flexible for additions.

### What's Missing

1. CreateRoom.tsx doesn't accept groupQuizSetId
2. QuizSetDetail page not located (may be in pages/groups/QuizSetDetail.tsx)

### Recommendation

- Keep CreateRoom as generic multiplayer room creator
- Add "Play Co-Play" button on QuizSetDetail page that:
  - Validates group membership
  - Calls POST /api/rooms with groupQuizSetId pre-filled
  - Navigates to /room/{id}/lobby

---

## Task A5: Sprint 4 conflict check

### Status: DONE (baseline)

- **V49 migration:** host_plays_game field added with DEFAULT TRUE
- **Room entity:** Field implemented at lines 71–74
- **RoomService.createRoom:** Overload at lines 75–114 with hostPlaysGame parameter
- **Default for new rooms:** hostPlaysGame = false (organizer mode)
- **Backward compat:** Existing rooms stay true via DB DEFAULT
- **startRoom validation:** Line 430 correctly counts non-host players only
- **joinRoom protection:** Lines 154–157 short-circuit host from joining in organizer mode

### Sprint 4 Completion Status

- Baseline (~95% done): architecture + backward compat complete
- Remaining: UI polish, tests, controls (documented in PROMPT_FIX_HOST_ORGANIZER_SPRINT4.md)

---

## Task A6: Test baseline

### Backend: 923 tests, 2 failures + 1 error (pre-existing, unrelated to co-play)
- QuestionReviewControllerTest JSON path assertion
- RoomControllerTest status code (400 vs 200)
- LifelineServiceTest unnecessary stubbing

### Frontend: Vitest configuration error (pre-existing, not related to co-play)

---

## Task A7: Score persistence Q-A boundary

### Current Storage

- Scores live in `room_players` table (no separate quiz-set leaderboard yet)
- Columns: score, correct_answers, total_answered, final_rank

### Boundary Strategy for Co-Play

**NEW TABLE (future):** `quiz_set_leaderboard`
- Tracks user scores ONLY for solo quiz-set play
- Co-play scores EXCLUDED (write to room_players only)
- Use source column: ENUM('SOLO', 'CO_PLAY') — co-play set to never-write

This preserves Q-O spirit: co-play is fun/temporary, not competitive ranking.

---

## Task A8: WebSocket events & quiz set context

### RoomDetailsDTO (lines 651–714 of RoomService.java)

Currently includes:
- id, roomCode, roomName, status, mode, questionSetId (personal), groupId, hostPlaysGame

**Missing:**
- groupQuizSetId (the foreign key)
- groupQuizSetName (for UI display in lobby)

### ADD to RoomDetailsDTO

Constructor at lines 679–713 needs:
```java
this.groupQuizSetId = room.getGroupQuizSetId();
this.groupQuizSetName = (room.getGroupQuizSetId() != null) 
  ? groupQuizSetRepository.findById(room.getGroupQuizSetId()).map(GroupQuizSet::getName).orElse(null)
  : null;
```

### Frontend

- WebSocket consumer (presumed in apps/web/src/api/websocket.ts, not located) should consume groupQuizSetId/Name from ROOM_STATE
- Display in lobby/header when present

---

## Task A9: Member-only access enforcement

### Current joinRoom (lines 120–189 of RoomService.java)

- Checks: room existence, status, capacity, another-active-room
- **NO GROUP MEMBERSHIP CHECK**

### Implementation for Co-Play

**When room.groupQuizSetId != null:**
1. Fetch GroupQuizSet
2. Extract groupId
3. Check user is GroupMember:
   ```java
   boolean isMember = groupMemberRepository.existsByGroupIdAndUserId(groupId, userId);
   if (!isMember) throw new Exception("Bạn không phải thành viên của nhóm này");
   ```

**ADD at line 125** (after room lookup, before other checks)

### Missing Dependency

- Inject GroupMemberRepository

---

## Recommended migration

```sql
-- V51 (draft, do NOT execute)
-- Co-Play FK constraint + index

ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_group_quiz_set 
  FOREIGN KEY (group_quiz_set_id) REFERENCES group_quiz_sets(id) ON DELETE SET NULL;

CREATE INDEX idx_rooms_group_quiz_set ON rooms(group_quiz_set_id);
```

---

## Branch points to modify

1. **RoomQuizService.java:481** — Insert GroupQuizSet question loading (Priority 0a)
2. **RoomService.java:125** — Add group membership check in joinRoom()
3. **RoomService.java:679** — Add groupQuizSetId/Name to RoomDetailsDTO
4. **CreateRoom.tsx (indirect)** — Support ?quizSetId query param OR new entry on QuizSetDetail
5. **websocket.ts (presumed)** — Consume groupQuizSetId/Name from ROOM_STATE payload
6. **Database V51** — Add FK + index

---

## Open questions for Bui

- [ ] GroupQuizSet status: Accept DRAFT (creator testing) or only PUBLISHED?
- [ ] QuizSetDetail page: Where is the "Play Co-Play" button? Is page implemented?
- [ ] Leaderboard visibility: Separate "recent co-plays" board or hidden entirely?
- [ ] Question count: Enforce max 50 at quiz-set-create time or at room-start time?
- [ ] Sprint 4 ETA: When is baseline considered DONE? (Current: ~95%, 10+ tasks remain)

---

## NOT done in this audit

- No code modifications
- No new files except this report
- No implementation
- No frontend QuizSetDetail exploration (not found)
- No leaderboard table creation
- No WebSocket payload tests
