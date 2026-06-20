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

- MBT-2 Thu gọn chiều cao bottom tab (user: "thanh bar hơi to")
  - `min-h-[52px]`→`min-h-[44px]`, icon `text-[22px]`→`text-[20px]`. Cập nhật `--mobile-nav-h` base 72→62px cho khớp (nav mới = 44+4+8 = 56px non-notch).
  - Status: [x] DONE · Files: `MobileBottomTabs.tsx`, `styles/global.css` · Test: Tầng 3 FE **1361 pass** + build exit 0
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`

- MBT-3 Cap safe-area padding (bar 96px → ~60px trên máy 3-nút)
  - Chẩn đoán qua DevTools trên S21 thật: bar cao 96.8px do `env(safe-area-inset-bottom)=48px` (thanh 3 nút) bị cộng full vào paddingBottom, dù WebView KHÔNG nằm dưới thanh hệ thống (đo `innerHeight` không gồm vùng nav) → 48px là dải cream trống. Slim min-h trước đó bị 48px này che.
  - Fix: cap inset `max(8px, min(env(safe-area-inset-bottom,0px), 12px))` ở nav paddingBottom + `--mobile-nav-h` base 54. Floor 8px giữ an toàn máy không-inset; cap 12px vẫn đủ cho gesture/notch.
  - Status: [x] DONE · Files: `MobileBottomTabs.tsx`, `styles/global.css` · Test: Tầng 3 FE **1364 pass** + build exit 0
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Verified trên S21 thật: cold-restart (force-stop + reopen, KHÔNG clear cache) → bar vẫn 56.8px (không revert). "Revert" trước đó chỉ do cài đè nhiều bản cùng version 1.0 (WebView giữ cache cũ).

- MBT-4 Fix vĩnh viễn cache stale: WebView tự clearCache mỗi cold start
  - `MainActivity.onCreate` → `getBridge().getWebView().clearCache(true)`. Tránh bản cập nhật sau render bundle cũ (index.html/CSS hashed bị WebView cache giữ qua update). Cold-start-only (không chạy khi resume nền), asset local nên re-read rẻ.
  - Status: [x] DONE · Files: `android/app/src/main/java/org/forbible/app/MainActivity.java` (native, no FE test) · Test: gradle assembleDebug exit 0 + app launch không crash trên S21
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`
