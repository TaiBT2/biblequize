-- Repeatable seed: 2 Corinthians questions (20 diverse questions)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES

-- Easy (6)
('q-2co2-001','2 Corinthians',1,3,4,'easy','multiple_choice_single',
'Đức Chúa Trời được gọi là Đức Chúa Trời của điều gì trong 2 Cô 1?',
'["Mọi sự yên ủi", "Mọi phép lạ", "Mọi sự phán xét", "Mọi của ban cho"]',
'[0]',
'2 Cô 1:3-4: Ngài an ủi chúng ta trong mọi hoạn nạn để chúng ta an ủi kẻ khác.',
'["Tân Ước","An ủi","Hoạn nạn"]','2 Corinthians 1:3-4','vi',true,NOW(),NOW()),

('q-2co2-002','2 Corinthians',3,17,18,'easy','multiple_choice_single',
'Nơi nào có Thánh Linh của Chúa, nơi đó có điều gì?',
'["Sự tự do", "Sự phán xét", "Sự giàu có", "Sự khôn ngoan"]',
'[0]',
'2 Cô 3:17: Chúa là Thánh Linh; nơi nào có Thánh Linh của Chúa, nơi đó có sự tự do.',
'["Tân Ước","Thánh Linh","Tự do"]','2 Corinthians 3:17-18','vi',true,NOW(),NOW()),

('q-2co2-003','2 Corinthians',4,7,10,'easy','multiple_choice_single',
'Chúng ta chứa kho báu trong vật gì để quyền phép thuộc về Đức Chúa Trời?',
'["Chóe bằng đất", "Hòm bằng gỗ", "Bình bằng đá", "Chén bằng vàng"]',
'[0]',
'2 Cô 4:7: Chóe bằng đất để quyền phép dư dật là của Đức Chúa Trời, chứ không phải bởi chúng ta.',
'["Tân Ước","Yếu đuối","Quyền phép"]','2 Corinthians 4:7-10','vi',true,NOW(),NOW()),

('q-2co2-004','2 Corinthians',5,17,17,'easy','multiple_choice_single',
'Ai ở trong Đấng Christ thì trở nên điều gì?',
'["Tạo vật mới", "Công dân trời", "Thầy tế lễ", "Người khôn ngoan"]',
'[0]',
'2 Cô 5:17: Ai ở trong Đấng Christ là một tạo vật mới.',
'["Tân Ước","Đổi mới","Cứu rỗi"]','2 Corinthians 5:17','vi',true,NOW(),NOW()),

('q-2co2-005','2 Corinthians',8,1,5,'easy','multiple_choice_single',
'Hội thánh Ma-xê-đoan được khen ngợi vì điều gì?',
'["Rộng rãi trong nghèo khó", "Giàu có dâng hiến", "Khéo quản trị", "Nhiều ân tứ"]',
'[0]',
'2 Cô 8:2: Trong thử thách lớn, lòng vui mừng dồi dào và sự nghèo khổ sâu xa của họ đã tràn ra sự rộng rãi.',
'["Tân Ước","Dâng hiến","Rộng rãi"]','2 Corinthians 8:1-5','vi',true,NOW(),NOW()),

('q-2co2-006','2 Corinthians',9,6,8,'easy','multiple_choice_single',
'Nguyên tắc gieo ít/gặt ít áp dụng cho điều gì trong 2 Cô 9?',
'["Dâng hiến", "Cầu nguyện", "Ăn chay", "Giảng đạo"]',
'[0]',
'2 Cô 9:6: Ai gieo ít thì gặt ít; ai gieo nhiều thì gặt nhiều.',
'["Tân Ước","Dâng hiến","Nguyên tắc"]','2 Corinthians 9:6-8','vi',true,NOW(),NOW()),

