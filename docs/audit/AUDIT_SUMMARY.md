# AUDIT_SUMMARY.md — Phase 1 TLDR

**Generated:** 2026-05-09
**Phase 1 status:** ✅ Complete — STOP for Bui review before Phase 2 rewrite.

## Files in this audit
1. [AUDIT_INVENTORY.md](AUDIT_INVENTORY.md) — Backend entities/controllers/services/migrations/seeders + Web pages/components/hooks/stores + Mobile screens/logic/stores/nav
2. [AUDIT_CONSTRAINTS.md](AUDIT_CONSTRAINTS.md) — C1–C9 verification table with file:line evidence
3. [AUDIT_DIVERGENCES.md](AUDIT_DIVERGENCES.md) — SPEC_USER_v3 / SPEC_ADMIN_v3 / SPEC_GROUP_v1.1 sections cross-checked vs code
4. [AUDIT_UNDOCUMENTED.md](AUDIT_UNDOCUMENTED.md) — ~25 features shipped but not in current specs
5. [AUDIT_VAPORWARE.md](AUDIT_VAPORWARE.md) — Spec sections describing features not (or partially) shipped

---

## TLDR — Constraint scoreboard

| C# | Constraint | Status |
|---|---|---|
| C1 | Tier names CŨ (religious) | ✅ Match |
| C2 | "Luyện Tập" / "Thi Đấu Ranked" + Layout Y | ✅ Match (web uses "Leo Rank" — minor wording variance) |
| C3 | 4 Liturgical seasons + ×1.5 bonus | ❌ **Diverged — only 2/4 seasons; bonus dead code** |
| C4 | BTTHĐ 2011 / 66 books / 50/50 VN-EN | ⚠️ 66 books + 50/50 ✅; **Bible version mismatch — code uses BTT 1926** |
| C5 | Answer colors A=Coral B=Sky C=Gold D=Sage | ✅ Match (web + mobile consistent) |
| C6 | Group roles Leader/Mod/Member | ✅ Match |
| C7 | Room lifecycle R1–R5 | ✅ Match (CANCELLED enum unused — cleanup nit) |
| C8 | SPEC_GROUP Q-A...Q-O | ⚠️ Q-A scoring scope unclear; Q-N route mismatch on FE; rest ✅ |
| C9 | Defer features (TV Host, Multi-leader, Seasonal UI, Friend, Premium, Offline) | ✅ Correctly deferred |

---

## Top 5 issues to resolve before Phase 2

1. **C3 — 4 Liturgical seasons (CRITICAL).** Spec promises 4 seasons + ×1.5 score; code ships 2 partial (Christmas, Easter) with bonus as dead code. Decision needed: (a) ship missing seasons + wire bonus before Phase 2, or (b) document current 2-season state and move 4-season target to ROADMAP. **Recommendation: (b) — keep canonical C3 in spec but mark "Currently 2/4 implemented, see BACKLOG.md" so Phase 2 spec is still accurate to canonical and code gap is tracked.**

2. **C4 — Bible version conflict.** Prompt says BTTHĐ 2011 (copyrighted). Code uses BTT 1926 (public domain). Bui must decide: was BTT 1926 chosen deliberately to avoid licensing? If yes, **canonical C4 must be updated to BTT 1926** in Phase 2.

3. **C8 Q-A — Group leaderboard scoring scope.** Code sums all `UserDailyProgress` (solo + group play). Spec says solo NOT in group leaderboard. Two interpretations:
   - (i) "Solo users from outside the group are excluded" — code is correct (group members only).
   - (ii) "Solo session scores by group members are excluded" — code is wrong.
   Bui must lock interpretation.

4. **Q-N FE route.** BE renamed `/live-quiz` → `/live-rooms` ✅. FE has no `/live-rooms` SPA route — group live rooms are listed inline in `GroupDetail.tsx` and join via existing `/room/:roomId/lobby`. Spec should document this (no separate FE route needed) and Q-N can stay locked.

5. **~25 undocumented features.** Daily Mission, Tier Cosmetics, Prestige, Lifeline (HINT), Early Ranked Unlock, Basic Quiz gate, Question Sets, Comeback, Milestone Burst, Mobile Auth, etc. Phase 2 must add these to specs. Most are user-facing.

