# 2026-06-18 — Guest-aware AppLayout chrome (public routes)

> **Source**: Bug report — logout xong vào `/leaderboard` (route public, không `RequireAuth`) vẫn thấy full nav đã-đăng-nhập + avatar dropdown giả (default name "Người Học" → initial "N"), khiến tưởng còn login. Đã reproduce: `localStorage`/`cookie` đều rỗng → đúng là guest, lỗi thuần UI.
> **Scope**: `layouts/AppLayout.tsx` + `layouts/components/MobileBottomTabs.tsx` — thêm guest state. KHÔNG đụng auth/session logic (đã đúng).

### Tasks

- GAC-1 AppLayout desktop header guest-aware
  - Status: [x] DONE · Files: `apps/web/src/layouts/AppLayout.tsx`, `apps/web/src/layouts/__tests__/AppLayout.test.tsx` · Test: Vitest
  - Detail: đọc `isAuthenticated` từ store. Guest → nav chỉ giữ link public (Trang chủ + Xếp hạng), ẩn Nhóm/Phòng Chơi/Cá nhân; cụm phải thay `NotificationBell + UserDropdown` bằng nút "Đăng nhập" (→ `/login`). Style dùng token có sẵn (pill `bg-bq-ink`/border), không CSS mới.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+2 pass · `audit.sh` no NEW broken · commit

- GAC-2 MobileBottomTabs guest-aware
  - Status: [x] DONE · Files: `apps/web/src/layouts/components/MobileBottomTabs.tsx` (+ test nếu có) · Test: Vitest
  - Detail: guest → chỉ Home + Leaderboard (ẩn Groups/Profile cần auth). Đọc `isAuthenticated` từ store.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+2 pass · Tầng 3 full regression trước commit cuối · commit
