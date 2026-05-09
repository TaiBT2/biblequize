# AUDIT_VAPORWARE.md — Phase 1 Step 1.5

**Generated:** 2026-05-09
**Method:** Read 3 specs, grep code for evidence of described features. Items below are **described in spec but not (or only partially) shipped**.

---

| # | Spec section | Feature described | Evidence in code? | Verdict | Action |
|---|---|---|---|---|---|
| 1 | SPEC_USER_v3 §3.3 (Seasons) | All 4 liturgical seasons (Phục Sinh / Ngũ Tuần / Cảm Tạ / Giáng Sinh) with leaderboard reset, separate season tier, top-3 badge per tier | Only 2/4 seasons partial (Christmas + Easter in `VarietyQuizController.java:184-212`); generic Season entity exists but not liturgical-tied; ×1.5 bonus dead code | **VAPORWARE** | Move to ROADMAP. Move current 2-season state into spec as "current state". Add BACKLOG item to wire ×1.5 bonus + add Pentecost + Thanksgiving |
| 2 | SPEC_USER_v3 §5.6.5 (Seasonal content) | Christmas (Dec 1-25): Isaiah books filter, ×1.5 XP | Christmas date detected ✅; Isaiah filter NOT verified in `VarietyQuizController.java:205`; ×1.5 XP dead | **PARTIAL VAPORWARE** | Document actual behavior; backlog Isaiah filter + bonus |
| 3 | SPEC_USER_v3 §9.6 (Friend System) | Friend leaderboard, friend list, challenge-friend feature | Challenge entity (peer challenges) exists; **Friend / Friendship entity NOT found** | **PARTIAL VAPORWARE** | Move full Friend System to ROADMAP v2.5. Note that Challenges (peer challenges) are shipped separately. |
| 4 | SPEC_USER_v3 §11.8 (Offline mode v3.0) | Pre-cache 50 Q/book + offline Practice + sync when online | `OfflineBanner.tsx` + `useOnlineStatus.ts` use `navigator.onLine` only; no service-worker, no cache | **VAPORWARE** (correctly marked v3.0 future) | Keep in ROADMAP. Note: OfflineBanner is real; full offline-quiz is not |
| 5 | SPEC_ADMIN_v3 §6 (AI Generator) | 200/day quota, 3-layer duplicate check, draft approval, batch explanations, cost alert | `AIQuestionGenerator.tsx` + `AIGenerationService` exist; quota field NOT verified in DB; GenAI integration target unclear (Gemini/OpenAI?) | **PARTIAL VAPORWARE** | Phase 2 — read AIGenerationService deeply, document actual quota + AI provider; backlog any missing pieces |
| 6 | SPEC_ADMIN_v3 §5 (Duplicate detection 3-layer) | Exact + fuzzy + semantic | `DuplicateDetectionService` exists; layer-by-layer specifics need verify | **PARTIAL** | Phase 2 — verify each layer |
| 7 | SPEC_GROUP §6 (Multi-leader v1.5) | Max 5 leaders, creator privilege, co-leader auto-promote | NOT shipped (single LEADER + MOD only) | **CORRECTLY DEFERRED** to v1.5 | Keep in ROADMAP |
| 8 | TV Host Mode (Kahoot 2-screen) | Mentioned as v1.5 | grep returns 0 hits | **CORRECTLY DEFERRED** | Keep in ROADMAP |
| 9 | SPEC §15.6 Sentry monitoring | `@sentry/react` (FE), `sentry-spring-boot-starter` (BE) | grep "@sentry\|sentry-" → 0 hits | **VAPORWARE** | Phase 2 — note as "configuration-ready, not integrated"; backlog if intent is to ship soon |
| 10 | SPEC §11.2 TanStack Query | "TanStack Query 90% code reuse" | grep "tanstack\|@tanstack\|react-query" → unclear in shipped code | **PARTIAL VAPORWARE** | Phase 2 — verify package.json + usage; clarify spec |
| 11 | SPEC_USER §8 Sound + haptics | Implied from soundManager.ts, haptics.ts mentioned in CLAUDE.md | Not verified in this audit | **NEEDS VERIFY** | Phase 2 — read files, document actual sound/haptic states |
| 12 | Light-themed tier names (per prompt) | Tia Sáng / Vinh Quang / etc | Wrong names — code uses religious tier names canonical | **WRONG SPEC** | Phase 2 — rewrite §3.1 with correct names (per C1) |

---

## Vaporware classification

| Class | Count | Action |
|---|---|---|
| Full vaporware (described, zero impl) | 2 (Sentry, full Offline mode) | ROADMAP or BACKLOG |
| Partial vaporware (described, partial impl) | 5 (4 seasons, Friend system, AI Generator, Dedup 3-layer, TanStack) | Document actual state in spec; missing parts → BACKLOG |
| Correctly deferred | 3 (Multi-leader, TV Host, Offline) | Move to ROADMAP cleanly |
| Wrong spec (canonical mismatch) | 2 (tier names, BTTHĐ 2011 vs BTT 1926) | Rewrite per canonical C1, ask Bui re Bible version |

---

## Recommendations for ROADMAP.md (Phase 2)

The following should appear ONLY in `SPEC_ROADMAP.md`, not current specs:
- Friend System — v2.5
- Multi-leader system — v1.5
- TV Host Mode (Kahoot two-screen) — v1.5
- Seasonal UI theming — v3.0
- Premium tier / Subscription — v3.0
- Offline mode (full PWA) — v3.0
- Pentecost (Ngũ Tuần) + Thanksgiving (Cảm Tạ) seasons — TBD
- Sentry monitoring (if intended to ship) — TBD
