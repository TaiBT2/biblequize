# 2026-05-19 — Quiz Results: hiển thị tổng điểm trong hero block

> **Source**: User feedback — "xếp hạng chơi xong ko biết được bao nhiêu điểm trong lượt đó"
> **Scope**: `apps/web/src/pages/QuizResults.tsx` + i18n. Áp dụng cho cả Luyện Tập + Đấu Hạng.

## Bug

Hero block hiện 3 stat: Câu đúng / Chính xác / Thời gian. `stats.totalScore` chỉ render trong khối `breakdown` (line 305) khi `hasBonuses = (speed > 0 || combo > 0)`. Hậu quả: user không có speed/combo bonus (rất phổ biến với điểm thấp) → không thấy tổng điểm ở đâu cả.

## Approach (Hướng A — user chọn)

Thay slot "Thời gian" trong 3-col grid bằng slot "Điểm". Lý do: 3 col giữ layout mobile gọn, time info ít quan trọng khi user xem kết quả tổng kết. Breakdown card vẫn giữ nguyên khi có bonus (để show base + speed + combo + total).

### Tasks

- QR-1 Thêm i18n key `results.stats.score` + `results.stats.scoreShort` (vi + en)
  - Status: [x] DONE
  - Files: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`

- QR-2 Thay slot Thời gian → Điểm trong QuizResults hero block
  - Status: [x] DONE
  - Files: `apps/web/src/pages/QuizResults.tsx`, `apps/web/src/pages/__tests__/QuizResults.test.tsx`
  - Cleanup: bỏ `timeText` / `totalSec` (dead code)
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact] — chỉ expose existing data, không đổi formula

## Checklist

- [x] QR-1 + QR-2 impl
- [x] Tầng 1 (QuizResults.test.tsx) pass — 19/19 (thêm 1 test mới)
- [x] Tầng 3 full regression baseline ≥ — 1254 pass (baseline 1212), 56 pre-existing fail (Ranked + ReviewQueue, unrelated)
- [ ] Commit `fix(quiz-results): show total score in hero block [no-spec-impact]`
