-- Matthew seed data: 20 questions (8 easy, 8 medium, 4 hard)
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

('seed-mat-001', 'Matthew', 1, 21, 21, 'easy', 'multiple_choice_single',
 'Thiên sứ bảo Giô-sép đặt tên con trẻ là gì? (Ma-thi-ơ 1:21)',
 '["Jêsus","Giăng","Đa-vít","Ê-li"]',
 '[0]',
 'Ma-thi-ơ 1:21 — "Người sẽ sanh một trai, ngươi khá đặt tên là Jêsus, vì chính con trai ấy sẽ cứu dân mình ra khỏi tội."',
 '["Ma-thi-ơ","Giáng sinh","Chúa Jêsus"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-002', 'Matthew', 2, 1, 1, 'easy', 'multiple_choice_single',
 'Chúa Jêsus được sanh ra tại thành nào? (Ma-thi-ơ 2:1)',
 '["Bết-lê-hem","Na-xa-rét","Giê-ru-sa-lem","Ca-bê-na-um"]',
 '[0]',
 'Ma-thi-ơ 2:1 — "Khi Đức Chúa Jêsus đã sanh tại thành Bết-lê-hem, xứ Giu-đê."',
 '["Ma-thi-ơ","Giáng sinh","Bết-lê-hem"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-003', 'Matthew', 3, 13, 16, 'easy', 'multiple_choice_single',
 'Ai đã làm phép báp-tem cho Chúa Jêsus? (Ma-thi-ơ 3:13)',
 '["Giăng Báp-tít","Phi-e-rơ","Gia-cơ","An-drê"]',
 '[0]',
 'Ma-thi-ơ 3:13 — "Khi ấy, Đức Chúa Jêsus từ xứ Ga-li-lê đến cùng Giăng tại sông Giô-đanh, đặng chịu người làm phép báp-tem."',
 '["Ma-thi-ơ","Báp-tem","Giăng Báp-tít"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-004', 'Matthew', 4, 19, 19, 'easy', 'multiple_choice_single',
 'Chúa Jêsus hứa sẽ làm Si-môn và Anh-rê trở nên gì? (Ma-thi-ơ 4:19)',
 '["Tay đánh lưới người","Vua","Thầy tế lễ","Tiên tri"]',
 '[0]',
 'Ma-thi-ơ 4:19 — "Hãy theo ta, ta sẽ cho các ngươi nên tay đánh lưới người."',
 '["Ma-thi-ơ","Môn đồ","Kêu gọi"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-005', 'Matthew', 6, 9, 9, 'easy', 'multiple_choice_single',
 'Bài cầu nguyện chung (Bài cầu nguyện Chúa dạy) bắt đầu bằng câu nào? (Ma-thi-ơ 6:9)',
 '["Lạy Cha chúng tôi ở trên trời","Lạy Đức Chúa Trời toàn năng","Hỡi Đức Giê-hô-va","Lạy Chúa, xin thương xót"]',
 '[0]',
 'Ma-thi-ơ 6:9 — "Vậy các ngươi hãy cầu như vầy: Lạy Cha chúng tôi ở trên trời."',
 '["Ma-thi-ơ","Cầu nguyện","Bài giảng trên núi"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-006', 'Matthew', 14, 19, 21, 'easy', 'multiple_choice_single',
 'Chúa Jêsus cho bao nhiêu người ăn no với năm cái bánh và hai con cá? (Ma-thi-ơ 14:21)',
 '["Năm ngàn người đàn ông","Ba ngàn người","Một ngàn người","Mười ngàn người"]',
 '[0]',
 'Ma-thi-ơ 14:21 — "Số người ăn ước chừng năm ngàn, không kể đàn bà con nít."',
 '["Ma-thi-ơ","Phép lạ","Năm ngàn người"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-007', 'Matthew', 16, 16, 16, 'easy', 'multiple_choice_single',
 'Phi-e-rơ xưng nhận Chúa Jêsus là ai? (Ma-thi-ơ 16:16)',
 '["Đấng Christ, Con Đức Chúa Trời hằng sống","Một tiên tri lớn","Giăng Báp-tít sống lại","Ê-li"]',
 '[0]',
 'Ma-thi-ơ 16:16 — "Si-môn Phi-e-rơ thưa rằng: Chúa là Đấng Christ, con Đức Chúa Trời hằng sống."',
 '["Ma-thi-ơ","Phi-e-rơ","Đấng Christ"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-008', 'Matthew', 28, 6, 6, 'easy', 'multiple_choice_single',
 'Thiên sứ nói gì với các phụ nữ tại mộ trống? (Ma-thi-ơ 28:6)',
 '["Ngài không ở đây đâu, Ngài đã sống lại","Hãy đi tìm nơi khác","Ngài đã về trời","Hãy chờ ở đây"]',
 '[0]',
 'Ma-thi-ơ 28:6 — "Ngài không ở đây đâu; Ngài đã sống lại rồi, như lời Ngài đã phán."',
 '["Ma-thi-ơ","Phục sinh","Mộ trống"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

-- ═══════════════════════════════════════════════════════════════
-- MEDIUM (8 questions)
-- ═══════════════════════════════════════════════════════════════

('seed-mat-009', 'Matthew', 2, 11, 11, 'medium', 'multiple_choice_single',
 'Các nhà thông thái từ phương Đông đem theo mấy lễ vật dâng cho Chúa Jêsus? (Ma-thi-ơ 2:11)',
 '["Ba lễ vật: vàng, nhũ hương, mộc dược","Hai lễ vật: vàng và bạc","Bốn lễ vật","Một lễ vật: vàng"]',
 '[0]',
 'Ma-thi-ơ 2:11 — "Họ bèn mở rương ra, dâng cho Ngài các lễ vật: vàng, nhũ hương, và mộc dược."',
 '["Ma-thi-ơ","Giáng sinh","Nhà thông thái"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-010', 'Matthew', 4, 1, 4, 'medium', 'multiple_choice_single',
 'Chúa Jêsus bị ma quỉ cám dỗ sau khi kiêng ăn bao lâu trong đồng vắng? (Ma-thi-ơ 4:1-2)',
 '["40 ngày 40 đêm","7 ngày","30 ngày","12 ngày"]',
 '[0]',
 'Ma-thi-ơ 4:1-2 — "Đức Chúa Jêsus được Đức Thánh Linh đưa đến nơi đồng vắng... Ngài đã kiêng ăn bốn mươi ngày bốn mươi đêm rồi, sau thì đói."',
 '["Ma-thi-ơ","Cám dỗ","Đồng vắng"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-011', 'Matthew', 5, 3, 3, 'medium', 'multiple_choice_single',
 'Phước hạnh đầu tiên trong Bài giảng trên núi dành cho ai? (Ma-thi-ơ 5:3)',
 '["Kẻ có lòng khó khăn","Kẻ giàu có","Kẻ mạnh mẽ","Kẻ khôn ngoan"]',
 '[0]',
 'Ma-thi-ơ 5:3 — "Phước cho những kẻ có lòng khó khăn, vì nước thiên đàng là của những kẻ ấy!"',
 '["Ma-thi-ơ","Bài giảng trên núi","Phước hạnh"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-012', 'Matthew', 7, 24, 25, 'medium', 'multiple_choice_single',
 'Trong ẩn dụ hai nền nhà, người khôn ngoan xây nhà trên gì? (Ma-thi-ơ 7:24)',
 '["Hòn đá","Đất cát","Đồi cao","Bên sông"]',
 '[0]',
 'Ma-thi-ơ 7:24 — "Ai nghe và làm theo lời ta phán đây, sánh được cùng một người khôn ngoan cất nhà mình trên hòn đá."',
 '["Ma-thi-ơ","Ẩn dụ","Bài giảng trên núi"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-013', 'Matthew', 13, 3, 8, 'medium', 'multiple_choice_single',
 'Trong thí dụ về người gieo giống, hạt giống rơi trên đất tốt đem lại kết quả gì? (Ma-thi-ơ 13:8)',
 '["Trái một hột ra một trăm, hột khác sáu chục, hột khác ba chục","Tất cả ra một trăm","Không ra trái","Chỉ ra ba chục"]',
 '[0]',
 'Ma-thi-ơ 13:8 — "Lại có hột rơi nhằm chỗ đất tốt, thì sanh trái, hột thì một trăm, hột thì sáu chục, hột thì ba chục."',
 '["Ma-thi-ơ","Thí dụ","Người gieo giống"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-014', 'Matthew', 17, 1, 2, 'medium', 'multiple_choice_single',
 'Chúa Jêsus đem ba môn đồ nào lên núi khi Ngài hóa hình? (Ma-thi-ơ 17:1)',
 '["Phi-e-rơ, Gia-cơ, Giăng","Phi-e-rơ, An-drê, Giăng","Ma-thi-ơ, Gia-cơ, Giăng","Phi-e-rơ, Gia-cơ, Thô-ma"]',
 '[0]',
 'Ma-thi-ơ 17:1 — "Đức Chúa Jêsus đem Phi-e-rơ, Gia-cơ, và Giăng là em Gia-cơ, cùng Ngài đi riêng ra, đưa lên trên núi cao."',
 '["Ma-thi-ơ","Hóa hình","Môn đồ"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-015', 'Matthew', 26, 15, 15, 'medium', 'multiple_choice_single',
 'Giu-đa nhận bao nhiêu tiền để phản Chúa Jêsus? (Ma-thi-ơ 26:15)',
 '["Ba mươi miếng bạc","Mười miếng vàng","Năm mươi miếng bạc","Một trăm đơ-ni-ê"]',
 '[0]',
 'Ma-thi-ơ 26:15 — "Các ngươi muốn cho tôi bao nhiêu đặng tôi nộp người cho? Họ bèn trả cho hắn ba mươi miếng bạc."',
 '["Ma-thi-ơ","Giu-đa","Thương khó"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-016', 'Matthew', 27, 46, 46, 'medium', 'multiple_choice_single',
 'Trên thập tự giá, Chúa Jêsus kêu lên rằng "Ê-li, Ê-li, lam-ma sa-bách-ta-ni" nghĩa là gì? (Ma-thi-ơ 27:46)',
 '["Đức Chúa Trời tôi ơi, sao Ngài lìa bỏ tôi?","Lạy Cha, xin tha tội cho họ","Mọi sự đã được trọn","Tôi khát"]',
 '[0]',
 'Ma-thi-ơ 27:46 — "Đức Chúa Trời tôi ơi! Đức Chúa Trời tôi ơi! Sao Ngài lìa bỏ tôi?"',
 '["Ma-thi-ơ","Thập tự giá","Thương khó"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

-- ═══════════════════════════════════════════════════════════════
-- HARD (4 questions)
-- ═══════════════════════════════════════════════════════════════

('seed-mat-017', 'Matthew', 1, 1, 17, 'hard', 'multiple_choice_single',
 'Gia phả trong Ma-thi-ơ 1:1-17 chia thành 3 giai đoạn, mỗi giai đoạn có bao nhiêu đời? (Ma-thi-ơ 1:17)',
 '["14 đời mỗi giai đoạn","12 đời mỗi giai đoạn","10 đời mỗi giai đoạn","7 đời mỗi giai đoạn"]',
 '[0]',
 'Ma-thi-ơ 1:17 — "Như vậy, từ Áp-ra-ham đến Đa-vít, hết thảy có mười bốn đời; từ Đa-vít đến khi bị đày qua Ba-by-lôn, cũng có mười bốn đời; và từ khi bị đày qua Ba-by-lôn đến Đấng Christ, lại cũng có mười bốn đời."',
 '["Ma-thi-ơ","Gia phả","Mê-si-a"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-018', 'Matthew', 5, 17, 17, 'hard', 'multiple_choice_single',
 'Chúa Jêsus phán Ngài đến để làm gì với luật pháp và các tiên tri? (Ma-thi-ơ 5:17)',
 '["Không phải để phá bỏ mà để làm cho trọn","Để thay thế bằng luật mới","Để hủy bỏ hoàn toàn","Để sửa đổi cho phù hợp"]',
 '[0]',
 'Ma-thi-ơ 5:17 — "Các ngươi đừng tưởng ta đến đặng phá luật pháp hay là lời tiên tri; ta đến, không phải để phá, song để làm cho trọn."',
 '["Ma-thi-ơ","Luật pháp","Bài giảng trên núi"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-019', 'Matthew', 22, 37, 40, 'hard', 'multiple_choice_single',
 'Chúa Jêsus nói điều răn lớn hơn hết là gì? Và điều răn thứ hai giống điều thứ nhất là gì? (Ma-thi-ơ 22:37-40)',
 '["Hết lòng yêu Chúa, và yêu kẻ lân cận như mình","Giữ ngày Sa-bát, và dâng phần mười","Không giết người, và không trộm cắp","Thờ một Đức Chúa Trời, và hiếu kính cha mẹ"]',
 '[0]',
 'Ma-thi-ơ 22:37-39 — "Ngươi hãy hết lòng, hết linh hồn, hết ý mà yêu mến Chúa, là Đức Chúa Trời ngươi. Ấy là điều răn lớn hơn hết. Còn điều răn thứ hai giống điều ấy: Ngươi hãy yêu kẻ lân cận như mình."',
 '["Ma-thi-ơ","Điều răn","Yêu thương"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-mat-020', 'Matthew', 28, 19, 20, 'hard', 'multiple_choice_single',
 'Trong Đại Mạng Lệnh, Chúa Jêsus bảo môn đồ làm phép báp-tem nhân danh ai? (Ma-thi-ơ 28:19)',
 '["Nhân danh Đức Cha, Đức Con, và Đức Thánh Linh","Nhân danh Chúa Jêsus","Nhân danh Đức Giê-hô-va","Nhân danh Đức Chúa Trời"]',
 '[0]',
 'Ma-thi-ơ 28:19 — "Vậy, hãy đi dạy dỗ muôn dân, hãy nhân danh Đức Cha, Đức Con, và Đức Thánh Linh mà làm phép báp-tem cho họ."',
 '["Ma-thi-ơ","Đại Mạng Lệnh","Ba Ngôi"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW());
