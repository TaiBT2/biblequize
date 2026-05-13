# 2026-04-30 — Ranked Page Redesign (Sacred Modernist v2) [IN PROGRESS]

> Source: `docs/prompts/PROMPT_RANKED_REDESIGN.md` + mockup `docs/designs/ranked-redesign-mockup.html`.
> Target file: `apps/web/src/pages/Ranked.tsx`. KHÔNG đụng AppLayout, KHÔNG đổi API, KHÔNG đổi business logic (energy/cap/season).
> Pre-flight verification (2026-04-30):
> - ✅ `/api/me/tier-progress` đã có (UserController.java:435) → cấp đủ data cho R1
> - ✅ `/api/me/ranked-status` đã có (RankedController.java:416) → cấp livesRemaining/questionsCounted/pointsToday/cap/bookProgress/resetAt
> - ✅ `/api/me/journey` đã có (UserController.java:383) → cấp bookMastery cho R4
> - ✅ `currentStreak` đã expose qua `/api/me` (UserResponse.java:32) — KHÔNG cần task BE-EXTEND
> - ⚠️ Backend gaps (handle bằng fallback FE, KHÔNG block redesign):
>   - `dailyAccuracy` → FE compute từ `correctAnswersInCurrentBook / questionsInCurrentBook` nếu có, hoặc render "—"
>   - `dailyDelta` (so với hôm qua) → render placeholder "—" hoặc hide line "↑ +N so với hôm qua"
>   - `pointsToTop50`, `pointsToTop10` → hardcode "60đ"/"200đ" với comment `// TODO: BE-EXTEND-RANKED-STATUS`
>
> Adjustments to original prompt (đã align với user 2026-04-30):
> - **CTA disabled rule**: GIỮ logic hiện tại `livesRemaining > 0 && questionsCounted < cap` (KHÔNG đổi sang "energy < 5"). Sub-text adapt: hết câu → "Đã đạt giới hạn 100 câu/ngày", hết energy → "Hết năng lượng — chờ phục hồi".
> - **Timer format**: GIỮ `HH:MM:SS` (consistent với app), KHÔNG đổi sang `HH h MMm`.
> - **Milestone progress formula** (R5):
>   - `rank > 100` → bar 0%, "▼ Bạn ở đây" trước Top 100
>   - `50 < rank ≤ 100` → bar lerp 0% → 33% theo (100 - rank) / 50
>   - `10 < rank ≤ 50` → bar lerp 33% → 66% theo (50 - rank) / 40
>   - `1 ≤ rank ≤ 10` → bar lerp 66% → 100% theo (10 - rank) / 9
>
> E2E impact: spec `tests/e2e/playwright/specs/{smoke,happy-path}/W-M04-ranked-mode.md` + code `apps/web/tests/e2e/{smoke,happy-path}/web-user/W-M04-ranked.spec.ts`. Data-testid `ranked-user-rank` BỊ BỎ (rank chỉ còn ở Season card R5) → cần cập nhật smoke spec W-M04-L1-002.

