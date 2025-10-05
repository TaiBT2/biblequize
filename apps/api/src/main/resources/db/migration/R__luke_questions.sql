-- Repeatable seed: Luke questions (20 diverse questions)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES

-- Easy (6)
('q-luk-001','Luke',1,26,38,'easy','multiple_choice_single',
'Thiên sứ truyền tin cho ai về việc sinh ra Chúa Giê-su?',
'["Ma-ri", "Ê-li-sa-bét", "Ma-tha", "Sa-ra"]',
'[0]',
'Lu-ca 1:26-38: Thiên sứ Gáp-ri-ên báo tin cho Ma-ri.',
'["Tân Ước","Giáng sinh","Thiên sứ"]','Luke 1:26-38','vi',true,NOW(),NOW()),

('q-luk-002','Luke',2,8,14,'easy','multiple_choice_single',
'Ai là những người đầu tiên nhận tin vui Giáng sinh từ thiên sứ?',
'["Các gã chăn chiên", "Các đạo sĩ", "Các thầy tế lễ", "Những người La-mã"]',
'[0]',
'Lu-ca 2:8-14: Các gã chăn chiên nghe thiên sứ báo tin vui.',
'["Tân Ước","Giáng sinh","Tin mừng"]','Luke 2:8-14','vi',true,NOW(),NOW()),

('q-luk-003','Luke',3,21,22,'easy','multiple_choice_single',
'Khi Chúa Giê-su chịu báp-têm, Thánh Linh ngự xuống như gì?',
'["Chim bồ câu", "Lưỡi như lửa", "Mây", "Gió mạnh"]',
'[0]',
'Lu-ca 3:22: Thánh Linh ngự xuống như hình chim bồ câu.',
'["Tân Ước","Báp-têm","Thánh Linh"]','Luke 3:21-22','vi',true,NOW(),NOW()),

('q-luk-004','Luke',5,1,11,'easy','multiple_choice_single',
'Phép lạ nào khiến Phi-e-rơ quỳ xuống thưa: "Lạy Chúa, xin lìa khỏi con"?',
'["Mẻ cá lạ", "Chữa lành mẹ vợ", "Đuổi quỷ", "Làm yên bão"]',
'[0]',
'Lu-ca 5:6-8: Mẻ cá lạ khiến Phi-e-rơ run sợ trước thánh khiết.',
'["Tân Ước","Phép lạ","Môn đồ"]','Luke 5:1-11','vi',true,NOW(),NOW()),

('q-luk-005','Luke',6,27,36,'easy','multiple_choice_single',
'Chúa Giê-su dạy gì về kẻ thù?',
'["Hãy yêu kẻ thù mình", "Hãy tránh xa", "Hãy tố cáo", "Hãy trừng phạt"]',
'[0]',
'Lu-ca 6:27: Hãy yêu kẻ thù mình, làm ơn cho kẻ ghét mình.',
'["Tân Ước","Đạo đức","Tình yêu"]','Luke 6:27-36','vi',true,NOW(),NOW()),

('q-luk-006','Luke',11,1,4,'easy','multiple_choice_single',
'Lời cầu nguyện mẫu Chúa dạy được gọi là gì?',
'["Bài cầu nguyện chung (Lạy Cha)", "Thi thiên của Đa-vít", "Lời chúc phước", "Kinh xưng tội"]',
'[0]',
'Lu-ca 11:2-4: Lời cầu nguyện: "Lạy Cha chúng tôi ở trên trời..."',
'["Tân Ước","Cầu nguyện","Khuôn mẫu"]','Luke 11:1-4','vi',true,NOW(),NOW()),

-- Medium (10)
('q-luk-007','Luke',7,36,50,'medium','multiple_choice_single',
'Người nữ có tội đã làm gì với chân Chúa Giê-su trong nhà Si-môn?',
'["Khóc ướt và lau bằng tóc, xức dầu", "Rửa bằng nước thơm", "Cởi giày", "Thay băng chân"]',
'[0]',
'Lu-ca 7:38: Khóc, lau bằng tóc, hôn chân, xức dầu thơm.',
'["Tân Ước","Ăn năn","Tha thứ"]','Luke 7:36-50','vi',true,NOW(),NOW()),