-- Medium (10)
('q-2co2-007','2 Corinthians',1,8,11,'medium','multiple_choice_single',
'Phao-lô thuật lại kinh nghiệm gì tại A-si?',
'["Quá sức chịu đựng, nhờ đó trông cậy Chúa", "Chiến thắng oanh liệt", "Được dân khen ngợi", "Thành công tài chính"]',
'[0]',
'2 Cô 1:8-9: Chúng tôi chịu khổ quá sức, nhưng để không trông cậy chính mình, bèn trông cậy Đức Chúa Trời khiến kẻ chết sống lại.',
'["Tân Ước","Hoạn nạn","Trông cậy"]','2 Corinthians 1:8-11','vi',true,NOW(),NOW()),

('q-2co2-008','2 Corinthians',2,14,17,'medium','multiple_choice_single',
'Chúng ta là mùi thơm gì cho Đức Chúa Trời trong Đấng Christ?',
'["Mùi thơm của Đấng Christ", "Mùi hương của luật pháp", "Mùi hương của của lễ", "Mùi hương của thế gian"]',
'[0]',
'2 Cô 2:15: Chúng ta là mùi thơm của Đấng Christ cho Đức Chúa Trời giữa kẻ được cứu và kẻ hư mất.',
'["Tân Ước","Chứng đạo","Mùi thơm"]','2 Corinthians 2:14-17','vi',true,NOW(),NOW()),

('q-2co2-009','2 Corinthians',4,16,18,'medium','multiple_choice_single',
'Vì sao không chán nản trước hoạn nạn tạm thời?',
'["Vinh hiển đời đời quá lớn lao", "Vì sẽ hết sớm", "Vì được khen ngợi", "Vì được thưởng ngay"]',
'[0]',
'2 Cô 4:17-18: Hoạn nạn tạm thời nhẹ nhàng sanh ra cho chúng ta sự vinh hiển đời đời vô lượng vô biên.',
'["Tân Ước","Hy vọng","Vinh hiển"]','2 Corinthians 4:16-18','vi',true,NOW(),NOW()),

('q-2co2-010','2 Corinthians',5,18,20,'medium','multiple_choice_single',
'Chức vụ mà các tín hữu nhận lãnh trong 2 Cô 5 là gì?',
'["Chức vụ giảng hòa", "Chức vụ phép lạ", "Chức vụ cai trị", "Chức vụ giáo sư"]',
'[0]',
'2 Cô 5:18-20: Đức Chúa Trời giao cho chúng ta chức vụ giảng hòa.',
'["Tân Ước","Giảng hòa","Sứ mạng"]','2 Corinthians 5:18-20','vi',true,NOW(),NOW()),

('q-2co2-011','2 Corinthians',6,14,18,'medium','multiple_choice_single',
'Lời khuyên "chớ mang ách chung với kẻ chẳng tin" nhằm bảo vệ điều gì?',
'["Sự thánh khiết và mối thông công", "Tự do cá nhân", "Lợi ích kinh doanh", "An toàn tài chính"]',
'[0]',
'2 Cô 6:14-18: Sự công bình với gian ác, sáng với tối nào hiệp nhau được.',
'["Tân Ước","Thánh khiết","Liên hệ"]','2 Corinthians 6:14-18','vi',true,NOW(),NOW()),

('q-2co2-012','2 Corinthians',7,8,11,'medium','multiple_choice_single',
'Sự buồn rầu theo ý Đức Chúa Trời sanh ra điều gì?',
'["Sự ăn năn dẫn đến sự cứu rỗi", "Sự hối hận tạm thời", "Sự cay đắng", "Sự oán trách"]',
'[0]',
'2 Cô 7:10: Buồn rầu theo Đức Chúa Trời sanh ra sự ăn năn, không hối hận.',
'["Tân Ước","Ăn năn","Thánh hóa"]','2 Corinthians 7:8-11','vi',true,NOW(),NOW()),

('q-2co2-013','2 Corinthians',8,9,9,'medium','multiple_choice_single',
'Ân điển của Chúa Giê-su trong 2 Cô 8:9 được mô tả thế nào?',
'["Ngài vốn giàu, vì anh em trở nên nghèo", "Ngài vốn nghèo, trở nên giàu", "Ngài vốn khôn ngoan", "Ngài vốn quyền năng"]',
'[0]',
'2 Cô 8:9: Hầu cho bởi sự nghèo của Ngài mà anh em được trở nên giàu.',
'["Tân Ước","Ân điển","Hy sinh"]','2 Corinthians 8:9','vi',true,NOW(),NOW()),

