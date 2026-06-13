# 2026-06-14 — KS W9: Auth / Onboarding / Public

> **Source**: [Khung Sáng master plan](2026-06-14-khung-sang-migration-plan.md) · **Scope**: màn ngoài AppLayout (login/onboarding/marketing/legal/404). Cần W0.
> **Prefix**: `KS-W9`. ⚠️ LandingPage = marketing (accepted i18n debt). AuthCallback chỉ spinner.

### Tasks
- KS-W9-1 `/login` Login — Files: `pages/Login.tsx` · nền lightwell, logo phổ, CTA action
- KS-W9-2 `/register` Register — Files: `pages/Register.tsx`
- KS-W9-3 `/auth/callback` AuthCallback — Files: `pages/AuthCallback.tsx` · chỉ spinner Khung Sáng (known issue dynamic import → static, fix-on-touch)
- KS-W9-4 `/onboarding` Onboarding — Files: `pages/Onboarding.tsx`
- KS-W9-5 `/onboarding/try` OnboardingTryQuiz — Files: `pages/OnboardingTryQuiz.tsx` (gameplay → ref W2)
- KS-W9-6 `/landing` LandingPage — Files: `pages/LandingPage.tsx` · hero phổ khúc xạ, sections sáng
- KS-W9-7 `/help` Help — Files: `pages/Help.tsx`
- KS-W9-8 `/privacy` + `/terms` — Files: `pages/PrivacyPolicy.tsx`, `pages/TermsOfService.tsx` · typography paper/ink
- KS-W9-9 `*` NotFound — Files: `pages/NotFound.tsx`
  - Status [ ] TODO · Test: vitest page tests · **Spec impact** [ ] None · **Spec strategy** [ ] (c)
### Checklist: impl · Tầng 1+2+3 · commit (EN)
