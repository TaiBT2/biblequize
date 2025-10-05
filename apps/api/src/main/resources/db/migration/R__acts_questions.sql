-- Repeatable seed: Acts questions (20 diverse questions)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES

-- Easy (6)
('q-act2-001','Acts',1,8,8,'easy','multiple_choice_single',
'Theo Công Vụ 1:8, khi Đức Thánh Linh giáng trên các môn đồ, điều gì xảy ra?',
'["Nhận quyền phép và làm chứng khắp nơi", "Nói tiếng thiên sứ", "Xây đền thờ mới", "Trở về nghề cũ"]',
'[0]',
'Công Vụ 1:8: Nhận quyền phép và làm chứng tại Giê-ru-sa-lem, Giu-đê, Sa-ma-ri và đến cùng trái đất.',
'["Tân Ước","Thánh Linh","Sứ mạng"]','Acts 1:8','vi',true,NOW(),NOW()),

('q-act2-002','Acts',2,1,4,'easy','multiple_choice_single',
'Ngày Lễ Ngũ Tuần, các môn đồ được đầy dẫy Thánh Linh và nói điều gì?',
'["Các thứ tiếng khác", "Tiếng thiên sứ", "Lời tiên tri dài", "Thơ ca"]',
'[0]',
'Công Vụ 2:4: Họ bắt đầu nói các thứ tiếng khác, theo như Thánh Linh cho họ nói.',
'["Tân Ước","Thánh Linh","Ngũ Tuần"]','Acts 2:1-4','vi',true,NOW(),NOW()),

('q-act2-003','Acts',3,1,10,'easy','multiple_choice_single',
'Người què ở Cửa Đẹp được chữa lành bởi danh nào?',
'["Danh Chúa Giê-su Christ", "Danh Phao-lô", "Danh Phi-e-rơ", "Danh Giăng"]',
'[0]',
'Công Vụ 3:6: Nhân danh Chúa Giê-su Christ ở Na-xa-rét, hãy bước đi!',
'["Tân Ước","Phép lạ","Danh Chúa"]','Acts 3:1-10','vi',true,NOW(),NOW()),

('q-act2-004','Acts',4,12,12,'easy','multiple_choice_single',
'Theo Công Vụ 4:12, sự cứu rỗi ở trong ai?',
'["Chỉ trong Chúa Giê-su", "Trong luật pháp", "Trong việc lành", "Trong của dâng"]',
'[0]',
'Công Vụ 4:12: Ở dưới trời chẳng có danh nào khác ban cho loài người, để chúng ta nhờ đó mà được cứu.',
'["Tân Ước","Cứu rỗi","Danh Chúa"]','Acts 4:12','vi',true,NOW(),NOW()),

('q-act2-005','Acts',6,1,7,'easy','multiple_choice_single',
'Bảy người được chọn trong Công Vụ 6 có mục đích chính gì?',
'["Phục vụ bàn (chăm lo nhu cầu thực tế)", "Giảng đạo toàn thời gian", "Viết thư tín", "Dạy luật pháp"]',
'[0]',
'Công Vụ 6:2-4: Để các sứ đồ chuyên về cầu nguyện và chức vụ giảng đạo.',
'["Tân Ước","Chức vụ","Quản trị"]','Acts 6:1-7','vi',true,NOW(),NOW()),

('q-act2-006','Acts',9,1,19,'easy','multiple_choice_single',
'Sa-lơ (Phao-lô) gặp Chúa trên đường nào?',
'["Đa-mách", "Ê-pha-sô", "Cô-rinh-tô", "Phi-líp"]',
'[0]',
'Công Vụ 9:3-6: Trên đường Đa-mách, Chúa hiện ra và gọi Sa-lơ.',
'["Tân Ước","Cải đạo","Kêu gọi"]','Acts 9:1-19','vi',true,NOW(),NOW()),

-- Medium (10)
('q-act2-007','Acts',8,26,40,'medium','multiple_choice_single',
'Phi-líp giải thích Kinh Thánh nào cho hoạn quan Ê-thi-ô-pi?',
'["Ê-sai 53", "Thi Thiên 23", "Sáng Thế Ký 12", "Giê-rê-mi 31"]',
'[0]',
'Công Vụ 8:32-35: Phi-líp mở miệng, bắt đầu từ đoạn Kinh Thánh ấy mà giảng về Chúa Giê-su.',
'["Tân Ước","Truyền giảng","Tiên tri"]','Acts 8:26-40','vi',true,NOW(),NOW()),

