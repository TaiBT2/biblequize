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

- DCR-2 BE: daily group-rank query + endpoint
  - Status: [ ] TODO · Files: `UserDailyProgressRepository.java`, `LeaderboardController.java` · Test: `LeaderboardControllerTest`
  - Detail: thêm `GET /api/leaderboard/daily/my-group-rank?date=` — resolve group của user
    (group chính; nếu user nhiều group → quyết định scope, xem BLOCKED note), đếm số member
    cùng group có `pointsCounted` cao hơn trong ngày (biến thể group-scoped của
    `countUsersAheadOnDate`). Trả `null` khi user không thuộc group nào.
  - **Spec impact**: [ ] SPEC_GROUP §group leaderboard / [ ] BL-2 (group leaderboard Q-A scope) — cần xác nhận
  - **Spec strategy**: [ ] (b) new BL-N nếu lệch — kiểm tra `docs/spec/BACKLOG.md` BL-2 trước
  - Checklist: verify scope vs BL-2 · impl · Tầng 1+3 pass · spec/BACKLOG updated · commit

- DCR-3 Wire "Trong nhóm" từ endpoint DCR-2
  - Status: [ ] TODO · Files: `apps/web/src/pages/DailyChallenge.tsx` · Test: `DailyChallenge.test.tsx`
  - Detail: `useQuery(['daily-my-group-rank'])` → `heroDone.rankGroup`. Khi endpoint trả
    `null` (không có group) → giữ "–" (đúng UX hiện tại).
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2 pass · commit

### Mở / cần quyết định
- DCR-2: nếu user thuộc nhiều group → rank theo group nào? Xem `docs/spec/SPEC_GROUP_v1.3.md`
  + BL-2 trước khi code. Nếu chưa rõ → DỪNG, hỏi user.
- Mobile (`DailyResultScreen.tsx`) cũng có `rankGlobal`/`rankGroup` — parity ở task riêng.
