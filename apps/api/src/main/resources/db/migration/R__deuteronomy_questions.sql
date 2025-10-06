-- Repeatable seed: Deuteronomy questions (20 questions, higher difficulty)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES

-- Easy (4)
('q-deu2-001','Deuteronomy',6,4,9,'easy','multiple_choice_single',
'Tuyên xưng đức tin trung tâm của Y-sơ-ra-ên trong Phục Truyền 6 gọi là gì?',
'["Shema", "Halakha", "Haggadah", "Kaddish"]',
'[0]',
'Phục Truyền 6:4-5: Hỡi Y-sơ-ra-ên, hãy nghe! Giê-hô-va, Đức Chúa Trời chúng ta là Chúa có một không hai.',
'["Cựu Ước","Shema","Trung tín"]','Deuteronomy 6:4-9','vi',true,NOW(),NOW()),

('q-deu2-002','Deuteronomy',8,2,5,'easy','multiple_choice_single',
'Mục đích của 40 năm trong đồng vắng theo PTr 8 là gì?',
'["Khiêm hạ, thử luyện, biết điều trong lòng", "Trừng phạt", "Tập chiến đấu", "Tích lũy của cải"]',
'[0]',
'Phục Truyền 8:2: Để khiêm hạ và thử, biết điều trong lòng ngươi.',
'["Cựu Ước","Đồng vắng","Thử luyện"]','Deuteronomy 8:2-5','vi',true,NOW(),NOW()),

('q-deu2-003','Deuteronomy',10,12,13,'easy','multiple_choice_single',
'Đức Chúa Trời đòi hỏi gì nơi Y-sơ-ra-ên theo PTr 10:12?',
'["Kính sợ, đi theo, yêu mến, hầu việc và giữ các điều răn", "Dâng của cải", "Xây đền thờ", "Chọn vua"]',
'[0]',
'Phục Truyền 10:12-13: Tóm tắt điều Đức Chúa Trời đòi hỏi.',
'["Cựu Ước","Yêu mến","Vâng phục"]','Deuteronomy 10:12-13','vi',true,NOW(),NOW()),

('q-deu2-004','Deuteronomy',30,11,20,'easy','multiple_choice_single',
'Phục Truyền 30 kêu gọi chọn điều gì?',
'["Sự sống và phước lành", "Sức mạnh", "Quyền lực", "Của cải"]',
'[0]',
'Phục Truyền 30:19: Ta đặt trước mặt ngươi sự sống và sự chết, phước lành và rủa sả; hãy chọn sự sống.',
'["Cựu Ước","Giao ước","Chọn lựa"]','Deuteronomy 30:11-20','vi',true,NOW(),NOW()),

-- Medium (10)
('q-deu2-005','Deuteronomy',4,5,8,'medium','multiple_choice_single',
'PTr 4 nhấn mạnh điều gì khiến các dân khác khen Israel khôn ngoan?',
'["Luật pháp công chính và gần gũi của Đức Chúa Trời", "Quân đội mạnh", "Vua khôn ngoan", "Đất phì nhiêu"]',
'[0]',
'Phục Truyền 4:7-8: Có dân nào có Đức Chúa Trời gần mình... và luật pháp công chính như vậy?',
'["Cựu Ước","Luật pháp","Danh Chúa"]','Deuteronomy 4:5-8','vi',true,NOW(),NOW()),

('q-deu2-006','Deuteronomy',12,1,14,'medium','multiple_choice_single',
'Tại sao phải phá bỏ các nơi cao và chỉ thờ phượng ở nơi Đức Chúa Trời chọn?',
'["Để phòng ngừa thờ hình tượng và hiệp nhất thờ phượng", "Để thuận tiện", "Để thu thuế", "Để kiểm soát dân"]',
'[0]',
'Phục Truyền 12:2-14: Phá các nơi cao; tìm nơi Chúa chọn để đặt Danh Ngài.',
'["Cựu Ước","Thờ phượng","Nơi chọn"]','Deuteronomy 12:1-14','vi',true,NOW(),NOW()),