('q-act2-008','Acts',10,1,48,'medium','multiple_choice_single',
'Phi-e-rơ thấy chiếu từ trời xuống dạy điều gì?',
'["Đừng gọi điều gì Đức Chúa Trời đã làm sạch là ô uế", "Chỉ ăn đồ thanh sạch", "Bỏ luật Môi-se", "Không vào nhà dân ngoại"]',
'[0]',
'Công Vụ 10:15: Điều Đức Chúa Trời đã làm sạch, chớ kể là ô uế.',
'["Tân Ước","Dân ngoại","Khải thị"]','Acts 10:1-48','vi',true,NOW(),NOW()),

('q-act2-009','Acts',12,1,17,'medium','multiple_choice_single',
'Phi-e-rơ được giải cứu khỏi ngục bằng cách nào?',
'["Thiên sứ giải cứu", "Động đất", "Cửa tự mở", "Lính ngủ quên"]',
'[0]',
'Công Vụ 12:7-10: Một thiên sứ của Chúa hiện đến, xiềng xích rơi khỏi tay ông.',
'["Tân Ước","Phép lạ","Thiên sứ"]','Acts 12:1-17','vi',true,NOW(),NOW()),

('q-act2-010','Acts',13,1,3,'medium','multiple_choice_single',
'Tại An-ti-ốt, ai được Thánh Linh biệt riêng ra cho công việc?',
'["Ba-na-ba và Sau-lơ", "Phi-e-rơ và Giăng", "Gia-cơ và Phi-líp", "Ti-mô-thê và Tít"]',
'[0]',
'Công Vụ 13:2: Hãy biệt riêng Ba-na-ba và Sau-lơ cho Ta, để làm công việc Ta gọi họ.',
'["Tân Ước","Truyền giáo","Kêu gọi"]','Acts 13:1-3','vi',true,NOW(),NOW()),

('q-act2-011','Acts',15,6,21,'medium','multiple_choice_single',
'Công đồng Giê-ru-sa-lem quyết định gì cho dân ngoại tin Chúa?',
'["Không bắt giữ trọn luật Môi-se; chỉ kiêng đồ cúng, huyết, thú chết ngạt và dâm loạn", "Phải chịu cắt bì", "Giữ mọi ngày lễ", "Học tiếng Hê-bơ-rơ"]',
'[0]',
'Công Vụ 15:28-29: Quyết định đặt gánh nặng rất ít cho anh em dân ngoại.',
'["Tân Ước","Giáo hội","Quyết nghị"]','Acts 15:6-21','vi',true,NOW(),NOW()),

('q-act2-012','Acts',16,25,34,'medium','multiple_choice_single',
'Cai ngục Phi-líp-phê tin Chúa sau sự kiện nào?',
'["Động đất mở cửa ngục", "Phi-e-rơ giảng", "Bịnh được chữa", "Mộng thấy thiên sứ"]',
'[0]',
'Công Vụ 16:26-34: Động đất mở cửa ngục; ông tin Chúa và cả nhà đều chịu báp-têm.',
'["Tân Ước","Cứu rỗi","Dấu lạ"]','Acts 16:25-34','vi',true,NOW(),NOW()),

('q-act2-013','Acts',17,22,34,'medium','multiple_choice_single',
'Tại A-rê-ô-ba-gô, Phao-lô rao giảng về điều gì cho người Hy Lạp?',
'["Đức Chúa Trời không ở trong đền do tay người làm và sự sống lại", "Luật Môi-se", "Các thần linh địa phương", "Triết học Khắc Kỷ"]',
'[0]',
'Công Vụ 17:24-31: Đức Chúa Trời Tạo Hóa, hô gọi ăn năn, ngày phán xét và sự sống lại.',
'["Tân Ước","Truyền giảng","A-thên"]','Acts 17:22-34','vi',true,NOW(),NOW()),

