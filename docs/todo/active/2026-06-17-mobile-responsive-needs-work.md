# 2026-06-17 — Mobile responsive fixes (Needs-work pages)

> **Source**: [MOBILE_RESPONSIVE_AUDIT.md](../../audit/MOBILE_RESPONSIVE_AUDIT.md) (7-agent audit). User: làm responsive mobile chuẩn/đẹp hơn, bắt đầu nhóm "Needs work".
> **Scope**: web only, mobile viewport ~375px. 1 page = 1 task = 1 commit. Không đụng logic, chỉ layout/responsive.
> **Prefix**: `MRF`.

### Tasks (cheap+sure → structural)
- MRF-1 Home: hero name `whitespace-nowrap` → wrap on mobile. Files: `pages/Home.tsx:~312`
- MRF-2 Review: sticky-header negative margins `-mx-8 md:-mx-14` mis-sized vs AppLayout `px-4 md:px-8` → khớp lại (`-mx-4 md:-mx-8`). Files: `pages/Review.tsx:~100`
- MRF-3 Leaderboard: bỏ double padding (`px-4 md:px-10` thừa) + podium responsive (stack/giảm density mobile) + label ≥ readable. Files: `pages/Leaderboard.tsx`
- MRF-4 GroupDetail: member-table header `hidden sm:grid` + tab nav `overflow-x-auto`. Files: `pages/GroupDetail.tsx:~1029,~858`
- MRF-5 TournamentMatch: VS grid `1fr auto 1fr` → collapse `flex-col` (hoặc grid-cols-1) trên mobile. Files: `pages/TournamentMatch.tsx:~410`
- MRF-6 TournamentDetail: hero 3-cột → `flex-col` mobile + tab `overflow-x-auto` + bracket affordance. Files: `pages/TournamentDetail.tsx:~482,~600,~261`
- MRF-7 Onboarding: slide nav offset + journey visual `px-12/min-h-[700px]` density mobile. Files: `pages/Onboarding.tsx:~148,~320`
- MRF-8 DailyChallenge: immersive `min-h-screen` lồng AppLayout → bỏ double main + dock clear `MobileBottomTabs`. Files: `pages/DailyChallenge.tsx:~475,~571` (structural — cẩn thận, không đụng gameplay logic)
  - Status mỗi task: [ ] TODO · Test: vitest page test nếu có + build + Tầng 3 cuối
  - **Spec impact**: [x] None (visual/responsive) · **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist mỗi task: impl · build pass · commit (EN) · cuối nhóm: Tầng 3 + push
