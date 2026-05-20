# 2026-05-20 — Fix: Quiz (rank/practice) explanation panel auto-shows + covers answer D

> **Source**: User bug report 2026-05-20 (screenshot mobile — pill "Xem giải thích" tại `bottom-48` đè lên answer D; explanation panel mặc định mở rộng, user chưa kịp xem đáp án đã thấy giải thích).
> **Scope**: [`apps/web/src/pages/Quiz.tsx`](../../../apps/web/src/pages/Quiz.tsx) — apply collapsed-by-default + unified bottom-dock pattern (match [DailyChallenge.tsx:549-627](../../../apps/web/src/pages/DailyChallenge.tsx) — same fix shipped 2026-05-19 cho Daily Challenge).

## Root cause

Quiz.tsx render explanation panel + pill bằng 2 element `fixed bottom-48 sm:bottom-36` (lines 968-1073), tách biệt với feedback bar `fixed bottom-10` (lines 935-966). Pill ở `bottom-48` (~192px) đè lên answer D trên viewport ~700px. Thêm nữa `explanationCollapsed` default = `false` + useEffect reset về `false` mỗi câu mới → panel auto-show mỗi lần answered.

DailyChallenge đã fix bằng cách:
1. Default `explanationCollapsed = true` (user phải click pill mới mở).
2. Bỏ auto-reset về expanded.
3. Gộp pill/panel + feedback bar vào 1 dock `fixed bottom-6 sm:bottom-10` với `flex flex-col` — pill nằm phía trên feedback bar trong dock, không float đè answers.
4. Thêm `pb-56 sm:pb-44` lên `<main>` khi answered để answer grid scroll clear khỏi dock.

### Tasks

- RANK-EXP-1 Apply collapsed-by-default + unified bottom-dock pattern cho Quiz.tsx
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Quiz.tsx`
  - Test: Tầng 1 Quiz.test.tsx 18/18 pass. Tầng 3 full vitest 1254 pass / 56 fail (baseline 1212 → +42, không regression — failures pre-existing trong BasicQuiz/DailyChallenge/Ranked/ReviewQueue, không file nào import Quiz.tsx). `tsc --noEmit` không có error mới ở Quiz.tsx.
  - **Spec impact**: [x] None (UX toggle, không đổi answer/scoring/timer logic)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: ✅ impl · ✅ Tầng 1 · ✅ Tầng 3 baseline · ⏳ commit (chờ user)

- RANK-EXP-3 Ẩn gameplay footer (Hint + Skip) khi đã trả lời
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Quiz.tsx`
  - Root cause: footer `mt-16 w-full flex justify-between` luôn render kể cả `showResult=true`. Hint button đã `disabled` khi showResult nhưng Skip button không có disabled state → vẫn trông clickable mà click không có hiệu lực (handler đã `if (!showResult)` guard nhưng visual misleading).
  - Fix: wrap toàn bộ footer `{!showResult && (...)}` — sau khi answered, dock dưới đã có "Câu tiếp theo" CTA, footer là noise.
  - Test: Quiz.test.tsx 18/18 pass.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

- RANK-EXP-2 Fix "BẠN CHỌN" hiển thị trên đáp án đúng khi user pick sai
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Quiz.tsx`
  - Root cause: `AnswerButton` props `pickedByUser` default `true` (legacy single-player assumption), nhưng Quiz.tsx không pass prop → đáp án đúng luôn hiện "✓ ĐÚNG · BẠN CHỌN" kể cả khi user pick sai. RoomQuiz.tsx đã pass đúng `pickedByUser={selected === i}`, Quiz.tsx miss.
  - Fix: pass `pickedByUser={isSelected}` để chỉ render "BẠN CHỌN" khi user thật sự pick option đó. Wrong pick → đáp án đúng hiện "✓ ĐÁP ÁN" (không kèm BẠN CHỌN); correct pick → "✓ ĐÚNG · BẠN CHỌN".
  - Test: Quiz.test.tsx re-run.
  - **Spec impact**: [x] None (UI label correctness, không đổi scoring/state)
  - **Spec strategy**: [x] (c) [no-spec-impact]

### Implementation summary

1. `[explanationCollapsed, setExplanationCollapsed] = useState(true)` (was `false`).
2. Reset useEffect đổi target từ `setExplanationCollapsed(false)` → `setExplanationCollapsed(true)` mỗi câu mới.
3. `<main>` thêm conditional `pb-56 sm:pb-44` khi `showResult` để answer grid scroll clear khỏi dock.
4. Gộp feedback bar (`bottom-10`) + pill/panel (`bottom-48`) thành 1 dock `fixed bottom-6 sm:bottom-10` với `flex flex-col gap-2`. Pill nằm phía trên feedback bar trong dock, không float đè answers nữa.
5. Wrong vs correct explanation gộp 1 nhánh `hasExp` boolean, render header khác nhau (`correctAnswerIs` cho wrong, `Giải thích` label cho right) — preserve test-id `quiz-answer-feedback`, `quiz-next-btn`, `quiz-score-delta`, `quiz-explanation-pill`, `quiz-explanation`, `quiz-explanation-close`.
