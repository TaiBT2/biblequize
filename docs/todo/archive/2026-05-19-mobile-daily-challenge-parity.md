# 2026-05-19 — Mobile Daily Challenge parity: done-page + season chip + streak heatmap

> **Source**: Audit 2026-05-19 (so sánh mobile vs web Daily Challenge flow) — visual quiz screen đã match sau commit `ad7e430`, nhưng post-completion experience + season/streak context còn lệch xa.
> **Scope**: Mobile chỉ — KHÔNG đụng web. Tạo done-page có accuracy ring + leaderboard + heatmap; thêm season chip vào FeaturedDailyCard; nâng cấp streak display.
> **Related**: [`2026-05-18-fix-daily-challenge-stale-cta.md`](2026-05-18-fix-daily-challenge-stale-cta.md) (gap stale CTA xử lý riêng).

## Gap nguồn (audit 2026-05-19)

1. **No comprehensive done-page** — web `/daily` khi `isCompleted=true` render HeroCard done (SVG accuracy ring) + DailyLeaderboard + StreakCard heatmap + HeatmapCard 30-day. Mobile sau quiz redirect về `QuizResultsScreen` generic (chỉ emoji + 3 stat cards).
2. **Missing liturgical season chip** — web `FeaturedDailyChallenge.tsx:264-268` render `MetaChip tone="season"` khi `seasonQuery.data?.active`. Mobile `FeaturedDailyCard.tsx:88-107` không có.
3. **Streak display nghèo** — web `StreakCard.tsx` có 7-day heatmap + longest streak. Mobile chỉ hiển thị số `currentStreak` từ `/api/me` trên HomeBanner.

### Tasks

- DC-PARITY-M1 Mobile `DailyResultScreen` — tạo screen mới (hoặc branch trong `QuizResultsScreen` khi `mode==='daily'`) hiển thị accuracy ring SVG (gradient stroke), số câu đúng / tổng, time breakdown, bonus XP nếu ≥4 đúng (50 XP), CTA "Xem lại" + "Về Home". Port từ `apps/web/src/pages/daily/HeroCard.tsx` (DoneLeft/DoneRight). Sau quiz `complete()` → navigate sang screen này thay vì generic results.
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/quiz/DailyResultScreen.tsx` (new) hoặc `QuizResultsScreen.tsx` (branch), `apps/mobile/src/navigation/QuizStack.tsx`
  - Test: jest component render snapshot; manual: complete daily mobile → assert screen mới hiện ring + bonus
  - **Spec impact**: [ ] None [x] SPEC_USER §5.3 Daily Challenge (post-completion UX)
  - **Spec strategy**: [ ] (a) update inline [x] (b) new BL-N [ ] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+3 pass · BACKLOG entry · commit

- DC-PARITY-M2 Mobile `DailyLeaderboardCard` — component hiển thị top 10 daily + rank của user (`betterThanPercent`). Endpoint: GET `/api/daily-challenge/leaderboard?language=X` (đã có cho web). Render dưới ring trong `DailyResultScreen`. Port từ `apps/web/src/pages/daily/DailyLeaderboard.tsx`.
  - Status: [x] DONE (endpoint thực tế dùng `/api/leaderboard/daily?size=10` shared với web)
  - Files: `apps/mobile/src/components/daily/DailyLeaderboardCard.tsx` (new), `apps/mobile/src/screens/quiz/DailyResultScreen.tsx`
  - Test: jest render với mock data; manual: assert rank hiện + tô đậm row của user
  - **Spec impact**: [ ] None [x] SPEC_USER §5.3
  - **Spec strategy**: [x] (b) new BL-N (cùng BL với M1)
  - Checklist: impl · Tầng 1+3 pass · commit

- DC-PARITY-M3 Mobile `DailyStreakHeatmap` — 7-day heatmap (rows = ngày, cell tô gold khi completed) + longest streak + freeze count. Port từ `apps/web/src/pages/daily/StreakCard.tsx`. Endpoint: GET `/api/daily-challenge/history?days=7` (sử dụng thay vì `/streak`). Render trong `DailyResultScreen`. HomeScreen integration defer — xem Out of scope dưới.
  - Status: [x] DONE (DailyResultScreen integration). HomeScreen replace defer — conflict với `feedback_mobile_stats_bare_numbers` preference giữ stat-row compact.
  - Files: `apps/mobile/src/components/daily/DailyStreakHeatmap.tsx` (new), `apps/mobile/src/screens/main/HomeScreen.tsx`, `apps/mobile/src/screens/quiz/DailyResultScreen.tsx`
  - Test: jest heatmap render 7 days với mix completed/not; manual: tap về Home thấy heatmap thay vì số
  - **Spec impact**: [ ] None [x] SPEC_USER §14 Streak System
  - **Spec strategy**: [x] (b) new BL-N
  - Checklist: impl · Tầng 1+3 pass · commit

- DC-PARITY-M4 Mobile `FeaturedDailyCard` season chip — thêm conditional `<MetaChip>` (text-only, no ×1.5 label per DECISIONS.md 2026-05-02) dùng `useQuery(['active-season'])`. Match web `FeaturedDailyChallenge.tsx:264-268` styling: icon `auto_awesome` + bg gold-soft. Test với season data mock active=true/false.
  - Status: [x] DONE
  - Files: `apps/mobile/src/components/home/FeaturedDailyCard.tsx`, `apps/mobile/src/hooks/useActiveSeason.ts` (new, hoặc reuse từ shared)
  - Test: jest FeaturedDailyCard render chip khi season.active=true; không khi false
  - **Spec impact**: [x] None (UI parity, no scoring change — bonus vẫn defer per DECISIONS.md)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+3 pass · commit

### Out of scope

- Streak Freeze UI control (web cũng chưa hoàn chỉnh, defer riêng).
- 30-day HeatmapCard (web có, nhưng mobile space-constrained — đợi UX research).
- Push notification streak warning < 2h (BE-driven, không thuộc gap UI).
- HomeScreen replace số streak bằng heatmap (M3) — defer vì conflict UX preference [[feedback_mobile_stats_bare_numbers]]. HomeBanner giữ bare số, heatmap chỉ hiện ở DailyResultScreen.

### Refs

- Web source files để port:
  - `apps/web/src/pages/daily/HeroCard.tsx` — DoneLeft/DoneRight (accuracy ring SVG)
  - `apps/web/src/pages/daily/DailyLeaderboard.tsx`
  - `apps/web/src/pages/daily/StreakCard.tsx`
  - `apps/web/src/components/FeaturedDailyChallenge.tsx:264-268` (season chip)
- Spec: `docs/spec/SPEC_USER_v3.1.md` §5.3 Daily Challenge, §14 Streak System, §5.6 Liturgical Seasons
- Decisions: `DECISIONS.md` 2026-05-02 (season bonus chưa wire, chip chỉ informational)
