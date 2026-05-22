# W-M06-QM — Đấu Nhanh per-mode specs (4 modes)

Aggregator spec doc cho 4 mode-specific test files. Each mode in 1 Playwright file (Option B per user decision 2026-05-23):

- `apps/web/tests/e2e/happy-path/web-user/W-M06-quickmatch-speed-race.spec.ts`
- `apps/web/tests/e2e/happy-path/web-user/W-M06-quickmatch-battle-royale.spec.ts`
- `apps/web/tests/e2e/happy-path/web-user/W-M06-quickmatch-team-vs-team.spec.ts`
- `apps/web/tests/e2e/happy-path/web-user/W-M06-quickmatch-sudden-death.spec.ts`

**Source task:** `docs/todo/active/2026-05-23-e2e-quickmatch-4modes.md` (QM-3..6)

L3 realtime tests `[DEFERRED — WEBSOCKET INFRASTRUCTURE]` — implement
after shared multi-context helper sẵn (xem `W-M06-survival-50p.spec.ts`).

---

## SPEED_RACE (`W-M06-QM-SR-*`)

**Spec:** SPEC_MULTIPLAYER §3.1 · 2-10 players · score 100 + speed bonus
floor((timeLimit_ms - responseMs) / timeLimit_ms × 50) max 150 ·
WS `ROUND_END`/`QUIZ_END`.

| ID | Priority | Mục đích |
|---|---|---|
| W-M06-QM-SR-001 | P0 | POST → mode=SPEED_RACE, defaults count=15/time=30/max=2-10 |
| W-M06-QM-SR-L3-001 | P1 | 2 players, faster correct → higher score |

---

## BATTLE_ROYALE (`W-M06-QM-BR-*`)

**Spec:** SPEC_MULTIPLAYER §3.2 · 3-100 players (cap raised 2026-05-22) ·
wrong → ELIMINATED + finalRank · all-wrong = amnesty round · WS
`PLAYER_ELIMINATED`/`BATTLE_ROYALE_UPDATE`.

| ID | Priority | Mục đích |
|---|---|---|
| W-M06-QM-BR-001 | P0 | POST → mode=BATTLE_ROYALE, defaults count=20/time=20/max≥3 |
| W-M06-QM-BR-L3-001 | P0 | Wrong answer → PLAYER_ELIMINATED, không nhận QUESTION_START tiếp |
| W-M06-QM-BR-L3-002 | P1 | All-wrong amnesty round — không loại ai |

---

## TEAM_VS_TEAM (`W-M06-QM-TVT-*`)

**Spec:** SPEC_MULTIPLAYER §3.3 · 4-20 even players · auto-balance team
join · POST /switch-team chỉ LOBBY · PERFECT_ROUND +50/player · winner =
team có tổng cao hơn.

| ID | Priority | Mục đích |
|---|---|---|
| W-M06-QM-TVT-001 | P0 | POST → mode=TEAM_VS_TEAM, host auto-assigned team A/B |
| W-M06-QM-TVT-002 | P1 | POST /switch-team trong LOBBY → 200 hoặc validated 400/422 |
| W-M06-QM-TVT-L3-001 | P0 | Team score aggregate → winner = team tổng cao hơn |
| W-M06-QM-TVT-L3-002 | P1 | PERFECT_ROUND broadcast +50 khi cả team đúng |

---

## SUDDEN_DEATH (`W-M06-QM-SD-*`)

**Spec:** SPEC_MULTIPLAYER §3.4 · 3-10 players · queue king-of-the-hill
1v1 · sai-trước-thua · close threshold 200ms · MAX_CONTINUES=3 tie-break
theo averageReactionTime · WS `MATCH_START`/`MATCH_END`/`SD_QUEUE_UPDATE`.

| ID | Priority | Mục đích |
|---|---|---|
| W-M06-QM-SD-001 | P0 | POST → mode=SUDDEN_DEATH, time=15, max 3-10 |
| W-M06-QM-SD-L3-001 | P1 | Queue init: 2 đầu joinedAt = ACTIVE, rest SPECTATOR |
| W-M06-QM-SD-L3-002 | P0 | Sai-trước-thua → MATCH_END, loser SPECTATOR, next challenger |
| W-M06-QM-SD-L3-003 | P1 | Cả 2 đúng/sai → hoà, MAX_CONTINUES tie-break |
| W-M06-QM-SD-L3-004 | P1 | Queue rỗng + 1 champion → game end, champion finalRank=1 |