('q-2co2-014','2 Corinthians',10,3,5,'medium','multiple_choice_single',
'Vũ khí của chúng ta không thuộc xác thịt nhưng có quyền năng gì?',
'["Phá đổ đồn lũy", "Bảo vệ thân thể", "Gây ảnh hưởng xã hội", "Xây dựng danh tiếng"]',
'[0]',
'2 Cô 10:4-5: Phá đổ tư tưởng và mọi sự kiêu ngạo nổi lên.',
'["Tân Ước","Thuộc linh","Chiến trận"]','2 Corinthians 10:3-5','vi',true,NOW(),NOW()),

('q-2co2-015','2 Corinthians',12,7,10,'medium','multiple_choice_single',
'Cái dằm trong xác thịt dạy Phao-lô điều gì?',
'["Ân điển Chúa đủ cho con; quyền năng nên trọn trong yếu đuối", "Phải cầu nguyện ít lại", "Phải mạnh mẽ hơn", "Phải dựa vào con người"]',
'[0]',
'2 Cô 12:9-10: Khi tôi yếu, ấy là lúc tôi mạnh.',
'["Tân Ước","Yếu đuối","Ân điển"]','2 Corinthians 12:7-10','vi',true,NOW(),NOW()),

-- Hard (4)
('q-2co2-016','2 Corinthians',4,1,6,'hard','multiple_choice_single',
'Vì đã nhận chức vụ theo lòng thương xót, Phao-lô làm gì?',
'["Chẳng ngã lòng; không xử theo mưu mẹo", "Ẩn giấu Tin Lành", "Tìm lời lẽ khôn khéo", "Chứng minh bằng dấu lạ"]',
'[0]',
'2 Cô 4:1-2: Chúng tôi không làm điều gian dối, nhưng trình bày lẽ thật.',
'["Tân Ước","Chức vụ","Chân thật"]','2 Corinthians 4:1-6','vi',true,NOW(),NOW()),

('q-2co2-017','2 Corinthians',5,10,10,'hard','multiple_choice_single',
'Ghế xét đoán của Đấng Christ nhằm mục đích gì?',
'["Nhận lại điều đã làm qua thân thể", "Phán xét để hư mất", "Phân chia chức vụ", "Xác định địa vị"]',
'[0]',
'2 Cô 5:10: Ai nấy sẽ khai trình để nhận điều lành hay dữ đã làm.',
'["Tân Ước","Phán xét","Phần thưởng"]','2 Corinthians 5:10','vi',true,NOW(),NOW()),

('q-2co2-018','2 Corinthians',11,23,30,'hard','multiple_choice_single',
'Phao-lô khoe về điều gì trong 2 Cô 11?',
'["Những sự yếu đuối", "Những phép lạ", "Những thành công", "Những triết lý"]',
'[0]',
'2 Cô 11:30: Nếu cần phải khoe, tôi sẽ khoe sự yếu đuối của tôi.',
'["Tân Ước","Khoe khoang","Yếu đuối"]','2 Corinthians 11:23-30','vi',true,NOW(),NOW()),

('q-2co2-019','2 Corinthians',13,11,11,'hard','multiple_choice_single',
'Lời chúc cuối thư 2 Cô-rinh-tô kêu gọi điều gì?',
'["Hòa thuận, hiệp ý, bình an", "Giữ luật pháp", "Sống ẩn dật", "Tránh bách hại"]',
'[0]',
'2 Cô 13:11: Hãy vui mừng, nên trọn lành, khuyên bảo nhau, đồng một ý, sống hòa thuận.',
'["Tân Ước","Kết luận","Bình an"]','2 Corinthians 13:11','vi',true,NOW(),NOW());


