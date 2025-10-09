-- Repeatable seed: more questions (contents from resources/more-questions.sql)
-- Câu hỏi bổ sung cho Bible Quiz - Nội dung sâu sắc và thú vị

-- Câu hỏi về Châm Ngôn (Proverbs)
INSERT IGNORE INTO questions (id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at) VALUES
('q-pro-001', 'Proverbs', 3, 5, 6, 'easy', 'multiple_choice_single',
'Trong Châm Ngôn 3:5-6, "Hãy hết lòng tin cậy Đức Giê-hô-va, chớ nương cậy nơi sự thông sáng của con". Từ "tin cậy" trong tiếng Hê-bơ-rơ có nghĩa gì?',
'["Batah - Tin cậy, nương dựa", "Aman - Tin tưởng", "Chasah - Ẩn náu", "Yachal - Hy vọng"]',
'[0]',
'Batah (בטח) có nghĩa là "tin cậy, nương dựa", không chỉ tin mà còn dựa vào hoàn toàn.',
'["Châm Ngôn", "Sự khôn ngoan", "Ngôn ngữ Hê-bơ-rơ"]',
'Wisdom Literature',
'vi',
true,

NOW(),
NOW()),

('q-pro-002', 'Proverbs', 31, 10, 10, 'medium', 'multiple_choice_single',
'Trong Châm Ngôn 31:10, "Người đàn bà tài đức ai sẽ tìm được?" Từ "tài đức" trong tiếng Hê-bơ-rơ có nghĩa gì?',
'["Chayil - Sức mạnh, quyền năng", "Tov - Tốt lành", "Yashar - Ngay thẳng", "Chakam - Khôn ngoan"]',
'[0]',
'Chayil (חיל) có nghĩa là "sức mạnh, quyền năng", không chỉ tài năng mà còn có sức mạnh nội tại.',
'["Châm Ngôn", "Người đàn bà tài đức", "Ngôn ngữ Hê-bơ-rơ"]',
'Wisdom Literature',
'vi',
true,

NOW(),
NOW()),

-- Câu hỏi về Ê-sai (Isaiah)
('q-isa-001', 'Isaiah', 9, 6, 6, 'easy', 'multiple_choice_single',
'Trong Ê-sai 9:6, "Vì có một con trẻ sanh cho chúng ta". Từ "con trẻ" trong tiếng Hê-bơ-rơ có nghĩa gì?',
'["Yeled - Con trẻ", "Naar - Thiếu niên", "Bachur - Thanh niên", "Zaken - Người già"]',
'[0]',
'Yeled (ילד) có nghĩa là "con trẻ", ám chỉ đến Chúa Giê-su được sinh ra như một em bé.',
'["Ê-sai", "Tiên tri Mê-si-a", "Ngôn ngữ Hê-bơ-rơ"]',
'Messianic Prophecy',
'vi',
true,

NOW(),
NOW()),

('q-isa-002', 'Isaiah', 53, 5, 5, 'hard', 'multiple_choice_single',
'Trong Ê-sai 53:5, "Người đã bị vì tội lỗi chúng ta mà bị thương". Từ "bị thương" trong tiếng Hê-bơ-rơ có nghĩa gì?',
'["Chalal - Bị đâm thủng, bị thương", "Naga - Chạm đến", "Ra - Xấu", "Aven - Tội lỗi"]',
'[0]',
'Chalal (חלל) có nghĩa là "bị đâm thủng, bị thương", ám chỉ đến sự chết của Chúa Giê-su trên thập tự.',
'["Ê-sai", "Tiên tri Mê-si-a", "Ngôn ngữ Hê-bơ-rơ"]',
'Messianic Prophecy',
'vi',
true,

NOW(),
NOW()),

-- Câu hỏi về Lu-ca (Luke)
('q-luk-001', 'Luke', 2, 14, 14, 'easy', 'multiple_choice_single',
'Trong Lu-ca 2:14, "Vinh quang cho Đức Chúa Trời trên các từng trời". Từ "vinh quang" trong tiếng Hy Lạp có nghĩa gì?',
'["Doxa - Vinh quang, danh tiếng", "Time - Danh dự", "Kleos - Tiếng tăm", "Ainos - Ca ngợi"]',
'[0]',
'Doxa (δόξα) có nghĩa là "vinh quang, danh tiếng", sự vinh hiển và uy nghi của Đức Chúa Trời.',
'["Lu-ca", "Giáng sinh", "Ngôn ngữ Hy Lạp"]',
'Gospel Studies',
'vi',
true,

NOW(),
NOW()),

('q-luk-002', 'Luke', 15, 20, 20, 'medium', 'multiple_choice_single',
'Trong Lu-ca 15:20, "Cha chạy ra ôm lấy con". Từ "chạy ra" trong tiếng Hy Lạp có nghĩa gì?',
'["Dramo - Chạy nhanh", "Badizo - Đi bộ", "Peripateo - Đi dạo", "Erechomai - Đến"]',
'[0]',
'Dramo (δραμών) có nghĩa là "chạy nhanh", thể hiện sự vội vàng và tình yêu của người cha.',
'["Lu-ca", "Người con hoang đàng", "Ngôn ngữ Hy Lạp"]',
'Gospel Studies',
'vi',
true,

NOW(),
NOW()),

