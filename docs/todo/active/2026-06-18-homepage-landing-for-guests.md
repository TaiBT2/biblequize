# 2026-06-18 — Homepage `/` shows rich LandingPage for guests (+ prerender)

> **Source**: User phát hiện `/` cho khách/crawler render Onboarding (thin "Choose language") → vấn đề SEO lớn nhất. Chọn A.
> **Scope**: `apps/web` routing + prerender + nginx. main.tsx là file NHẠY CẢM → Tầng 3 bắt buộc.

Bối cảnh: `HomeOrLanding` gate khách mới → `<Onboarding/>` (chọn ngôn ngữ, ~0 keyword). Googlebot fresh
(không localStorage) luôn thấy màn này → trang chủ rỗng chữ. `GuestRouting.test.tsx` đã document intent
đúng (guest → LandingPage, không gate) — main.tsx đã lệch.

### Tasks

- HLG-1 main.tsx: bỏ onboarding gate → khách thấy LandingPage giàu chữ tại `/`
  - Status: [x] DONE · Files: `src/main.tsx` (HomeOrLanding + bỏ import useOnboardingStore)
  - Ngôn ngữ: i18n auto-detect navigator + `QuizLanguageSelect` có sẵn trên landing header. `/onboarding` route giữ.
  - checkAuth fast-path cho khách (không userName → isLoading=false ngay) → không treo.
  - **Spec impact**: [ ] None — user-facing flow change (khách không bị ép onboarding). Cân nhắc BL/SPEC?
  - **Spec strategy**: [x] (c) [no-spec-impact] (sửa lệch khỏi intent đã test; onboarding vẫn reachable)

- HLG-2 Prerender `/` → `dist/home.html` + nginx `location = /`
  - Status: [x] DONE · Files: `scripts/prerender.mjs` (root route → home.html), `infra/docker/nginx.conf`
  - Giữ `dist/index.html` shell sạch cho fallback; chỉ exact `/` serve home.html.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

### Note
- Authed user direct-load `/`: thấy thoáng landing (home.html) trước khi JS → dashboard. Tradeoff chấp nhận (đa số authed nav trong app).
- Deploy lại FE image (worktree sạch).
