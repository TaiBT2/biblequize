# Question Import Format Guide
> API: `POST /api/admin/questions/import`
> Auth: Bearer token (ADMIN role required)

---

## JSON Format

### Full example
```json
[
  {
    "book": "Genesis",
    "chapter": 1,
    "verseStart": 1,
    "verseEnd": 3,
    "difficulty": "easy",
    "type": "multiple_choice_single",
    "text": "Trong khởi đầu, Đức Chúa Trời đã dựng nên gì?",
    "options": ["Trời và đất", "Biển và núi", "Ánh sáng", "Con người"],
    "correctAnswer": [0],
    "explanation": "Sáng Thế Ký 1:1 — Ban đầu, Đức Chúa Trời dựng nên trời và đất.",
    "language": "vi"
  }
]
```

### Minimal example
```json
[
  {
    "book": "Matthew",
    "difficulty": "medium",
    "type": "true_false",
    "text": "Chúa Giê-xu sinh ra tại Bết-lê-hem.",
    "correctAnswer": 0
  }
]
```

`text` hoặc `content` đều OK. `correctAnswer`: số hoặc array.

---

## CSV Format

```csv
book,chapter,difficulty,type,text,optionA,optionB,optionC,optionD,correctAnswer,explanation
Genesis,1,easy,multiple_choice_single,"Ai dựng nên trời và đất?","Đức Chúa Trời","Con người","Thiên sứ","Không ai",0,"Sáng Thế Ký 1:1"
Ma-thi-ơ,2,medium,multiple_choice_single,"Chúa Giê-xu sinh ra tại đâu?","Na-xa-rét","Bết-lê-hem","Giê-ru-sa-lem","Ca-bê-na-um",1,"Ma-thi-ơ 2:1"
```

---

## Fields

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `book` | string | **Bắt buộc** | Tên sách (EN hoặc VN: `"Genesis"`, `"Sáng Thế Ký"`) |
| `difficulty` | string | **Bắt buộc** | `"easy"` / `"medium"` / `"hard"` |
| `type` | string | **Bắt buộc** | `"multiple_choice_single"` / `"true_false"` / `"fill_in_blank"` / `"multiple_choice_multi"` |
| `text`/`content` | string | **Bắt buộc** | Nội dung câu hỏi |
| `correctAnswer` | int/int[] | **Bắt buộc** | Index đáp án (0-based) |
| `options` | string[] | **MCQ bắt buộc** | Min 2 cho MCQ. Tự động `["Đúng","Sai"]` cho true_false |
| `explanation` | string | **Khuyến nghị** | Thiếu → câu **inactive** (cần admin bổ sung) |
| `chapter` | int | Tùy chọn | Chương |
| `verseStart`/`verseEnd` | int | Tùy chọn | Câu (JSON only) |
| `language` | string | Tùy chọn | Default `"vi"` |

---

## true_false Convention

| correctAnswer | Nghĩa |
|---------------|-------|
| `0` | **Đúng** — câu phát biểu đúng |
| `1` | **Sai** — câu phát biểu sai |

Options tự động `["Đúng", "Sai"]` nếu không cung cấp.

---

## Vietnamese Book Names

Tự động chuyển VN → EN. Case-insensitive. Ví dụ: `Sáng Thế Ký` → `Genesis`, `Ma-thi-ơ` → `Matthew`, `Khải Huyền` → `Revelation`. Hỗ trợ 66 sách + biến thể phổ biến.

---

## Validation

| Rule | Mô tả |
|------|-------|
| Required fields | `book`, `difficulty`, `type`, `text`/`content`, `correctAnswer` |
| MCQ options | Min 2, correctAnswer index in range |
| true_false | correctAnswer chỉ 0 hoặc 1 |
| Explanation | Thiếu → **warning** + inactive |
| Duplicate | Dry-run: **warning** nếu trùng DB hoặc batch |

---

## Response

### Dry-run
```json
{
  "dryRun": true,
  "willImport": 8,
  "errors": [{ "index": 3, "error": "record 3: MCQ requires options (min 2)" }],
  "warnings": [{ "index": 2, "warning": "record 2: thiếu explanation" }],
  "duplicates": 1
}
```

### Import
```json
{ "imported": 8, "errors": [], "warnings": [...], "duplicates": 0 }
```

---

## curl Examples

```bash
# Dry-run
curl -X POST http://localhost:8080/api/admin/questions/import \
  -H "Authorization: Bearer <TOKEN>" -F "file=@questions.json" -F "dryRun=true"

# Import thật
curl -X POST http://localhost:8080/api/admin/questions/import \
  -H "Authorization: Bearer <TOKEN>" -F "file=@questions.json" -F "dryRun=false"

# Skip duplicates
curl -X POST http://localhost:8080/api/admin/questions/import \
  -H "Authorization: Bearer <TOKEN>" -F "file=@questions.json" -F "dryRun=false" -F "skipDuplicates=true"
```
