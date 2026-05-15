# 2026-05-15 — Multiplayer Quick Match (Đấu Nhanh) pivot

> **Source**: User decision 2026-05-15 — pivot Solo Arena concept (MPP-3/4) sang Quick Match. Mockup `docs/new-multiplayer/MOCKUP_MULTIPLAYER_LOBBY_v3.html` + prompt `docs/new-multiplayer/PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT.md` (1435 LOC). User confirm 4 corrections sau khi đọc prompt: creator có quyền chọn mode/scope/source (KHÔNG fixed), AI questions one-shot KHÔNG save pool.
>
> **Status**: TODO

### Locked decisions (2026-05-15)

| Decision | Value |
|---|---|
| Naming | "Đấu Nhanh" (VI), `quickMatch` (code) |
| Match policy | **Always-create** (giống Liên Quân custom lobby, KHÔNG matchmaking) |
| Config | Creator pick mode (4) + scope (book/chapter/verse) + count + time + source |
| Source options | DATABASE random / AI_GENERATED (Tier 4+ unlock) |
| AI storage | **`Room.ai_questions_payload JSON`** (V57 new column) — one-shot, throw-away sau game |
| Soft-host | `hostPlaysGame=true`, no Quản trò controls (pause/skip/broadcast/end-early reject 422) |
| Start permission | Any player when ≥2 ready |
| Daily cap | **3 trận/ngày/user**, Redis SETEX 24h |
| XP/Leaderboard | KHÔNG (variety-style) |
| Color theme | Indigo `#6366f1` → `#818cf8` gradient |
| Config UI | **Modal popup** (`QuickMatchConfigModal.tsx`), không inline expand |

### Tasks

- QP-AUDIT Audit codebase state
  - Status: [x] DONE — verified Solo Arena artifacts (SoloArenaEntryCard, SoloArenaPlaceholder, /solo-arena route, EmptyState soft-link), BACKLOG entries, Room entity (host_plays_game exists, quick_match NOT exists), latest migration V56, RedisTemplate + AIProviderRouter available.

- QP-0.5 Docs: BACKLOG close BL-MP-SOLO + promote BL-MP-QM + add BL-MP-QM-CUSTOM
  - Status: [x] DONE
  - Files: `docs/spec/BACKLOG.md`
  - Close BL-MP-SOLO with CANCELLED reason. Update BL-MP-QM to ACTIVE with full v2 scope (creator-config + always-create + AI ephemeral). Add new BL-MP-QM-CUSTOM v2 (user-persistent settings).
  - **Spec strategy**: [x] (b) new BL entries
  - Checklist: append BACKLOG → commit < 50 LOC

- QP-1 BE: Migration V57 + Room entity fields
  - Status: [x] DONE
  - Files: `apps/api/src/main/resources/db/migration/V57__add_room_quick_match.sql`, `apps/api/src/main/java/com/biblequiz/modules/room/entity/Room.java`
  - SQL: `ALTER TABLE rooms ADD COLUMN quick_match BOOLEAN NOT NULL DEFAULT FALSE, ADD COLUMN ai_questions_payload JSON NULL`. Index `idx_rooms_quick_match (quick_match, status)` cho find/filter.
  - Entity: `boolean quickMatch = false`, `String aiQuestionsPayload` (lưu JSON string) + getter/setter.
  - **Spec strategy**: [x] (a) update inline (SPEC_MULTIPLAYER §2.1 Room fields)
  - Checklist: migration + entity + JUnit compile pass → commit < 60 LOC