('q-luk-008','Luke',8,4,15,'medium','multiple_choice_single',
'Trong dụ ngôn người gieo giống, hạt rơi nơi vệ đường bị điều gì?',
'["Chim ăn mất", "Nắng đốt cháy", "Gai nghẹt", "Nước cuốn trôi"]',
'[0]',
'Lu-ca 8:5,12: Chim trời ăn mất; kẻ ác cướp đi lời khỏi lòng.',
'["Tân Ước","Dụ ngôn","Tấm lòng"]','Luke 8:4-15','vi',true,NOW(),NOW()),

('q-luk-009','Luke',9,28,36,'medium','multiple_choice_single',
'Những ai hiện ra trong sự kiện hóa hình theo Lu-ca?',
'["Môi-se và Ê-li", "Áp-ra-ham và Môi-se", "Đa-vít và Sa-lô-môn", "Ê-sai và Giê-rê-mi"]',
'[0]',
'Lu-ca 9:30: Hai người là Môi-se và Ê-li.',
'["Tân Ước","Vinh hiển","Tiên tri"]','Luke 9:28-36','vi',true,NOW(),NOW()),

('q-luk-010','Luke',10,25,37,'medium','multiple_choice_single',
'Trong dụ ngôn Người Sa-ma-ri nhân lành, ai đã giúp người bị nạn?',
'["Người Sa-ma-ri", "Thầy tế lễ", "Thầy Lê-vi", "Quan tòa"]',
'[0]',
'Lu-ca 10:33: Người Sa-ma-ri thấy thì động lòng thương xót.',
'["Tân Ước","Dụ ngôn","Láng giềng"]','Luke 10:25-37','vi',true,NOW(),NOW()),

('q-luk-011','Luke',12,22,34,'medium','multiple_choice_single',
'Chúa Giê-su dạy về mối quan tâm đối với đồ ăn, áo mặc như thế nào?',
'["Đừng lo lắng, trước hết tìm Nước Đức Chúa Trời", "Phải dự trữ cho đủ", "Lo xa là khôn ngoan", "Làm giàu trước"]',
'[0]',
'Lu-ca 12:29-31: Trước hết hãy tìm Nước Đức Chúa Trời.',
'["Tân Ước","Đức tin","Ưu tiên"]','Luke 12:22-34','vi',true,NOW(),NOW()),

('q-luk-012','Luke',14,7,14,'medium','multiple_choice_single',
'Trong bài học về chỗ ngồi, Chúa dạy điều gì?',
'["Hãy khiêm nhường chọn chỗ dưới", "Hãy chọn chỗ nhất", "Hãy đến sớm", "Hãy mời người quyền thế"]',
'[0]',
'Lu-ca 14:10: Hãy xuống chỗ rốt, để chủ nhà bảo: bạn ơi, lên trên.',
'["Tân Ước","Khiêm nhường","Tiệc cưới"]','Luke 14:7-14','vi',true,NOW(),NOW()),

('q-luk-013','Luke',15,11,32,'medium','multiple_choice_single',
'Trong dụ ngôn người con hoang đàng, người cha làm gì khi con trở về?',
'["Chạy ra ôm hôn và tổ chức tiệc", "Khiển trách nặng", "Bắt làm tôi tớ", "Từ chối nhận"]',
'[0]',
'Lu-ca 15:20-24: Cha động lòng thương, chạy ra ôm hôn, mở tiệc.',
'["Tân Ước","Dụ ngôn","Ân điển"]','Luke 15:11-32','vi',true,NOW(),NOW()),

