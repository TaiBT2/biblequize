# 2026-05-22 — Daily Challenge: wire "Hạng toàn cầu" + "Trong nhóm"

> **Source**: User báo 2 ô HẠNG TOÀN CẦU / TRONG NHÓM trong HeroCard (state `done`) luôn hiện "–".
> **Scope**: `DailyChallenge.tsx` + `HeroCard.tsx` (FE web) · `LeaderboardController` / repo (BE). Mobile parity = follow-up riêng.

## Bối cảnh

`HeroCard.tsx:255-256` render `rankGlobal` / `rankGroup` từ `dailyResult`, fallback `'—'` khi `null`.
Hai field này được FE đọc từ payload `GET /api/daily-challenge/result` (`getResultData`) — nhưng
`DailyChallengeService.getResultData` **không bao giờ trả 2 field này** → luôn `null` → UI luôn "–".

Phát hiện: endpoint `GET /api/leaderboard/daily/my-rank` ĐÃ tồn tại và trả `rank` (toàn cầu, theo
`UserDailyProgress.pointsCounted` — cùng nguồn với `/api/leaderboard/daily` mà page đã hiển thị).
→ Global rank chỉ cần wire FE. Group rank cần BE mới.

### Tasks

- DCR-1 Wire "Hạng toàn cầu" từ endpoint có sẵn
  - Status: [x] DONE (impl) — chờ commit (tree đang dirty với WIP task khác) · Files: `apps/web/src/pages/DailyChallenge.tsx` · Test: `DailyChallenge.test.tsx`
  - Detail: thêm `useQuery(['daily-my-rank'])` gọi `GET /api/leaderboard/daily/my-rank`,
    chỉ enabled khi `isCompleted`. Map `rank` → `heroDone.rankGlobal`. Đồng thời dùng cho
    `myEntry.rank` (hiện hardcode `dailyResult.rankGlobal ?? 0` → 0).
  - **Spec impact**: [x] None — surfaces dữ liệu đã có, không đổi business rule
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2 pass · commit

- DCR-2 Bỏ ô "Trong nhóm" khỏi HeroCard (single-col layout)
  - Status: [x] DONE (impl) — chờ commit · Files: `apps/web/src/pages/daily/HeroCard.tsx`, `apps/web/src/pages/DailyChallenge.tsx` · Test: `DailyChallenge.test.tsx`
  - Quyết định (user 2026-05-22): KHÔNG build group-rank backend. Lý do — xếp hạng
    Daily Challenge trong nhóm xung đột spec:
    · Q-A LOCKED (Bui 2026-05-09): group leaderboard = group-play-only, Daily Challenge
      KHÔNG đóng góp (C8).
    · SPEC_GROUP_v1.3 §10: Group Leaderboard DEPRECATED, endpoint sẽ `410 Gone` Sprint 8+.
  - Detail: bỏ `StatMini` rankGroup, grid `grid-cols-2` → `grid-cols-1`, xóa prop
    `rankGroup` khỏi `DoneSummary` + bỏ `rankGroup` khỏi `heroDone`.
  - **Spec impact**: code catch-up — code drift (ô "Trong nhóm") nay khớp lại SPEC_GROUP §10 + Q-A. Không cần sửa spec file.
  - **Spec strategy**: [x] (a) — không edit spec (spec đã canonical), commit `fix:` ghi rõ alignment
  - Checklist: [x] impl · [x] Tầng 1+2 pass · [ ] commit

~~DCR-3 Wire "Trong nhóm"~~ — HỦY (gộp vào DCR-2: ô đã bị bỏ).

### Ghi chú
- Orphan i18n key `daily.done.rankGroup` còn lại trong vi/en.json — vô hại, dọn sau nếu cần.
- Mobile (`DailyResultScreen.tsx`) cũng có ô `rankGroup` tương tự — cần cùng treatment,
  parity ở task riêng.
