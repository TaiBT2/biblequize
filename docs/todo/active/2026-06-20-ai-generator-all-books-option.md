# 2026-06-20 — AI Generator: option "Tất cả sách" (toàn Kinh Thánh theo chủ đề)

> **Source**: User prompt + screenshot (admin Trình tạo AI, ô "Nội dung đoạn" = "câu đố về Đavit"). · **Scope**: Admin AI Question Generator — book selector.

Mục tiêu: thêm lựa chọn **"Tất cả sách"** vào dropdown SÁCH. Khi chọn, AI tạo câu hỏi từ TOÀN BỘ Kinh Thánh (66 sách) bám theo ô "Nội dung đoạn" (chủ đề), mỗi câu tự khai báo book/chapter/verse của nó. Selector Chương/Câu **vô hiệu hóa** (vẫn hiện, disabled).

Quyết định hành vi (xác nhận với user 2026-06-20):
- Hành vi: **Toàn Kinh Thánh (theo chủ đề)** — AI lấy từ bất kỳ sách nào, dựa "Nội dung đoạn".
- Chương/Câu: **Vô hiệu hóa (disable)** khi đã chọn Tất cả sách.

Sentinel: `book === "ALL"` xuyên suốt FE → request → `buildPrompt`.

### Tasks

- ABO-1 BE: `buildPrompt` chế độ "all books" khi `book == "ALL"`
  - Status: [x] DONE · Files: `AIGenerationService.java` · Test: `AIGenerationPromptTest`
  - Ref toàn-Kinh-Thánh + chỉ thị "đa dạng sách" + BẮT BUỘC mỗi câu tự khai book/chapter/verse. Controller cho "ALL" đi xuyên qua (non-blank, không default về Genesis).
  - **Spec impact**: [x] SPEC_ADMIN §7.1/§7.5
  - **Spec strategy**: [x] (a) update inline
  - Checklist: impl · Tầng 1+2+3 pass · spec updated · `audit.sh` no NEW broken · commit

- ABO-2 FE: option "Tất cả sách" + disable Chương/Câu + draft mapping per-câu + i18n
  - Status: [x] DONE · Files: `AIQuestionGenerator.tsx`, `i18n/vi.json`, `i18n/en.json`, `__tests__/AIQuestionGenerator.test.tsx`
  - `<option value="ALL">`; `isAllBooks` ⇒ disable 4 select Chương/Câu; payload gửi `book:"ALL"`; draft dùng `q.book/q.chapter/q.verse*` thay vì form.
  - **Spec impact**: [x] SPEC_ADMIN §7 (cùng ABO-1)
  - **Spec strategy**: [x] (a) update inline (đã gộp ABO-1)
  - Checklist: impl · Tầng 1+2+3 pass · i18n validator no tăng · commit
