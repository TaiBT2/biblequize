# Seed Data — Bible Quiz Questions

## Format

Mỗi file SQL chứa `INSERT IGNORE INTO questions` với các cột bắt buộc:

```sql
INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end,
  difficulty, type, content, options, correct_answer,
  explanation, tags, source, language, is_active,
  created_at, updated_at
) VALUES (...);
```

## Quy tắc bắt buộc

1. **ID**: Format `seed-{book}-{number}` (ví dụ: `seed-gen-001`)
2. **4 fields bắt buộc**: `content`, `options`, `correct_answer`, `explanation`
3. **explanation**: Phải có trích dẫn câu Kinh Thánh cụ thể (sách chương:câu)
4. **Tỷ lệ difficulty**: 40% easy, 40% medium, 20% hard
5. **Bản dịch**: Bản Truyền Thống 1926 (public domain)
6. **options**: JSON array 4 lựa chọn: `'["A","B","C","D"]'`
7. **correct_answer**: JSON array index: `'[0]'` = đáp án A
8. **type**: Luôn dùng `multiple_choice_single` cho seed data
9. **language**: `'vi'`
10. **Idempotent**: Dùng `INSERT IGNORE INTO` để chạy lại an toàn

## Thêm sách mới

1. Tạo file `scripts/seed/{book}.sql`
2. Tuân thủ format trên, tối thiểu 20 câu/sách
3. Chạy validate: `mysql -u root -p biblequiz < scripts/utils/validate_seed.sql`
4. Chạy seed: `mysql -u root -p biblequiz < scripts/seed/{book}.sql`

## Kiểm tra pool size

```bash
mysql -u root -p -P 3307 biblequiz < scripts/utils/validate_seed.sql
```

Ranked mode yêu cầu mỗi sách phải có:
- >= 30 câu easy
- >= 20 câu medium
- >= 10 câu hard
