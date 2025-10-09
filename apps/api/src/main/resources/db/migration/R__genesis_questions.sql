-- Simple Genesis questions for testing
INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES
('q-gen-001','Genesis',1,1,1,'easy','multiple_choice_single',
'Trong câu mở đầu Kinh Thánh, "Ban đầu Đức Chúa Trời dựng nên trời đất" (Sáng 1:1), từ "ban đầu" có nghĩa gì?',
'["Thời điểm bắt đầu của thời gian", "Nguyên lý cơ bản nhất", "Điều quan trọng hàng đầu", "Khởi điểm của mọi sự"]',
'[0]',
'Ban đầu = nguyên lý cơ bản nhất, không phải thời điểm thời gian.',
'["Cựu Ước","Sáng tạo","Nguyên lý"]', 'Genesis 1:1', 'vi', true, NOW(), NOW()),
('q-gen-002','Genesis',1,2,2,'medium','multiple_choice_single',
'Trước khi Đức Chúa Trời phán "Hãy có sự sáng", tình trạng đất như thế nào?',
'["Trống không và tối tăm", "Đầy nước và tối tăm", "Khô cạn và tối tăm", "Có sự sống và tối tăm"]',
'[0]',
'Đất vốn trống không và tối tăm, chưa có hình dạng và sự sống.',
'["Cựu Ước","Sáng tạo","Tình trạng ban đầu"]', 'Genesis 1:2', 'vi', true, NOW(), NOW()),
('q-gen-003','Genesis',3,15,15,'hard','multiple_choice_single',
'Lời tiên tri về "dòng dõi người nữ" trong Sáng 3:15 ám chỉ ai?',
'["Chúa Giê-su Christ", "A-đam", "A-bên", "Nô-ê"]',
'[0]',
'Sáng 3:15 là lời tiên tri đầu tiên về Chúa Cứu Thế sẽ đến từ dòng dõi người nữ.',
'["Cựu Ước","Tiên tri","Chúa Cứu Thế"]', 'Genesis 3:15', 'vi', true, NOW(), NOW());
