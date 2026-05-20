# 2026-05-20 — Home Daily card: drop MotivationCard + redesign FeaturedDailyCard

> **Source**: user feedback (screenshot review 2026-05-20). 2 bước:
> 1. Bỏ MotivationCard "Bước 1" (duplicate CTA với FeaturedDailyCard).
> 2. Redesign FeaturedDailyCard theo mẫu mới: date badge, "Lời Chúa" emphasis, pill chips, reward block "+50 XP", CTA "Bắt đầu".
> **Scope**: web Home.tsx + apps/web/src/components/FeaturedDailyCard.tsx + mobile HomeScreen.tsx + apps/mobile/src/components/home/FeaturedDailyCard.tsx + 2 test files.

### Tasks

- HOME-DEDUPE-1 Web: bỏ render + import MotivationCard + dead gate vars
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Home.tsx`
  - Test: `apps/web/src/pages/__tests__/Home.test.tsx` 26/26 pass
  - **Spec impact**: [x] None (UX adjustment)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

- HOME-DEDUPE-2 Mobile: bỏ render + import MotivationCard + dead gate vars
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/main/HomeScreen.tsx`
  - Test: mobile tsc clean
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

- DC-REDESIGN-1 Web: redesign FeaturedDailyCard (date badge, "Lời Chúa" emphasis, pill chips, reward block, CTA "Bắt đầu")
  - Status: [x] DONE
  - Files: `apps/web/src/components/FeaturedDailyCard.tsx` + test
  - Test: update FeaturedDailyCard.test.tsx (drop dots/participants assertions, add reward block + date label assertions)
  - **Spec impact**: [x] None (visual-only)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

- DC-REDESIGN-2 Mobile: mirror redesign
  - Status: [x] DONE
  - Files: `apps/mobile/src/components/home/FeaturedDailyCard.tsx`
  - Test: mobile tsc clean
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

### Out of scope (defer)

- Bỏ duplicate "5 câu · 3 phút" subline ↔ meta row → defer
- Bỏ row ○○○○○ dots → defer
- Bước 1/N progress → defer (cần biết tổng số bước onboarding thực tế)