---

## Phase 2 recommendation

Proceed with the following deliverables (per prompt §Phase 2):

1. `SPEC_USER_v3.1.md` — incorporate canonical C1 tier names; document undocumented features 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 16, 17, 20, 21, 22, 23, 24, 25, 26, 27, 28; cross-reference SPEC_MULTIPLAYER and SPEC_GROUP.
2. `SPEC_MULTIPLAYER.md` (split from SPEC_USER §5.4) — 5 modes (Speed Race, Battle Royale, Team vs Team, Sudden Death, Group Live Sequential) + R1–R5 lifecycle + WebSocket events table.
3. `SPEC_ADMIN_v3.1.md` — verify and document Test Panel, AI Generator (with actual quota/provider), Question Quality, ExportCenter, Notification campaigns, group lock, Early Unlock metrics.
4. `SPEC_GROUP_v1.2.md` — preserve Q-A...Q-O locked decisions (with Q-A clarification); document Scheduled Quizzes, Kick logs, Reports, Group analytics.
5. `SPEC_ROADMAP.md` — Friend (v2.5), Multi-leader (v1.5), TV Host (v1.5), Seasonal UI (v3.0), Premium (v3.0), Offline full (v3.0), missing 2 liturgical seasons (TBD), Sentry (TBD).
6. `BACKLOG.md` — code gaps:
   - C3: ship Pentecost + Thanksgiving + wire ×1.5 bonus
   - C7: drop CANCELLED enum value (defensive only)
   - V24 XP surge: wire bonus into ScoringService
   - Q-A scoring scope: implement chosen interpretation
   - i18n hardcoded count baseline 116 lines (existing)

---

## Bui-locked decisions (2026-05-09)

| # | Decision | Phase 2 action |
|---|---|---|
| **Q1** | **BTTHĐ 2011 canonical** | Spec documents BTTHĐ 2011. Code currently uses BTT 1926 → BACKLOG.md fix item to migrate seed text. |
| **Q2** | **Q-A = group-play-only** | Lock in SPEC_GROUP_v1.2: solo Practice/Ranked/Daily contributions do NOT count toward group leaderboard. Only group-room + scheduled-quiz scores count. → BACKLOG.md fix item: `ChurchGroupService.getLeaderboard()` must filter by source (currently sums all UserDailyProgress). |
| **Q3** | **4/4 mùa canonical** | Spec documents all 4 liturgical seasons (Phục Sinh / Ngũ Tuần / Cảm Tạ / Giáng Sinh) with ×1.5 bonus. → BACKLOG.md: ship Pentecost + Thanksgiving and wire ×1.5 multiplier in ScoringService. |
| **Q4** | **"Luyện Tập" + "Đấu Hạng"** (Vietnamese-only, no English mixing) | Normalize all i18n vi.json keys (web `practice`/`ranked`, mobile equivalents). Remove "Leo Rank" and "Thi Đấu Ranked" variants. → BACKLOG.md fix item for i18n. |
| **Q5** | **Wire XP surge bonus** | Spec documents Milestone Burst feature fully (2h ×1.5 XP after hitting 90% tier progress). → BACKLOG.md: wire `User.xp_surge_until` consumption in ScoringService. |
| **Q6** | **TanStack ✅ shipped, Sentry ❌ not shipped → remove from spec** | TanStack confirmed: web `^5.56.2`, mobile `^5.96.2`, used in 71 web files. Sentry: no `@sentry/*` import, no `sentry-spring-boot` in pom.xml. Remove all Sentry references from specs (or move to ROADMAP if intent is to ship later). |

---

## ✅ Phase 1 complete — ready to proceed to Phase 2

All 6 Bui questions answered. Phase 2 deliverables (per prompt §Phase 2):
1. SPEC_USER_v3.1.md
2. SPEC_MULTIPLAYER.md
3. SPEC_ADMIN_v3.1.md
4. SPEC_GROUP_v1.2.md (with Q-A clarification)
5. SPEC_ROADMAP.md
6. BACKLOG.md (with 5 code-gap items: BTTHĐ 2011 migration, Q-A scoring filter, 2 missing seasons + ×1.5 wire-up, i18n wording normalize, XP surge wire-up; remove Sentry refs)
