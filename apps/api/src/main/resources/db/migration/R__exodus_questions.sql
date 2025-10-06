-- Repeatable seed: Exodus questions (20 diverse questions)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES

-- Easy (6)
('q-exo2-001','Exodus',3,13,15,'easy','multiple_choice_single',
'Danh xưng Đức Chúa Trời bày tỏ cho Môi-se nơi bụi gai cháy là gì?',
'["Ta là Đấng Tự Hữu Hằng Hữu", "Đấng Toàn Năng", "Giê-hô-va Nissi", "Đức Chúa Trời quân đội"]',
'[0]',
'Xuất Ê-díp-tô Ký 3:14: Ta là Ta, Đấng Tự Hữu Hằng Hữu.',
'["Cựu Ước","Mạc khải","Danh Chúa"]','Exodus 3:13-15','vi',true,NOW(),NOW()),

('q-exo2-002','Exodus',4,1,9,'easy','multiple_choice_single',
'Dấu lạ đầu tiên Đức Chúa Trời ban cho Môi-se là gì?',
'["Gậy hóa rắn", "Nước hóa máu", "Bàn tay cùi", "Mưa đá"]',
'[0]',
'Xuất 4:3: Gậy quăng xuống đất hóa thành rắn.',
'["Cựu Ước","Dấu lạ","Kêu gọi"]','Exodus 4:1-9','vi',true,NOW(),NOW()),

('q-exo2-003','Exodus',12,1,14,'easy','multiple_choice_single',
'Lễ nào được lập trước tai vạ cuối cùng?',
'["Lễ Vượt Qua", "Lễ Ngũ Tuần", "Lễ Lều Tạm", "Lễ Thổi Kèn"]',
'[0]',
'Xuất 12:13-14: Huyết sẽ là dấu trên các nhà; khi thấy huyết, Ta sẽ vượt qua.',
'["Cựu Ước","Lễ nghi","Cứu chuộc"]','Exodus 12:1-14','vi',true,NOW(),NOW()),

('q-exo2-004','Exodus',14,21,31,'easy','multiple_choice_single',
'Biển Đỏ được rẽ ra nhờ điều gì?',
'["Môi-se giơ tay trên biển theo lệnh Chúa", "Gió mạnh tự nhiên", "Tàu bè", "Cầu nguyện chung"]',
'[0]',
'Xuất 14:21: Đức Giê-hô-va dùng gió đông mạnh suốt đêm, và Môi-se giơ tay trên biển.',
'["Cựu Ước","Phép lạ","Giải cứu"]','Exodus 14:21-31','vi',true,NOW(),NOW()),

('q-exo2-005','Exodus',16,4,5,'easy','multiple_choice_single',
'Trong đồng vắng, Đức Chúa Trời ban lương thực nào từ trời?',
'["Ma-na", "Chim bồ câu", "Lúa mạch", "Nho"]',
'[0]',
'Xuất 16:4: Ta sẽ làm mưa bánh từ trời xuống.',
'["Cựu Ước","Chu cấp","Đồng vắng"]','Exodus 16:4-5','vi',true,NOW(),NOW()),

('q-exo2-006','Exodus',20,1,17,'easy','multiple_choice_single',
'Mười Điều Răn được ban ở đâu?',
'["Núi Si-nai", "Núi Mô-ri-a", "Núi Hô-rếp", "Núi Ghê-ri-xim"]',
'[0]',
'Xuất 19-20: Đức Chúa Trời ban luật pháp trên núi Si-nai.',
'["Cựu Ước","Luật pháp","Giao ước"]','Exodus 20:1-17','vi',true,NOW(),NOW()),

-- Medium (10)
('q-exo2-007','Exodus',3,7,12,'medium','multiple_choice_single',
'Mục đích Đức Chúa Trời sai Môi-se đến Pha-ra-ôn là gì?',
'["Đem dân ra khỏi Ai Cập để phục sự Ngài", "Thay đổi chính trị", "Xây đền thờ", "Tìm giàu có"]',
'[0]',
'Xuất 3:10-12: Hãy đưa dân Ta ra khỏi Ai Cập.',
'["Cựu Ước","Kêu gọi","Phục sự"]','Exodus 3:7-12','vi',true,NOW(),NOW()),

('q-exo2-008','Exodus',7,14,24,'medium','multiple_choice_single',
'Tai vạ đầu tiên trên Ai Cập là gì?',
'["Nile hóa máu", "Ếch nhái", "Trận mưa đá", "Con đầu lòng chết"]',
'[0]',
'Xuất 7:20: Nước sông hóa thành máu.',
'["Cựu Ước","Tai vạ","Xét đoán"]','Exodus 7:14-24','vi',true,NOW(),NOW()),

('q-exo2-009','Exodus',17,8,13,'medium','multiple_choice_single',
'Trong chiến trận với A-ma-léc, khi Môi-se giơ tay thì điều gì xảy ra?',
'["Y-sơ-ra-ên thắng thế", "A-ma-léc thắng", "Gió nổi lên", "Mặt trời đứng lại"]',
'[0]',
')','["Cựu Ước","Chiến trận","Cầu nguyện"]','Exodus 17:8-13','vi',true,NOW(),NOW()),

('q-exo2-010','Exodus',18,13,27,'medium','multiple_choice_single',
'Gét-trô khuyên Môi-se điều gì về quản trị?',
'["Lập các trưởng chục, trưởng trăm...", "Tự mình xử hết", "Giao cho con trai", "Tìm người giàu"]',
'[0]',
'Xuất 18:21-22: Lập người tài đức để gánh nặng cùng ông.',
'["Cựu Ước","Quản trị","Khôn ngoan"]','Exodus 18:13-27','vi',true,NOW(),NOW()),

