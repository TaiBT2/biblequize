-- Repeatable seed: Leviticus questions (20 questions, higher difficulty)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES

-- Easy (4)
('q-lev2-001','Leviticus',1,3,9,'easy','multiple_choice_single',
'Sách Lê-vi bắt đầu với loại của lễ nào?',
'["Của lễ thiêu", "Của lễ chay", "Của lễ về sự phạm tội", "Của lễ bình an"]',
'[0]',
'Lê-vi 1:3-9: Mô tả của lễ thiêu.',
'["Cựu Ước","Lê-vi","Của lễ"]','Leviticus 1:3-9','vi',true,NOW(),NOW()),

('q-lev2-002','Leviticus',10,1,3,'easy','multiple_choice_single',
'Nát-đáp và A-bi-hu chịu hình phạt vì điều gì?',
'["Dâng lửa lạ trước mặt Đức Giê-hô-va", "Ăn của thánh", "Uống rượu say", "Vào nơi chí thánh"]',
'[0]',
'Lê-vi 10:1-2: Họ dâng lửa lạ, lửa từ trước mặt Đức Giê-hô-va ra thiêu họ.',
'["Cựu Ước","Thánh khiết","Tế lễ"]','Leviticus 10:1-3','vi',true,NOW(),NOW()),

('q-lev2-003','Leviticus',11,1,8,'easy','multiple_choice_single',
'Chương 11 quy định gì?',
'["Món ăn thanh sạch và ô uế", "Của lễ chuộc tội", "Ngày lễ", "Cách đoán tội"]',
'[0]',
'Lê-vi 11:1-8: Phân biệt loài ăn được và không ăn được.',
'["Cựu Ước","Thanh sạch","Luật thực phẩm"]','Leviticus 11:1-8','vi',true,NOW(),NOW()),

('q-lev2-004','Leviticus',23,1,44,'easy','multiple_choice_single',
'Lê-vi 23 liệt kê các gì?',
'["Các kỳ lễ của Đức Giê-hô-va", "Các chi phái", "Các bằng cấp thầy tế lễ", "Các hình phạt"]',
'[0]',
'Lê-vi 23: Các kỳ lễ: Sa-bát, Lễ Vượt Qua, Bánh Không Men, Bó Đầu Mùa, Ngũ Tuần, Thổi Kèn, Chuộc Tội, Lều Tạm.',
'["Cựu Ước","Lễ nghi","Lịch thánh"]','Leviticus 23','vi',true,NOW(),NOW()),

-- Medium (10)
('q-lev2-005','Leviticus',4,27,35,'medium','multiple_choice_single',
'Cơ chế nào áp dụng cho tội lỗi vô ý của dân thường?',
'["Của lễ vì tội lỗi với con cái cái", "Bò đực không tì vít", "Chiên đực", "Chim bồ câu"]',
'[0]',
'Lê-vi 4:27-35: Dâng con cái cái không tì vít vì tội lỗi vô ý.',
'["Cựu Ước","Chuộc tội","Vô ý"]','Leviticus 4:27-35','vi',true,NOW(),NOW()),

('q-lev2-006','Leviticus',5,14,19,'medium','multiple_choice_single',
'Của lễ chuộc sự mắc lỗi (trespass/guilt offering) nhấn mạnh điều gì?',
'["Bồi thường cộng thêm một phần năm", "Chỉ thú tội", "Chỉ ăn năn", "Chỉ hiến dâng"]',
'[0]',
'Lê-vi 5:16: Bồi thường và thêm một phần năm cho kẻ đã phạm.',
'["Cựu Ước","Chuộc lỗi","Công bình"]','Leviticus 5:14-19','vi',true,NOW(),NOW()),

('q-lev2-007','Leviticus',13,1,8,'medium','multiple_choice_single',
'Ai có thẩm quyền phân định ô uế về phung?',
'["Thầy tế lễ", "Quan xét", "Trưởng lão", "Vua"]',
'[0]',
'Lê-vi 13-14: Thầy tế lễ xem xét dấu hiệu phung và tuyên bố sạch hay ô uế.',
'["Cựu Ước","Thanh sạch","Tế lễ"]','Leviticus 13:1-8','vi',true,NOW(),NOW()),

