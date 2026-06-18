# 2026-06-18 — Bundle: vendor + locale chunk splitting (giảm entry monolith)

> **Source**: User "tiếp tục cải thiện performance cao hơn" — sau lazy-load routes (RCS), entry chunk vẫn 651 kB (gzip 215 kB) vì gộp react-dom + tanstack + i18n + cả 270 kB locale JSON (vi.json 143kB + en.json 127kB).
> **Scope**: `apps/web/vite.config.ts` build config only. KHÔNG đổi logic, KHÔNG thêm dep, KHÔNG đụng i18n init.

### Tasks

- BVC-1 `manualChunks` function: tách react-vendor / router / query / i18n-vendor / locales ra khỏi entry
  - Status: [x] DONE — entry index 651 kB → **125 kB** (gzip 34 kB). Chunks: react-vendor 58kB gz, locales 73kB gz, vendor 37kB gz, i18n 18kB gz, query 12kB gz, router 5kB gz, realtime 6kB gz (lazy, KHÔNG preload). vitest 1319 pass, browser smoke OK (Onboarding render, chunks execute, không lỗi chunk-load). Files: `apps/web/vite.config.ts` · Test: `npm run build` (entry index giảm; xuất hiện chunk locales + react-vendor) + `vitest run` (≥ baseline 1310) + preview smoke
  - Ghi chú: locale JSON vẫn static-import ở i18n init → 'locales' chunk load eager song song (modulepreload), nhưng tách khỏi entry → entry parse nhanh hơn + cache riêng (đổi code không bust locale).
  - **Spec impact**: [x] None — pure build config
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 3 pass · build verify · commit

### Out of scope (đề xuất — cần user duyệt vì rủi ro / quyết định)
- **Locale-dedup: chỉ load 1 ngôn ngữ active** (bỏ ~135 kB ngôn ngữ kia). Đòn bẩy GIẢM BYTES THẬT lớn nhất, nhưng phải đổi i18n init → async (dynamic import) → rủi ro phá ~100 test render đồng bộ. Cần làm cẩn thận + audit test. Hỏi user trước.
- **Brotli/gzip serving** — infra nginx, không phải code.
