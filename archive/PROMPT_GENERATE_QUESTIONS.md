# Prompt tạo bộ câu hỏi — 1 sách Kinh Thánh

> Dùng prompt này với Claude (claude.ai) hoặc bất kỳ AI nào.
> Thay [BOOK_EN], [BOOK_VI], [CHAPTERS] cho từng sách.
> Output: file JSON sẵn sàng import vào BibleQuiz.

---

## Cách dùng

1. Copy prompt bên dưới
2. Thay 3 placeholder:
   - `[BOOK_EN]` → tên tiếng Anh (vd: "Genesis")
   - `[BOOK_VI]` → tên tiếng Việt (vd: "Sáng Thế Ký")
   - `[CHAPTERS]` → số chương (vd: "50")
3. Paste vào Claude.ai hoặc AI khác
4. Nhận JSON output → save thành file (vd: `01-genesis.json`)
5. Import: `POST /api/admin/questions/import` với `dryRun=true` trước

---

## Prompt (copy từ đây)

```
Tạo bộ câu hỏi trắc nghiệm Kinh Thánh cho sách [BOOK_VI] ([BOOK_EN]), gồm [CHAPTERS] chương.

## Yêu cầu số lượng
- 35 câu Easy
- 25 câu Medium  
- 15 câu Hard
- Tổng: 75 câu

## Phân bổ theo chương
- Trải đều câu hỏi qua TẤT CẢ các chương (không tập trung vào vài chương đầu)
- Mỗi chương nên có ít nhất 1 câu (nếu sách có ít chương thì mỗi chương nhiều câu hơn)

## Phân bổ theo loại
- 70% multiple_choice_single (4 lựa chọn, 1 đúng)
- 20% true_false
- 10% fill_in_blank

## Tiêu chí độ khó

Easy:
- Sự kiện nổi tiếng ai cũng biết
- Nhân vật chính, câu Kinh Thánh phổ biến
- Đáp án sai khác biệt rõ ràng với đáp án đúng
- Ví dụ: "Ai đã dựng nên trời và đất?" → Đức Chúa Trời (ai cũng biết)

Medium:
- Chi tiết cụ thể trong câu chuyện (tên địa danh, số liệu, thứ tự sự kiện)
- Đáp án sai hợp lý, cùng ngữ cảnh
- Cần đọc kỹ mới nhớ
- Ví dụ: "Áp-ra-ham sống được bao nhiêu tuổi?" → cần nhớ chính xác

Hard:
- Cross-reference giữa các chương/sách
- Ý nghĩa thần học, bối cảnh lịch sử
- Đáp án sai rất gần đúng, dễ nhầm
- Câu hỏi suy luận, không chỉ ghi nhớ
- Ví dụ: "Lời hứa nào của Đức Chúa Trời với Áp-ra-ham được nhắc lại trong Hê-bơ-rơ 6:13-14?"

## Format JSON (BẮT BUỘC)

Output ONLY JSON array, KHÔNG có markdown, KHÔNG có giải thích ngoài JSON.
Mỗi câu hỏi là 1 object trong array:

```json
[
  {
    "book": "[BOOK_EN]",
    "chapter": 1,
    "verseStart": 1,
    "verseEnd": 3,
    "difficulty": "easy",
    "type": "multiple_choice_single",
    "text": "Câu hỏi bằng tiếng Việt?",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correctAnswer": [0],
    "explanation": "[BOOK_VI] X:Y — 'Trích dẫn câu Kinh Thánh chính xác.'",
    "language": "vi"
  }
]
```

## Quy tắc cho từng field

book: luôn là "[BOOK_EN]" (tiếng Anh)
chapter: số chương chứa câu trả lời
verseStart: câu bắt đầu (BẮT BUỘC cho mọi câu)
verseEnd: câu kết thúc (nếu span nhiều câu, optional nếu 1 câu)
difficulty: "easy" / "medium" / "hard"
type: "multiple_choice_single" / "true_false" / "fill_in_blank"

text: 
- Tiếng Việt, rõ ràng, không mơ hồ
- Không bắt đầu bằng "Theo Kinh Thánh..." (thừa — đây là app Kinh Thánh)
- true_false: viết dạng khẳng định ("Môi-se dẫn dân qua Biển Đỏ.")
- fill_in_blank: dùng ___ cho chỗ trống ("Ban đầu ___ dựng nên trời đất.")

options (multiple_choice):
- LUÔN 4 đáp án
- Đáp án sai phải hợp lý (cùng category với đáp án đúng)
- KHÔNG có đáp án kiểu "Tất cả đều đúng" hoặc "Không có đáp án nào"
- Thứ tự random (đáp án đúng không luôn ở vị trí 0)

options (true_false):
- KHÔNG cần cung cấp — hệ thống tự tạo ["Đúng", "Sai"]

correctAnswer:
- multiple_choice: [index] — ví dụ [2] nghĩa là đáp án C đúng
- true_false: [0] = Đúng, [1] = Sai
- fill_in_blank: [0] (index trong options nếu có, hoặc text answer)

explanation (BẮT BUỘC cho mọi câu):
- Bắt đầu bằng reference: "[BOOK_VI] X:Y"
- Trích dẫn câu Kinh Thánh liên quan (trong dấu nháy đơn)
- 1-2 câu giải thích thêm nếu cần
- Tối đa 100 từ
- Dùng Kinh Thánh Việt Ngữ Bản Truyền Thống Hiệu Đính 2011

## Ví dụ từng loại

### Easy — multiple_choice_single:
```json
{
  "book": "[BOOK_EN]",
  "chapter": 1,
  "verseStart": 1,
  "difficulty": "easy",
  "type": "multiple_choice_single",
  "text": "Ai đã dựng nên trời và đất?",
  "options": ["Môi-se", "Đức Chúa Trời", "Áp-ra-ham", "Đa-vít"],
  "correctAnswer": [1],
  "explanation": "[BOOK_VI] 1:1 — 'Ban đầu, Đức Chúa Trời dựng nên trời và đất.' Đây là câu mở đầu của toàn bộ Kinh Thánh.",
  "language": "vi"
}
```

### Medium — multiple_choice_single:
```json
{
  "book": "[BOOK_EN]",
  "chapter": 5,
  "verseStart": 27,
  "difficulty": "medium",
  "type": "multiple_choice_single",
  "text": "Mê-tu-sê-la sống được bao nhiêu tuổi?",
  "options": ["777 tuổi", "969 tuổi", "930 tuổi", "895 tuổi"],
  "correctAnswer": [1],
  "explanation": "[BOOK_VI] 5:27 — 'Mê-tu-sê-la hưởng thọ được chín trăm sáu mươi chín tuổi, rồi qua đời.' Ông là người sống lâu nhất trong Kinh Thánh.",
  "language": "vi"
}
```

### Hard — multiple_choice_single:
```json
{
  "book": "[BOOK_EN]",
  "chapter": 14,
  "verseStart": 18,
  "verseEnd": 20,
  "difficulty": "hard",
  "type": "multiple_choice_single",
  "text": "Mên-chi-xê-đéc, vua Sa-lem, mang gì ra đón Áp-ram sau trận chiến?",
  "options": ["Vàng và bạc", "Bánh và rượu", "Áo choàng và kiếm", "Chiên và bò"],
  "correctAnswer": [1],
  "explanation": "[BOOK_VI] 14:18 — 'Mên-chi-xê-đéc, vua Sa-lem, sai đem bánh và rượu ra. Vua cũng là thầy tế lễ của Đức Chúa Trời Chí Cao.' Hình bóng về Chúa Giê-xu trong Hê-bơ-rơ 7.",
  "language": "vi"
}
```

### Easy — true_false:
```json
{
  "book": "[BOOK_EN]",
  "chapter": 7,
  "verseStart": 12,
  "difficulty": "easy",
  "type": "true_false",
  "text": "Trận đại hồng thủy kéo dài 40 ngày 40 đêm.",
  "correctAnswer": [0],
  "explanation": "[BOOK_VI] 7:12 — 'Mưa xuống mặt đất suốt bốn mươi ngày bốn mươi đêm.'",
  "language": "vi"
}
```

### Medium — true_false:
```json
{
  "book": "[BOOK_EN]",
  "chapter": 11,
  "verseStart": 31,
  "difficulty": "medium",
  "type": "true_false",
  "text": "Áp-ram ra đi từ thành U-rơ khi ông 65 tuổi.",
  "correctAnswer": [1],
  "explanation": "[BOOK_VI] 12:4 — 'Áp-ram được bảy mươi lăm tuổi khi ông rời Ha-ran.' Ông 75 tuổi, không phải 65.",
  "language": "vi"
}
```

### Hard — fill_in_blank:
```json
{
  "book": "[BOOK_EN]",
  "chapter": 1,
  "verseStart": 1,
  "difficulty": "hard",
  "type": "fill_in_blank",
  "text": "Ban đầu ___ dựng nên trời và đất.",
  "options": ["Đức Chúa Trời", "Đức Giê-hô-va", "Chúa Giê-xu", "Thánh Linh"],
  "correctAnswer": [0],
  "explanation": "[BOOK_VI] 1:1 — 'Ban đầu, Đức Chúa Trời dựng nên trời và đất.'",
  "language": "vi"
}
```

## Checklist trước khi output
- [ ] Đủ 75 câu (35 easy + 25 medium + 15 hard)
- [ ] Trải đều qua [CHAPTERS] chương
- [ ] 70% MCQ + 20% true_false + 10% fill_in_blank
- [ ] Mỗi câu có explanation với trích dẫn Kinh Thánh
- [ ] correctAnswer index đúng (khớp với vị trí trong options)
- [ ] Không câu nào trùng nội dung
- [ ] true_false: correctAnswer chỉ [0] hoặc [1]
- [ ] fill_in_blank: có options + ___ trong text
- [ ] Tất cả trích dẫn chính xác theo Kinh Thánh
- [ ] Output là JSON array thuần, không markdown

BẮT ĐẦU NGAY. Output JSON only.
```

