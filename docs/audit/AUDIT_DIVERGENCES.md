# AUDIT_DIVERGENCES.md — Phase 1 Step 1.3

**Generated:** 2026-05-09
**Method:** Cross-check spec sections of `SPEC_USER_v3.md`, `SPEC_ADMIN_v3.md`, `SPEC_GROUP_v1.1.md` against shipped code.
**Convention:** SPEC SAI = spec needs rewrite to canonical. CODE SAI = code needs fix (logged in BACKLOG.md).

---

## SPEC_USER_v3.md

### §3.1 Tier names
- **Spec says:** (per prompt note) Light-themed names — Tia Sáng / Ánh Bình Minh / Ngọn Đèn / Ngọn Lửa / Ngôi Sao / Vinh Quang
- **Code says:** `apps/web/src/data/tiers.ts:40-98` + `i18n/vi.json:2-9` — Tân Tín Hữu / Người Tìm Kiếm / Môn Đồ / Hiền Triết / Tiên Tri / Sứ Đồ
- **Verdict:** **SPEC SAI.** Code matches canonical C1.
- **Action:** Phase 2 — rewrite §3.1 with religious tier names + per-tier XP thresholds (0 / 1k / 5k / 15k / 40k / 100k).

### §3.2.1 Difficulty distribution
- **Need to verify:** `SmartQuestionSelector.java` (or equivalent in `quiz/QuestionService`).
- **Action:** Phase 2 — verify per-tier difficulty mix in code, document table accurately.

### §3.2.2 Rewards multipliers (XP / energy)
- **Need to verify:** `ScoringService.java`, `EnergyService.java`.
- **Action:** Phase 2 — extract numbers from code, table per tier.

### §3.2.3 Game mode unlocks per tier
- **Code reality:** Tier-1 gated via Basic Quiz (V31 `basic_quiz_passed`) before Ranked unlock; Early Ranked Unlock (V29) at ≥80% Practice accuracy bypasses XP gate. Tournaments tier 4+.
- **Action:** Phase 2 — document Basic Quiz gate + Early Ranked Unlock (currently undocumented in spec).

### §4 Scoring + speed bonus + energy
- **Code:** ranked module has `ScoringService`, `EnergyService`. Need to extract formulas.
- **Action:** Phase 2 — read code, document base/speed/streak multipliers.

### §5.1 Practice mode
- **Code:** `Practice.tsx`, `Quiz.tsx`, `SessionController`. Generally aligns with spec.
- **Action:** Phase 2 — light verify.

### §5.4.1–5.4.4 Multiplayer modes
- **Code:** SpeedRaceScoringService, BattleRoyaleEngine, TeamScoringService, SuddenDeathMatchService, SequentialScoringService — all 5 modes shipped (note: 4 originally + GROUP_LIVE_SEQUENTIAL added V39).
- **Spec:** `SPEC_USER_v3_PATCH_5.4.0.md` exists — likely current; needs verification.
- **Action:** Phase 2 — consider extracting Multiplayer to `SPEC_MULTIPLAYER.md`. Document GROUP_LIVE_SEQUENTIAL alongside the 4 original modes.

### §5.4.5 Disconnect/reconnect
- **Code:** `RoomPresenceListener.java` 60s grace + host promotion (R4) + all-disconnect (R5).
- **Action:** Phase 2 — align spec with R1–R5 canonical wording.

### §5.6.5 Seasonal content
- **Spec says:** Christmas (12/1-25) + Easter (T3-4) → ×1.5 XP
- **Code says:** `VarietyQuizController.java:184-212` only Christmas + Easter; controller comment line 24-43 says "no XP, no leaderboard"; ×1.5 bonus dead code
- **Verdict:** **Both spec and code diverge from canonical C3 (4 mùa).**
- **Action:** Phase 2 — document current 2-season + dead bonus state in BACKLOG.md, write spec to canonical (4 seasons + ×1.5).

### §6 Bible Journey Map
- **Code:** `Journey.tsx` + `BibleJourneyCard.tsx` exist. No dedicated `JourneyService.java` — likely derived from `UserBookProgress`.
- **Action:** Phase 2 — verify aggregation source, document.

### §7 Smart Question Selection
- **Code:** `QuestionService.java` likely contains selector logic; check `BookProgressionService`, `UserQuestionService`. No file literally named `SmartQuestionSelector.java`.
- **Action:** Phase 2 — verify implementation, may need to rename spec terminology.

### §8 Sound + haptics
- **Code:** likely `apps/web/src/lib/soundManager.ts`, `apps/web/src/lib/haptics.ts` — verify.
- **Action:** Phase 2 — verify.

### §9.1.4 Group Quiz Set
- **Code:** `GroupQuizSet.java` with `question_ids` JSON ✅ (Q-O).
- **Action:** Phase 2 — light verify.

