# 2026-05-02 — Variety Modes Leaderboard Fix (Option A) [DONE]

> Per audit `apps/api/AUDIT_VARIETY_MODES_LEADERBOARD.md` (2026-05-01) + Bui decision 2026-05-02: Practice/Single NEVER grant ranked leaderboard points. Daily Challenge intentionally grants +50 XP (motivation). Variety modes (Mystery/Speed/Weekly/Seasonal/Daily Bonus) are "for fun" — no XP, no leaderboard. Milestone Burst UI disabled until wired.

- [x] Commit 1 (`4f4d614`): Practice/Single never grant pointsCounted (V2 fix)
- [x] Commit 2 (`af2a4e4`): Hardening — allow-list in creditNonRankedProgress (rejects variety modes if FE ever wires sessions)
- [x] Commit 3 (`9da87fe`): Remove xpMultiplier JSON noise from VarietyQuizController (3 endpoints)
- [x] Commit 4 (`54a060e`): TODO comments + disable misleading surgeMultiplier UI

### Future work (out of scope for this sprint)

- [ ] Wire Milestone Burst (Task TP-5): RankedController.submitRankedAnswer must call `scoringService.calculateWithTier(..., xpSurgeActive)` with `xpSurgeActive = user.getXpSurgeUntil() != null && user.getXpSurgeUntil().isAfter(LocalDateTime.now())`. After wiring, re-enable surgeActive/surgeMultiplier in UserController GET /api/me/tier-progress (remove the hardcoded false/1.0 + the regression test that locks it down).
- [ ] Wire ComebackService 2X_XP_DAY / RECOVERY_PACK / STARTER_PACK rewards (currently JSON-only)
- [ ] Wire VarietyQuizController /daily-bonus DOUBLE_XP (decision needed: ranked points / tier XP / both?)
- [ ] If Bui later wants to wire Mystery/Speed/Weekly to scoring: do NOT route through `SessionService.creditNonRankedProgress` (allow-list rejects them) — build a dedicated path with explicit Bui-approved leaderboard policy.
- [ ] Architecture decision (deferred from audit V3): if variety modes should ever grant tier XP without contaminating leaderboard, need schema split (separate `tier_xp` column or `ranked_leaderboard_entry` table).

---