### Task R1: Header + Tier Progress Bar [x] DONE 2026-04-30
- Status: [x] DONE
- File(s): `apps/web/src/pages/Ranked.tsx`
- Test: `apps/web/src/pages/__tests__/Ranked.test.tsx`
- API: `GET /api/me/tier-progress` (đã có)
- Checklist:
  - [x] Header redesigned: title + tier badge pill + progress text + 1.5px progress bar
  - [x] Edge case max tier (`nextTier === null`) → "Đã đạt tier cao nhất 👑" + bar 100%
  - [x] Animation `transition-all duration-700 ease-out` on progress bar
  - [x] Preserve data-testid: `ranked-tier-badge`; new testids: `ranked-tier-progress-text`, `ranked-tier-progress-bar`
  - [x] i18n keys added: `ranked.pointsToNext`, `ranked.maxTier` (vi+en)
  - [x] Tier-progress API fetched via new `fetchTierProgress()`; `tierData.totalPoints` is canonical (fixes pre-existing bug where today's points were used for tier calc)
  - [x] Vitest: 4 visual + 5 boundary tests pass (21/21 total in Ranked.test.tsx)
  - [x] Tầng 1 (21/21) + Tầng 2 (461/461) + Tầng 3 FE (989/989) — 0 R1 regressions
  - [x] Tầng 3 BE: pre-existing failures verified on main (QuestionReviewControllerTest + RankedControllerTest ApplicationContext) — 0 R1 regressions
  - [x] Audit baseline: NO existing test asserts tier name from proxy data (e2e W-M04-L2-001 still passes — `setTier(N)` adjusts all-time sum to threshold so post-fix tier resolves identically)
  - [x] Live BE smoke test (boundary): totalPoints ∈ {0, 999, 1000, 4999, 5000} via `seed-points` + `/api/me/tier-progress` — all 5 PASS, server-side tier resolution matches FE expectations
  - [x] Locale fix: `pointsToNext.toLocaleString('vi-VN')` (matches HeroStatSheet.tsx pattern)
  - [x] Commits: `feat: Ranked header with tier progress bar (R1)` + `test: R1 tier boundary cases + vi-VN locale`

### Task R2: Energy + Streak 2-column row [x] DONE 2026-04-30
- Status: [x] DONE
- File(s): `apps/web/src/pages/Ranked.tsx`, `apps/web/src/store/authStore.ts` (extend User), `apps/web/src/i18n/{vi,en}.json`
- Test: `apps/web/src/pages/__tests__/Ranked.test.tsx`
- API: `livesRemaining` từ `/api/me/ranked-status`, `currentStreak` từ `/api/me` (cả 2 đã có)
- Checklist:
  - [x] Layout `grid-cols-12` 7+5 split (Energy 60% / Streak 40%)
  - [x] Energy card: gold number + h-2 progress + "~Z câu" footer left + timer footer right
  - [x] Streak card: orange linear-gradient bg + 🔥 emoji + "N ngày" orange (#fb923c) + adaptive caption
  - [x] R1 polish bundled: nextTier name → gold #e8a832 + font-semibold (locale-agnostic via lastIndexOf split)
  - [x] Removed decorative `bolt` watermark (8xl opacity-10) from Energy card
  - [x] Preserve testids: `ranked-energy-display` (moved to value span), `ranked-energy-timer`, `ranked-reset-timer`; new `ranked-energy-card`
  - [x] AuthStore extended: `User.currentStreak?: number` + `checkAuth()` reads from `meRes.data.currentStreak`
  - [x] i18n keys added: `ranked.questionsLeft`, `streakHeader`, `streakDays`, `streakKeepGoing`, `streakStart` (vi+en)
  - [x] 7 R2 vitest cases pass: energy display, questionsLeft formula, timer format, streak>0 caption, streak=0 caption, no watermark, gold tier name
  - [x] Tầng 1 (28/28) + Tầng 2 (468/468) + Tầng 3 FE (996/996) — 0 R2 regressions
  - [x] Tầng 3 BE: 679 tests, 1 fail + 36 err — IDENTICAL to pre-R2 baseline (pre-existing on main)
  - [x] i18n validator: 121 hardcoded (unchanged), 0 missing keys
  - [x] Commit: `feat: Ranked energy + streak cards + R1 polish (R2)`

### Task R3: 3 Stats Cards (loại bỏ rank duplicate) [x] DONE 2026-04-30
- Status: [x] DONE
- Files: `apps/web/src/pages/Ranked.tsx`, `Ranked.test.tsx`, `i18n/{vi,en}.json`, `tests/e2e/pages/RankedPage.ts`, `smoke/W-M04-ranked.spec.ts`, spec md
- Outcome: 3-card grid (questions / points / accuracy). Card 3 conditional on backend `dailyAccuracy`. Card 2 delta line conditional on non-zero `dailyDelta`. No "75%"/"↑ +0" placeholders. Rank `#N` removed from Today row → exists only in Season card. Trophy + gold-strip watermarks removed. R2 oversight (energy testid scope) bundled in.
- 6 R3 vitest cases pass; spec L1-002 + RankedPage POM + smoke spec MD updated.
- Commit: `d64818f feat: Ranked 3 stats cards, no duplicate rank, watermark cleanup (R3)`

### Task R4: Active Book Card [x] DONE 2026-04-30
- Status: [x] DONE
- Files: `apps/web/src/pages/Ranked.tsx`, `Ranked.test.tsx`, `i18n/{vi,en}.json`
- Outcome: Slim horizontal card — 48×48 gold-tinted icon + "Genesis • Book 2/66 • [MIXED]" inline + sub "Conquering — N%" + 1px gold progress bar + disabled "Change book" button (tooltip explains gap; grep confirmed no Ranked book-selector flow). Investigation confirmed no "water drop" element ever existed and "MIXED" badge was not orphan.
- 5 R4 vitest cases pass; testids preserved.
- Commit: `522ff5c feat: Ranked active book card slim horizontal layout (R4)`

### Task R5: Season Card with Milestones + CTA [x] DONE 2026-04-30
- Status: [x] DONE
- Files: `apps/web/src/pages/Ranked.tsx`, `Ranked.test.tsx`, `i18n/{vi,en}.json`, smoke spec MD + Playwright code
- Outcome:
  - Season card horizontal layout: rank big number left + "{N} đ mùa" sub + progress bar with 4 evenly-spaced milestones (Top 100/50/10/1) on the right; reset countdown badge in header.
  - Milestone lerp formula (rank > 100 → 0%; 50<rank≤100 → 0-33%; 10<rank≤50 → 33-66%; 1≤rank≤10 → 66-100%) implemented with clamp helper. Active milestone slot replaces label with "▼ Bạn ở đây" gold/weight-700.
  - Null daily rank → renders "Chưa xếp hạng" / "Unranked" (instead of legacy "#—"). Smoke spec L1-005 assertion updated to accept either rank pattern or unranked label.
  - CTA 3 states (preserves existing `livesRemaining > 0 && questionsCounted < cap` logic, no new rule):
    - Normal → "Vào Thi Đấu Ngay" + "Continue {book} • ~{Math.floor(energy/5)} questions" sub
    - No energy → "Hết năng lượng" + "Phục hồi sau {time}" (testid `ranked-no-energy-msg` preserved)
    - Cap reached → "Hoàn thành ngày" + "Quay lại sau {time}" (testid `ranked-cap-reached-msg` preserved)
  - Testid dedup: Season card's reset timer renamed to `ranked-season-reset` (Energy card keeps `ranked-reset-timer` for L1-006).
- 10 R5 vitest cases pass (boundary: rank=200/75/30/5/1, null rank, CTA states A/B/C, Vào Thi Đấu rendering).
- **Tầng 4 W-M04 smoke 7/7 pass** (L1-001 → L1-007). Pre-existing L1-005 fail unblocked by R5.
- Commit: `feat: Ranked season + milestones + CTA (R5)`

### Task R6: Final regression + cleanup [x] DONE 2026-04-30
- Status: [x] DONE
- Outcome:
  - Tầng 3 FE: 1017/1017 pass (1007 → 1017 with R5)
  - Tầng 3 BE: 679 / 1 fail / 36 err — IDENTICAL to pre-R1 baseline (all pre-existing on main, verified by stash-and-rerun)
  - Tầng 4 Playwright W-M04 smoke: **7/7 pass** (clean board)
  - i18n validator: 121 hardcoded (unchanged from R1 baseline), 0 missing keys
  - Folded into R5 commit (no separate cleanup commit needed — all updates were inline)

---

**Ranked redesign v2 — final summary**:
- Commits: 5 R-tasks + R1 follow-up = 6 commits (`51017e0` R1, `5ab4f09` R1 boundary tests, `fecb9d9` R2, `d64818f` R3, `522ff5c` R4, R5 commit pending stage)
- Vitest cases added on Ranked.test.tsx: 12 → 49 (+37 total across R1-R5)
- Tầng 3 FE total: ~980 baseline → 1017 with all R-tasks
- Tầng 4 W-M04 smoke: 0/7 (pre-existing infra) → 6/7 (R3) → **7/7 (R5)**
- 0 BE regressions across all 5 R-tasks (R1-R5 are FE-only)

---
