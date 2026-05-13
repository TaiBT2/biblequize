# 2026-04-19 — Remove duplicate top-nav + sidebar-nav [DONE]

### Task NAV-1: Remove top nav items (AppLayout)
- Status: [x] DONE
- Vấn đề: header + sidebar cùng render 4 items (Trang chủ/Xếp hạng/Nhóm/Cá nhân)
- Fix: Xóa `<nav>` block trong header. Header còn lại: logo (trái) + icons + user menu (phải). Sidebar làm primary nav (desktop). Bottom nav (mobile) không đổi.
- Regression test: `does NOT duplicate nav links between header and sidebar` — check mỗi route render ≤ 2 Links trong DOM (sidebar + mobile bottom nav)
- Commit: "refactor(layout): remove top-nav items, sidebar is sole desktop nav"
