# 2026-06-17 — SEO prerender public routes (#3 follow-up)

> **Source**: SEO audit #3 → user duyệt devDep prerender (jsdom renderer)
> **Scope**: `apps/web` build pipeline. Build-time prerender các route public để social
> crawler (FB/Zalo/Twitter, không chạy JS) đọc được meta + content. KHÔNG đụng module khác.

Quyết định kỹ thuật (từ spike):
- `@prerenderer/prerenderer` + `@prerenderer/renderer-jsdom` (devDeps, build-only, KHÔNG ship client).
- jsdom thay vì puppeteer → không cần Chromium trong Docker node:20-alpine.
- Post-build script (`scripts/prerender.mjs`) chạy sau `vite build`, render từng route **resilient**
  (1 route fail không phá build — exit 0 luôn).
- Routes: `/landing`, `/privacy`, `/terms`, `/help` (+ thử `/daily`). **Bỏ `/`** (nội dung phụ
  thuộc auth/onboarding → không deterministic khi prerender).
- nginx `try_files $uri $uri/ /index.html` tự serve `dist/<route>/index.html`.

### Tasks

- PRE-1 Thêm devDeps `@prerenderer/prerenderer` + `@prerenderer/renderer-jsdom`
  - Status: [x] DONE · Files: `apps/web/package.json`, `pnpm-lock.yaml` · Test: `pnpm install --frozen-lockfile` clean
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- PRE-2 Thêm PageMeta (title/description/canonical) cho PrivacyPolicy + TermsOfService + Help
  - Status: [x] DONE · Files: `pages/PrivacyPolicy.tsx`, `pages/TermsOfService.tsx`, `pages/Help.tsx` · Test: render emits per-page canonical
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- PRE-3 `scripts/prerender.mjs` + wire vào `build` script + verify dist output
  - Status: [ ] TODO · Files: `apps/web/scripts/prerender.mjs` (new), `apps/web/package.json` (build script) · Test: build → dist/landing/index.html chứa rendered meta
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

### Out of scope
- Prerender `/` (auth-dependent) — homepage static meta trong index.html đã đúng.
- Per-page meta cho các route auth-gated (không index, robots disallow).
