# 2026-06-24 — Result screen: layout head-to-head cho ≤2 người + badge hòa điểm

> **Source**: User feedback — podium 3 bậc bị lệch/trống khi chỉ 2 người; hòa điểm không giải thích; 2 người trông giống nhau.
> **Scope**: FE-only. Thêm component `HeadToHead`, dùng thay `Podium` khi `results.length <= 2`. Không đụng Podium (3+ người).

### Tasks

- RES-1 Component `HeadToHead` (duel ≤2 người)
  - Status: [x] DONE · Files: `components/multiplayer/HeadToHead.tsx` (mới) · Test: HeadToHead.test.tsx
  - Nội dung: winner (vàng + 👑 + glow) · VS · runner-up (bạc); solo nếu 1 người; **avatar màu theo playerId** (phân biệt người); **badge "Hòa điểm"** khi score bằng nhau + hiện "✓ N câu đúng" secondary.
  - **Spec impact**: [ ] None · **Spec strategy**: [x] (c) [no-spec-impact]

- RES-2 Wire vào QuizEndScreen + test
  - Status: [x] DONE · Files: `components/multiplayer/QuizEndScreen.tsx` (≤2 → HeadToHead, else Podium) · Test: QuizEndScreen.test.tsx (2 người → head-to-head; 3 người → podium)
  - **Spec impact**: [ ] None · **Spec strategy**: [x] (c)
  - Checklist: impl · Tầng 3 FE pass · commit

### Notes
- PlayerScore có: score, correctAnswers, accuracy, finalRank. KHÔNG có avatarUrl / reactionTime → avatar màu hash playerId; tie-break secondary = correctAnswers.
- Giữ compact variant (player view nhỏ hơn host view) như Podium.
