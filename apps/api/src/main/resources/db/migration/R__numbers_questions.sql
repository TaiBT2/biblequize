-- Repeatable seed: Numbers questions (20 questions, higher difficulty)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES

-- Easy (4)
('q-num2-001','Numbers',6,22,27,'easy','multiple_choice_single',
'Lời chúc phước của A-rôn nổi tiếng gồm điều nào?',
'["Đức Giê-hô-va giáng phước và gìn giữ ngươi", "Hãy mạnh mẽ và can đảm", "Đừng sợ chi", "Hãy ca ngợi Chúa"]',
'[0]',
'Dân số Ký 6:24-26: Đức Giê-hô-va giáng phước cho ngươi và gìn giữ ngươi.',
'["Cựu Ước","Chúc phước A-rôn","Phước lành"]','Numbers 6:22-27','vi',true,NOW(),NOW()),

('q-num2-002','Numbers',9,15,23,'easy','multiple_choice_single',
'Dân Y-sơ-ra-ên đi hay dừng tùy theo điều gì trong đồng vắng?',
'["Trụ mây/trụ lửa", "Ý kiến trưởng lão", "Tiếng kèn", "Khan hiếm nước"]',
'[0]',
'Dân 9:17: Theo trụ mây nhấc lên hay dừng.',
'["Cựu Ước","Dẫn dắt","Đồng vắng"]','Numbers 9:15-23','vi',true,NOW(),NOW()),

('q-num2-003','Numbers',12,1,10,'easy','multiple_choice_single',
'Mi-ri-am bị phạt phung vì tội gì?',
'["Nói nghịch Môi-se", "Ăn của thánh", "Thờ hình tượng", "Không giữ Sa-bát"]',
'[0]',
'Dân 12:1-10: Vì nói nghịch Môi-se, Mi-ri-am bị phung.',
'["Cựu Ước","Phung","Quyền bính"]','Numbers 12:1-10','vi',true,NOW(),NOW()),

('q-num2-004','Numbers',21,4,9,'easy','multiple_choice_single',
'Phương thuốc cho dân bị rắn lửa cắn là gì?',
'["Ngước nhìn con rắn bằng đồng", "Uống nước đắng", "Thoa dầu", "Cầu nguyện tập thể"]',
'[0]',
'Dân 21:8-9: Hễ ai nhìn con rắn bằng đồng thì được sống.',
'["Cựu Ước","Biểu tượng","Cứu rỗi"]','Numbers 21:4-9','vi',true,NOW(),NOW()),

-- Medium (10)
('q-num2-005','Numbers',1,1,4,'medium','multiple_choice_single',
'Tên sách “Dân số Ký” xuất phát từ sự kiện nào?',
'["Đếm dân theo chi phái", "Đếm của cải", "Đếm thầy tế lễ", "Đếm nạn đói"]',
'[0]',
'Dân 1:2: Hãy điểm số toàn hội chúng.',
'["Cựu Ước","Dân số","Tổ chức"]','Numbers 1:1-4','vi',true,NOW(),NOW()),

('q-num2-006','Numbers',11,4,9,'medium','multiple_choice_single',
'Món ma-na được mô tả có mùi vị giống gì?',
'["Bánh trộn dầu/ mật ong", "Bánh bột chua", "Bánh không men", "Bánh men"]',
'[0]',
'Dân 11:7-9: Vị như bánh trộn dầu, một đoạn ghi như bánh bằng mật ong.',
'["Cựu Ước","Ma-na","Mô tả"]','Numbers 11:7-9','vi',true,NOW(),NOW()),

('q-num2-007','Numbers',13,25,33,'medium','multiple_choice_single',
'Báo cáo của 12 thám tử dẫn đến điều gì?',
'["Dân khóc than, không tin và bị định đi vòng 40 năm", "Tấn công ngay", "Ký hòa ước", "Trở về Ai Cập"]',
'[0]',
'Dân 14:1-34: Không tin, bị định mỗi ngày thành một năm — 40 năm.',
'["Cựu Ước","Đức tin","Hậu quả"]','Numbers 13:25-33','vi',true,NOW(),NOW()),

('q-num2-008','Numbers',16,1,35,'medium','multiple_choice_single',
'Cô-ra, Đa-than, A-bi-ram nổi loạn bị đoán phạt ra sao?',
'["Đất hả miệng nuốt; lửa thiêu 250 người", "Bị lưu đày", "Bị phạt tiền", "Bị bệnh"]',
'[0]',
'Dân 16:31-35: Đất hả miệng nuốt Đa-than, A-bi-ram; lửa thiêu 250 người dâng hương.',
'["Cựu Ước","Nổi loạn","Xét đoán"]','Numbers 16:1-35','vi',true,NOW(),NOW()),

('q-num2-009','Numbers',17,1,13,'medium','multiple_choice_single',
'Cái gậy nào trổ bông để xác nhận thầy tế lễ?',
'["Gậy A-rôn (chi phái Lê-vi)", "Gậy Giu-đa", "Gậy Ép-ra-im", "Gậy Bên-gia-min"]',
'[0]',
'Dân 17:8: Gậy A-rôn trổ bông hạnh, kết trái.',
'["Cựu Ước","Xác nhận","Tế lễ"]','Numbers 17:1-13','vi',true,NOW(),NOW()),

('q-num2-010','Numbers',20,7,13,'medium','multiple_choice_single',
'Lỗi của Môi-se tại Mê-ri-ba là gì?',
'["Đập đá thay vì nói với đá; không tôn Chúa là thánh", "Nói với đá quá sớm", "Gào thét với dân", "Quên mang gậy"]',
'[0]',
'Dân 20:8-12: Vì không tin và không tôn Ngài là thánh, ông không vào đất hứa.',
'["Cựu Ước","Mê-ri-ba","Thánh khiết"]','Numbers 20:7-13','vi',true,NOW(),NOW()),

