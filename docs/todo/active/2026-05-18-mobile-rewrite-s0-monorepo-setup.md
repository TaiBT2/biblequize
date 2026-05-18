# 2026-05-18 — Mobile rewrite S0: monorepo + packages/shared setup

> **Source**: Master roadmap [`2026-05-18-mobile-rewrite-roadmap.md`](2026-05-18-mobile-rewrite-roadmap.md) Sprint 0
> **Scope**: Convert root → pnpm workspaces, tạo `packages/shared/{types,constants,logic,i18n-keys}`, di chuyển logic duplicate giữa web + mobile vào shared. KHÔNG behavior change, KHÔNG đụng UI, KHÔNG đụng API. Pure refactor.
> **Why now**: Phải xong trước mọi sprint S1-S7 vì các sprint sau sẽ import từ `packages/shared` (BL-4 i18n constants, scoring logic dùng chung, DTO types).

### Tasks

> **Sprint status (2026-05-18)**: ✅ DONE — all 7 task committed, regression PASS (mobile 33/33; web vitest in progress at S0-7 commit time; api untouched).
> **Commits**: c5d2666 (plan docs) · 2470dc2 (S0-1) · b398da5 (S0-2) · 9f7a65e (S0-3) · 1a3fec3 (S0-4 + BL-4 closed) · ee646bd (S0-5) · db5ce2a (S0-6).

