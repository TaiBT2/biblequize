# 2026-05-18 — Fix: Daily Challenge question card clipped on mobile

> **Source**: User bug report 2026-05-18 (mobile screenshot — question text "Theo Công Vụ 13:9..." bị cắt trên/dưới trong card)
> **Scope**: `apps/web/src/pages/DailyChallenge.tsx` — port QM-3 mobile pattern đã có sẵn từ `Quiz.tsx`

## Root cause

`DailyChallenge.tsx:468` quiz card dùng `aspect-[16/9]` + `overflow-hidden` + `p-10` trên mobile → card có chiều cao cố định (~184px trên màn 327px), padding 40px mỗi bên → câu dài tràn ra ngoài bị cắt.

`Quiz.tsx` đã fix bug giống hệt bằng QM-3 pattern (`aspect-auto + min-h-[160px] + p-5 md:p-10` + adaptive font 3 bucket qua `getQuestionLengthClass`). Daily chỉ cần port y hệt.

### Tasks

- DAILY-FIX-1 Port QM-3 mobile pattern vào quiz card của DailyChallenge
  - Status: [x] DONE
  - Files: `apps/web/src/pages/DailyChallenge.tsx`
  - Test: Tầng 3 FE regression — 1167 pass / 125 fail giống hệt clean state (0 regression). textHelpers test 22/22 pass. tsc no new errors on DailyChallenge.tsx.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact] (UI fix mobile clipping, không đổi behavior)
  - Checklist: ✅ impl · ✅ Tầng 3 no regression · ⏳ commit (user-driven)
