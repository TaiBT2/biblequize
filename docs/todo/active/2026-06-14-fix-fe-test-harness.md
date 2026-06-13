# 2026-06-14 — Fix FE Test Harness (vitest không chạy được)

> **Source**: phát hiện khi chuẩn bị redesign Khung Sáng (2026-06-14). **Scope**: tooling test FE — blocker CHUNG của repo (mọi nhánh), KHÔNG riêng redesign.
> **Prefix**: `FTH`. ⚠️ Chặn gate "test trước commit" (CLAUDE.md Tầng 3) cho mọi việc FE.

## Triệu chứng
- `npm test` (vitest) trên nhánh: **toàn bộ 129 file fail** — `Vitest failed to find the runner` / `Cannot read properties of undefined (reading 'config')`.

## Root cause (đã xác minh)
- `apps/web/package.json` khai báo **`vite: ^5.3.1` + `vitest: ^4.1.2`** trên **main + feat/liturgical-coverage + redesign** (giống nhau).
- **vitest 4.x peer = `vite ^6 || ^7 || ^8`** → KHÔNG tương thích vite 5. vitest 4 cần API `vite/module-runner` (chỉ có ở vite ≥6) → `ERR_PACKAGE_PATH_NOT_EXPORTED: './module-runner'`.
- `.npmrc`: `node-linker=hoisted` + `shamefully-hoist=true` → cả workspace bị ép về **1 vite duy nhất** (v5, direct dep của app) → vitest không lấy được vite 6 lồng riêng.
- Baseline `.test-baseline = 1287` (từng pass) ⇒ trước đây hẳn cài kiểu **nested** (npm) cho `apps/web` để vitest 4 có vite 6 riêng. Nhưng `npm install` vướng `@biblequize/shared: workspace:*` (npm không hiểu `workspace:`).

## Đã thử (không cho suite xanh)
| Cách | Kết quả |
|---|---|
| pnpm install lại (hoisted) | runner vẫn gãy (vite 5) |
| Hạ `vitest` → `^3.2.4` (peer vite ^5\|\|^6) | Runner CHẠY nhưng **958/1290 fail**: phần lớn `An update to Root was not wrapped in act(...)` (render async i18n/effect) + vài lỗi event happy-dom. ⇒ harness cần sửa thêm act/i18n, không chỉ version. |
| `--environment jsdom` | jsdom 27 không load (`html-encoding-sniffer`) |

> Đã **revert** mọi thay đổi deps về nguyên trạng (vitest ^4.1.2, lockfile committed).

## Hướng sửa (cần chốt — đụng deps, hỏi user theo CLAUDE.md)
- **(A) Nâng vite 5 → 6** (khớp peer vitest 4) — đúng intent declared, nhưng đụng build/dev toàn FE (plugin-react ^4 ok với vite 6, cần verify config/HMR/SSR-less).
- **(B) Hạ vitest 4 → 3** + sửa test setup (i18n init await + IS_REACT_ACT_ENVIRONMENT / cấu hình testing-library) cho hết act warning → 958 fail về xanh. Tooling-only nhưng công sửa setup lớn.
- **(C) Tách install nested cho `apps/web`** (vitest 4 lấy vite 6 riêng, app giữ vite 5): vd dùng pnpm `overrides`/`packageExtensions` hoặc bỏ `shamefully-hoist` cho test, hoặc dev-container riêng.
- Xác minh: hỏi team **cách thực tế họ cài + chạy FE test** (node version, npm vs pnpm cho apps/web, CI script) để tái lập đúng baseline 1287.

## Tạm thời (cho redesign Khung Sáng đi tiếp)
Verify bằng `npm run type-check` (tsc) + `npm run build` (vite) + chạy app thật `localhost:5173`. Ghi rõ trong commit là test gate bị block bởi FTH.

### Tasks
- FTH-1 Chốt hướng (A/B/C) với user + xác minh cách team chạy test — Status: [ ] TODO
- FTH-2 Triển khai fix đã chốt — Status: [ ] TODO
- FTH-3 Suite về xanh ≥ baseline 1287, cập nhật `.test-baseline` nếu cần — Status: [ ] TODO
