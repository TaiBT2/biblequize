# 2026-05-20 — Ranked timer: 90s/câu flat

> **Source**: User prompt 2026-05-20 — "tăng thời gian quiz rank lên tôi muốn 1 câu có tối đa 90s để trả lời".
> **Scope**: `apps/web/src/pages/Ranked.tsx` + `docs/spec/SPEC_USER_v3.1.md` §3.2 timer column.

## Root cause

Ranked.tsx `startRankedQuiz` navigates sang `/quiz` không truyền `timePerQuestion` → Quiz.tsx fallback `DEFAULT_TIMER = 30`. Câu Bible với scripture reference dài + 4 đáp án dài → 30s không đủ user đọc + suy nghĩ.

BE `TierDifficultyConfig` có tier-based timer (30→18s) nhưng chỉ áp dụng cho `SessionService.startSession` (Practice smart-selection path). Ranked flow của Ranked.tsx KHÔNG đi qua SessionService — chỉ gọi `/api/ranked/sessions` (RankedSessionService chỉ track energy/cap, không timer) rồi tự fetch questions từ `/api/questions` → tier-timer BE chưa từng ảnh hưởng Ranked thực tế. Số 30s đang xài là DEFAULT_TIMER FE chứ không phải spec value.

### Tasks

- RANK-TIMER-1 Set Ranked timer = 90s flat
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Ranked.tsx`, `docs/spec/SPEC_USER_v3.1.md`
  - FE: Pass `timePerQuestion: 90` in navigate state cho `/quiz`. Inline comment ghi policy + lý do.
  - Spec: Update §3.2 — bỏ cột "Timer (s)" trong difficulty table (chỉ giữ Easy/Medium/Hard%), thêm note **Timer:** 90s flat cho Ranked. Ghi rõ legacy `TierDifficultyConfig.timerSeconds` (30→18) còn dùng cho Practice smart-selection path.
  - Test: Quiz.test.tsx pass (test mock không depend value cụ thể timer).
  - **Spec impact**: [x] SPEC_USER §3.2 (timer policy thay đổi từ tier-based → flat 90s cho Ranked)
  - **Spec strategy**: [x] (a) update inline cùng PR
  - Checklist: ✅ FE impl · ✅ spec update · ⏳ commit (chờ user)
