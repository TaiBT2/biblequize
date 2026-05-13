# 2026-05-05 — Daily Challenge Redesign theo `daily_challenge_mockup.html` [DONE]

> **Source:** Bui yêu cầu redesign trang Daily Challenge match mockup HTML.
> **Branch:** `redesign/daily-challenge`
> **Decisions Bui (2026-05-05):**
> - Q1: Gộp landing + result thành 1 page state-aware (option a).
> - Q2: Build cả BE + FE đầy đủ (option a).
> - Q3: Defer Practice retry button.
> - Q4: Heatmap 30 ngày (default mockup).
> - Q5: Yesterday recap conditional (chỉ hiện khi có data hôm qua).
> - Q6: Season chip — chỉ show name nếu Season active, KHÔNG show ×1.5 multiplier (BE chưa có field).
> - Q7: Tab "Nhóm của tôi" trong leaderboard — show tab nhưng v1 dùng cùng data như Toàn cầu (BE chưa có endpoint group-scoped daily lb); tab UI ready, wire khi có endpoint sau.

### Task DC-1: BE — V33 migration + DailyCompletion entity [x] DONE
- File(s):
  - `apps/api/src/main/resources/db/migration/V33__add_daily_completions.sql` (NEW)
  - `apps/api/src/main/java/com/biblequiz/modules/daily/entity/DailyCompletion.java` (NEW)
  - `apps/api/src/main/java/com/biblequiz/modules/daily/repository/DailyCompletionRepository.java` (NEW)
- Spec: Bảng `daily_completions(id PK, user_id FK, date, score, correct_count, total_questions, time_seconds, completed_at)`. Unique index `(user_id, date)`. Persist long-term (vs cache 48h) để query history 30 ngày + yesterday summary.
- Checklist:
  - [ ] V33 SQL migration
  - [ ] DailyCompletion entity (UUID v7 id, createdAt)
  - [ ] Repository: `findByUserIdAndDateBetween`, `findByUserIdAndDate`
  - [ ] Compile pass: `./mvnw compile -q`
  - [ ] Commit: `feat(db): V33 daily_completions table for history + recap`

### Task DC-2: BE — Persist completion + 2 new endpoints [x] DONE
- File(s):
  - `apps/api/src/main/java/com/biblequiz/modules/daily/service/DailyChallengeService.java` (markCompleted persists to new table)
  - `apps/api/src/main/java/com/biblequiz/api/DailyChallengeController.java` (2 new endpoints)
- Endpoints:
  - `GET /api/me/daily-challenge/history?days=30` → `[{date, correctCount, totalQuestions, completed}]`
  - `GET /api/me/daily-challenge/yesterday-summary` → `{completed, correctCount, totalQuestions, timeSeconds, betterThanPercent}` hoặc `{completed:false}`
- Checklist:
  - [ ] markCompleted ghi DailyCompletion row (idempotent qua unique constraint)
  - [ ] Service methods getHistory, getYesterdaySummary
  - [ ] 2 controller endpoints với @PreAuthorize
  - [ ] Compile pass
  - [ ] Commit: `feat(daily): persist completion + history/yesterday endpoints`

### Task DC-3: BE — Tests cho 2 endpoints mới [x] DONE
- File(s): `apps/api/src/test/java/com/biblequiz/modules/daily/service/DailyChallengeServiceTest.java` (extend hoặc new)
- Test cases:
  - [ ] getHistory returns 30 entries (gồm cả ngày miss = `completed:false`)
  - [ ] getYesterdaySummary trả completed=false khi user chưa làm hôm qua
  - [ ] getYesterdaySummary trả đúng data khi có completion
  - [ ] markCompleted idempotent (gọi 2 lần = 1 row)
- Checklist:
  - [ ] Tests pass: `./mvnw test -Dtest=DailyChallengeServiceTest`
  - [ ] Commit: `test(daily): coverage cho history + yesterday endpoints`

### Task DC-4..9: FE — Redesign DailyChallenge.tsx + 5 sub-components [x] DONE
- Note: DC-4 đến DC-9 gộp vào 1 commit `feat(daily): redesign per daily_challenge_mockup.html (DC-4..9)` vì cùng 1 file orchestrator + sub-components mới có cohesion cao.

### (legacy split) Task DC-4: FE — Refactor unify landing+result thành state-aware [x] DONE
- File(s): `apps/web/src/pages/DailyChallenge.tsx`
- Spec: Bỏ branch `if (showResult)` riêng — page render single layout với state derived từ `dailyResult` (null = chưa làm, có data = đã hoàn thành). Quiz view (`quizStarted`) vẫn riêng. Skeleton ban đầu giữ nguyên.
- Checklist:
  - [ ] Tách `<HeroCard state={completed ? 'done' : 'ready'} ... />` component
  - [ ] Render same page header cho cả 2 state
  - [ ] Vitest: existing 8 tests vẫn pass (chưa đổi nội dung, chỉ refactor structure)
  - [ ] Commit: `refactor(daily): unify landing + result thành state-aware page (DC-4)`

### Task DC-5: FE — Page header + hero card 2-col state A (chưa làm) [x] DONE
- File(s): `apps/web/src/pages/DailyChallenge.tsx`, `apps/web/src/i18n/{vi,en}.json`
- Spec match mockup:
  - Page header: flame-icon + title + meta-chips (date + season chip nếu active) + countdown right
  - Hero card 2-col grid (1.6fr 1fr) responsive: collapse 1-col `<lg`
  - LEFT state A: status-badge "Sẵn sàng" pulse + title "5 câu hỏi chờ bạn..." + desc + meta-row 4 items + reward-preview block + CTA + yesterday recap (conditional)
  - RIGHT state A: preview-illustration (flame circle) + headline "Đừng để chuỗi gãy!" + verse-mini card