### §9.6 Friend System
- **Spec says:** v2.5 defer
- **Code:** Challenge entity exists for peer challenges; no Friend entity
- **Verdict:** Spec correctly marks defer. Move to ROADMAP.

### §10 i18n
- **Code:** `vi.json` + `en.json` for web + mobile shipped. Validator exists (`npm run validate:i18n`).
- **Action:** Phase 2 — already documented; verify state.

### §11 Mobile app
- **Code:** apps/mobile rebuilt. Has 5-tab nav. Multiplayer realtime is stub.
- **Action:** Phase 2 — document parity gaps from AUDIT_INVENTORY §14.

### §11.8 Offline mode (Premium v3.0)
- **Spec says:** Pre-cache 50 Q/book + offline practice
- **Code:** `OfflineBanner.tsx` only `navigator.onLine` detection — no service-worker, no cache
- **Verdict:** Spec describes future feature correctly as v3.0. Move to ROADMAP. Not a current divergence.

### §16 WebSocket events
- **Code:** RoomWebSocketController has 8 handlers + topic `/topic/room/{roomId}`. See AUDIT_INVENTORY §4.
- **Action:** Phase 2 — write proper STOMP events table.

### §17 API endpoints
- **Action:** Phase 2 — write authoritative table from AUDIT_INVENTORY §2.

---

## SPEC_ADMIN_v3.md

### §3 User management
- **Code:** AdminUserController has GET/{id}, POST /{id}/ban. Verify scope vs spec.

### §4 Question CRUD
- **Code:** AdminQuestionController POST/PUT.

### §5 Duplicate detection 3-layer
- **Code:** `DuplicateDetectionService` exists in adminai module. Layers (exact / fuzzy / semantic) need extraction.

### §6 AI Question Generator
- **Spec says:** 200/day quota, 3-layer dedup, draft approval workflow
- **Code:** `AIQuestionGenerator.tsx` (admin page) + `AIGenerationService` (backend). Full extent of quota + GenAI integration unclear without deeper read.
- **Action:** Phase 2 — verify quota field in DB/config, AI integration target (Gemini? OpenAI?).

### §7 Review Queue
- **Code:** ReviewQueue admin page + QuestionReviewController. ✅

### §13 Configuration keys
- **Code:** `AdminConfigController` (likely) + `app_config` table assumed; need to grep for ConfigService.
- **Action:** Phase 2 — list actual config keys in use.

### §17 Test Panel (dev/staging)
- **Code:** AdminTestController fully implemented (set-state, refill-energy, set-streak, reset-history, set-mission-state, seed-points). ✅
- **Action:** Phase 2 — document accurately.

---

## SPEC_GROUP_v1.1.md

### Locked Q-A...Q-O
| Decision | Match? | Notes |
|---|---|---|
| Q-A solo NOT in group leaderboard | ⚠️ Partial | Group members scoped ✅; solo-vs-group score distinction ❌ — clarify in spec |
| Q-B sequential manual advance | ✅ | |
| Q-C bỏ dedup live + solo path | ✅ | |
| Q-D Mod role v1 | ✅ | |
| Q-N route /live-quiz → /live-rooms | ✅ BE / ⚠️ FE has no `/live-rooms` SPA route, generic `/rooms` reused | |
| Q-O JSON questionIds | ✅ | |
| Multi-leader v1.5 | ✅ correctly deferred | |

### Inline gap markers Q-E, Q-F, Q-J, Q-K, Q-L, Q-M
- **Action:** Phase 2 — re-read SPEC_GROUP_v1.1.md sections containing these markers and verify against code (Group leaderboard period, kick reasons, live-room cleanup, scheduled quiz attempt limits, etc.).

---

## Cross-cutting CANCELLED status

- **Code:** `Room.java:93` enum value still defined (defensive checks at `RoomPresenceListener.java:140` + RoomService cleanup); no setter call. C7 says CANCELLED is deprecated.
- **Action:** Spec SAI to mention CANCELLED as a state. BACKLOG.md item to remove enum value. Phase 2 spec uses only LOBBY/IN_PROGRESS/ENDED.

---

## Cross-cutting `xpSurge` not consumed

- **Code:** `User.xp_surge_until` (V24) exists; ranked scoring does not consume it (audit 2026-05-01 confirmed dead code). 
- **Verdict:** Half-shipped feature. Spec must either document plan to wire bonus OR remove field.
- **Action:** BACKLOG.md item.

---

## Q-A scoring scope (clarification needed)

`ChurchGroupService.getLeaderboard()` scopes membership but sums **all** `UserDailyProgress` (no source filter). If intent is "only group quiz contributions count," code needs fix. If intent is "all play by group members count," code is right and spec needs clarification.
- **Action:** Phase 2 — ask Bui to lock Q-A interpretation.
