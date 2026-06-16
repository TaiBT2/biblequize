# 2026-06-17 — Practice: book-select "chìm" + no-book unclear error

> **Source**: user (production test forbible.org) — (1) tên sách trong dropdown SÁCH KINH THÁNH bị chìm (low-contrast); (2) không chọn sách → bắt đầu Luyện Tập báo lỗi không tường minh.
> **Scope**: `components/ui/SearchableSelect.tsx`, `pages/Practice.tsx`.
> **Prefix**: `PBS`.

### Root cause
- **(1) chìm**: `SearchableSelect` còn dùng token theme tối (`--hp-text` #F0E8D0 cream, `--hp-muted`, `--hp-card` #16161F, `--hp-gold`) + nền white-alpha → trên nền paper sáng Khung Sáng chữ giá trị (cream) gần như vô hình. Đây là known-issue "SearchableSelect inline styles → Tailwind" (fix-on-touch).
- **(2) lỗi không tường minh**: BE **có** hỗ trợ book rỗng = tất cả 66 sách (SmartQuestionSelector QuestionFilter `book.isEmpty() ? List.of()` → bookCount=0 → findMetaByLanguage). FE `startQuiz` `catch { setErrorMsg(t('practice.errorCreate')) }` nuốt lỗi thật, chỉ hiện thông báo generic. Cần surface message thật từ server.

### Tasks
- PBS-1 Migrate `SearchableSelect` sang Khung Sáng (Tailwind bq tokens: bq-white/ink/ink2/ink3/hair/inset/amber/sapphire). Giữ nguyên props + behavior (placeholder "Chọn...", allLabel "Tất cả", noMatch "Không tìm thấy", roles/aria).
  - Status: [ ] TODO · Files: `components/ui/SearchableSelect.tsx` · Test: `SearchableSelect.test.tsx`
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`
- PBS-2 `Practice.startQuiz` catch: surface server `error`/`message` (fallback generic) → lỗi tường minh.
  - Status: [ ] TODO · Files: `pages/Practice.tsx` · Test: Practice page tests
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2+3 pass · commit (EN)
