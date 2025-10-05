-- Repeatable seed: Mark questions (20 diverse questions)
-- Mapping:
--  - question -> content
--  - options (A-D) -> options (JSON array of 4 strings)
--  - answer -> correct_answer (JSON array with index of correct option)
--  - reference -> source (e.g., "Mark 5:34")
--  - difficulty -> difficulty ('easy' | 'medium' | 'hard')
--  - category -> tags (JSON array including category and Testament)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES

-- Easy (6)
('q-mar-001','Mark',1,1,1,'easy','multiple_choice_single',
'Sách Mác bắt đầu với lời khẳng định nào về Chúa Giê-su?',
'["Con Đức Chúa Trời", "Con loài người", "Tiên tri như Ê-sai", "Vua của Do Thái"]',
'[0]',
'Mác 1:1 mở đầu: "Tin Lành của Đức Chúa Giê-su Christ, Con Đức Chúa Trời".',
'["Tân Ước","Lời mở đầu","Thần học"]','Mark 1:1','vi',true,NOW(),NOW()),

('q-mar-002','Mark',1,16,18,'easy','multiple_choice_single',
'Chúa Giê-su kêu gọi Si-môn và Anh-rê trở nên gì?',
'["Những ngư phủ lưới người", "Những thầy dạy luật", "Những thầy tế lễ", "Những nhà tiên tri"]',
'[0]',
'Mác 1:17: "Hãy theo Ta, Ta sẽ khiến các ngươi trở nên tay đánh lưới người."',
'["Tân Ước","Gọi môn đồ","Mệnh lệnh"]','Mark 1:16-18','vi',true,NOW(),NOW()),

('q-mar-003','Mark',2,5,12,'easy','multiple_choice_single',
'Người bại liệt được Chúa Giê-su chữa lành sau khi Ngài phán điều gì?',
'["Tội lỗi con đã được tha", "Hãy đứng dậy đi", "Hãy đi rửa ở hồ Si-lô-ê", "Đức tin con đã cứu con"]',
'[0]',
'Mác 2:5 trước khi chữa lành phần thân thể, Chúa phán: "Hỡi con, tội lỗi con đã được tha."',
'["Tân Ước","Phép lạ","Tha tội"]','Mark 2:5-12','vi',true,NOW(),NOW()),

('q-mar-004','Mark',4,35,41,'easy','multiple_choice_single',
'Khi bão tố nổi lên trên biển, Chúa Giê-su đã làm gì?',
'["Quở gió và phán: Hãy yên đi!", "Nhảy khỏi thuyền", "Kêu các môn đồ kéo lưới", "Cầu mưa"]',
'[0]',
'Mác 4:39: Ngài quở gió và phán với biển: "Hãy lặng đi! Yên đi!"',
'["Tân Ước","Phép lạ","Tự nhiên"]','Mark 4:35-41','vi',true,NOW(),NOW()),

('q-mar-005','Mark',5,25,34,'easy','multiple_choice_single',
'Người đàn bà bị băng huyết được chữa lành khi làm gì?',
'["Chạm đến áo Chúa", "Kêu lớn tiếng", "Dâng của lễ", "Nhịn ăn cầu nguyện"]',
'[0]',
'Mác 5:27-29: Chị chạm đến áo Chúa Giê-su và được lành.',
'["Tân Ước","Đức tin","Phép lạ"]','Mark 5:25-34','vi',true,NOW(),NOW()),

('q-mar-006','Mark',10,13,16,'easy','multiple_choice_single',
'Chúa Giê-su dạy gì về trẻ nhỏ khi người ta đem trẻ đến với Ngài?',
'["Nước Đức Chúa Trời thuộc về những người giống như trẻ nhỏ", "Trẻ nhỏ chưa hiểu nên chờ lớn", "Chỉ ban phước cho vài em", "Đuổi họ đi"]',
'[0]',
'Mác 10:14: "Hãy để con trẻ đến cùng Ta... vì nước Đức Chúa Trời thuộc về những kẻ giống như con trẻ ấy."',
'["Tân Ước","Giáo huấn","Nước Trời"]','Mark 10:13-16','vi',true,NOW(),NOW()),

