# 2026-07-11 — Bỏ Tutorial Overlay ở Home (tour giới thiệu tính năng lần đầu)

> **Source**: User request — tour spotlight lần đầu vào Home ("Đã hiểu!") gây confuse user mới, muốn gỡ bỏ. · **Scope**: `apps/web` (Home tutorial only — KHÔNG đụng flow onboarding đăng ký `hasSeenOnboarding`).

### Tasks
- RTO-1 Gỡ TutorialOverlay + dọn store/i18n/test + update spec §18
  - Status: [x] DONE · Files: `pages/Home.tsx`, `components/TutorialOverlay.tsx` (xoá), `components/__tests__/TutorialOverlay.test.tsx` (xoá), `store/onboardingStore.ts`, `store/__tests__/onboardingStore.test.ts`, `pages/__tests__/Home.test.tsx`, `i18n/vi.json`, `i18n/en.json`, `docs/spec/SPEC_USER_v3.1.md` · Test: Vitest onboardingStore + Home
  - **Spec impact**: [x] SPEC_USER §18 Tutorial Overlay
  - **Spec strategy**: [x] (a) update inline — user confirm gỡ feature, spec §18 mark removed + step 5 onboarding flow
  - Checklist: impl · Tầng 1+2+3 pass · spec updated · `audit.sh` no NEW broken · commit