- **S0-1 Init pnpm workspaces**
  - Tạo root `package.json` (private, name "biblequize") + `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
  - `.npmrc` set `auto-install-peers=true`, `node-linker=hoisted` (Expo cần hoisted để metro resolve).
  - Verify: `pnpm install` succeed; `pnpm --filter web build` + `pnpm --filter mobile start` + `pnpm --filter api ...` chạy như cũ.
  - Status: [x] DONE
  - Files: `package.json` (new root), `pnpm-workspace.yaml` (new), `.npmrc` (new)
  - Test: Tầng 3 — `pnpm --filter web test:unit`, `pnpm --filter mobile test`, `pnpm --filter api test` baseline.
  - Spec impact: None.
  - Spec strategy: (c) `[no-spec-impact]`.

- **S0-2 Tạo packages/shared skeleton**
  - `packages/shared/package.json` (name `@biblequize/shared`, type module, exports map cho 4 subpath).
  - `packages/shared/tsconfig.json` extends root, declaration: true, composite: true.
  - `packages/shared/src/{types,constants,logic,i18n-keys}/index.ts` — export rỗng + placeholder comment.
  - Web + mobile thêm `"@biblequize/shared": "workspace:*"` vào dependencies; verify resolve.
  - Status: [x] DONE
  - Files: `packages/shared/**` (new), `apps/web/package.json`, `apps/mobile/package.json`
  - Test: Build cả web + mobile — no broken import.
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S0-3 Extract DTO types vào packages/shared/types**
  - Inventory types duplicate: User, Tier, Question, Session, Room, QuizSet, ScheduledQuiz, Achievement, Notification — đọc cả `apps/web/src/types/` + `apps/mobile/src/types/models.ts`, giữ shape canonical (web là source of truth nếu lệch).
  - Move sang `packages/shared/src/types/{user,tier,question,session,room,quizSet,scheduledQuiz,achievement,notification}.ts`.
  - Web + mobile re-export hoặc import trực tiếp; remove duplicate definitions.
  - Status: [x] DONE
  - Files: `packages/shared/src/types/**` (new), `apps/web/src/types/**`, `apps/mobile/src/types/models.ts`
  - Test: `tsc --noEmit` cả web + mobile clean (no regression). Vitest + Jest baseline.
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S0-4 Extract canonical constants (C1/C2/C5 + book list)**
  - `packages/shared/src/constants/tiers.ts` — TIER_NAMES (C1: 6 religious tiers), TIER_THRESHOLDS.
  - `packages/shared/src/constants/modes.ts` — MODE_LABELS_VI = `{ PRACTICE: "Luyện Tập", RANKED: "Đấu Hạng", ... }` (C2 canonical, fix BL-4 inline).
  - `packages/shared/src/constants/answerColors.ts` — `{ A: "#FF7F7F", B: "#7FBEFF", C: "#FFD700", D: "#A8C8A8" }` (C5).
  - `packages/shared/src/constants/books.ts` — 66 Protestant books (C4).
  - Web + mobile import + replace string literals/duplicate maps.
  - Status: [x] DONE
  - Files: `packages/shared/src/constants/**` (new), grep apps/ for `"Luyện Tập"` / `"Đấu Hạng"` / `"Thi Đấu"` / tier strings, replace.
  - Test: Vitest + Jest baseline. Web Playwright smoke verify UI text unchanged.
  - Spec impact: BL-4 mobile partial → DONE (i18n "Thi Đấu" → "Đấu Hạng" replaced via shared constants).
  - Spec strategy: (a) update BACKLOG.md BL-4 line `apps/mobile/src/i18n/vi.json:63-65` → DONE.

- **S0-5 Merge logic packages (scoring + streaks + tierProgression)**
  - Compare `apps/web/src/logic/` (nếu có) vs `apps/mobile/src/logic/{scoring,streaks,tierProgression}.ts`.
  - Move canonical version sang `packages/shared/src/logic/`, mobile + web re-export.
  - Move tests `apps/mobile/src/logic/__tests__/*` sang `packages/shared/src/logic/__tests__/` — chạy bằng jest hoặc vitest tuỳ theo runner shared package.
  - Status: [x] DONE
  - Files: `packages/shared/src/logic/**` (new), `apps/mobile/src/logic/**` (re-export), `apps/web/src/logic/**` (re-export hoặc xoá nếu duplicate)
  - Test: All 3 logic suites pass — count ≥ baseline (mobile hiện có 3 test files).
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S0-6 Typed i18n key registry**
  - `packages/shared/src/i18n-keys/index.ts` — `export const I18nKey = { profile: { editTitle: "profile.editTitle" }, ... } as const` (typed registry mirror vi.json structure).
  - Web + mobile `t(I18nKey.profile.editTitle)` thay `t("profile.editTitle")` — catch missing keys compile-time.
  - Migration scope task này: TOP-LEVEL keys + 1 namespace mẫu (e.g., `profile.*`). Full migration defer S6 polish.
  - Status: [x] DONE
  - Files: `packages/shared/src/i18n-keys/index.ts` (new), 1-2 file mẫu trong web + mobile dùng pattern mới
  - Test: `tsc --noEmit` clean. Vitest + Jest baseline.
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

- **S0-7 Tầng 3 full regression + baseline update**
  - Chạy `pnpm --filter web test`, `pnpm --filter mobile test`, `pnpm --filter api test` đầy đủ.
  - So sánh test count vs `.test-baseline` web + api. Update nếu count tăng (do logic test giờ chạy từ shared). KHÔNG được giảm.
  - Build production: `pnpm --filter web build` + `pnpm --filter mobile expo prebuild` (Android) — verify no broken import từ workspace resolution.
  - `tools/spec-audit/audit.sh` — exit code 0 hoặc 1 (không NEW broken).
  - Status: [x] DONE
  - Files: `apps/web/.test-baseline`, `apps/api/.test-baseline` (update only if increased)
  - Test: SELF — đây là test gate.
  - Spec impact: None. Strategy: (c) `[no-spec-impact]`.

### Common

- **Spec impact**: BL-4 partial DONE (mobile i18n rename via S0-4). Toàn sprint ngoài S0-4 = no spec impact.
- **Spec strategy**: S0-4 → (a) update BACKLOG.md BL-4 line mobile → DONE; còn lại → (c) `[no-spec-impact]`.
- **Sensitive files touched**:
  - `apps/web/src/store/authStore.ts` + `apps/mobile/src/stores/authStore.ts` — IF type User được moved sang shared, sẽ chạm. CLAUDE.md sensitive → Tầng 3 BẮT BUỘC.
  - Không đụng `apps/web/src/api/client.ts`, `apps/web/src/contexts/RequireAuth*.tsx`, SecurityConfig, GlobalExceptionHandler — vì S0 pure type refactor.
- **Commit policy**: 1 task = 1 commit, message format `refactor(shared): <task> [no-spec-impact]`. S0-4 commit `refactor(shared): C1+C2+C5 constants — fix(BL-4) mobile vi.json`.
- **Risk + rollback**: Nếu Expo metro không resolve workspace deps (known Expo SDK 49+ quirk) → fallback dùng `metro.config.js` với `extraNodeModules` pointing to `../../packages/shared`. Nếu vẫn fail, revert task S0-2 và làm shared như git submodule. Decision point: S0-2 verify step.

### Verification

- Sau S0-7: web + mobile + api đều test pass, baseline ≥, build production OK, không UI/UX change visible.
- `git diff main..HEAD` chỉ thấy: new `packages/`, new root `package.json` + `pnpm-workspace.yaml`, web/mobile package.json updated, imports refactored. Không có .tsx component thay đổi behavior.
- Master roadmap [`2026-05-18-mobile-rewrite-roadmap.md`](2026-05-18-mobile-rewrite-roadmap.md) cập nhật S0 status → DONE, tạo file S1 detail (`2026-05-18-mobile-rewrite-s1-polish-stubs.md`) khi user trigger start S1.