('q-lev2-008','Leviticus',16,1,34,'medium','multiple_choice_single',
'Ngày Lễ Chuộc Tội có hai con dê dùng cho mục đích gì?',
'["Một bị giết làm của lễ, một làm dê gánh tội thả vào đồng vắng", "Cả hai đều hiến trên bàn thờ", "Một bán để bồi thường", "Một dâng cho Lê-vi"]',
'[0]',
'Lê-vi 16: Con dê thứ nhất làm của lễ chuộc tội; con dê thứ hai được thả cho A-xa-xên (gánh tội).',
'["Cựu Ước","Chuộc tội","Biểu tượng"]','Leviticus 16:1-34','vi',true,NOW(),NOW()),

('q-lev2-009','Leviticus',17,10,14,'medium','multiple_choice_single',
'Vì sao huyết bị cấm ăn trong Lê-vi 17?',
'["Vì sự sống ở trong huyết", "Vì ô uế", "Vì hiếm quý", "Vì đắt tiền"]',
'[0]',
'Lê-vi 17:11: Sự sống của xác thịt ở trong huyết; Ta đã ban huyết trên bàn thờ để chuộc tội.',
'["Cựu Ước","Thần học huyết","Cấm lệnh"]','Leviticus 17:10-14','vi',true,NOW(),NOW()),

('q-lev2-010','Leviticus',18,1,5,'medium','multiple_choice_single',
'Mệnh lệnh tổng quát mở đầu chương 18 là gì?',
'["Đừng làm theo tục Ai Cập và Ca-na-an; hãy làm theo luật Ta", "Hãy giữ mọi tập tục địa phương", "Hãy chọn điều thiện theo mắt mình", "Hãy làm hòa với các dân"]',
'[0]',
'Lê-vi 18:3-5: Đừng làm theo tục xứ Ai Cập/ Ca-na-an; làm theo luật Ta, sống bởi đó.',
'["Cựu Ước","Thánh khiết","Đạo đức"]','Leviticus 18:1-5','vi',true,NOW(),NOW()),

('q-lev2-011','Leviticus',19,9,18,'medium','multiple_choice_single',
'“Hãy yêu người lân cận như mình” xuất hiện ở đâu trong Lê-vi?',
'["Lê-vi 19:18", "Lê-vi 20:26", "Lê-vi 23:3", "Lê-vi 11:44"]',
'[0]',
'Lê-vi 19:18: Đừng báo thù... nhưng hãy yêu kẻ lân cận như mình.',
'["Cựu Ước","Đạo đức","Tình yêu"]','Leviticus 19:9-18','vi',true,NOW(),NOW()),

('q-lev2-012','Leviticus',19,23,25,'medium','multiple_choice_single',
'Quy định về cây trái ba năm đầu dạy điều gì?',
'["Quả ba năm là không sạch; năm thứ tư dâng như của thánh", "Phải bán đi", "Phải đốt bỏ", "Phải tặng người nghèo"]',
'[0]',
'Lê-vi 19:23-25: Ba năm đầu không ăn; năm thứ tư thánh hiến; năm thứ năm được ăn.',
'["Cựu Ước","Thánh hiến","Kỷ luật"]','Leviticus 19:23-25','vi',true,NOW(),NOW()),

('q-lev2-013','Leviticus',24,10,16,'medium','multiple_choice_single',
'Hình phạt đối với kẻ phạm thượng Danh Đức Chúa Trời là gì?',
'["Ném đá", "Phạt tiền", "Lưu đày", "Đánh roi"]',
'[0]',
'Lê-vi 24:16: Kẻ phạm thượng Danh Đức Giê-hô-va sẽ bị ném đá.',
'["Cựu Ước","Danh Chúa","Phạm thượng"]','Leviticus 24:10-16','vi',true,NOW(),NOW()),

-- Hard (6)
('q-lev2-014','Leviticus',10,8,11,'hard','multiple_choice_single',
'Chỉ dẫn nào về rượu cho thầy tế lễ nêu rõ mục đích phân biệt?',
'["Không uống khi vào lều hội mạc để phân biệt thánh/phàm, sạch/ô uế", "Không uống suốt đời", "Chỉ uống ngày lễ", "Chỉ uống ở nhà"]',
'[0]',
'Lê-vi 10:9-11: Để phân biệt thánh và phàm, và dạy dân luật pháp.',
'["Cựu Ước","Tế lễ","Kỷ luật"]','Leviticus 10:8-11','vi',true,NOW(),NOW()),

