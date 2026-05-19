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
  - Status: [x] DONE
  - Removed:
    - `apps/web/src/pages/daily/HeroCard.tsx:121-147` (`ReadyRight` function — 140px flame + "Đừng để chuỗi gãy!" + sub-text)
    - `apps/web/src/pages/daily/HeroCard.tsx:53-62` → grid conditional 2-col chỉ cho `state='done'`, ready state = single-col
    - `apps/web/src/pages/daily/HeroCard.tsx:30` (prop `currentStreak`)
    - `apps/web/src/pages/DailyChallenge.tsx:691` (prop forwarding)
    - i18n vi+en: 5 keys orphan dropped (`previewHeadline`, `previewSubStreak`, `streakDaysSpan`, `previewSubTail`, `previewSubFresh`)
  - StreakCard riêng giờ là nguồn streak DUY NHẤT (DC-4 sẽ chỉnh sau)
  - **Spec strategy**: `[no-spec-impact]`

- DC-3 Thu gọn hero + fix "hoàn thành trong —" placeholder
  - Status: [x] DONE
  - Hero structure: badge → title → desc → MetaItem pills → reward box → CTA → "Hôm qua" line — đã đúng từ sau DC-2 (chỉ còn ReadyLeft, single-col).
  - Placeholder fix: `apps/web/src/pages/daily/HeroCard.tsx:110-122` — branch JSX theo `yesterday.timeSeconds > 0`:
    - Có time → render full `yesterdayBody` ("...hoàn thành trong M:SS.")
    - Không có time → render `yesterdayBodyNoTime` mới ("bạn đúng X/Y câu.") — bỏ hẳn mệnh đề "hoàn thành trong"
  - `yesterday?.completed === false` vẫn ẩn toàn bộ dòng (gate sẵn từ trước)
  - i18n: thêm `daily.ready.yesterdayBodyNoTime` cho vi+en
  - **Spec strategy**: `[no-spec-impact]`

- DC-4 Streak card scale + week-strip labels + freeze wording (B: drop "used")
  - Status: [x] DONE
  - Decision: B — drop "used" wording, hiển thị benefit per-tier-only. Reason: BE entity field `User.streakFreezeUsedThisWeek` chỉ là Boolean (không count), expose ra FE sẽ inaccurate cho T3+. Chọn B để giữ BE-zero và tránh nói dối user.
  - Changes:
    - `apps/web/src/pages/daily/StreakCard.tsx:23-25` — scale theo streak: `<7` → flame 36px + number `text-3xl`; `>=7` → flame 56px + number `text-5xl` (giữ celebration cũ)
    - `apps/web/src/pages/daily/StreakCard.tsx:61-70` — week strip: always show `d.label`, bỏ rendering rỗng ('') → 3 trạng thái phân biệt bằng bg/border (gold-solid: hôm nay done · gold-dashed: hôm nay chưa · red-gradient: past done · gray: past chưa)
    - `apps/web/src/pages/daily/StreakCard.tsx:74-82` — freeze block: new key `daily.freezePerWeek` = `{N}× / tuần` thay cho `freezeCount` (used/total)
    - `apps/web/src/pages/DailyChallenge.tsx:233-242` — thêm `tierProgressQuery` reuse `/api/me/tier-progress` (BE-zero)
    - `apps/web/src/pages/DailyChallenge.tsx:301-309` — compute `freezesPerWeek` từ `tierLevel`: T1-2=1, T3-4=2, T5-6=3 per SPEC_USER §3.2.2
  - i18n: `freezeIndicator` đổi label sang "Đóng băng chuỗi" / "Streak freeze", `freezeCount` → `freezePerWeek` ({count}× / tuần)
  - **Spec strategy**: `[no-spec-impact]` (đúng SPEC_USER §14 + §3.2.2)

- DC-5 Leaderboard chỉ hiện State B
  - Status: [x] DONE
  - `apps/web/src/pages/DailyChallenge.tsx:709-735` — branch theo `isCompleted`:
    - `false` (State A): chỉ render `<StreakCard>` full-width, không render `<DailyLeaderboard>` — tránh tín hiệu "Bạn — Chưa làm hôm nay / 0 đ" trước khi user bấm Start
    - `true` (State B): giữ grid `lg:grid-cols-[2fr_1fr]` cho Leaderboard + StreakCard, surface ranking thật làm reward
  - Component `DailyLeaderboard` không xóa, chỉ gate render — query `leaderboardQuery` vẫn chạy (cache có sẵn khi user complete)
  - SPEC_USER §5.3 mô tả BE behavior + endpoints + edge cases, KHÔNG mô tả layout screen
  - **Spec strategy**: `[no-spec-impact]`

- DC-6 Reorder + spacing
  - Status: [x] DONE
  - **Reorder**: thứ tự State A đã đúng target từ sau DC-5: `PageHeader → HeroCard (slim) → StreakCard (full-width) → HeatmapCard (when historyDays.length > 0)`. Không cần reorder gì thêm.
  - **Spacing**: tất cả block dùng `mb-7` (28px) nhất quán — không tight, không quá rộng.
  - **QA visual**: grep `var(--` trên DailyChallenge.tsx + daily/ → 0 hits. Bg + glass + gold đều hardcode hex per constraint #1.
  - **Reframe heatmap stats** ([i18n vi+en line 2222](apps/web/src/i18n/vi.json#L2222)): drop `({{percent}}%)` parenthetical — "3/30 ngày hoàn thành (10%)" → "3/30 ngày hoàn thành". Bỏ % để tránh "grading" feel; ratio raw đủ thông tin, color heatmap riêng đã encode mức độ.
  - **Spec strategy**: `[no-spec-impact]`

- DC-REGRESSION 4-tier test
  - Status: [ ] TODO

## Checklist

- [x] Phase 0 AUDIT approved by Bui
- [x] DC-1 committed
- [ ] DC-2..DC-6 commits
- [ ] DC-REGRESSION pass
