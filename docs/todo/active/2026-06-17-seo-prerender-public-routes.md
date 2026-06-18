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

- PRE-3 `scripts/prerender.mjs` (puppeteer) + `scripts/seo-dedupe.mjs` + unit test
  - Status: [x] DONE · Files: `scripts/prerender.mjs`, `scripts/seo-dedupe.mjs` (new), `src/__tests__/prerender-dedupe.test.ts` (new)
  - jsdom (PRE-1 ban đầu) **không chạy ESM → 0/5**; đổi sang `@prerenderer/renderer-puppeteer` + `puppeteer`
    (executablePath = Playwright chrome local / apk chromium Docker; pnpm bỏ qua postinstall → không tải Chromium).
    Local test: **5/5 routes render** (content + per-page meta). Dedupe content-aware (React 19 hoist tạo
    duplicate title/og + canonical rỗng) + force canonical per-route. Unit test 3/3 pass.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- PRE-4 web.Dockerfile: apk chromium + PRERENDER_CHROMIUM env + RUN prerender sau build
  - Status: [x] DONE · Files: `infra/docker/web.Dockerfile` · Chromium chỉ trong build stage (final nginx image không có)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- PRE-5 Rebuild FE image (clean worktree) + verify prerendered dist + redeploy + verify prod
  - Status: [ ] TODO · Files: deploy only
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

### Out of scope
- Prerender `/` (auth-dependent) — homepage static meta trong index.html đã đúng.
- Per-page meta cho các route auth-gated (không index, robots disallow).
