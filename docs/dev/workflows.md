# Workflows

> Extracted from CLAUDE.md on 2026-05-09. Referenced from CLAUDE.md §References.
> Updates: thay đổi → update file này, KHÔNG add lại vào CLAUDE.md.

## Workflow khi làm feature mới

```
1. Đọc TODO.md → xác định task cần làm
2. Nếu prompt mới → CHIA NHỎ thành tasks → GHI VÀO TODO.md trước
3. **E2E Test Gate** → kiểm tra TC spec + Playwright code (xem docs/dev/testing.md §E2E Test Gate)
4. Bắt đầu task đầu tiên trong TODO.md
5. Nếu có Stitch design → MCP query Stitch lấy design → code match pixel-perfect
6. Nếu không có Stitch design → follow design tokens + pattern từ screens đã sync
7. Code từng phần nhỏ → Tầng 1 test (scope test) sau mỗi phần
8. Hoàn thành screen → viết unit test đầy đủ (Vitest, min 8 cases)
9. Unit test pass → chạy e2e test liên quan (Playwright) → phải pass
10. Tầng 2 test (related modules) → fix nếu có regression
11. Tầng 3 test (FULL REGRESSION) → BẮT BUỘC pass hết trước khi commit
12. Kiểm tra: số test >= baseline, không có test bị skip
13. Update TODO.md → đánh ✅ task vừa xong
14. Commit theo convention (1 task = 1 commit)
15. Nếu có quyết định kỹ thuật → ghi DECISIONS.md
16. Chuyển sang task tiếp theo trong TODO.md → lặp lại từ bước 4
```

## Self-check sau mỗi 30 phút code

```
□ Mình đang code đúng task trong TODO.md? (hay bị đi lạc sang việc khác)
□ Mình có đang sửa file ngoài scope task? → DỪNG, ghi TODO riêng
□ Code mình vừa viết follow pattern existing? → Grep verify
□ Đã chạy Tầng 1 test chưa? → Nếu chưa: DỪNG, test ngay
□ LOC thay đổi hiện tại bao nhiêu? → Nếu > 100: DỪNG, commit partial, chia task
```

---

## Workflow khi sync Stitch design

### Nguyên tắc cốt lõi
> **Stitch HTML là source of truth. Code PHẢI replicate từng section, không được tự ý bỏ bớt hoặc thêm.**
> Nếu Stitch có 8 sections → code phải có 8 sections. Không được "simplified version".

```
1. Đọc TODO.md → nếu là prompt mới → chia thành tasks per screen → ghi TODO.md
2. Bắt đầu task đầu tiên (1 screen = 1 task)
3. Đọc Stitch HTML file:
   - Nếu có trong docs/designs/stitch/ → đọc trực tiếp
   - Nếu chưa có → MCP Stitch query → save HTML → rồi đọc
4. LIỆT KÊ từng section trong Stitch HTML (viết ra comment hoặc terminal):
   - Section 1: [tên] — [mô tả nội dung] — [Tailwind classes chính]
   - Section 2: [tên] — [mô tả] — [classes]
   - ... liệt kê TOÀN BỘ, không bỏ sót
5. Đọc code hiện tại → liệt kê sections trong code
6. DIFF bắt buộc (viết ra):
   | # | Stitch Section | Code Section | Match | Action |
   |---|---------------|-------------|-------|--------|
   | 1 | KPI Cards | KPI Cards | 🔄 70% | Update sub-stats |
   | 2 | Activity Log | KHÔNG CÓ | ❌ | THÊM MỚI |
   | 3 | ... | ... | ... | ... |
7. Thực hiện TỪNG action trong bảng diff:
   - ❌ KHÔNG CÓ → tạo component mới match Stitch HTML
   - 🔄 Partial → update cho khớp 100%
   - ✅ Match → giữ nguyên
   - Code có nhưng Stitch KHÔNG CÓ → XÓA (trừ khi là business logic cần thiết)
8. Với mỗi section mới/update: copy Tailwind classes từ Stitch HTML, adjust cho React
9. KHÔNG thay đổi business logic — chỉ sửa UI/styling
10. SAU KHI CODE XONG — verify lại bảng diff: tất cả sections phải ✅
11. Tầng 1 → Tầng 2 → Tầng 3 test
12. Update TODO.md → đánh ✅
13. Commit: `sync: <ScreenName> from Stitch + tests`
```

### Cách đọc Stitch HTML file
```
1. Mở file HTML trong docs/designs/stitch/
2. Tìm tất cả top-level <div> hoặc <section> → đó là các sections
3. Với mỗi section:
   - Đọc Tailwind classes → giữ nguyên khi chuyển sang React
   - Đọc text content → hiểu section làm gì
   - Đọc nested structure → replicate component tree
4. Colors trong HTML → map sang code variables (nếu có)
5. Icons trong HTML → dùng cùng icon library
6. KHÔNG ĐƯỢC tự ý:
   - Bỏ section nào trong Stitch
   - Thêm section không có trong Stitch
   - Đổi layout grid khác Stitch
   - Đổi color khác Stitch
   - "Simplified" bất kỳ section nào
```

---

## PROMPT_*.md pattern

> Khi nhận prompt lớn từ Bui được lưu ở `docs/prompts/PROMPT_*.md` hoặc `docs/MULTIPLAYER/PROMPT_*.md`:

1. Đọc TOÀN BỘ prompt file trước khi action
2. Phân tích Phase structure (Phase 1 verify → Phase N output)
3. Ghi tất cả Phases + verify steps vào TODO.md
4. Mỗi Phase = 1 commit (hoặc nhiều commit nếu phase quá lớn)
5. Phase 1 verify thường BẮT BUỘC chạy trước khi sang Phase 2 — ground truth
6. Nếu phát hiện ambiguity → ghi `QUESTIONS.md` + hỏi Bui, KHÔNG tự suy diễn

---

## Khi Claude Code bị kẹt / không chắc

### Nguyên tắc "Khi nghi ngờ"
1. **Không chắc về behavior** → viết test trước, verify behavior hiện tại, rồi mới sửa
2. **Không chắc file nào ảnh hưởng** → đọc bảng "file nhạy cảm" trong `docs/dev/testing.md` → chạy Full Regression
3. **Không chắc design** → check Stitch MCP trước, KHÔNG tự design
4. **Không chắc API contract** → đọc Controller + DTO trong backend, KHÔNG đoán response format
5. **Không chắc về performance impact** → benchmark trước và sau, ghi kết quả vào commit message
6. **Task quá lớn (> 100 LOC thay đổi)** → DỪNG, chia nhỏ thêm trong TODO.md
7. **2 cách implement, không biết chọn cái nào** → ghi cả 2 vào DECISIONS.md với trade-offs, chọn cái đơn giản hơn

### Khi gặp lỗi không fix được sau 3 lần thử
```
1. Ghi lại: file nào, error gì, 3 cách đã thử
2. Đánh task [!] BLOCKED trong TODO.md
3. Ghi lý do block
4. Chuyển sang task khác không phụ thuộc
5. Quay lại task blocked sau khi có thêm context
```
