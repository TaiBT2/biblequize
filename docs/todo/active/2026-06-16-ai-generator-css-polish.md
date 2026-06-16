# 2026-06-16 — AI Generator: CSS polish đồng bộ admin pattern

> **Source**: User prompt "CSS lại page admin/ai-generator" · **Scope**: chỉ styling, no behavior change
> **Hướng**: đồng bộ với các page admin khác · **Pain point**: spacing chưa cân + quá nhiều màu/rối

### Tasks

- AIG-1 Header sync + provider badges de-clutter
  - Status: [x] DONE · Files: `apps/web/src/pages/admin/AIQuestionGenerator.tsx` · Test: vitest page test giữ data-testid
  - Đổi `font-black tracking-tighter` + icon `text-4xl` → admin canonical `font-extrabold tracking-tight` + icon `text-2xl`. Tách provider config badges khỏi subtitle row (đang full-color xanh/đỏ) → chip trung tính + status dot.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

- AIG-2 Section labels + spacing
  - Status: [x] DONE · Files: `apps/web/src/pages/admin/AIQuestionGenerator.tsx`
  - Section `<h3>` gold uppercase + emoji 📖 → muted `text-[#d5c4af]/70` không emoji (khớp label style admin). Padding form panel `p-6`→`p-5`.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

- AIG-3 DraftCard fix light-theme leftovers
  - Status: [x] DONE · Files: `apps/web/src/pages/admin/ai-generator/DraftCard.tsx`
  - Sửa các màu light-mode kẹt trong card dark: explanation `bg-amber-50/text-amber-800`, save-error `bg-red-50/text-red-600`, divider `border-[#eeeae0]`, reject btn `bg-[#f0ece4]`, approved footer `border-emerald-200/text-emerald-600` → token dark.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

- AIG-4 Localize book dropdown theo UI language
  - Status: [x] DONE · Files: `apps/web/src/pages/admin/AIQuestionGenerator.tsx`
  - Dropdown Sách hardcode tên tiếng Anh dù UI đang tiếng Việt. Dùng `useBookName()` (như Questions list) để hiện nhãn Việt, giữ `value` = key tiếng Anh (API + getChapterCount/getVerseCount key theo English).
  - **Spec impact**: [x] None (i18n coverage, nối tiếp AIS-1..2)
  - **Spec strategy**: [x] (c) [no-spec-impact]

- AIG-5 Khoá provider Gemini + Claude (chưa dùng)
  - Status: [x] DONE · Files: `AIQuestionGenerator.tsx` + i18n vi/en
  - Gemini & Claude `disabled` + icon ổ khoá + tooltip `providerLocked`, không chọn được. DeepSeek vẫn default. Key i18n mới `admin.aiGenerator.providerLocked`.
  - **Spec impact**: [x] None (tạm khoá UI, BE không đổi)
  - **Spec strategy**: [x] (c) [no-spec-impact]

### Checklist
- impl · vitest page test pass · typecheck no error · `[no-spec-impact]` commit
