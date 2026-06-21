# 2026-06-16 — Daily Challenge scoring rework (0/20/40/60/100/150)

> **Source**: User feedback — flat +50 XP quá thấp, "lười chơi Daily, thà chơi Ranked". · **Scope**: BE `DailyChallengeService`, FE web `DailyChallenge.tsx`, mobile `DailyResultScreen`, SPEC_USER §5.3, DECISIONS.md.
> **Decision**: DECISIONS.md 2026-06-16 (supersedes 2026-04-20 flat +50).

Bảng XP mới theo số câu đúng: `0 / 20 / 40 / 60 / 100 / 150`. Bỏ ngưỡng ≥4. Gộp về 1 con số hiển thị = XP. XP tính server-side từ `correctCount`.

### Tasks

- DCS-1 BE: scoring lookup + markCompleted/getResultData + unit tests
  - Status: [x] DONE (DailyChallengeServiceTest+ControllerTest 31/31 pass) · Files: `modules/daily/service/DailyChallengeService.java`, `service/DailyChallengeServiceTest.java`, `api/dto/CompleteDailyChallengeRequest.java` (doc) · Test: `DailyChallengeServiceTest`
  - **Spec impact**: [x] SPEC_USER §5.3 (thêm dòng XP) + DECISIONS.md
  - **Spec strategy**: [x] (a) update inline
  - Checklist: impl · Tầng 1+2 (service test) · spec + DECISIONS updated · commit
- DCS-2 FE web: XP lookup optimistic + 1-số display + per-question feedback dọn "+20"
  - Status: [x] DONE (DailyChallenge.test 7/7 pass; tsc no new error; i18n count-neutral) · Files: `pages/DailyChallenge.tsx`, `pages/__tests__/DailyChallenge.test.tsx`, i18n nếu cần · Test: Vitest DailyChallenge
  - **Spec impact**: [x] None (UI khớp decision đã ghi ở DCS-1)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+2 · commit
- DCS-3 Mobile parity: DailyResultScreen fallback xpEarned theo lookup
  - Status: [x] DONE (mobile tsc clean) · Files: `apps/mobile/src/screens/quiz/DailyResultScreen.tsx` · Test: build/tsc
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · tsc · commit
- DCS-4 BACKLOG: server-side verify từng đáp án (chống khai khống correctCount)
  - Status: [x] DONE (BL-22 appended) · Files: `docs/spec/BACKLOG.md` · Test: n/a
  - **Spec strategy**: [x] (b) new BL-N
  - Checklist: append BL-N · commit
- DCS-5 UI copy sweep: teaser "+50 XP" → "+150 XP (tối đa)" toàn bộ daily surfaces (web + mobile)
  - Status: [x] DONE (full Vitest 1279/1279; tsc web+mobile clean) · Files: web `HeroCard.tsx`, `Home.tsx`, `FeaturedDailyCard.tsx`, `FeaturedDailyChallenge.tsx`, i18n vi/en; mobile `FeaturedDailyCard.tsx`, `DailyChallengeScreen.tsx`, i18n vi/en; tests `FeaturedDailyChallenge.test`, `FeaturedDailyCard.test` · Test: Vitest + tsc
  - **Spec impact**: [x] None (copy khớp DECISIONS DCS-1) · **Decision**: teaser = +150 XP max (user chốt 2026-06-16)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: KHÔNG đụng ComebackModal/DailyMissionsCard (+50 feature khác) · impl · Vitest + tsc · commit