('q-act2-014','Acts',18,24,28,'medium','multiple_choice_single',
'A-bô-lô thiếu điều gì khiến Bê-rít-sin và A-qui-la giảng giải thêm?',
'["Chỉ biết phép báp-têm của Giăng", "Không biết tiếng Hy Lạp", "Không biết Cựu Ước", "Không biết lịch sử Ít-ra-ên"]',
'[0]',
'Công Vụ 18:25-26: Ông chỉ biết phép báp-têm của Giăng, được giảng giải đạo Đức Chúa Trời cách chính xác hơn.',
'["Tân Ước","Môn đệ","Dạy dỗ"]','Acts 18:24-28','vi',true,NOW(),NOW()),

('q-act2-015','Acts',19,11,20,'medium','multiple_choice_single',
'Tại Ê-phê-sô, chuyện gì xảy ra khiến nhiều người đem sách phù thủy đốt?',
'["Phép lạ lớn qua tay Phao-lô", "Động đất", "Lời tiên tri", "Sấm sét"]',
'[0]',
'Công Vụ 19:11-19: Đức Chúa Trời làm các phép lạ phi thường qua tay Phao-lô.',
'["Tân Ước","Ăn năn","Phù thủy"]','Acts 19:11-20','vi',true,NOW(),NOW()),

('q-act2-016','Acts',20,7,12,'medium','multiple_choice_single',
'Ê-u-ty-khơ xảy ra điều gì khi Phao-lô giảng lâu?',
'["Ngủ gục, rơi từ tầng ba, được làm sống lại", "Được chữa lành tay", "Nói tiếng khác", "Thấy khải tượng"]',
'[0]',
'Công Vụ 20:9-12: Ê-u-ty-khơ ngủ gục, rơi xuống, Phao-lô ôm và làm sống lại.',
'["Tân Ước","Phép lạ","Tai nạn"]','Acts 20:7-12','vi',true,NOW(),NOW()),

-- Hard (4)
('q-act2-017','Acts',21,27,36,'hard','multiple_choice_single',
'Tại sao Phao-lô bị bắt ở Giê-ru-sa-lem theo Công Vụ 21?',
'["Bị tố cáo đưa dân ngoại vào đền thờ", "Bị tố cáo chống thuế", "Bị tố cáo báng bổ", "Bị tố cáo gây bạo loạn"]',
'[0]',
'Công Vụ 21:28-29: Người Giu-đa cáo rằng ông đem người Hy Lạp vào đền thờ và làm ô uế nơi thánh.',
'["Tân Ước","Bắt bớ","Đền thờ"]','Acts 21:27-36','vi',true,NOW(),NOW()),

('q-act2-018','Acts',23,6,10,'hard','multiple_choice_single',
'Phao-lô nói điều gì gây chia rẽ giữa Pha-ri-si và Sa-đu-sê?',
'["Về sự sống lại", "Về phép báp-têm", "Về lề luật", "Về đền thờ"]',
'[0]',
'Công Vụ 23:6-8: Vì Pha-ri-si tin có sự sống lại, thiên sứ và thần linh; Sa-đu-sê thì không.',
'["Tân Ước","Biện hộ","Sống lại"]','Acts 23:6-10','vi',true,NOW(),NOW()),

('q-act2-019','Acts',26,19,23,'hard','multiple_choice_single',
'Trước vua A-gríp-pa, Phao-lô nói mình không chống lại điều gì?',
'["Sự hiện thấy từ trời", "Luật pháp", "Dân tộc", "Quan quyền"]',
'[0]',
'Công Vụ 26:19: Tôi chẳng dám nghịch lại sự hiện thấy từ trời.',
'["Tân Ước","Lời chứng","Kêu gọi"]','Acts 26:19-23','vi',true,NOW(),NOW()),

('q-act2-020','Acts',28,1,6,'hard','multiple_choice_single',
'Trên đảo Ma-lơ-ta, điều gì xảy ra với Phao-lô sau khi rắn độc cắn?',
'["Không hề hấn, dân đảo cho là thần", "Bị sưng tay", "Ngất xỉu", "Chết trong vài giờ"]',
'[0]',
'Công Vụ 28:3-6: Phao-lô không hề hấn gì, họ đổi ý cho là một vị thần.',
'["Tân Ước","Phép lạ","Bảo vệ"]','Acts 28:1-6','vi',true,NOW(),NOW());


