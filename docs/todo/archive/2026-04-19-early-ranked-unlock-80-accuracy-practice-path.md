# 2026-04-19 — Early Ranked unlock (80% accuracy Practice path) [DONE]

### Spec
- User tier 1 chơi Practice ≥ 10 câu, accuracy ≥ 80% → auto-unlock Ranked
- Permanent unlock (không reset)
- Không đổi XP threshold tier 2 (1000 XP) — unlock là flag riêng, orthogonal
- Tournament vẫn giữ tier gate 4 (không bypass)

### Task ER-1: Flyway migration + User entity [x] DONE
- File: `V29__add_early_ranked_unlock.sql`
- Columns: `early_ranked_unlock BOOLEAN`, `practice_correct_count INT`, `practice_total_count INT` (all default 0/false)
- User entity thêm 3 fields + getters/setters

### Task ER-2: SessionService tracking logic [x] DONE
- File: `SessionService.updateEarlyRankedUnlockProgress()` — invoked from submitAnswer
- Short-circuit cho: non-practice / user tier≥2 / đã unlock
- Increment counters + check qua `EarlyRankedUnlockPolicy.shouldUnlock()`
- Policy extracted thành utility class cho testability

### Task ER-3: Ranked gate bypass [x] DONE
- File: `SessionService.createSession()` — check khi mode=ranked
- Reject với IllegalStateException nếu tier<2 + !earlyRankedUnlock

### Task ER-4: Expose flag in /api/me [x] DONE
- File: `UserResponse` DTO — thêm 3 fields matching entity

### Task ER-5: Frontend GameModeGrid consume flag [x] DONE
- File: `GameModeGrid.tsx` — prop `earlyRankedUnlock?: boolean`
- isLocked check: `!bypassByEarlyUnlock` (chỉ Ranked card, không Tournament)
- unlockedRecommendModes: include 'ranked' nếu flag set
- Home.tsx pass `earlyRankedUnlock={meData?.earlyRankedUnlock}`

### Task ER-6: Tests [x] DONE
- BE: `EarlyRankedUnlockPolicyTest` — 6 cases (threshold, boundary, defensive, overflow)
- FE: GameModeGrid.test.tsx +2 cases (flag bypasses Ranked gate; Tournament stays gated)
- Commit: "feat(api): early Ranked unlock via Practice accuracy ≥80%/10Q"
