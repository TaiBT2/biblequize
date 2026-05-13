# 2026-04-19 — Dual-path progress indicator on locked Ranked card [DONE]

### Task UP-1: Helper `earlyUnlock.ts` — pure functions
- Status: [x] DONE
- `minCorrectNeededForEarlyUnlock(correct, total)` — derived formula max(0, 10-t, 4t-5c)
- `practiceAccuracyPct(correct, total)` — null-safe percentage
- `earlyUnlockProgressPct(correct, total)` — 0-100 for progress bar, caps at 99 until actually qualifying
- Constants mirror backend `EarlyRankedUnlockPolicy` (10 / 80%)
- Tests: 11 cases cover threshold boundary, defensive input, sample-size vs accuracy constraint which-dominates

### Task UP-2: GameModeGrid — dual progress bar
- Status: [x] DONE
- Extended `userStats` prop: `practiceCorrectCount` + `practiceTotalCount` (optional, backward compat)
- Locked Ranked card renders 2 paths:
  - Path 1 (XP): gold progress bar, "Cần thêm X điểm..."
  - Path 2 (Accuracy): green progress bar, "X/Y đúng (Z%) — cần N câu đúng nữa"
- Accuracy path ONLY for Ranked (Tournament etc. still show XP-only)
- "Đủ điều kiện rồi" message when user already qualifies (grace period before backend flips flag)
- Data-testid attrs: `-xp-path`, `-accuracy-path`, `-accuracy-status`, `-accuracy-progress`

### Task UP-3: Home.tsx pass practice counts
- Status: [x] DONE
- Pass `meData.practiceCorrectCount` + `practiceTotalCount` through userStats

### Task UP-4: i18n + tests
- Status: [x] DONE
- Keys: `gameModes.orEarlyUnlock`, `earlyUnlockReady`, `earlyUnlockRemaining` (VI + EN)
- GameModeGrid.test.tsx +4 cases: dual path rendered; Tournament not dual; backward-compat without counts; Ready state
- Commit: "feat(home): dual-path progress indicator on locked Ranked card"