- QP-2 BE: `POST /api/rooms/quick-match` endpoint
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/api/RoomController.java`, new DTO `QuickMatchRequest`, `RoomService.createQuickMatchRoom()`
  - Body: `{ mode, bookScope, questionCount, timePerQuestion, source }`. Validate daily cap (QP-4) + AI tier-lock (Tier 4+) + user not in another room. Always create new Room với `quickMatch=true`, `hostPlaysGame=true`, config từ body. Nếu source=AI: pre-generate inline qua QP-3 service, save JSON vào `aiQuestionsPayload`. Increment daily counter. Return RoomDetailsDTO.
  - Errors: 422 `DAILY_CAP_REACHED`, 422 `AI_TIER_LOCKED`, 422 `ALREADY_IN_ANOTHER_ROOM`.
  - **Spec strategy**: [x] (a) update inline (SPEC_MULTIPLAYER §3.6 + §8)
  - Checklist: endpoint + DTO + service method → commit ~200 LOC

- QP-3 BE: QuickMatchQuestionSourceService
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/modules/room/service/QuickMatchQuestionSourceService.java`, wire vào `RoomQuizService.startQuiz()`
  - `selectQuestions(source, count, book, chapter, verseStart, verseEnd)`: DB path → `QuestionRepository.findRandom...` với filter, mixed difficulty 30/50/20. AI path → `AIProviderRouter.generate(ctx)` → serialize result thành JSON string → return cả 2 dạng `List<Question>` (cho game) + `String json` (cho persistence vào `Room.aiQuestionsPayload`).
  - `RoomQuizService.startQuiz()` update: nếu `room.quickMatch && room.aiQuestionsPayload != null` → deserialize JSON → dùng làm question list, KHÔNG query Question table.
  - **Spec strategy**: [x] (c) `[no-spec-impact]` (internal service)
  - Checklist: service + RoomQuizService wire → commit ~180 LOC

- QP-4 BE: DailyQuickMatchCounter Redis
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/modules/room/service/DailyQuickMatchCounter.java`, expose `remainingToday` qua existing `/api/me/multiplayer-stats` response
  - Redis SETEX key `quickmatch:daily:{userId}:{yyyymmdd}`, INCR on create, TTL until 24h UTC EOD. `hasReachedCap()`, `increment()`, `getRemainingToday()`. Add field `quickMatchRemainingToday` vào `WeeklyMultiplayerStatsDTO`.
  - **Spec strategy**: [x] (a) update inline (SPEC_USER §27.2 response shape)
  - Checklist: counter component + DTO field + MultiplayerStatsService inject → commit ~100 LOC

- QP-5 BE: Start logic any-player + Quản trò controls reject
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` (or wherever `startRoom()` lives), Quản trò endpoint methods in RoomController
  - `startRoom()` branch: nếu `room.quickMatch` → assert user in room, không cần host. Nếu traditional → giữ `assertUserIsHost()`.
  - 5 host endpoints (`/host/pause`, `/host/resume`, `/host/skip`, `/host/broadcast`, `/host/end-early`) thêm guard: nếu `room.quickMatch` → throw 422 `QUICK_MATCH_NO_HOST_CONTROLS`.
  - **Spec strategy**: [x] (a) update inline (SPEC_MULTIPLAYER §2.5 quick-match semantics)
  - Checklist: branch logic + 5 endpoint guards → commit ~80 LOC

- QP-6 FE: Rename SoloArenaEntryCard → QuickMatchEntryCard (opens modal)
  - Status: [x] DONE
  - Files: `apps/web/src/pages/multiplayer/SoloArenaEntryCard.tsx` → rename → `QuickMatchEntryCard.tsx`, update import in `Multiplayer.tsx`
  - Use `git mv` to preserve history. Update copy per mockup v3: rocket icon (`rocket_launch`), "Vào ngay · Không cần host" kicker, "Đấu Nhanh" title, "Server tự điều phối — bạn vào là chơi" copy, 3 tags (Speed Race / 2–10 / Random — thực ra hiển thị "Tùy bạn chọn" vì v2 cho config), quota indicator `{N}/3 trận Đấu Nhanh hôm nay`. Click button → opens `QuickMatchConfigModal` (QP-6.5).
  - Export `QUICK_MATCH_COLORS` from `modeMeta.ts` (move from inline `SOLO` const trong file SoloArenaEntryCard).
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: rename + new copy + modal trigger → commit ~120 LOC

