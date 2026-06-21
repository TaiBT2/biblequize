# 2026-06-22 — Ranked scoring rework A+B+C (BL-26)

> **Source**: [DECISIONS.md 2026-06-22 (LOCKED LD1–LD4)](../../DECISIONS.md) · BL-26. · **Scope**: `ScoringService`, `RankedController`, `RankedSessionService.Progress`, FE Quiz/Ranked result, SPEC_USER §4. KHÔNG đụng multiplayer scoring.

### Công thức mới (LOCKED)
```
core        = base(8/12/18) + speedBonus      // speedBonus theo timer THẬT (90s ranked)
speedBonus  = floor(base × 0.5 × speedRatio²),  speedRatio = clamp((TL-elapsed)/TL, 0..1)
situational = min(2.0, 1 + comboBonus + surge(+0.5) + season(+0.3) + comeback(+0.2))
              comboBonus = +0.2 (streak≥5) / +0.35 (≥10)
earned      = round(core × situational × tierMult(1.0..2.0) × (dailyFirst?2:1))
matchBonus  = cuối trận 10 câu: acc≥90% +15%, 75–89% +8%, <75% 0%   (server-recompute)
```

### Tasks
- ABC-1 `ScoringService.calculateRanked(...)` — additive situational + timer param (A1+C+comebackBonus)
  - Status: [x] DONE
  - Files: `ScoringService.java` (+ new method, giữ `calculate`/`calculateWithTier` cũ cho compat), `ScoringServiceTest.java`
  - Test: new cases — timer 90s speed bonus; situational cap 2.0; comeback +0.2; tier nhân riêng; dailyFirst ×2
  - **Spec impact**: [x] SPEC_USER §4 (ABC-7) · **Spec strategy**: [x] (a) inline (ABC-7)
- ABC-2 Wire `RankedController` → `calculateRanked` + daily-first (A2) + comeback (D3) tracking
  - Status: [x] DONE — `RANKED_TIMER_MS=90_000`; `dailyFirst=p.pointsToday==0`; `comeback=p.lastAnswerWrong`; set `lastAnswerWrong=!isCorrect` cuối; Progress +field. RankedControllerTest stubs đổi calculateWithTier→calculateRanked (9 args). Test: 47/51 pass (4 fail `dailyDelta` là **pre-existing**, verified bằng git stash trên controller gốc — không liên quan).
- ABC-3 (gộp vào ABC-1/2) — additive situational đã ở ABC-1; surge/season truyền đúng qua calculateRanked
  - Status: [x] DONE (folded)
- ABC-4 (B) Match-accuracy bonus — endpoint `POST /ranked/sessions/{id}/match-complete` server-recompute + award UDP
  - Status: [x] DONE — Progress +counters (matchTotal/Correct/Earned/matchBonusAwarded), submit cộng dồn, endpoint recompute (≥90% +15%, 75–89% +8%) idempotent + persist UDP + invalidate cache. FE: Quiz.tsx useEffect gọi match-complete khi `isQuizCompleted` (ranked) → `matchBonus` → chip trong RankedQuizResults. Test: BE 5/5 (90/80/<75/idempotent/unknown-session) · FE build + 1386/1386 vitest.
- ABC-5 (D1) Surface sub-tier sao (FE) — **DEFER** (an toàn cho push không giám sát; `TierProgressService` đã sẵn, surface sau)
  - Status: [!] DEFER
- ABC-6 (E) Surface rank Tuần + delta (FE) — **DEFER** (dùng `dailyDelta`/weekly board sẵn có, surface sau)
  - Status: [!] DEFER
- ABC-7 SPEC_USER §4 update inline + close BL-26
  - Status: [x] DONE — SPEC_USER v3.1 + v3.2 §4.2 (timer 90s) + §4.5 (công thức 2-path + accuracy bonus). BACKLOG BL-26 → DONE.