-- Medium (10)
('q-mar-007','Mark',1,21,28,'medium','multiple_choice_single',
'Dân chúng ngạc nhiên về điều gì khi Chúa Giê-su giảng dạy tại Ca-bê-na-um?',
'["Ngài dạy như có quyền", "Ngài dùng dụ ngôn khó hiểu", "Ngài trích dẫn nhiều sách", "Ngài nói thật nhỏ nhẹ"]',
'[0]',
'Mác 1:22: Ngài dạy như có quyền, chứ không như các thầy thông giáo.',
'["Tân Ước","Giảng dạy","Thẩm quyền"]','Mark 1:21-28','vi',true,NOW(),NOW()),

('q-mar-008','Mark',2,27,28,'medium','multiple_choice_single',
'Chúa Giê-su dạy về ngày Sa-bát như thế nào?',
'["Sa-bát vì loài người", "Loài người vì Sa-bát", "Mọi việc đều cấm", "Chỉ thầy tế lễ mới giữ"]',
'[0]',
'Mác 2:27: "Ngày Sa-bát vì loài người, chứ không phải loài người vì ngày Sa-bát."',
'["Tân Ước","Luật pháp","Ngày Sa-bát"]','Mark 2:27-28','vi',true,NOW(),NOW()),

('q-mar-009','Mark',3,13,19,'medium','multiple_choice_single',
'Mục đích chính Chúa Giê-su lập mười hai sứ đồ là gì?',
'["Ở với Ngài và sai đi giảng đạo", "Thay Ngài cai trị", "Chăm lo tài chính", "Giữ luật Môi-se"]',
'[0]',
'Mác 3:14: để họ ở cùng Ngài và để sai họ đi giảng đạo, có quyền đuổi quỷ.',
'["Tân Ước","Môn đồ","Sứ mạng"]','Mark 3:13-19','vi',true,NOW(),NOW()),

('q-mar-010','Mark',4,3,20,'medium','multiple_choice_single',
'Trong dụ ngôn người gieo giống, đất tốt biểu trưng cho điều gì?',
'["Nghe và nhận lấy lời, kết quả", "Nghe rồi quên", "Bị gai nghẹt", "Bị chim ăn mất"]',
'[0]',
'Mác 4:20: Đất tốt là những người nghe lời, nhận lấy và kết quả.',
'["Tân Ước","Dụ ngôn","Tấm lòng"]','Mark 4:3-20','vi',true,NOW(),NOW()),

('q-mar-011','Mark',5,1,20,'medium','multiple_choice_single',
'Người bị quỷ ám ở Ghê-ra-sa xưng tên quỷ là gì?',
'["Đạo binh (Legion)", "A-ba-đôn", "Bê-ên-xê-bun", "A-sê-ra"]',
'[0]',
'Mác 5:9: "Tên ta là Đạo binh, vì chúng ta là nhiều."',
'["Tân Ước","Phép lạ","Giải cứu"]','Mark 5:1-20','vi',true,NOW(),NOW()),

('q-mar-012','Mark',6,30,44,'medium','multiple_choice_single',
'Khi hóa bánh cho năm ngàn người, có bao nhiêu ổ bánh và bao nhiêu cá?',
'["5 bánh, 2 cá", "7 bánh, 2 cá", "5 bánh, 5 cá", "7 bánh, 7 cá"]',
'[0]',
'Mác 6:41: năm cái bánh và hai con cá.',
'["Tân Ước","Phép lạ","Bánh hóa nhiều"]','Mark 6:30-44','vi',true,NOW(),NOW()),

('q-mar-013','Mark',7,14,23,'medium','multiple_choice_single',
'Theo Chúa Giê-su, điều gì làm ô uế con người?',
'["Điều từ trong lòng ra", "Món ăn chưa rửa sạch", "Không rửa tay", "Ăn đồ cấm"]',
'[0]',
'Mác 7:20-23: Những điều từ trong lòng ra mới làm ô uế con người.',
'["Tân Ước","Đạo đức","Tấm lòng"]','Mark 7:14-23','vi',true,NOW(),NOW()),

