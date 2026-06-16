# 2026-06-17 — checkAuth: chỉ logout khi refresh 401, không logout khi /api/me lỗi

> **Source**: Điều tra "reload → logout" trên local. Root cause vận hành: backend stale không serve `UserController` → `/api/me` 404. Nhưng FE `checkAuth` coi 404 = session chết → xoá `userName` → logout oan dù refresh đã thành công (session còn hợp lệ).
> **Scope**: chỉ `apps/web/src/store/authStore.ts` (`checkAuth`). KHÔNG đụng module khác.

## Vấn đề

`checkAuth` gộp refresh + `/api/me` trong 1 try/catch; catch xoá session khi `status === 404 || 401`. Nhưng:
- refresh **thành công** = session hợp lệ (BE validate user theo DB; user bị xoá → refresh 401).
- `/api/me` 404/5xx sau đó là sự cố backend/build/transient → **không phải** session chết.

→ Cần tách: **refresh fail (401)** = logout + clear; **/api/me fail** = giữ session, dùng cached profile. refresh network/5xx = giữ cached profile để retry (không clear).

## Tasks

- CKR-1 Tách refresh-failure vs /api/me-failure trong checkAuth
  - Status: [x] DONE
  - Files: `apps/web/src/store/authStore.ts`, `apps/web/src/store/__tests__/authStore.test.ts`
  - Fix: refresh 401 → clear + unauth; refresh transient → keep profile + unauth (no token); refresh OK + /api/me fail → **stay authenticated** với cached profile.
  - Test: (a) refresh OK + /api/me 404 → isAuthenticated=true, userName giữ nguyên; (b) refresh 401 → isAuthenticated=false + userName bị xoá.
  - **Spec impact**: [x] None (robustness, không đổi behavior user-facing khi mọi thứ bình thường)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+2+3 pass · `[no-spec-impact]` tag · commit

## Ghi chú vận hành (ngoài scope code)
Bug gốc local: backend đang chạy không serve route của `UserController` (stale DevTools build) → cần rebuild + restart `apps/api`. Fix CKR-1 chỉ làm SPA bền hơn trước sự cố loại này, KHÔNG thay thế việc restart backend.
