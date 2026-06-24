# 2026-06-24 — Host (Quản trò) result screen: parity với player view

> **Source**: User — màn result của host Quản trò (RoomQuizHost) chưa optimize như player view.
> **Scope**: FE-only. RoomQuizHost dùng `PodiumBlock` (3 bậc, lệch khi 2 người) + list "Xếp hạng cuối cùng" (lặp). Theme SÁNG.

### Tasks
- HRP-1 HeadToHead light + metric
  - Status: [x] DONE · Files: `components/multiplayer/HeadToHead.tsx` (prop `light`, `metric`, type nới H2HPlayer null-safe để nhận cả FinalRanking)
  - **Spec impact**: [ ] None · **Spec strategy**: [x] (c)
- HRP-2 Wire RoomQuizHost
  - Status: [x] DONE · Files: `pages/room/RoomQuizHost.tsx` (≤2 → HeadToHead light; ẩn list "Xếp hạng cuối cùng" khi ≤2) · Test: existing host tests pass
  - **Spec impact**: [ ] None · **Spec strategy**: [x] (c)

### Notes
- FinalRanking field optional → HeadToHead nới type (H2HPlayer all-optional, null-safe).
- BR: host truyền `metric=brMetric` ("X/Y đúng") để tránh nghịch lý score (DECISIONS 2026-06-12).
- "Thời lượng" host tính từ matchStartedAt (luôn ra chuỗi, không "—") → để nguyên.
