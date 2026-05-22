# 2026-05-23 — E2E tests cho Đấu Nhanh (Quick Match) — 4 modes

> **Source**: User audit 2026-05-23 — feature shipped từ 2026-05-15 (`PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT.md`) nhưng E2E Test Gate gap: 0 test case.
> **Scope**: Bộ Playwright e2e + spec docs cho Quick Match, cover cả 4 modes (SPEED_RACE, BATTLE_ROYALE, TEAM_VS_TEAM, SUDDEN_DEATH). Decision (user 2026-05-23): tách file riêng cho mỗi mode (Option B).
> **Status**: TODO

### Sub-task layout (option B — separate files per mode)

```
apps/web/tests/e2e/
├── smoke/web-user/
│   └── W-M06-quickmatch.spec.ts                       (QM-1)
└── happy-path/web-user/
    ├── W-M06-quickmatch.spec.ts                       (QM-2 — general: modal, daily cap, AI gating, errors)
    ├── W-M06-quickmatch-speed-race.spec.ts            (QM-3)
    ├── W-M06-quickmatch-battle-royale.spec.ts         (QM-4)
    ├── W-M06-quickmatch-team-vs-team.spec.ts          (QM-5)
    └── W-M06-quickmatch-sudden-death.spec.ts          (QM-6)

tests/e2e/playwright/specs/
├── smoke/W-M06-quickmatch.md                          (QM-1)
└── happy-path/
    ├── W-M06-quickmatch.md                            (QM-2)
    └── W-M06-quickmatch-{4 modes}.md                  (QM-3..6)
```

### Tasks

- QM-0 Verify SUDDEN_DEATH rules + Quick Match canonical contract trong SPEC_MULTIPLAYER
  - Status: `[x]` DONE — findings ở "Rules verified" bên dưới
  - **Spec impact**: `[x]` None (read-only) · **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- QM-1a Add `data-testid` attributes vào QuickMatch components (prerequisite for tests)
  - Status: `[x]` DONE · Files: `QuickMatchEntryCard.tsx`, `QuickMatchConfigModal.tsx`, `QuickMatchRoomCard.tsx`
  - Detail: tests reference selectors mà components chưa có. Thêm testid: `qm-entry-card`, `qm-entry-cta`, `qm-entry-counter`, `qm-modal`, `qm-mode-{SPEED_RACE|BATTLE_ROYALE|TEAM_VS_TEAM|SUDDEN_DEATH}`, `qm-source-database`, `qm-source-ai`, `qm-submit`, `qm-error`.
  - **Spec impact**: `[x]` None · **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- QM-1 Smoke: card render + modal open + 4-mode picker + i18n
  - Status: `[x]` DONE · Files: `apps/web/tests/e2e/smoke/web-user/W-M06-quickmatch.spec.ts`, `tests/e2e/playwright/specs/smoke/W-M06-quickmatch.md`
  - Cover: L1-001 (card render), L1-002 (modal open Esc/backdrop), L1-003 (defaults), L1-004 (i18n EN), L1-005 (modal có đủ 4 mode chips), L1-006 (chọn mode → defaults cập nhật).
  - **Spec impact**: `[x]` None (test-only)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: impl · smoke run pass · commit

- QM-2 Happy-path general: API + UI + errors (mode-agnostic)
  - Status: `[x]` DONE · Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-quickmatch.spec.ts`, `tests/e2e/playwright/specs/happy-path/W-M06-quickmatch.md`
  - Cover: L2-QM-001 (POST DATABASE → 200, quickMatch=true, hostPlaysGame=true), L2-QM-002 (UI flow → lobby, no Quản trò controls), L2-QM-003 (AI Tier <4 lock), L2-QM-004 (AI Tier 4+ happy), L2-QM-005 (DAILY_CAP_REACHED), L2-QM-006 (ALREADY_IN_ANOTHER_ROOM), L2-QM-007 (counter update 0/3 → 1/3), L2-QM-008 (empty-state CTA).
  - **Spec impact**: `[x]` None (test-only)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: impl · happy-path pass · commit

- QM-3 SPEED_RACE mode tests (API + L3 realtime scoring)
  - Status: `[x]` DONE · Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-quickmatch-speed-race.spec.ts`, spec doc
  - Cover: MODE-001 (API → mode=SPEED_RACE, defaults count=15/time=30/max=4), L3-SR-001 (2 players, faster correct → higher score).
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: reuse WS pattern từ `W-M06-survival-50p.spec.ts` · impl · pass · commit

- QM-4 BATTLE_ROYALE mode tests (API + L3 elimination)
  - Status: `[x]` DONE · Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-quickmatch-battle-royale.spec.ts`, spec doc
  - Cover: MODE-002 (API → BATTLE_ROYALE, count=20/time=20/max=8), L3-BR-001 (wrong answer → PLAYER_ELIMINATED event, không nhận QUESTION_START tiếp, last man standing → win).
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- QM-5 TEAM_VS_TEAM mode tests (API + lobby team assignment + L3 team scoring)
  - Status: `[x]` DONE · Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-quickmatch-team-vs-team.spec.ts`, spec doc
  - Cover: MODE-003 (API → TEAM_VS_TEAM, 2 team slots, count=15/time=30/max=8), LOBBY-001 (UI 2 team panels + join team), L3-TVT-001 (team score aggregate, winner = higher total), L3-TVT-002 (TEAM_ASSIGNED broadcast).
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- QM-6 SUDDEN_DEATH mode tests (API + L3 sudden death rule) — **depends QM-0**
  - Status: `[x]` DONE (L2 implemented, L3 deferred — WebSocket infrastructure) (waiting QM-0 rule verification) · Files: `apps/web/tests/e2e/happy-path/web-user/W-M06-quickmatch-sudden-death.spec.ts`, spec doc
  - Cover: MODE-004 (API → SUDDEN_DEATH, count=20/time=15/max=8), L3-SD-001 (rule TBD by QM-0).
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- QM-7 Update pivot doc + spec audit + mode picker visibility
  - Status: `[x]` DONE · Files: `PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT.md` (mark outdated note re: 4-mode expansion), `docs/spec/SPEC_MULTIPLAYER.md` (Quick Match section nếu thiếu 4-mode support)
  - Detail: pivot doc 2026-05-15 nói "Speed Race only" nhưng code đã ship 4 modes — drift. Cập nhật pivot doc với note "EXPANDED 2026-05-XX to 4 modes" hoặc thêm BL-N nếu spec chưa catch up.
  - **Spec impact**: `[x]` SPEC_MULTIPLAYER §3 / §7.1 — depending QM-0 findings
  - **Spec strategy**: `[ ]` (a) update inline `[ ]` (b) new BL-N — quyết định sau QM-0

