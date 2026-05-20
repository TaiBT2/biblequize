# 2026-05-20 — Fix: per-game score ≠ XP leaderboard (Rank + Daily Challenge)

> **Source**: User report 2026-05-20 — "số điểm tôi chơi được và số điểm cộng vào XP trên leaderboard ko giống nhau". Confirmed via code audit: 2 separate scoring formulas (FE vs BE), no per-question reconciliation.
> **Scope**: Rank flow (`RankedController` + `Quiz.tsx`) + Daily Challenge flow (`DailyChallenge.tsx`).
> **User decision**: Make FE display BE truth (not change economy). Recommended option in both cases.

## Root causes

### Rank
- FE [`Quiz.tsx:394-402`](../../../apps/web/src/pages/Quiz.tsx) computes local `questionScore`: base 10/20/30 (E/M/H) + `floor(timeLeft/2)` + `timeLeft≥25 ? 5 : 0`, × difficulty multiplier (1.0/1.2/1.5).
- BE [`ScoringService.calculateWithTier`](../../../apps/api/src/main/java/com/biblequiz/modules/ranked/service/ScoringService.java) computes: base 8/12/18 + `floor(base × 0.5 × speedRatio²)` + tier multiplier (1.0–2.0) + XP surge ×1.5 + combo (×1.2 at 5-streak, ×1.5 at 10-streak).
- BE [`RankedController` response](../../../apps/api/src/main/java/com/biblequiz/api/RankedController.java) returns `pointsToday` (cumulative) but NOT `earned` per-question → FE has no way to know the BE value → falls back to its own incorrect formula.
- Result: Hard question perfect run = FE shows ~75đ, BE adds 18đ to leaderboard. ~4× discrepancy.

### Daily Challenge
- FE [`DailyChallenge.tsx:365`](../../../apps/web/src/pages/DailyChallenge.tsx) computes `score = correctCount * 20`. 5/5 = 100đ shown.
- BE [`DailyChallengeService.creditCompletionXp:266-284`](../../../apps/api/src/main/java/com/biblequiz/modules/daily/service/DailyChallengeService.java) cộng flat `DAILY_COMPLETION_XP = 50` (nếu `correctCount >= 4`, else 0).
- BE persists `DailyCompletion.score` = FE-sent value (just for history record), nhưng `UserDailyProgress.pointsCounted` (leaderboard source) chỉ +50 flat.
- Result: 5/5 → FE shows 100, leaderboard +50. 3/5 → FE shows 60, leaderboard +0.

### Tasks

- SCORE-FIX-1 BE: thêm `earned` (per-question score) vào RankedController response
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/api/RankedController.java`
  - Add `resp.put("earned", earned);` in the response builder. `earned` đã được compute tại line 282 từ `ScoringService.calculateWithTier`.
  - **Spec impact**: [x] None (additive field, BE-FE contract expansion)
  - **Spec strategy**: [x] (c) [no-spec-impact]

- SCORE-FIX-2 FE Rank: Quiz.tsx dùng `data.earned` thay vì tính local
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Quiz.tsx`
  - Khi `mode === 'ranked'` + có `data.earned` từ response: set `questionScore = data.earned`. Giữ local formula làm fallback cho practice/mystery/speed modes (chưa sync BE scoring).
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

- SCORE-FIX-3 FE Daily: hiển thị 50 XP truth + threshold messaging
  - Status: [x] DONE
  - Files: `apps/web/src/pages/DailyChallenge.tsx` (+ `daily/HeroCard.tsx` nếu cần)
  - Thay `correctCount * 20` cosmetic bằng `dailyResult.xpEarned` (đã có sẵn từ BE response). Thêm hint nếu <4 đúng: "Cần ≥4/5 đúng để nhận 50 XP".
  - **Spec impact**: [x] None (UI truth, BE economy không đổi)
  - **Spec strategy**: [x] (c) [no-spec-impact]