('q-lev2-015','Leviticus',16,12,13,'hard','multiple_choice_single',
'Vì sao cần hương thơm che phủ nắp thi ân khi thầy tế lễ thượng phẩm vào nơi chí thánh?',
'["Để khỏi chết", "Để có mùi dễ chịu", "Để dấu khói", "Để báo hiệu"]',
'[0]',
'Lê-vi 16:13: Hương thơm che nắp thi ân kẻo người chết.',
'["Cựu Ước","Chí thánh","Sự hiện diện"]','Leviticus 16:12-13','vi',true,NOW(),NOW()),

('q-lev2-016','Leviticus',19,19,19,'hard','multiple_choice_single',
'Lê-vi 19:19 cấm trộn các loại (giống vật, hạt giống, vải) nhằm nhấn mạnh điều gì?',
'["Phân biệt và toàn vẹn thánh khiết", "Vệ sinh", "Kinh tế", "Thẩm mỹ"]',
'[0]',
'Nguyên tắc biệt riêng, không pha trộn tượng trưng cho thánh khiết.',
'["Cựu Ước","Biệt riêng","Biểu tượng"]','Leviticus 19:19','vi',true,NOW(),NOW()),

('q-lev2-017','Leviticus',25,8,17,'hard','multiple_choice_single',
'Năm Hân Hỷ (Jubilee) diễn ra như thế nào?',
'["Sau bảy kỳ bảy năm, năm thứ 50 giải phóng và hoàn trả tài sản", "Mỗi 7 năm xóa nợ", "Mỗi 70 năm tha tội", "Mỗi 49 năm cấm buôn bán"]',
'[0]',
'Lê-vi 25:10-13: Công bố sự tự do trên đất, ai nấy trở về cơ nghiệp.',
'["Cựu Ước","Kinh tế xã hội","Tự do"]','Leviticus 25:8-17','vi',true,NOW(),NOW()),

('q-lev2-018','Leviticus',26,3,13,'hard','multiple_choice_single',
'Điều kiện nhận phước trong chương 26 là gì?',
'["Đi theo luật lệ, gìn giữ và làm theo", "Dâng nhiều của lễ", "Có vua công chính", "Giữ lễ Sa-bát"]',
'[0]',
'Lê-vi 26:3-13: Nếu đi trong luật lệ Ta... thì Ta sẽ ban mưa đúng thời, bình an, sinh sản.',
'["Cựu Ước","Giao ước","Phước lành"]','Leviticus 26:3-13','vi',true,NOW(),NOW()),

('q-lev2-019','Leviticus',26,14,46,'hard','multiple_choice_single',
'Dòng kỷ luật theo giao ước trong Lê-vi 26 tăng dần ra sao?',
'["Bảy lần hơn nếu không ăn năn, đến lưu đày", "Ba lần cảnh cáo", "Phạt tiền trước", "Chỉ nhắc nhở"]',
'[0]',
'Lê-vi 26:18,21,24,28: Nếu không nghe, Ta sẽ phạt bảy lần hơn...',
'["Cựu Ước","Kỷ luật giao ước","Lưu đày"]','Leviticus 26:14-46','vi',true,NOW(),NOW()),

('q-lev2-020','Leviticus',27,28,29,'hard','multiple_choice_single',
'Vật nào dâng hiến bị tuyệt đối biệt riêng cho Đức Giê-hô-va (herem) sẽ ra sao?',
'["Không bán, không chuộc; thánh cực thánh", "Bán để lấy tiền đền thờ", "Đổi vật khác", "Hoàn trả năm thứ năm"]',
'[0]',
'Lê-vi 27:28: Vật biệt riêng tuyệt đối thuộc về Đức Giê-hô-va, không được chuộc.',
'["Cựu Ước","Khấn nguyện","Biệt riêng"]','Leviticus 27:28-29','vi',true,NOW(),NOW());


