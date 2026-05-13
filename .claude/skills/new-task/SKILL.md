---
name: new-task
description: Create a new task file in docs/todo/active/ with the project template, then add a row to the root TODO.md index. Use when the user invokes /new-task <slug> or asks to start a new task work-unit for the BibleQuize project.
---

# /new-task — Tạo file task mới trong docs/todo/active/

Tạo 1 file task work-unit chuẩn format CLAUDE.md §Quy trình quản lý Task, kèm cập nhật TODO.md index.

## Args

- `<slug>` (tuỳ chọn): kebab-case slug ngắn, < 50 ký tự, đã ascii-fold tiếng Việt. Nếu thiếu → hỏi user.

## Workflow

### 1. Thu thập input

Bằng AskUserQuestion (gom 1–2 câu hỏi), thu thập:
- **Slug** (nếu chưa có trong args) — ascii-fold tiếng Việt, kebab-case, < 50 ký tự.
- **Title** đầy đủ (sẽ là H1 và row index).
- **Source** ngắn (vd: `User prompt`, `PROMPT_X.md`, `Audit Y`, `BL-N`).
- **Scope** 1 dòng tóm tắt.
- **Code prefix** 2–3 ký tự uppercase cho sub-task (vd: `CQ`, `QSC`, `BL`). Nếu user không chọn, suggest từ slug.

Nếu user prompt đã chứa đủ thông tin, KHÔNG hỏi lại — extract trực tiếp.

### 2. Compute path

- `<DATE>` = today ISO format. Lấy bằng Bash `date +%Y-%m-%d` hoặc PowerShell `Get-Date -Format yyyy-MM-dd`.
- `<FILE>` = `docs/todo/active/<DATE>-<slug>.md`.
- Nếu file đã tồn tại → báo user, đề xuất slug khác hoặc append `-2`.

### 3. Tạo file với template

```markdown
# <DATE> — <Title>

> **Source**: <source>
> **Scope**: <scope>
> **Status**: TODO

### Tasks

- <CODE>-1 <Tên sub-task đầu tiên — placeholder nếu user chưa cho>
  - Status: `[ ]` TODO · Files: `path/to/file` · Test: <test strategy>
  - **Spec impact**: `[ ]` None `[ ]` SPEC_USER §X `[ ]` SPEC_ADMIN §X `[ ]` SPEC_GROUP §X `[ ]` SPEC_MULTIPLAYER §X `[ ]` BL-N
  - **Spec strategy**: `[ ]` (a) update inline `[ ]` (b) new BL-N `[ ]` (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2+3 pass · spec/BACKLOG updated · `audit.sh` no NEW broken · commit
```

Nếu user đã cung cấp danh sách sub-task, fill thẳng vào — KHÔNG dùng placeholder.

### 4. Cập nhật TODO.md index

- Đọc root `TODO.md`.
- Tìm header `## Active (N)` → tăng `N` lên `N+1`.
- Tìm row đầu tiên sau divider `|---|---|---|---|` trong table Active.
- Prepend (insert NGAY sau divider) row:
  ```
  | <DATE> | <Title> | TODO | [detail](docs/todo/active/<DATE>-<slug>.md) |
  ```

Hook PreToolUse `check-todo-append.mjs` sẽ KHÔNG block update này vì row không chứa pattern `## YYYY-MM-DD —`.

### 5. Report

Trả về cho user (≤3 dòng):
- Tạo `<FILE>` (link clickable).
- Đã add 1 row vào TODO.md Active table → count `N → N+1`.
- Gợi ý bước kế: "Mở file detail và điền thêm sub-task, hoặc bắt đầu task đầu tiên."

## Rules

- KHÔNG commit tự động — user kiểm soát commit.
- KHÔNG append `## <DATE> — ...` vào root TODO.md — hook sẽ block, và rule trong CLAUDE.md §Quy trình quản lý Task cấm.
- KHÔNG tạo file ngoài `docs/todo/active/`. Khi task DONE, user / Claude khác sẽ move sang `archive/`.
- Slug PHẢI ascii-fold (vd: `cho-i-cu-ng-nhau` → `choi-cung-nhau`); KHÔNG để dấu/khoảng trắng trong tên file.

## Khi không dùng

- User đang continue task hiện có → mở file detail thay vì tạo mới.
- Single bugfix < 50 LOC không cần workflow task — chỉ commit trực tiếp.
- Refactor nội bộ tagged `[no-spec-impact]` < 100 LOC cũng có thể skip — judgment call.