('q-deu2-007','Deuteronomy',13,1,5,'medium','multiple_choice_single',
'Vì sao ngay cả dấu lạ cũng không đủ để chấp nhận một tiên tri?',
'["Nếu dẫn đến thờ thần khác thì phải từ chối", "Vì dấu lạ là giả", "Vì phải nghe vua", "Vì cần hội đồng xét"]',
'[0]',
'Phục Truyền 13:1-3: Dù dấu lạ xảy ra, nếu xui thờ thần khác, chớ nghe.',
'["Cựu Ước","Tiên tri giả","Trung tín"]','Deuteronomy 13:1-5','vi',true,NOW(),NOW()),

('q-deu2-008','Deuteronomy',15,1,11,'medium','multiple_choice_single',
'Năm tha nợ (Shemitah) dạy điều gì?',
'["Lòng thương xót và trông cậy Chúa", "Kinh tế hiệu quả", "Chính trị công bằng", "Cải cách ruộng đất"]',
'[0]',
'Phục Truyền 15:1-11: Hết bảy năm thì tha nợ; đừng có lòng ác.',
'["Cựu Ước","Kinh tế giao ước","Thương xót"]','Deuteronomy 15:1-11','vi',true,NOW(),NOW()),

('q-deu2-009','Deuteronomy',17,14,20,'medium','multiple_choice_single',
'Luật vua trong PTr 17 đặt những giới hạn nào?',
'["Không nhiều ngựa, không nhiều vợ, không nhiều bạc vàng", "Không đánh trận", "Không xây đền", "Không thu thuế"]',
'[0]',
'Phục Truyền 17:16-17: Giới hạn quyền lực để vua kính sợ Chúa.',
'["Cựu Ước","Luật vua","Khiêm nhường"]','Deuteronomy 17:14-20','vi',true,NOW(),NOW()),

('q-deu2-010','Deuteronomy',18,15,19,'medium','multiple_choice_single',
'“Đấng tiên tri như Môi-se” ám chỉ điều gì trước nhất trong văn mạch?',
'["Chuỗi tiên tri sau này, tối hậu ứng nghiệm nơi Đấng Christ", "Giô-suê", "Ê-li", "Ê-sai"]',
'[0]',
'Phục Truyền 18:15: Đức Chúa Trời sẽ dấy lên cho ngươi một tiên tri như ta.',
'["Cựu Ước","Tiên tri","Mê-si-a"]','Deuteronomy 18:15-19','vi',true,NOW(),NOW()),

('q-deu2-011','Deuteronomy',21,22,23,'medium','multiple_choice_single',
'Người bị treo trên cây bị xem là gì theo PTr 21:23?',
'["Bị Đức Chúa Trời rủa sả", "Bị loại khỏi hội", "Bị ô uế tạm", "Bị mất cơ nghiệp"]',
'[0]',
'Phục Truyền 21:23: Kẻ bị treo trên cây là bị Đức Chúa Trời rủa sả (Phao-lô ứng dụng trong Gal 3:13).',
'["Cựu Ước","Rủa sả","Đóng đinh"]','Deuteronomy 21:22-23','vi',true,NOW(),NOW()),

('q-deu2-012','Deuteronomy',24,19,22,'medium','multiple_choice_single',
'Luật nhặt sót (gleaning) bày tỏ điều gì về tấm lòng Đức Chúa Trời?',
'["Quan tâm kẻ nghèo, ngoại kiều, mồ côi, góa bụa", "Chỉ giữ luật", "Cạnh tranh công bằng", "Tăng năng suất"]',
'[0]',
'Phục Truyền 24:19-22: Hãy để phần cho kẻ nghèo và ngoại kiều.',
'["Cựu Ước","Công chính xã hội","Lòng thương xót"]','Deuteronomy 24:19-22','vi',true,NOW(),NOW()),

('q-deu2-013','Deuteronomy',29,29,29,'medium','multiple_choice_single',
'“Sự kín nghiệm thuộc về Đức Giê-hô-va... sự tỏ ra thuộc về chúng ta” dạy gì?',
'["Giới hạn mạc khải và trách nhiệm vâng phục", "Không cần học", "Bí mật giáo phái", "Được phép đoán số"]',
'[0]',
'Phục Truyền 29:29: Chúng ta chịu trách nhiệm về điều đã tỏ ra.',
'["Cựu Ước","Mạc khải","Vâng phục"]','Deuteronomy 29:29','vi',true,NOW(),NOW()),