---

## Danh sách 66 sách — Copy placeholder thay nhanh

| # | [BOOK_EN] | [BOOK_VI] | [CHAPTERS] |
|---|-----------|-----------|------------|
| 1 | Genesis | Sáng Thế Ký | 50 |
| 2 | Exodus | Xuất Hành | 40 |
| 3 | Leviticus | Lê-vi Ký | 27 |
| 4 | Numbers | Dân Số Ký | 36 |
| 5 | Deuteronomy | Phục Truyền Luật Lệ Ký | 34 |
| 6 | Joshua | Giô-suê | 24 |
| 7 | Judges | Các Quan Xét | 21 |
| 8 | Ruth | Ru-tơ | 4 |
| 9 | 1 Samuel | 1 Sa-mu-ên | 31 |
| 10 | 2 Samuel | 2 Sa-mu-ên | 24 |
| 11 | 1 Kings | 1 Các Vua | 22 |
| 12 | 2 Kings | 2 Các Vua | 25 |
| 13 | 1 Chronicles | 1 Sử Ký | 29 |
| 14 | 2 Chronicles | 2 Sử Ký | 36 |
| 15 | Ezra | E-xơ-ra | 10 |
| 16 | Nehemiah | Nê-hê-mi | 13 |
| 17 | Esther | Ê-xơ-tê | 10 |
| 18 | Job | Gióp | 42 |
| 19 | Psalms | Thi Thiên | 150 |
| 20 | Proverbs | Châm Ngôn | 31 |
| 21 | Ecclesiastes | Truyền Đạo | 12 |
| 22 | Song of Solomon | Nhã Ca | 8 |
| 23 | Isaiah | Ê-sai | 66 |
| 24 | Jeremiah | Giê-rê-mi | 52 |
| 25 | Lamentations | Ca Thương | 5 |
| 26 | Ezekiel | Ê-xê-chi-ên | 48 |
| 27 | Daniel | Đa-ni-ên | 12 |
| 28 | Hosea | Ô-sê | 14 |
| 29 | Joel | Giô-ên | 3 |
| 30 | Amos | A-mốt | 9 |
| 31 | Obadiah | Áp-đia | 1 |
| 32 | Jonah | Giô-na | 4 |
| 33 | Micah | Mi-chê | 7 |
| 34 | Nahum | Na-hum | 3 |
| 35 | Habakkuk | Ha-ba-cúc | 3 |
| 36 | Zephaniah | Sô-phô-ni | 3 |
| 37 | Haggai | A-ghê | 2 |
| 38 | Zechariah | Xa-cha-ri | 14 |
| 39 | Malachi | Ma-la-chi | 4 |
| 40 | Matthew | Ma-thi-ơ | 28 |
| 41 | Mark | Mác | 16 |
| 42 | Luke | Lu-ca | 24 |
| 43 | John | Giăng | 21 |
| 44 | Acts | Công Vụ | 28 |
| 45 | Romans | Rô-ma | 16 |
| 46 | 1 Corinthians | 1 Cô-rinh-tô | 16 |
| 47 | 2 Corinthians | 2 Cô-rinh-tô | 13 |
| 48 | Galatians | Ga-la-ti | 6 |
| 49 | Ephesians | Ê-phê-sô | 6 |
| 50 | Philippians | Phi-líp | 4 |
| 51 | Colossians | Cô-lô-se | 4 |
| 52 | 1 Thessalonians | 1 Tê-sa-lô-ni-ca | 5 |
| 53 | 2 Thessalonians | 2 Tê-sa-lô-ni-ca | 3 |
| 54 | 1 Timothy | 1 Ti-mô-thê | 6 |
| 55 | 2 Timothy | 2 Ti-mô-thê | 4 |
| 56 | Titus | Tít | 3 |
| 57 | Philemon | Phi-lê-môn | 1 |
| 58 | Hebrews | Hê-bơ-rơ | 13 |
| 59 | James | Gia-cơ | 5 |
| 60 | 1 Peter | 1 Phi-e-rơ | 5 |
| 61 | 2 Peter | 2 Phi-e-rơ | 3 |
| 62 | 1 John | 1 Giăng | 5 |
| 63 | 2 John | 2 Giăng | 1 |
| 64 | 3 John | 3 Giăng | 1 |
| 65 | Jude | Giu-đe | 1 |
| 66 | Revelation | Khải Huyền | 22 |

---

## Tips khi dùng

1. **Chạy từng sách** — đừng yêu cầu 66 sách 1 lần, AI sẽ giảm chất lượng
2. **Verify output** — paste JSON vào validator (jsonlint.com) trước khi import
3. **Dry-run trước** — `dryRun=true` để check errors/warnings
4. **Sách ngắn** (1-4 chương: Ruth, Obadiah, Philemon, 2-3 John, Jude):
   - Giảm xuống 40 câu (20 easy + 12 medium + 8 hard) — đủ min pool
   - Câu hỏi có thể cross-reference sách khác để đủ hard questions
5. **Sách dài** (Psalms 150 chương, Isaiah 66 chương):
   - Tăng lên 100 câu nếu muốn cover nhiều chương
   - Focus vào Psalms nổi tiếng (23, 51, 91, 119, 139)
6. **Review explanation** — đây là phần quan trọng nhất, phải chính xác