('q-exo2-011','Exodus',25,8,9,'medium','multiple_choice_single',
'Mục đích dựng Đền Tạm là gì?',
'["Để Đức Chúa Trời ở giữa họ", "Lưu trữ của cải", "Huấn luyện quân đội", "Làm chỗ hội họp"]',
'[0]',
'Xuất 25:8: Họ sẽ làm cho Ta một nơi thánh, để Ta ở giữa họ.',
'["Cựu Ước","Đền Tạm","Sự hiện diện"]','Exodus 25:8-9','vi',true,NOW(),NOW()),

('q-exo2-012','Exodus',31,12,17,'medium','multiple_choice_single',
'Dấu giữa Đức Chúa Trời và dân Y-sơ-ra-ên đời đời là gì?',
'["Ngày Sa-bát", "Dấu cầu vồng", "Phép cắt bì", "Dầu xức thánh"]',
'[0]',
'Xuất 31:13,17: Sa-bát là dấu đời đời giữa Ta và con cái Y-sơ-ra-ên.',
'["Cựu Ước","Sa-bát","Dấu hiệu"]','Exodus 31:12-17','vi',true,NOW(),NOW()),

('q-exo2-013','Exodus',32,1,10,'medium','multiple_choice_single',
'Dân sự đã phạm tội gì dưới chân núi khi Môi-se ở trên núi?',
'["Làm bò vàng và thờ lạy", "Bạo loạn", "Đánh nhau", "Bỏ trốn"]',
'[0]',
'Xuất 32:4-6: Họ làm bò vàng và thờ lạy nó.',
'["Cựu Ước","Thờ hình tượng","Sa ngã"]','Exodus 32:1-10','vi',true,NOW(),NOW()),

('q-exo2-014','Exodus',33,12,23,'medium','multiple_choice_single',
'Môi-se cầu xin điều gì đặc biệt nơi Đức Chúa Trời?',
'["Xin cho con thấy vinh hiển Ngài", "Xin cho con quyền lực", "Xin đất hứa", "Xin nhiều binh lính"]',
'[0]',
'Xuất 33:18: Xin cho tôi thấy sự vinh hiển của Ngài.',
'["Cựu Ước","Cầu nguyện","Vinh hiển"]','Exodus 33:12-23','vi',true,NOW(),NOW()),

('q-exo2-015','Exodus',34,6,7,'medium','multiple_choice_single',
'Đức Chúa Trời tự bày tỏ bản tính Ngài thế nào trong Xuất 34:6-7?',
'["Nhân từ, thương xót, chậm giận, dư dật ân huệ và thành thật", "Toàn năng và công chính", "Ghen tuông và xét đoán", "Thánh khiết và vinh hiển"]',
'[0]',
'Xuất 34:6-7: Tuyên bố bản tính nhân từ nhưng không dung túng tội lỗi.',
'["Cựu Ước","Bản tính Chúa","Khải thị"]','Exodus 34:6-7','vi',true,NOW(),NOW()),

-- Hard (4)
('q-exo2-016','Exodus',12,21,28,'hard','multiple_choice_single',
'Ý nghĩa thần học của huyết chiên Vượt Qua là gì?',
'["Dấu che chở khỏi cơn đoán phạt", "Dấu hiệu của lễ hội", "Truyền thống gia đình", "Biểu tượng nông nghiệp"]',
'[0]',
'Xuất 12:23: Đức Giê-hô-va sẽ vượt qua cửa và không cho kẻ hủy diệt vào.',
'["Cựu Ước","Cứu chuộc","Biểu tượng"]','Exodus 12:21-28','vi',true,NOW(),NOW()),

('q-exo2-017','Exodus',19,4,6,'hard','multiple_choice_single',
'Lời hứa về chức tế lễ và dân thánh dạy gì về ơn gọi Y-sơ-ra-ên?',
'["Làm vương quốc thầy tế lễ, dân thánh", "Làm dân chiến binh", "Làm dân giàu có", "Làm dân khôn ngoan"]',
'[0]',
'Xuất 19:6: Các ngươi sẽ làm một vương quốc thầy tế lễ, một dân thánh cho Ta.',
'["Cựu Ước","Ơn gọi","Thánh khiết"]','Exodus 19:4-6','vi',true,NOW(),NOW()),

('q-exo2-018','Exodus',25,10,22,'hard','multiple_choice_single',
'Nắp thi ân (chuẩn bị cho lễ chuộc tội) có ý nghĩa gì?',
'["Nơi Đức Chúa Trời gặp dân qua huyết chuộc tội", "Trang trí đẹp", "Chỗ đặt bánh trần thiết", "Nơi nhóm lại"]',
'[0]',
'Xuất 25:22: Tại đó Ta sẽ gặp ngươi và phán dặn.',
'["Cựu Ước","Chuộc tội","Hiện diện"]','Exodus 25:10-22','vi',true,NOW(),NOW()),

('q-exo2-019','Exodus',32,30,35,'hard','multiple_choice_single',
'Lời cầu thay của Môi-se sau tội bò vàng bày tỏ điều gì về người lãnh đạo thuộc linh?',
'["Dám đứng ở giữa Đức Chúa Trời và dân, sẵn lòng hy sinh", "Phải nghiêm khắc", "Phải dùng uy quyền", "Phải rút lui"]',
'[0]',
'Xuất 32:32: Xin hãy tha tội họ; bằng không, xin xóa tên con khỏi sách Ngài đã chép.',
'["Cựu Ước","Cầu thay","Lãnh đạo"]','Exodus 32:30-35','vi',true,NOW(),NOW());


