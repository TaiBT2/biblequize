# 2026-06-18 — i18n locale-dedup: chỉ load ngôn ngữ active (giảm bytes thật)

> **Source**: Follow-up task BVC "Out of scope" — user yêu cầu "quay lại locale-dedup". Trước đây cả vi.json (143kB) + en.json (127kB) inline vào payload đầu dù user chỉ dùng 1.
> **Scope**: `apps/web` i18n init + render bootstrap. Sensitive files (i18n, main.tsx) → Tầng 3 đầy đủ.

### Tasks

- ILD-1 i18n: dynamic import per-language; chỉ load active (+ fallback vi); lazy-load khi switch
  - Status: [x] DONE · Files: `src/i18n/index.ts` (rewrite), `src/main.tsx` (await `i18nReady` trước render), `src/test/setup.ts` (await `i18nReady`), `vite.config.ts` (bỏ rule gộp `locales` để mỗi lang 1 chunk)
  - Thiết kế: `loaders = { vi: ()=>import('./vi.json'), en: ()=>import('./en.json') }`. Detect lang đồng bộ (localStorage→navigator) → fetch chunk → init. Prod load active+`vi`(fallback); TEST load cả 2 (branch `import.meta.env.MODE==='test'`, tree-shaken khỏi prod). Patch `i18n.changeLanguage`: nếu bundle CHƯA có → load rồi switch; nếu CÓ rồi → gọi native ĐỒNG BỘ (giữ hành vi test/cũ). Không dùng top-level await (es2020 cấm) → promise `i18nReady`.
  - Verify: vitest **1319 pass** (≥ baseline); browser smoke: vi-user chỉ tải `vi` (KHÔNG `en`); en-user tải en+vi; switch → `en` lazy-load on-demand, UI đổi, 0 lỗi CSP/console.
  - Kết quả: vi-user (đa số) **bỏ ~35kB gz** (en chunk) khỏi initial load. vi 38.86kB gz / en 35.28kB gz là 2 chunk riêng, không modulepreload.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`

### Ghi chú trade-off
- Locale chunk giờ fetch sau khi entry JS execute (waterfall 1 round-trip) thay vì preload song song — đổi lại nửa bytes. Net tốt cho mạng chậm (case LCP cao). Preload có hash động → cần plugin (dep) nên bỏ qua.
- en-user load cả vi+en (fallback an toàn cho ~14 missing en keys); chỉ vi-user mới được full saving — chấp nhận vì audience đa số là vi.