-- Hard (6)
('q-deu2-014','Deuteronomy',4,32,40,'hard','multiple_choice_single',
'PTr 4:32-40 kêu gọi nền tảng nào cho sự độc nhất của Đức Chúa Trời?',
'["Lịch sử cứu rỗi và mạc khải trên Si-nai", "Nhiều thần phục vụ", "Thiên văn học", "Triết học Hy Lạp"]',
'[0]',
'Phục Truyền 4: lịch sử và kinh nghiệm mạc khải xác quyết Đức Chúa Trời là một.',
'["Cựu Ước","Độc thần","Lịch sử"]','Deuteronomy 4:32-40','vi',true,NOW(),NOW()),

('q-deu2-015','Deuteronomy',10,16,16,'hard','multiple_choice_single',
'“Hãy cắt bì bì lòng” nghĩa là gì?',
'["Biệt riêng tấm lòng cho Đức Chúa Trời, bỏ cứng cổ", "Cắt bì theo xác thịt", "Ăn chay", "Khấn nguyện"]',
'[0]',
'Phục Truyền 10:16: Chớ cứng cổ nữa; hình ảnh cho sự thay đổi tận tâm.',
'["Cựu Ước","Tấm lòng","Biệt riêng"]','Deuteronomy 10:16','vi',true,NOW(),NOW()),

('q-deu2-016','Deuteronomy',18,20,22,'hard','multiple_choice_single',
'Thử nghiệm nào để phân định tiên tri thật/giả theo PTr 18?',
'["Lời có ứng nghiệm và không dẫn thờ thần khác", "Có phép lạ", "Được dân ưa", "Được vua chuẩn"]',
'[0]',
'Phục Truyền 18:22 và 13:1-3: Hai tiêu chí: ứng nghiệm và trung thành với Chúa.',
'["Cựu Ước","Tiên tri","Phân định"]','Deuteronomy 18:20-22','vi',true,NOW(),NOW()),

('q-deu2-017','Deuteronomy',23,1,8,'hard','multiple_choice_single',
'Các giới hạn gia nhập hội Đức Giê-hô-va ở PTr 23 phản ánh điều gì?',
'["Tính thánh của hội và lịch sử địch thù", "Phân biệt giai cấp", "Kinh tế", "Phong tục"]',
'[0]',
'Phục Truyền 23:1-8: Có rào chắn theo thần học về thánh khiết và lịch sử A-môn, Mô-áp.',
'["Cựu Ước","Thánh khiết","Hội thánh OT"]','Deuteronomy 23:1-8','vi',true,NOW(),NOW()),

('q-deu2-018','Deuteronomy',27,11,26,'hard','multiple_choice_single',
'Nghi lễ rủa sả tại Ê-banh và Ghê-ri-xim nhấn mạnh điều gì?',
'["Tính hệ trọng của vâng phục/không vâng phục giao ước", "Truyền thống bộ tộc", "Du lịch tôn giáo", "Lịch mùa màng"]',
'[0]',
'Phục Truyền 27:11-26: Các rủa sả công bố cho kẻ không vâng phục.',
'["Cựu Ước","Rủa sả","Giao ước"]','Deuteronomy 27:11-26','vi',true,NOW(),NOW()),

('q-deu2-019','Deuteronomy',32,1,43,'hard','multiple_choice_single',
'Bài ca Môi-se (PTr 32) chủ yếu nhằm mục đích gì?',
'["Chứng cáo giao ước, cảnh báo bội tín và hứa phục hồi", "Ca tụng chiến thắng", "Hướng dẫn nghi lễ", "Kể gia phả"]',
'[0]',
'Phục Truyền 32: bài ca làm chứng cho Israel về đường tội và ân điển Chúa.',
'["Cựu Ước","Bài ca","Giao ước"]','Deuteronomy 32:1-43','vi',true,NOW(),NOW()),

('q-deu2-020','Deuteronomy',34,5,12,'hard','multiple_choice_single',
'PTr 34 kết thúc thế nào về Môi-se?',
'["Tiên tri không ai như Môi-se, Chúa biết mặt đối mặt", "Môi-se làm vua", "Môi-se xây đền", "Môi-se về Ai Cập"]',
'[0]',
'Phục Truyền 34:10-12: Không còn tiên tri nào như Môi-se, người Chúa biết mặt đối mặt.',
'["Cựu Ước","Môi-se","Kết sử"]','Deuteronomy 34:5-12','vi',true,NOW(),NOW());