('q-luk-014','Luke',16,19,31,'medium','multiple_choice_single',
'Trong câu chuyện người giàu và La-xa-rơ, sau khi chết họ ở đâu?',
'["Người giàu ở nơi khổ hình, La-xa-rơ trong lòng Áp-ra-ham", "Cả hai ở thiên đàng", "Cả hai ở âm phủ", "Đổi chỗ cho nhau"]',
'[0]',
'Lu-ca 16:22-23: Người giàu ở nơi khổ hình; La-xa-rơ ở lòng Áp-ra-ham.',
'["Tân Ước","Dụ ngôn","Hậu xét"]','Luke 16:19-31','vi',true,NOW(),NOW()),

('q-luk-015','Luke',18,1,8,'medium','multiple_choice_single',
'Dụ ngôn quan tòa bất công dạy điều gì về cầu nguyện?',
'["Phải bền lòng cầu nguyện", "Cầu nguyện ngắn gọn", "Cầu nguyện tại đền thờ", "Cầu nguyện vào ban đêm"]',
'[0]',
'Lu-ca 18:1: Ngài phán phải cầu nguyện luôn, chớ hề nản chí.',
'["Tân Ước","Cầu nguyện","Kiên trì"]','Luke 18:1-8','vi',true,NOW(),NOW()),

('q-luk-016','Luke',19,1,10,'medium','multiple_choice_single',
'Xa-chê là ai và đã làm gì sau khi gặp Chúa?',
'["Trưởng ty thu thuế, hoàn trả và bố thí", "Thầy tế lễ, dâng tế lễ", "Ký lục, chép luật", "Thương gia, xây hội quán"]',
'[0]',
'Lu-ca 19:2,8: Xa-chê hứa trả gấp bốn và cho người nghèo.',
'["Tân Ước","Ăn năn","Cải hóa"]','Luke 19:1-10','vi',true,NOW(),NOW()),

-- Hard (4)
('q-luk-017','Luke',20,20,26,'hard','multiple_choice_single',
'Chúa Giê-su trả lời thế nào về việc nộp thuế cho Sê-sa?',
'["Của Sê-sa trả cho Sê-sa, của Đức Chúa Trời trả cho Đức Chúa Trời", "Không cần nộp thuế", "Chỉ người Do Thái nộp", "Hãy dâng tất cả cho Đền thờ"]',
'[0]',
'Lu-ca 20:25: Nguyên tắc kép về trách nhiệm đời và đạo.',
'["Tân Ước","Khôn ngoan","Quyền bính"]','Luke 20:20-26','vi',true,NOW(),NOW()),

('q-luk-018','Luke',22,39,46,'hard','multiple_choice_single',
'Tại Ghết-sê-ma-nê, Chúa dạy môn đồ điều gì?',
'["Hãy cầu nguyện kẻo sa vào cám dỗ", "Hãy chạy trốn", "Hãy cầm gươm", "Hãy ngủ yên"]',
'[0]',
'Lu-ca 22:40: Hãy cầu nguyện, kẻo sa vào sự cám dỗ.',
'["Tân Ước","Cầu nguyện","Thử thách"]','Luke 22:39-46','vi',true,NOW(),NOW()),

('q-luk-019','Luke',23,39,43,'hard','multiple_choice_single',
'Chúa phán gì với tên trộm ăn năn trên thập tự?',
'["Hôm nay ngươi sẽ ở với Ta trong Pa-ra-đi", "Tội con đã được tha", "Hãy xuống khỏi thập tự", "Hãy về nhà con"]',
'[0]',
'Lu-ca 23:43: Lời hứa thiên đàng cho kẻ ăn năn.',
'["Tân Ước","Ân điển","Thập tự"]','Luke 23:39-43','vi',true,NOW(),NOW()),

('q-luk-020','Luke',24,13,35,'hard','multiple_choice_single',
'Hai môn đồ trên đường Em-ma-út nhận ra Chúa khi nào?',
'["Khi Ngài bẻ bánh", "Khi Ngài giảng giải Thi Kinh", "Khi Ngài chào hỏi", "Khi Ngài đi vào nhà"]',
'[0]',
'Lu-ca 24:30-31: Mắt họ mở ra khi Ngài bẻ bánh.',
'["Tân Ước","Phục sinh","Mắt mở"]','Luke 24:13-35','vi',true,NOW(),NOW());