('q-num2-011','Numbers',22,21,35,'medium','multiple_choice_single',
'Con vật nào đã nói với Ba-la-am?',
'["Lừa cái", "Bò cái", "Chiên cái", "Lạc đà"]',
'[0]',
'Dân 22:28: Đức Giê-hô-va mở miệng lừa cái.',
'["Cựu Ước","Ba-la-am","Dấu lạ"]','Numbers 22:21-35','vi',true,NOW(),NOW()),

('q-num2-012','Numbers',23,19,19,'medium','multiple_choice_single',
'Tuyên bố thần học mạnh mẽ trong Dân 23:19 là gì?',
'["Đức Chúa Trời chẳng phải là người để nói dối", "Chúa là tình yêu", "Chúa là bình an", "Chúa là công lý"]',
'[0]',
'Dân 23:19: Điều Ngài đã phán há chẳng làm sao?',
'["Cựu Ước","Tín thực","Bất biến"]','Numbers 23:19','vi',true,NOW(),NOW()),

('q-num2-013','Numbers',25,1,9,'medium','multiple_choice_single',
'Tai họa tại Phê-ô do điều gì gây ra?',
'["Thờ Ba-anh Phê-ô và dâm loạn", "Thiếu nước", "Nổi loạn", "Ăn ma-na chán"]',
'[0]',
'Dân 25:1-3,9: Dân thông dâm và thờ Ba-anh; tai vạ giết 24.000 người.',
'["Cựu Ước","Thờ hình tượng","Kỷ luật"]','Numbers 25:1-9','vi',true,NOW(),NOW()),

('q-num2-014','Numbers',27,18,23,'medium','multiple_choice_single',
'Ai được lập kế vị Môi-se?',
'["Giô-suê con Nun", "Ca-lép", "Ê-li-a-xa thầy tế lễ", "Phi-nê-a"]',
'[0]',
'Dân 27:18-23: Giô-suê, người có thần ở trong.',
'["Cựu Ước","Lãnh đạo","Kế vị"]','Numbers 27:18-23','vi',true,NOW(),NOW()),

-- Hard (6)
('q-num2-015','Numbers',5,11,31,'hard','multiple_choice_single',
'Nghi thức thử lòng ghen trong Dân 5 nhằm mục đích gì?',
'["Phán quyết công minh về nghi ngờ ngoại tình", "Răn đe phụ nữ", "Tăng quyền đàn ông", "Thu lợi đền thờ"]',
'[0]',
'Dân 5:11-31: Một nghi thức đặc thù trong bối cảnh giao ước để giải quyết nghi ngờ.',
'["Cựu Ước","Nghi thức","Công bình"]','Numbers 5:11-31','vi',true,NOW(),NOW()),

('q-num2-016','Numbers',9,1,14,'hard','multiple_choice_single',
'Quy định về Lễ Vượt Qua tháng hai (Pesach Sheni) cho ai?',
'["Cho người ô uế/đi xa không dự kịp tháng nhất", "Cho người nghèo", "Cho người Lê-vi", "Cho ngoại kiều"]',
'[0]',
'Dân 9:10-11: Có thể giữ vào tháng hai ngày mười bốn.',
'["Cựu Ước","Ân điển","Lịch lễ"]','Numbers 9:1-14','vi',true,NOW(),NOW()),

('q-num2-017','Numbers',15,37,41,'hard','multiple_choice_single',
'Tua trên bốn góc áo (tzitzit) nhằm nhắc điều gì?',
'["Nhớ các điều răn và nên thánh", "Nhớ ngày Sa-bát", "Nhớ lễ vượt qua", "Nhớ tổ phụ"]',
'[0]',
'Dân 15:39-40: Để nhớ làm hết thảy điều răn Đức Giê-hô-va.',
'["Cựu Ước","Dấu hiệu","Ghi nhớ"]','Numbers 15:37-41','vi',true,NOW(),NOW()),

('q-num2-018','Numbers',19,1,22,'hard','multiple_choice_single',
'Tro bò cái đỏ dùng để làm gì?',
'["Làm nước thanh tẩy ô uế do xác chết", "Chữa bệnh da", "Xức dầu thánh", "Nước rửa tay thầy tế lễ"]',
'[0]',
'Dân 19:2-9: Pha với nước làm nước thanh tẩy.',
'["Cựu Ước","Thanh sạch","Bò cái đỏ"]','Numbers 19:1-22','vi',true,NOW(),NOW()),

('q-num2-019','Numbers',31,21,24,'hard','multiple_choice_single',
'Cách tẩy uế chiến lợi phẩm và người sau chiến trận là gì?',
'["Qua lửa và nước theo điều răn", "Nghỉ bảy ngày", "Dâng của lễ", "Tắm rửa ba lần"]',
'[0]',
'Dân 31:22-24: Vật chịu lửa thì qua lửa; còn lại qua nước.',
'["Cựu Ước","Thanh sạch","Chiến trận"]','Numbers 31:21-24','vi',true,NOW(),NOW()),

('q-num2-020','Numbers',36,1,12,'hard','multiple_choice_single',
'Luật thừa kế các con gái Xê-lô-phê-hát bảo toàn điều gì?',
'["Cơ nghiệp trong chi phái", "Quyền tư hữu", "Quyền gia trưởng", "Quyền tế lễ"]',
'[0]',
'Dân 36:6-9: Kết hôn trong chi phái để cơ nghiệp không chuyển qua chi phái khác.',
'["Cựu Ước","Thừa kế","Công bình"]','Numbers 36:1-12','vi',true,NOW(),NOW());