-- Câu hỏi về Công Vụ (Acts)
('q-act-001', 'Acts', 2, 4, 4, 'easy', 'multiple_choice_single',
'Trong Công Vụ 2:4, "Hết thảy đều được đầy dẫy Đức Thánh Linh". Từ "đầy dẫy" trong tiếng Hy Lạp có nghĩa gì?',
'["Pimplemi - Đầy tràn", "Pleroo - Làm đầy", "Gemizo - Chứa đầy", "Chortazo - No đủ"]',
'[0]',
'Pimplemi (πίμπλημι) có nghĩa là "đầy tràn", không chỉ đầy mà còn tràn ra ngoài.',
'["Công Vụ", "Đức Thánh Linh", "Ngôn ngữ Hy Lạp"]',
'Acts Studies',
'vi',
true,

NOW(),
NOW()),

('q-act-002', 'Acts', 9, 15, 15, 'medium', 'multiple_choice_single',
'Trong Công Vụ 9:15, Chúa phán về Phao-lô "Người này là đồ dùng ta đã chọn". Từ "đồ dùng" trong tiếng Hy Lạp có nghĩa gì?',
'["Skeuos - Đồ dùng, khí cụ", "Organon - Công cụ", "Ergon - Công việc", "Douleia - Sự phục vụ"]',
'[0]',
'Skeuos (σκεῦος) có nghĩa là "đồ dùng, khí cụ", ám chỉ đến Phao-lô như một công cụ của Đức Chúa Trời.',
'["Công Vụ", "Phao-lô", "Ngôn ngữ Hy Lạp"]',
'Acts Studies',
'vi',
true,

NOW(),
NOW()),

-- Câu hỏi về 1 Cô-rinh-tô (1 Corinthians)
('q-1co-001', '1 Corinthians', 13, 4, 4, 'easy', 'multiple_choice_single',
'Trong 1 Cô-rinh-tô 13:4, "Tình yêu thương hay nhịn nhục". Từ "nhịn nhục" trong tiếng Hy Lạp có nghĩa gì?',
'["Makrothumeo - Nhịn nhục lâu dài", "Hupomeno - Chịu đựng", "Anechomai - Chịu đựng", "Kartereo - Kiên trì"]',
'[0]',
'Makrothumeo (μακροθυμέω) có nghĩa là "nhịn nhục lâu dài", không chỉ chịu đựng mà còn kiên nhẫn.',
'["1 Cô-rinh-tô", "Tình yêu", "Ngôn ngữ Hy Lạp"]',
'Pauline Studies',
'vi',
true,

NOW(),
NOW()),

('q-1co-002', '1 Corinthians', 15, 55, 55, 'hard', 'multiple_choice_single',
'Trong 1 Cô-rinh-tô 15:55, "Hỡi sự chết, sự thắng của mầy ở đâu?" Từ "thắng" trong tiếng Hy Lạp có nghĩa gì?',
'["Nikos - Chiến thắng", "Trophe - Thức ăn", "Broma - Thức ăn", "Stinger - Cái nọc"]',
'[0]',
'Nikos (νῖκος) có nghĩa là "chiến thắng", sự chết đã bị đánh bại bởi sự sống lại của Chúa Giê-su.',
'["1 Cô-rinh-tô", "Sự sống lại", "Ngôn ngữ Hy Lạp"]',
'Pauline Studies',
'vi',
true,

NOW(),
NOW()),

-- Câu hỏi về Ê-phê-sô (Ephesians)
('q-eph-001', 'Ephesians', 2, 8, 8, 'easy', 'multiple_choice_single',
'Trong Ê-phê-sô 2:8, "Ấy là nhờ ân điển mà các con được cứu". Từ "ân điển" trong tiếng Hy Lạp có nghĩa gì?',
'["Charis - Ân điển, ơn huệ", "Eleos - Lòng thương xót", "Agape - Tình yêu", "Dikaiosune - Sự công bình"]',
'[0]',
'Charis (χάρις) có nghĩa là "ân điển, ơn huệ", sự ban cho không xứng đáng của Đức Chúa Trời.',
'["Ê-phê-sô", "Ân điển", "Ngôn ngữ Hy Lạp"]',
'Pauline Studies',
'vi',
true,

NOW(),
NOW()),

('q-eph-002', 'Ephesians', 6, 12, 12, 'medium', 'multiple_choice_single',
'Trong Ê-phê-sô 6:12, "Vì chúng ta đánh trận không phải với thịt và huyết". Từ "đánh trận" trong tiếng Hy Lạp có nghĩa gì?',
'["Pale - Vật lộn, đấu tranh", "Polemos - Chiến tranh", "Machomai - Đánh nhau", "Agon - Cuộc thi đấu"]',
'[0]',
'Pale (πάλη) có nghĩa là "vật lộn, đấu tranh", cuộc chiến tâm linh cá nhân và nội tại.',
'["Ê-phê-sô", "Cuộc chiến tâm linh", "Ngôn ngữ Hy Lạp"]',
'Pauline Studies',
'vi',
true,

NOW(),
NOW());


