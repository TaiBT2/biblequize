-- Psalms seed data: 20 questions (8 easy, 8 medium, 4 hard)
-- Source: Kinh Thanh Ban Truyen Thong 1926 (public domain)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end,
  difficulty, type, content, options, correct_answer,
  explanation, tags, source, language, review_status, approvals_count, is_active,
  created_at, updated_at
) VALUES

-- ═══════════════════════════════════════════════════════════════
-- EASY (8 questions)
-- ═══════════════════════════════════════════════════════════════

('seed-psa-001', 'Psalms', 23, 1, 1, 'easy', 'multiple_choice_single',
 'Thi Thiên 23:1 mở đầu với lời tuyên bố nào?',
 '["Đức Giê-hô-va là Đấng chăn giữ tôi","Đức Giê-hô-va là nơi nương náu tôi","Đức Giê-hô-va là ánh sáng tôi","Đức Giê-hô-va là vua tôi"]',
 '[0]',
 'Thi Thiên 23:1 — "Đức Giê-hô-va là Đấng chăn giữ tôi: tôi sẽ chẳng thiếu thốn gì."',
 '["Thi Thiên","Chăn chiên","Thi Thiên 23"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-002', 'Psalms', 23, 4, 4, 'easy', 'multiple_choice_single',
 'Dù đi trong trũng bóng chết, tác giả Thi Thiên 23 nói mình sẽ không sợ vì sao? (Thi 23:4)',
 '["Vì Chúa ở cùng tôi","Vì tôi mạnh mẽ","Vì kẻ thù đã bỏ đi","Vì trời đã sáng"]',
 '[0]',
 'Thi Thiên 23:4 — "Dầu khi tôi đi trong trũng bóng chết, tôi sẽ chẳng sợ tai họa nào; vì Chúa ở cùng tôi."',
 '["Thi Thiên","Bình an","Thi Thiên 23"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-003', 'Psalms', 1, 1, 1, 'easy', 'multiple_choice_single',
 'Thi Thiên 1:1 gọi người nào là có phước?',
 '["Người không theo mưu kế kẻ dữ","Người giàu có","Người có quyền lực","Người được mọi người yêu thích"]',
 '[0]',
 'Thi Thiên 1:1 — "Phước cho người nào chẳng theo mưu kế của kẻ dữ, chẳng đứng trong đường tội nhân."',
 '["Thi Thiên","Phước hạnh","Thi Thiên 1"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-004', 'Psalms', 119, 105, 105, 'easy', 'multiple_choice_single',
 'Thi Thiên 119:105 ví sánh Lời Chúa với vật gì?',
 '["Ngọn đèn cho chân tôi, ánh sáng cho đường lối tôi","Thanh gươm bén","Tấm khiên bảo vệ","Bánh ăn hằng ngày"]',
 '[0]',
 'Thi Thiên 119:105 — "Lời Chúa là ngọn đèn cho chân tôi, ánh sáng cho đường lối tôi."',
 '["Thi Thiên","Lời Chúa","Thi Thiên 119"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-005', 'Psalms', 100, 3, 3, 'easy', 'multiple_choice_single',
 'Thi Thiên 100:3 nói chúng ta là gì của Đức Giê-hô-va?',
 '["Dân sự Ngài, là bầy chiên của đồng cỏ Ngài","Các thiên sứ Ngài","Các vua Ngài","Các tiên tri Ngài"]',
 '[0]',
 'Thi Thiên 100:3 — "Chính Ngài đã dựng nên chúng tôi, chúng tôi thuộc về Ngài; chúng tôi là dân sự Ngài, là bầy chiên của đồng cỏ Ngài."',
 '["Thi Thiên","Thờ phượng","Thi Thiên 100"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-006', 'Psalms', 46, 1, 1, 'easy', 'multiple_choice_single',
 'Thi Thiên 46:1 gọi Đức Chúa Trời là gì?',
 '["Nơi nương náu và sức lực của chúng tôi","Đấng phán xét","Đấng chiến thắng","Vua muôn vua"]',
 '[0]',
 'Thi Thiên 46:1 — "Đức Chúa Trời là nơi nương náu và sức lực của chúng tôi, Ngài sẵn giúp đỡ trong cơn gian truân."',
 '["Thi Thiên","Nương náu","Thi Thiên 46"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-007', 'Psalms', 150, 6, 6, 'easy', 'multiple_choice_single',
 'Câu cuối cùng của sách Thi Thiên (150:6) kêu gọi ai ngợi khen Đức Giê-hô-va?',
 '["Phàm vật chi thở","Chỉ người Y-sơ-ra-ên","Chỉ các thầy tế lễ","Chỉ các thiên sứ"]',
 '[0]',
 'Thi Thiên 150:6 — "Phàm vật chi thở, hãy ngợi khen Đức Giê-hô-va!"',
 '["Thi Thiên","Ngợi khen","Thi Thiên 150"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-008', 'Psalms', 27, 1, 1, 'easy', 'multiple_choice_single',
 'Thi Thiên 27:1 gọi Đức Giê-hô-va là gì cho người viết Thi Thiên?',
 '["Ánh sáng và sự cứu rỗi của tôi","Vua và chúa của tôi","Thầy và bạn của tôi","Cha và mẹ của tôi"]',
 '[0]',
 'Thi Thiên 27:1 — "Đức Giê-hô-va là ánh sáng và sự cứu rỗi tôi: tôi sẽ sợ ai?"',
 '["Thi Thiên","Ánh sáng","Thi Thiên 27"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

-- ═══════════════════════════════════════════════════════════════
-- MEDIUM (8 questions)
-- ═══════════════════════════════════════════════════════════════

('seed-psa-009', 'Psalms', 1, 3, 3, 'medium', 'multiple_choice_single',
 'Người tin kính được ví như cây gì trong Thi Thiên 1:3?',
 '["Cây trồng gần dòng nước, ra trái đúng mùa","Cây bá hương cao trên núi","Cây ô-liu xanh tốt","Cây nho sai trái"]',
 '[0]',
 'Thi Thiên 1:3 — "Người ấy sẽ như cây trồng gần dòng nước, sanh bông trái theo thì tiết, lá nó cũng chẳng tàn héo."',
 '["Thi Thiên","Ẩn dụ","Thi Thiên 1"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-010', 'Psalms', 51, 1, 2, 'medium', 'multiple_choice_single',
 'Thi Thiên 51 được Đa-vít viết sau sự kiện nào?',
 '["Sau khi phạm tội với Bát-sê-ba","Sau khi chiến thắng Gô-li-át","Sau khi lên ngôi vua","Sau khi trốn khỏi Sau-lơ"]',
 '[0]',
 'Thi Thiên 51 (tiêu đề) — "Thi thiên của Đa-vít, làm khi tiên tri Na-than đến cùng người, sau khi người đã đi đến cùng Bát-sê-ba." (2 Sa-mu-ên 12)',
 '["Thi Thiên","Đa-vít","Ăn năn"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-011', 'Psalms', 51, 10, 10, 'medium', 'multiple_choice_single',
 'Đa-vít cầu xin Đức Chúa Trời điều gì trong Thi Thiên 51:10?',
 '["Dựng nên trong tôi một lòng trong sạch","Cho tôi thêm nhiều của cải","Đánh bại kẻ thù tôi","Cho tôi sống lâu"]',
 '[0]',
 'Thi Thiên 51:10 — "Đức Chúa Trời ôi! Xin hãy dựng nên trong tôi một lòng trong sạch, và làm cho mới lại trong tôi một thần linh ngay thẳng."',
 '["Thi Thiên","Ăn năn","Tấm lòng"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-012', 'Psalms', 46, 10, 10, 'medium', 'multiple_choice_single',
 'Thi Thiên 46:10 kêu gọi chúng ta làm gì?',
 '["Hãy yên lặng và biết rằng ta là Đức Chúa Trời","Hãy chiến đấu mạnh mẽ","Hãy chạy trốn kẻ thù","Hãy kêu la lớn tiếng"]',
 '[0]',
 'Thi Thiên 46:10 — "Hãy yên lặng và biết rằng ta là Đức Chúa Trời."',
 '["Thi Thiên","Yên lặng","Thi Thiên 46"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-013', 'Psalms', 139, 14, 14, 'medium', 'multiple_choice_single',
 'Đa-vít nói mình được dựng nên cách nào trong Thi Thiên 139:14?',
 '["Cách đáng sợ lạ lùng","Cách đơn giản","Cách bình thường","Cách tình cờ"]',
 '[0]',
 'Thi Thiên 139:14 — "Tôi cảm tạ Chúa, vì tôi được dựng nên cách đáng sợ lạ lùng. Công việc Chúa thật lạ lùng, lòng tôi biết rõ lắm."',
 '["Thi Thiên","Sáng tạo","Thi Thiên 139"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-014', 'Psalms', 103, 12, 12, 'medium', 'multiple_choice_single',
 'Thi Thiên 103:12 mô tả Đức Chúa Trời đem tội lỗi chúng ta đi xa bao nhiêu?',
 '["Phương đông xa cách phương tây bao nhiêu","Một dặm đường","Đến tận biển","Đến cuối đất"]',
 '[0]',
 'Thi Thiên 103:12 — "Phương đông xa cách phương tây bao nhiêu, thì Ngài đã đem sự vi phạm chúng tôi khỏi xa chúng tôi bấy nhiêu."',
 '["Thi Thiên","Tha thứ","Thi Thiên 103"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-015', 'Psalms', 34, 8, 8, 'medium', 'multiple_choice_single',
 'Thi Thiên 34:8 mời gọi chúng ta làm gì để biết Đức Giê-hô-va tốt lành?',
 '["Hãy nếm thử xem Đức Giê-hô-va tốt lành dường bao","Hãy đọc sách luật pháp","Hãy dâng nhiều của lễ","Hãy kiêng ăn bảy ngày"]',
 '[0]',
 'Thi Thiên 34:8 — "Khá nếm thử xem Đức Giê-hô-va tốt lành dường bao! Phước cho người nào nương náu mình nơi Ngài!"',
 '["Thi Thiên","Kinh nghiệm","Thi Thiên 34"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-016', 'Psalms', 37, 4, 4, 'medium', 'multiple_choice_single',
 'Theo Thi Thiên 37:4, khi chúng ta lấy Đức Giê-hô-va làm điều vui thích, Ngài sẽ làm gì?',
 '["Ban cho ngươi điều lòng mình ao ước","Ban cho ngươi nhiều vàng bạc","Đánh bại mọi kẻ thù","Cho ngươi sống đời đời trên đất"]',
 '[0]',
 'Thi Thiên 37:4 — "Cũng hãy khoái lạc nơi Đức Giê-hô-va, thì Ngài sẽ ban cho ngươi điều lòng mình ao ước."',
 '["Thi Thiên","Khoái lạc","Thi Thiên 37"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

-- ═══════════════════════════════════════════════════════════════
-- HARD (4 questions)
-- ═══════════════════════════════════════════════════════════════

('seed-psa-017', 'Psalms', 22, 1, 1, 'hard', 'multiple_choice_single',
 'Thi Thiên 22:1 "Đức Chúa Trời tôi ơi, sao Ngài lìa bỏ tôi?" được trích dẫn bởi ai trên thập tự giá?',
 '["Chúa Jêsus (Ma-thi-ơ 27:46)","Phi-e-rơ","Phao-lô","Giăng"]',
 '[0]',
 'Thi Thiên 22:1 — "Đức Chúa Trời tôi ơi! Đức Chúa Trời tôi ơi! Sao Ngài lìa bỏ tôi?" — Chúa Jêsus trích dẫn câu này trên thập tự giá (Ma-thi-ơ 27:46).',
 '["Thi Thiên","Tiên tri","Thập tự giá","Mê-si-a"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-018', 'Psalms', 22, 16, 18, 'hard', 'multiple_choice_single',
 'Thi Thiên 22:16-18 tiên tri về sự kiện nào xảy ra khoảng 1000 năm sau?',
 '["Chân tay bị đâm thâu, bắt thăm áo xống — sự đóng đinh Chúa Jêsus","Sự sụp đổ Ba-by-lôn","Cuộc xuất hành khỏi Ai Cập","Sự xây dựng đền thờ"]',
 '[0]',
 'Thi Thiên 22:16,18 — "Chúng nó đã xỏ lủng tay chân tôi... Chúng nó chia nhau áo xống tôi, bắt thăm về áo dài tôi." — Ứng nghiệm tại Giăng 19:23-24.',
 '["Thi Thiên","Tiên tri Mê-si-a","Đóng đinh"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-019', 'Psalms', 110, 1, 1, 'hard', 'multiple_choice_single',
 'Thi Thiên 110:1 — "Đức Giê-hô-va phán cùng Chúa tôi" — Chúa Jêsus dùng câu này để chứng minh điều gì? (Ma-thi-ơ 22:44)',
 '["Đấng Mê-si-a không chỉ là con cháu Đa-vít mà còn là Chúa của Đa-vít","Đa-vít là tiên tri vĩ đại nhất","Dòng dõi Đa-vít sẽ trị vì mãi mãi","Đền thờ sẽ được xây lại"]',
 '[0]',
 'Thi Thiên 110:1 — "Đức Giê-hô-va phán cùng Chúa tôi rằng: Hãy ngồi bên hữu ta." Chúa Jêsus dùng câu này (Ma-thi-ơ 22:43-45) để hỏi: nếu Đa-vít gọi Đấng Christ là Chúa, thì Đấng Christ có phải chỉ là con cháu Đa-vít không?',
 '["Thi Thiên","Mê-si-a","Thần học"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-psa-020', 'Psalms', 90, 1, 2, 'hard', 'multiple_choice_single',
 'Thi Thiên 90 được ghi là thi thiên của ai, là người viết Thi Thiên duy nhất không phải Đa-vít trong nhóm đầu tiên?',
 '["Môi-se","Sa-lô-môn","A-sáp","Con trai Cô-rê"]',
 '[0]',
 'Thi Thiên 90 (tiêu đề) — "Lời cầu nguyện của Môi-se, người của Đức Chúa Trời." Đây là Thi Thiên duy nhất được ghi tác giả là Môi-se.',
 '["Thi Thiên","Môi-se","Tác giả"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW());
