# 2026-06-20 — Thêm tab "Phòng Chơi" (Multiplayer) vào bottom nav mobile

> **Source**: User yêu cầu thêm 1 icon "phòng chơi" vào thanh bar dưới (đang 4 icon).
> **Scope**: chỉ `MobileBottomTabs` + test. Route `/multiplayer` đã tồn tại (main.tsx:172), desktop nav đã có mục này (AppLayout navItems, labelKey `gameModes.rooms`).
> **Prefix**: `MBT`.

### Bối cảnh spec
- SPEC_USER_v3.1 §980 / v3.2 §2093: bottom tabs **5 mục: Home / Quiz / Multiplayer / Groups / Profile**. Code web hiện chỉ 4 (Home/Leaderboard/Groups/Profile) → **thiếu Multiplayer**. Thêm tab này là catch-up theo spec.
- Divergence còn lại (spec có Quiz, không Leaderboard; web dùng Leaderboard) là **pre-existing, ngoài scope** — chỉ thêm Multiplayer theo đúng yêu cầu user.

### Tasks
- MBT-1 Thêm tab thứ 5 `/multiplayer` vào `MobileBottomTabs.TABS`
  - labelKey `gameModes.rooms` (= "Phòng Chơi" VI / "Game Rooms" EN — đồng bộ desktop nav), icon `sports_esports`, `auth: true` (ẩn với khách như Groups/Profile). Đặt giữa Groups và Profile → khớp thứ tự desktop (Home/Leaderboard/Groups/Multiplayer/Profile).
  - Cập nhật `MobileBottomTabs.test.tsx`: assert `mobile-tab-multiplayer` hiện khi authed + ẩn với guest.
  - Status: [x] DONE · Files: `layouts/components/MobileBottomTabs.tsx`, `__tests__/MobileBottomTabs.test.tsx`
  - Test: Tầng 3 FE **1361 pass** (≥ baseline 1277) + build exit 0 · 5 tab flex-1, label `whitespace-nowrap`
  - **Spec impact**: [x] SPEC_USER §mobile-nav (5-tab) — thêm Multiplayer đúng intent · **Spec strategy**: [x] (c) `[no-spec-impact]` (code tiến gần spec, không sửa spec; divergence Quiz/Leaderboard ghi nhận pre-existing)