### Rules verified (QM-0)

**Quick Match endpoint** — `POST /api/rooms/quick-match` ([RoomController.java:132](apps/api/src/main/java/com/biblequiz/api/RoomController.java#L132)):
- Body: `mode`, `bookScope`, `questionCount` (5-20, default 10), `timePerQuestion` (10-60, default 30), `source` (DATABASE/AI_GENERATED), `language` (vi/en), AI extras `chapterFrom/To`, `verseFrom/To`.
- 200 response: `{ success: true, room, viewerUserId, quickMatch: true, remainingToday }`.
- 422 errors: `DAILY_CAP_REACHED` (`remaining: 0`), `AI_TIER_LOCKED` (`currentTier`), `AI_GENERATION_INSUFFICIENT`. `ALREADY_IN_ANOTHER_ROOM` từ create flow chứ không phải QP-2 endpoint.
- Daily cap = 3/user/day reset 0h UTC ([DailyQuickMatchCounter.java](apps/api/src/main/java/com/biblequiz/modules/room/service/DailyQuickMatchCounter.java)).
- Soft-host: `hostPlaysGame=true`, no Quản trò controls (QP-5 rejects).

**Spec gap (sẽ fix ở QM-7)**: `SPEC_MULTIPLAYER.md` chưa document Quick Match endpoint hoặc 4-mode support. Pivot doc 2026-05-15 còn nói "SPEED_RACE only".

**Mode rules** (từ SPEC_MULTIPLAYER §3):

| Mode | Players | Câu | Time | Win condition | Key WS events |
|---|---|---|---|---|---|
| SPEED_RACE | 2–10 | N | per-Q | tổng điểm cao nhất | `ROUND_END`, `QUIZ_END` |
| BATTLE_ROYALE | 3–100 | N | per-Q | last man standing (finalRank=1) | `PLAYER_ELIMINATED`, `BATTLE_ROYALE_UPDATE` (all-wrong = amnesty round) |
| TEAM_VS_TEAM | 4–20 chẵn | N | per-Q | team có tổng cao hơn | `PERFECT_ROUND { teamAPerfect|teamBPerfect }` (+50/player) |
| SUDDEN_DEATH | 3–10 | ∞ (đến còn 1) | per-Q | finalRank=1 (champion cuối) | `MATCH_START`, `MATCH_END`, `SD_QUEUE_UPDATE` |

**SUDDEN_DEATH rule chi tiết** ([SPEC_MULTIPLAYER.md:302-326](docs/spec/SPEC_MULTIPLAYER.md#L302)):
- Queue sort theo `joinedAt`. 2 đầu queue = ACTIVE, còn lại SPECTATOR.
- Mỗi câu: chỉ kết quả của 2 ACTIVE tính.
- Sai-trước-thua (wrong/timeout). Cả 2 đúng / cả 2 sai = hoà → câu kế cùng matchup.
- `CLOSE_THRESHOLD_MS = 200`, `MAX_CONTINUES = 3` tie-break trước khi force loss theo `averageReactionTime`.
- Match end → loser SPECTATOR + finalRank, winner streak += 1, next challenger từ queue.
- Game end khi queue rỗng + còn 1 champion.

**BATTLE_ROYALE all-wrong amnesty** ([SPEC_MULTIPLAYER.md:261](docs/spec/SPEC_MULTIPLAYER.md#L261)): nếu tất cả ACTIVE đều sai 1 câu → không loại ai. Test phải tính tới case này.

**TEAM_VS_TEAM auto-balance** ([RoomService.addPlayerToRoom:249-253](apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java#L249)): join → team nào ít người hơn. `POST /api/rooms/{id}/switch-team` chỉ LOBBY.

### Test priority summary

| Priority | Count | Tasks |
|---|---|---|
| P0 | 11 | QM-1 (L1-001/002/005), QM-2 (L2-001/002/005), QM-3 (MODE-001), QM-4 (MODE-002, L3-BR-001), QM-5 (MODE-003, L3-TVT-001), QM-6 (MODE-004) |
| P1 | 12 | rest of QM-2..6 |
| P2 | 7 | i18n, empty state, lobby hint banners, counter timing |

### Notes
- L3 realtime tests cần ≥2 browser context — pattern có sẵn ở `W-M06-survival-50p.spec.ts`, reuse helper.
- BE: Redis counter `DailyQuickMatchCounter` — test cần reset cơ chế (fresh user mỗi test hoặc seed admin endpoint).
- KHÔNG dùng `page.waitForTimeout()` — dùng `page.waitForResponse`/`waitForEvent('websocket')` (CLAUDE.md cấm).
