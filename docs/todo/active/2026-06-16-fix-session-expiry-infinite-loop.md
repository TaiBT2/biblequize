# 2026-06-16 — Fix session-expiry infinite request loop (login chết do rate-limit)

> **Source**: Prod incident `forbible.org/login?error=processing_failed` (16/06). Log API cho thấy `/api/ranked/sync-progress`, `/api/auth/refresh`, `/api/auth/logout` mỗi cái gọi đúng **343 lần/3h** → vòng lặp tự động đốt sạch quota rate-limit 1000/giờ/IP → `/api/auth/exchange` bị 429 → frontend `processing_failed`.
> **Scope**: chỉ frontend web, vùng auth session-expiry. KHÔNG đụng module khác.

## Root cause

Vòng lặp tự nuôi:
1. Request 401 → interceptor [client.ts](../../../apps/web/src/api/client.ts) gọi `/api/auth/refresh` → 401 → `dispatch('auth:session-expired')`.
2. Listener [main.tsx](../../../apps/web/src/main.tsx) → `authStore.logout()`.
3. `logout()` [authStore.ts](../../../apps/web/src/store/authStore.ts) gọi `POST /api/ranked/sync-progress` (cần auth) → 401 → quay lại (1) → vô hạn.

Rate-limiter (429) vô tình chặn loop vì 429 ≠ 401 nên interceptor ngừng retry → dừng ở ~343 vòng.

## Tasks

- SEL-1 Tách handler session-expiry ra module testable + guard chống tái nhập
  - Status: [x] DONE
  - Files: `apps/web/src/auth/sessionExpiry.ts` (new), `apps/web/src/main.tsx` (wire), `apps/web/src/auth/__tests__/sessionExpiry.test.ts` (new)
  - Fix: re-entrancy guard — khi đang xử lý logout thì bỏ qua event `auth:session-expired` lặp lại → phá vòng lặp dù bất kỳ call nào trong `logout()` bị 401.
  - Test: dispatch event 2 lần liên tiếp khi logout đang chạy → `logout()` chỉ chạy 1 lần; expiry mới sau khi settle → chạy lại được.
  - **Spec impact**: [x] None (ngăn runaway loop, không đổi behavior user-facing)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+2+3 pass · `[no-spec-impact]` tag · commit

## Follow-up (out of scope, task riêng)
- Fix B: tách `/api/auth/exchange|refresh|logout` khỏi bucket rate-limit general (defense-in-depth) — user đã chọn, làm sau A.