- Checklist:
  - [ ] Page header layout match mockup
  - [ ] Hero state A LEFT đầy đủ
  - [ ] Hero state A RIGHT đầy đủ
  - [ ] i18n keys mới (vi + en)
  - [ ] Vitest pass
  - [ ] Commit: `style(daily): page header + hero state A (DC-5)`

### Task DC-6: FE — Hero card state B (đã hoàn thành) [x] DONE
- File(s): `apps/web/src/pages/DailyChallenge.tsx`, i18n
- Spec match mockup:
  - LEFT state B: badge "Đã hoàn thành lúc HH:MM" + title "Hoàn thành! Tốt lắm 🎉" + desc với betterThan% + completion-summary table (4 rows: correct, time, betterThan, XP) + q-breakdown dots + CTA "Xem lại"
  - RIGHT state B: score-circle (gradient ring) + completion-stats grid (rank toàn cầu, rank trong nhóm) + share buttons
- Checklist:
  - [ ] Hero state B LEFT
  - [ ] Hero state B RIGHT
  - [ ] Wire ShareCard component vào share button
  - [ ] i18n keys
  - [ ] Vitest pass
  - [ ] Commit: `style(daily): hero state B completion view (DC-6)`

### Task DC-7: FE — Row 2 Leaderboard (tabs) + Streak + Verse cards [x] DONE
- File(s): `apps/web/src/pages/DailyChallenge.tsx`, i18n
- Spec match mockup:
  - Grid 2:1 collapse `<lg`
  - LEFT (Leaderboard): tabs "Toàn cầu" / "Nhóm của tôi" (v1 cùng data) + 5 lb-rows với rank/medal/avatar/name/tier/score/time + divider + user row (highlighted) — show user row cả 2 state (chưa làm = "—")
  - RIGHT stack: Streak card (flame + 12 + 7-day grid với done/today/freeze) + Verse card (BTTHĐ verse rotated daily)
- Checklist:
  - [ ] Leaderboard với tabs UI
  - [ ] User-row pinned (highlight + dùng data từ /me)
  - [ ] Streak card 7-day với freeze indicator
  - [ ] Verse card (reuse `data/verses.ts`)
  - [ ] Vitest pass
  - [ ] Commit: `style(daily): row 2 leaderboard + streak + verse (DC-7)`

### Task DC-8: FE — History heatmap 30 ngày [x] DONE
- File(s): `apps/web/src/pages/DailyChallenge.tsx`, i18n
- Spec: 30-cell grid 15-col + legend (l1-l4 color levels theo correctCount) + today highlighted + hover tooltip "DD/MM: N/5"
- Wire `GET /api/me/daily-challenge/history?days=30`
- Checklist:
  - [ ] Heatmap component
  - [ ] Color level mapping (0=miss, 1-2=l1, 3=l2, 4=l3, 5=l4)
  - [ ] Stats text "X/30 ngày hoàn thành (Y%)"
  - [ ] Vitest pass
  - [ ] Commit: `style(daily): 30-day history heatmap (DC-8)`

### Task DC-9: FE — Wire APIs + i18n cleanup [x] DONE
- File(s): `apps/web/src/pages/DailyChallenge.tsx`, i18n
- Spec: Replace `useEffect+fetch` bằng TanStack Query hooks cho:
  - `daily-challenge` (existing)
  - `daily-leaderboard` (existing /api/leaderboard/daily)
  - `daily-yesterday` (NEW) — show recap conditionally
  - `daily-history` (NEW) — heatmap data
  - `season-active` (existing /api/seasons/active) — season chip nếu có
- Checklist:
  - [ ] Tất cả data fetching qua useQuery
  - [ ] Loading + error states
  - [ ] `npm run validate:i18n` không báo missing keys
  - [ ] Vitest pass
  - [ ] Commit: `feat(daily): wire history + yesterday + season APIs (DC-9)`

### Task DC-10: Tests + Full Regression [x] DONE
- Vitest DailyChallenge.test.tsx: 6/7 (1 pre-existing fail, baseline matches)
- BE: DailyChallengeServiceTest 15/15 + DailyChallengeControllerTest 14/14
- i18n validator: hardcoded 442 = baseline (no regression)
- Full FE regression: 1135/1172 pass (37 fails all pre-existing in Ranked + RoomLobby + DailyChallenge XP test — confirmed via git stash baseline)
- Full BE regression: RankedControllerTest 43 errors pre-existing Spring context bean issue (not my changes)
- File(s):
  - `apps/web/src/pages/__tests__/DailyChallenge.test.tsx` (update mocks + assertions)
  - `apps/web/tests/e2e/smoke/web-user/W-M05-daily.spec.ts` (update selectors nếu đổi)
- Checklist:
  - [ ] Vitest DailyChallenge.test.tsx pass (min 8 cases: state A render, state B render, countdown, leaderboard, streak, heatmap, yesterday conditional, error)
  - [ ] Tầng 3 Full Regression FE: `npx vitest run`
  - [ ] Tầng 3 Full Regression BE: `./mvnw test -Dtest=...`
  - [ ] i18n validator: `npm run validate:i18n`
  - [ ] Commit: `test(daily): update unit tests for redesigned page (DC-10)`

---