('q-mar-014','Mark',8,34,38,'medium','multiple_choice_single',
'Điều kiện để theo Chúa Giê-su theo Mác 8:34 là gì?',
'["Chối mình, vác thập tự, theo Ngài", "Dâng một phần mười", "Giữ mọi ngày lễ", "Hiểu hết luật pháp"]',
'[0]',
'Mác 8:34: Chối mình, vác thập tự mình hằng ngày mà theo.',
'["Tân Ước","Môn đồ hóa","Môn đệ"]','Mark 8:34-38','vi',true,NOW(),NOW()),

('q-mar-015','Mark',9,2,8,'medium','multiple_choice_single',
'Sự kiện nào xảy ra trên núi cùng với Phi-e-rơ, Gia-cơ và Giăng?',
'["Hóa hình", "Thăng thiên", "Bữa Tiệc Ly", "Đuổi quỷ"]',
'[0]',
'Mác 9:2-8: Chúa Giê-su biến hóa hình, Môi-se và Ê-li hiện ra.',
'["Tân Ước","Vinh hiển","Khải tượng"]','Mark 9:2-8','vi',true,NOW(),NOW()),

('q-mar-016','Mark',10,17,27,'medium','multiple_choice_single',
'Chúa Giê-su bảo người trai trẻ giàu có làm gì để có sự sống đời đời?',
'["Bán hết của cải cho người nghèo và theo Ngài", "Giữ thêm lễ nghi", "Tăng của dâng", "Học thêm luật pháp"]',
'[0]',
'Mác 10:21: Hãy bán hết của cải, bố thí cho người nghèo, rồi theo Ta.',
'["Tân Ước","Môn đồ","Tài sản"]','Mark 10:17-27','vi',true,NOW(),NOW()),

-- Hard (4)
('q-mar-017','Mark',11,12,14,'hard','multiple_choice_single',
'Chúa Giê-su rủa cây vả vì sao?',
'["Không có trái", "Bị sâu", "Không được chăm sóc", "Ở gần đền thờ"]',
'[0]',
'Mác 11:13-14: Vì không thấy trái nơi nó, Ngài phán rủa.',
'["Tân Ước","Biểu tượng","Xét đoán"]','Mark 11:12-14','vi',true,NOW(),NOW()),

('q-mar-018','Mark',12,28,34,'hard','multiple_choice_single',
'Điều răn lớn nhất theo Chúa Giê-su trong Mác 12 là gì?',
'["Yêu Chúa và yêu người lân cận", "Giữ ngày Sa-bát", "Dâng phần mười", "Kiêng ăn cầu nguyện"]',
'[0]',
'Mác 12:29-31: Mến Chúa hết lòng... và yêu người lân cận như mình.',
'["Tân Ước","Điều răn lớn","Đạo đức"]','Mark 12:28-34','vi',true,NOW(),NOW()),

('q-mar-019','Mark',13,32,37,'hard','multiple_choice_single',
'Về ngày và giờ Chúa tái lâm, Chúa Giê-su dạy điều gì?',
'["Không ai biết, hãy tỉnh thức", "Sẽ biết qua dấu trên trời", "Các thiên sứ sẽ báo trước", "Người công bình sẽ biết"]',
'[0]',
'Mác 13:32-37: Không ai biết, hãy tỉnh thức và cầu nguyện.',
'["Tân Ước","Cánh chung","Tỉnh thức"]','Mark 13:32-37','vi',true,NOW(),NOW()),

('q-mar-020','Mark',15,33,39,'hard','multiple_choice_single',
'Viên đội trưởng La-mã nói gì khi thấy Chúa Giê-su tắt thở?',
'["Thật, người này là Con Đức Chúa Trời!", "Hẳn người này là người vô tội", "Người này là tiên tri", "Người này là vua Do Thái"]',
'[0]',
'Mác 15:39: Viên đội trưởng tuyên xưng Ngài là Con Đức Chúa Trời.',
'["Tân Ước","Lời chứng","Thập tự"]','Mark 15:33-39','vi',true,NOW(),NOW());


