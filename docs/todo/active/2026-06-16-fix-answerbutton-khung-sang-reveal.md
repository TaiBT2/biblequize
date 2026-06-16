# 2026-06-16 — Fix AnswerButton: migrate reveal states to Khung Sáng (light)

> **Source**: user screenshot (Quiz gameplay, Genesis 41) — sau khi trả lời, các đáp án không chọn (A/C/D) biến mất, chữ đáp án đúng (B) mờ trắng khó đọc.
> **Scope**: chỉ `components/quiz/AnswerButton.tsx` (+ test). Component này sót lại từ theme tối "Game vibe" — chưa migrate sang Khung Sáng (W2).
> **Prefix**: `ABK`.

### Root cause
`AnswerButton` dùng token theme tối:
- `default`/`selected`: `text-on-surface` = `#e1e1f1` (gần trắng) → chữ vô hình trên nền paper sáng.
- `correct`/`wrong`: `text-white` trên nền pale-green/pale-red → contrast kém.
- `disabled` (đáp án không chọn sau reveal): `bg-transparent border-transparent text-white opacity-25` → card biến mất + chữ trắng vô hình. Trong grid 2×2 nên A/C/D thành chữ cái lơ lửng.

Reference faithful: `docs/designs/biblequiz-light/quiz.css` §.answer — correct/wrong giữ chữ `--ink` (đậm), chỉ `.key` (letter chip) white-on-jewel; dimmed = `opacity .4 + saturate .5` trên card **vẫn hiện**.

### Tasks
- ABK-1 Migrate 6 state của AnswerButton sang token Khung Sáng (bq-ink / bq-hairline / bq-white / bq-emerald / bq-ruby); badge correct/wrong đổi sang jewel đậm; disabled = card dimmed readable (giữ position-color cue C5).
  - Status: [ ] TODO · Files: `apps/web/src/components/quiz/AnswerButton.tsx` · Test: `AnswerButton.test.tsx` + Tầng 3
  - **Spec impact**: [x] None (visual only, C5 answer colors preserved)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2+3 pass · `audit.sh` no NEW broken · commit (EN)