- QP-6.5 FE: QuickMatchConfigModal
  - Status: [x] DONE
  - Files: `apps/web/src/pages/multiplayer/QuickMatchConfigModal.tsx` (new)
  - Modal popup, indigo accent. 5 sections: (1) Mode 4 cards radio (SR/BR/Team/Đấu vương) — reuse `modeMeta` palette · (2) Book scope select (ALL/OT/NT/specific book picker — initial: just ALL/OT/NT/GOSPELS dropdown) · (3) Question count chip group (5/10/15/20) · (4) Time chip group (15/20/30s) · (5) Source toggle (System default · AI sinh — disabled+badge nếu tier < 4). Submit button → `triggerQuickMatch(config)` → navigate `/room/{id}/lobby`. Error toasts cho 3 error codes.
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: modal + form state + submit → commit ~200 LOC

- QP-7 FE: Delete SoloArenaPlaceholder + /solo-arena route
  - Status: [x] DONE
  - Files: delete `apps/web/src/pages/SoloArenaPlaceholder.tsx`, edit `apps/web/src/main.tsx` (remove route + import)
  - Grep `solo-arena|SoloArena` ensure no residual references trong active source (chỉ allow trong docs/archive).
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: file delete + route remove + grep clean → commit < 40 LOC

- QP-8 FE: EmptyRoomsState 2 CTAs (Đấu Nhanh opens modal)
  - Status: [x] DONE
  - Files: `apps/web/src/pages/multiplayer/EmptyState.tsx`
  - Replace 4-mode-grid + Solo soft-link → 2 primary CTAs: Đấu Nhanh (indigo gradient, opens `QuickMatchConfigModal`) + Tạo phòng Quản trò (gold outline, navigate `/room/create`). Per mockup v3 §EmptyState.
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: rewrite CTAs → tests pass → commit ~60 LOC

- QP-9 FE: QuickMatchRoomCard + filter chip
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/multiplayer/QuickMatchRoomCard.tsx` (new), update `Multiplayer.tsx` (filter chip + branch render)
  - Distinct from RoomCard: indigo accent, "Đấu Nhanh" badge top-right, room code title `Phòng #{roomCode}`, kicker shows actual mode + scope (vd "Speed Race · Cựu Ước"), source icon (`cpu` for DB / `auto_awesome` for AI), avatar stack, capacity X/Y, "Vào ngay →" indigo CTA.
  - RoomsSection: filter chip "Đấu Nhanh" first in chip row (indigo). Branch render: `room.quickMatch ? <QuickMatchRoomCard/> : <RoomCard/>`.
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: new component + branch + filter logic → commit ~180 LOC

- QP-10 FE: RoomLobby quick-match variant
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/RoomLobby.tsx`
  - Conditional: nếu `room.quickMatch` → indigo info banner ("Không có Quản trò — bất kỳ ai có thể bấm Bắt đầu khi đủ 2 người") thay Quản trò gold banner. Start button visible to all when readyCount >= 2. Hide host control panel.
  - **Spec strategy**: [x] (a) update inline (SPEC_MULTIPLAYER §7.4 variant table row)
  - Checklist: variant render + spec → commit ~100 LOC

- QP-11 FE: triggerQuickMatch helper + error handler
  - Status: [x] DONE
  - Files: `apps/web/src/api/rooms.ts` (add `triggerQuickMatch(config)` + `handleQuickMatchError`), update `WeeklyMultiplayerStatsDTO` TS type với `quickMatchRemainingToday`
  - POST `/api/rooms/quick-match` body shape match QP-2. Error handler maps codes → friendly VN toasts (already-in-room / daily-cap / tier-lock).
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: helper + types → commit ~80 LOC

- QP-REGRESSION Full test suite + smoke
  - Status: [ ] TODO
  - BE: `mvn compile` clean, no new failures
  - FE: vitest baseline (≥1167 passing), tsc clean, Multiplayer.test.tsx pass
  - Manual smoke checklist: empty state 2 CTAs · click Đấu Nhanh opens modal · submit creates room · Tier 3 user AI option disabled · daily counter decrements · 3rd attempt blocked · indigo banner in lobby · any-player can start
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: smoke clean → commit

### Out of scope (per prompt §0.2)

- TV Host Mode (v1.5)
- AI question batching quality control (separate BL-AI)
- BL-MP-QM-CUSTOM: persistent user preferences for source/count/scope (v2 enhancement)
- Matchmaking with ELO/skill — simple find-or-create only (currently always-create per locked decision)
