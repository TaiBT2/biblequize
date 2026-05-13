# 2026-04-19 — Fix Leaderboard duplicate "Bạn" row [DONE]

### Task LB-1: Hide sticky "Bạn" row khi user ĐÃ trong top-N visible
- Status: [x] DONE
- File(s): apps/web/src/pages/Home.tsx + Home.test.tsx
- Root cause: sticky row hiện vô điều kiện khi `myRank` tồn tại → duplicate khi user đã hiển thị trong leaderboard list chính
- Fix: thêm derived `showMyRankSticky = myRank != null && myRank > leaderboard.length` — chỉ show sticky khi user nằm NGOÀI window top-N đang hiển thị (around-me pattern đúng nghĩa)
- data-testid mới: `home-my-rank-sticky` để test query dễ
- Tests: +2 case (duplicate guard khi user rank 1 trong top-2; positive case khi user rank 85 ngoài top-2)
- Commit: "fix(web): hide sticky 'Bạn' row when user already visible in leaderboard top"
