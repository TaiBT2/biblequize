# 2026-05-19 — Daily Challenge: Dedupe & Slim Redesign

> **Source**: Bui prompt — "Daily Challenge Screen: Dedupe & Slim Redesign"
> **Scope**: `apps/web/src/pages/DailyChallenge.tsx` + `apps/web/src/pages/daily/*`. Frontend-only.
> **Rollback model**: 1 task = 1 commit. STOP sau mỗi commit chờ Bui xác nhận.

## Phase 0 — AUDIT (DONE)

Findings báo cáo trong session — confirm BE-zero cho DC-1/2/3/5/6. DC-4 freeze-count chọn phương án B (drop "used"), giữ BE-zero.

## Tasks

- DC-1 Gỡ verse khỏi màn Daily Challenge (2 chỗ + props + dead helper)
  - Status: [x] DONE
  - Removed:
    - `apps/web/src/pages/daily/HeroCard.tsx:32-33` (props `verseText` / `verseRef`)
    - `apps/web/src/pages/daily/HeroCard.tsx:123` (destructure)
    - `apps/web/src/pages/daily/HeroCard.tsx:147-158` (verse block trong `ReadyRight`)
    - `apps/web/src/pages/DailyChallenge.tsx:12` (import `DAILY_VERSES`)
    - `apps/web/src/pages/DailyChallenge.tsx:112-117` (helper `pickDailyVerse`)
    - `apps/web/src/pages/DailyChallenge.tsx:273` (`verse` useMemo)
    - `apps/web/src/pages/DailyChallenge.tsx:693-694` (prop forwarding)
    - `apps/web/src/pages/DailyChallenge.tsx:715-725` (standalone verse card)
  - i18n cleanup: `daily.ready.versePreviewLabel` + `daily.verseTitle` removed from vi+en
  - Verse vẫn render trên Home qua `DailyVerseBanner` + `VerseFooter` (constraint #2)
  - **Spec strategy**: `[no-spec-impact]` — đồng bộ `SPEC_USER §17.2` (verse là banner Home, không thuộc Daily Challenge)

- DC-2 Gỡ block streak trùng trong hero
  - Status: [ ] TODO

- DC-3 Thu gọn hero + fix "hoàn thành trong —" placeholder
  - Status: [ ] TODO

- DC-4 Streak card scale + week-strip labels + freeze wording (B: drop "used")
  - Status: [ ] TODO
  - Decision: B — drop "used" wording, hiển thị benefit per-tier-only ("Đóng băng chuỗi: {N}/tuần"). Reason: BE entity field `User.streakFreezeUsedThisWeek` chỉ là Boolean (không count), expose ra FE sẽ inaccurate cho T3+. Chọn B để giữ BE-zero và tránh nói dối user.

- DC-5 Leaderboard chỉ hiện State B
  - Status: [ ] TODO

- DC-6 Reorder + spacing
  - Status: [ ] TODO

- DC-REGRESSION 4-tier test
  - Status: [ ] TODO

## Checklist

- [x] Phase 0 AUDIT approved by Bui
- [x] DC-1 committed
- [ ] DC-2..DC-6 commits
- [ ] DC-REGRESSION pass
