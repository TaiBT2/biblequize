# 2026-06-20 — Multiplayer Result Screen optimize (QuizEndScreen)

> **Source**: Đánh giá đầu sâu `components/multiplayer/QuizEndScreen.tsx` (413 LOC) + `Podium.tsx` · **Scope**: chỉ màn kết quả multiplayer (QuizEndScreen + Podium), KHÔNG đụng module khác.

### Tasks

- MRO-1 Correctness fixes (freeze duration + score 0 + avatar initial)
  - Status: [x] DONE · Files: `apps/web/src/components/multiplayer/QuizEndScreen.tsx` · Test: `QuizEndScreen.test.tsx` + 2 case mới (11 pass, Tầng 3 1369 pass)
  - Detail:
    - Freeze `matchDuration` lúc mount (`Date.now()` đang gọi trong render body → tăng theo mỗi re-render do STOMP).
    - `me.score ? ... : ''` nuốt điểm 0 → check `!= null`.
    - Avatar hero dùng `myUsername[0]` trong khi `me` match qua `myUserId` → dùng `me.username[0]`.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2 pass · Tầng 3 trước commit · commit

- MRO-2 Performance: giảm lớp `backdrop-filter: blur()` chồng nhau (mobile jank)
  - Status: [ ] TODO · Files: `QuizEndScreen.tsx` · Test: visual + existing tests pass
  - Detail: 4 lớp blur đồng thời + confetti animate. Giữ blur cho panel chính, panel phụ dùng nền rgba đậm tĩnh (bỏ blur) để giảm jank Android.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2 pass · Tầng 3 trước commit · commit

- MRO-3 Dedup sort: truyền `ranked` đã sort xuống Podium + memoize
  - Status: [ ] TODO · Files: `QuizEndScreen.tsx`, `Podium.tsx` · Test: `QuizEndScreen.test.tsx` (podium vẫn render đúng top3)
  - Detail: `Podium.top3` recompute + re-sort mỗi render. Nhận `ranked` đã sort hoặc memoize nội bộ.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2 pass · Tầng 3 trước commit · commit

- MRO-4 Tách subcomponent đưa QuizEndScreen < 300 LOC
  - Status: [ ] TODO · Files: `QuizEndScreen.tsx` (+ file con mới trong `components/multiplayer/`) · Test: existing tests pass
  - Detail: Tách `HeroCard`, `RankingList`, action panels. Mục tiêu < 300 LOC theo convention.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2 pass · Tầng 3 trước commit · commit
