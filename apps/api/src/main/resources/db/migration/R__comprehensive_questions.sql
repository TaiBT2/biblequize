-- Repeatable seed: comprehensive questions (partial contents from resources/comprehensive-questions.sql)
-- Câu hỏi trắc nghiệm Kinh Thánh chất lượng cao
-- Tạo bởi chuyên gia Kinh Thánh và sáng tạo nội dung học tập

-- Câu hỏi về Sáng Thế Ký (Genesis) - 20 câu
INSERT IGNORE INTO questions (id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at) VALUES

-- Câu hỏi dễ (6 câu)
('q-gen-001', 'Genesis', 1, 1, 1, 'easy', 'multiple_choice_single',
'Trong câu đầu tiên của Kinh Thánh, "Ban đầu Đức Chúa Trời dựng nên trời đất" (Sáng 1:1), từ "ban đầu" trong tiếng Hê-bơ-rơ có nghĩa gì?',
'["Beresheet - Khởi nguyên tuyệt đối", "Rishon - Thứ nhất", "Tachlit - Mục đích", "Techilah - Bắt đầu"]',
'[0]',
'Beresheet (בראשית) có nghĩa là "khởi nguyên tuyệt đối", không chỉ là thời gian mà còn là nguyên lý cơ bản của vũ trụ.',
'["Cựu Ước", "Ngôn ngữ", "Khởi nguyên"]',
'Genesis 1:1',
'vi',
true,
NOW(),
NOW());


