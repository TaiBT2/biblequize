# 2026-06-18 — Thêm keyword phụ Tin Lành (pillar page + meta)

> **Source**: User — sau khi thấy chưa index, muốn thêm keyword phụ ngách Tin Lành.
> **Scope**: enrich pillar page `/cau-do-kinh-thanh` + index.html keywords. KHÔNG tạo trang trùng (doorway).

Keyword phụ nhắm: "trắc nghiệm Kinh Thánh Tin Lành", "câu đố Kinh Thánh Tin Lành",
"đố Kinh Thánh online", "trắc nghiệm Kinh Thánh theo sách".

### Tasks

- SKW-1 Enrich pillar page: title/desc/h1 + intro + section "theo từng sách" + 2 FAQ (Tin Lành angle)
  - Status: [x] DONE · Files: `pages/CauDoKinhThanh.tsx` · Tự nhiên, không nhồi keyword
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SKW-2 index.html meta keywords + bổ sung Tin Lành terms
  - Status: [x] DONE · Files: `index.html`
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

### Note
- FAQPage schema tự cập nhật (build từ FAQ array).
- Deploy lại FE image (worktree sạch).
