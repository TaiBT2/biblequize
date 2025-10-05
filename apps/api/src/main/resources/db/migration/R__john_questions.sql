-- Repeatable seed: John questions (20 diverse questions)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES

-- Easy (6)
('q-joh2-001','John',1,1,5,'easy','multiple_choice_single',
'Cụm từ "Ban đầu có Ngôi Lời" nói về ai?',
'["Chúa Giê-su", "Giăng Báp-tít", "Môi-se", "Ê-li"]',
'[0]',
'Giăng 1:1: Ngôi Lời là Chúa Giê-su, ở cùng Đức Chúa Trời và là Đức Chúa Trời.',
'["Tân Ước","Thần học","Khởi nguyên"]','John 1:1-5','vi',true,NOW(),NOW()),

('q-joh2-002','John',3,16,16,'easy','multiple_choice_single',
'Theo Giăng 3:16, Đức Chúa Trời bày tỏ tình yêu như thế nào?',
'["Ban Con Một", "Ban luật pháp", "Ban thiên sứ", "Ban của cải"]',
'[0]',
'Giăng 3:16: Vì Đức Chúa Trời yêu thương thế gian, đến nỗi đã ban Con Một của Ngài.',
'["Tân Ước","Tình yêu","Cứu rỗi"]','John 3:16','vi',true,NOW(),NOW()),

('q-joh2-003','John',4,7,26,'easy','multiple_choice_single',
'Chúa Giê-su phán với người đàn bà Sa-ma-ri về thứ nước nào?',
'["Nước sống", "Nước phép", "Nước ngọt", "Nước mưa"]',
'[0]',
'Giăng 4:10,14: Nước sống ban sự sống đời đời.',
'["Tân Ước","Biểu tượng","Nước sống"]','John 4:7-26','vi',true,NOW(),NOW()),

('q-joh2-004','John',6,35,35,'easy','multiple_choice_single',
'Chúa Giê-su tự xưng là gì trong Giăng 6:35?',
'["Bánh sự sống", "Ánh sáng thế gian", "Cửa chiên", "Người chăn hiền lành"]',
'[0]',
'Giăng 6:35: Ta là bánh sự sống; ai đến với Ta chẳng hề đói.',
'["Tân Ước","Ta là","Biểu tượng"]','John 6:35','vi',true,NOW(),NOW()),

('q-joh2-005','John',8,12,12,'easy','multiple_choice_single',
'Trong Giăng 8:12, Chúa Giê-su phán mình là gì?',
'["Sự sáng của thế gian", "Sự sống lại", "Con đường", "Cây nho thật"]',
'[0]',
'Giăng 8:12: Ta là sự sáng của thế gian; ai theo Ta chẳng đi trong tối tăm.',
'["Tân Ước","Ta là","Ánh sáng"]','John 8:12','vi',true,NOW(),NOW()),

('q-joh2-006','John',11,25,26,'easy','multiple_choice_single',
'Trước mộ La-xa-rơ, Chúa Giê-su phán mình là gì?',
'["Sự sống lại và sự sống", "Bánh sự sống", "Cửa chiên", "Người chăn tốt lành"]',
'[0]',
'Giăng 11:25: Ta là sự sống lại và sự sống; ai tin Ta sẽ sống.',
'["Tân Ước","Ta là","Phục sinh"]','John 11:25-26','vi',true,NOW(),NOW()),

-- Medium (10)
('q-joh2-007','John',2,1,11,'medium','multiple_choice_single',
'Phép lạ đầu tiên của Chúa Giê-su trong sách Giăng là gì?',
'["Hóa nước thành rượu", "Chữa con viên quan", "Chữa người bại 38 năm", "Hóa bánh cho 5.000 người"]',
'[0]',
'Giăng 2:1-11: Tại tiệc cưới Ca-na, Ngài hóa nước thành rượu.',
'["Tân Ước","Phép lạ","Dấu lạ"]','John 2:1-11','vi',true,NOW(),NOW()),

('q-joh2-008','John',5,1,9,'medium','multiple_choice_single',
'Người bại 38 năm được chữa lành ở hồ nào?',
'["Bê-tê-xda", "Si-lô-ê", "Ghê-nê-sa-rét", "Ên-đô"]',
'[0]',
'Giăng 5:2-9: Ở hồ Bê-tê-xda, Chúa phán: Hãy đứng dậy, vác giường và đi.',
'["Tân Ước","Phép lạ","Chữa lành"]','John 5:1-9','vi',true,NOW(),NOW()),

('q-joh2-009','John',6,66,69,'medium','multiple_choice_single',
'Khi nhiều môn đồ lui đi, Phi-e-rơ xưng nhận Chúa là ai?',
'["Đấng Thánh của Đức Chúa Trời", "Con vua Đa-vít", "Tiên tri lớn", "Thầy dạy lỗi lạc"]',
'[0]',
'Giăng 6:68-69: Chúng tôi tin và biết Ngài là Đấng Thánh của Đức Chúa Trời.',
'["Tân Ước","Xưng nhận","Đức tin"]','John 6:66-69','vi',true,NOW(),NOW()),

('q-joh2-010','John',7,37,39,'medium','multiple_choice_single',
'Trong ngày lễ lớn, Chúa Giê-su kêu gọi ai khát hãy đến Ngài để làm gì?',
'["Mà uống", "Mà nghỉ ngơi", "Mà học hỏi", "Mà được chữa lành"]',
'[0]',
'Giăng 7:37: Ai khát, hãy đến cùng Ta mà uống.',
'["Tân Ước","Lời mời","Nước sống"]','John 7:37-39','vi',true,NOW(),NOW()),

('q-joh2-011','John',8,31,36,'medium','multiple_choice_single',
'Chúa Giê-su dạy về sự tự do thật đến từ đâu?',
'["Từ lẽ thật", "Từ luật pháp", "Từ quyền lực", "Từ của cải"]',
'[0]',
'Giăng 8:31-32,36: Lẽ thật sẽ buông tha các ngươi; Con mà buông tha thì thật được tự do.',
'["Tân Ước","Lẽ thật","Tự do"]','John 8:31-36','vi',true,NOW(),NOW()),

('q-joh2-012','John',9,1,7,'medium','multiple_choice_single',
'Chúa Giê-su chữa người mù bẩm sinh bằng cách nào?',
'["Lấy bùn thoa mắt và bảo đi rửa ở Si-lô-ê", "Đặt tay cầu nguyện", "Phán một lời", "Bảo cha mẹ cầu nguyện"]',
'[0]',
'Giăng 9:6-7: Ngài nhổ nước miếng làm bùn, thoa mắt, bảo đi rửa.',
'["Tân Ước","Phép lạ","Dấu lạ"]','John 9:1-7','vi',true,NOW(),NOW()),

('q-joh2-013','John',10,11,18,'medium','multiple_choice_single',
'Hình ảnh "Người chăn hiền lành" dạy điều gì?',
'["Hy sinh mạng sống vì chiên", "Dẫn chiên đi đồng cỏ", "Đếm chiên mỗi đêm", "Chăn chiên bằng gậy"]',
'[0]',
'Giăng 10:11: Người chăn hiền lành vì chiên phó sự sống mình.',
'["Tân Ước","Ta là","Mục tử"]','John 10:11-18','vi',true,NOW(),NOW()),

('q-joh2-014','John',13,34,35,'medium','multiple_choice_single',
'Dấu hiệu nhận biết môn đồ của Chúa Giê-su là gì?',
'["Yêu nhau", "Giữ ngày Sa-bát", "Ăn chay", "Dâng hiến"]',
'[0]',
'Giăng 13:34-35: Bởi điều nầy thiên hạ đều nhận biết các ngươi là môn đồ Ta, nếu các ngươi yêu nhau.',
'["Tân Ước","Điều răn mới","Tình yêu"]','John 13:34-35','vi',true,NOW(),NOW()),

('q-joh2-015','John',14,6,6,'medium','multiple_choice_single',
'Câu xưng nhận nổi tiếng Giăng 14:6 nói Ngài là gì?',
'["Đường đi, lẽ thật và sự sống", "Ánh sáng và muối", "Cửa và đường", "Đầu và thân"]',
'[0]',
'Giăng 14:6: Không ai đến cùng Cha mà chẳng bởi Ta.',
'["Tân Ước","Ta là","Cứu rỗi"]','John 14:6','vi',true,NOW(),NOW()),

('q-joh2-016','John',15,1,8,'medium','multiple_choice_single',
'Hình ảnh cây nho thật dạy điều gì cho môn đồ?',
'["Ở trong Ngài để kết nhiều quả", "Tự mình cố gắng", "Nhờ luật pháp kết quả", "Tìm cành khác"]',
'[0]',
'Giăng 15:5: Ta là gốc nho, các ngươi là nhành; ở trong Ta thì kết nhiều quả.',
'["Tân Ước","Ta là","Kết quả"]','John 15:1-8','vi',true,NOW(),NOW()),

-- Hard (4)
('q-joh2-017','John',16,7,15,'hard','multiple_choice_single',
'Vì sao Chúa Giê-su phải đi để Đấng Yên ủi đến?',
'["Để Ngài đến cáo trách, dạy dỗ và dẫn vào lẽ thật", "Để các sứ đồ được tự do", "Để ứng nghiệm lời tiên tri", "Để lập vương quốc trần gian"]',
'[0]',
'Giăng 16:7-13: Khi Ngài đến, sẽ cáo trách thế gian... dẫn các ngươi vào cả lẽ thật.',
'["Tân Ước","Thánh Linh","An ủi"]','John 16:7-15','vi',true,NOW(),NOW()),

('q-joh2-018','John',17,20,23,'hard','multiple_choice_single',
'Trong lời cầu nguyện thầy tế lễ, Chúa cầu xin điều gì cho những người tin?',
'["Hiệp một", "Giàu có", "Khỏe mạnh", "Khôn ngoan"]',
'[0]',
'Giăng 17:21: Hầu cho ai nấy hiệp làm một, như Cha ở trong Con và Con ở trong Cha.',
'["Tân Ước","Cầu thay","Hiệp một"]','John 17:20-23','vi',true,NOW(),NOW()),

('q-joh2-019','John',19,28,30,'hard','multiple_choice_single',
'Lời cuối cùng của Chúa Giê-su trên thập tự trong Giăng 19:30 là gì?',
'["Đã xong", "Cha ơi, xin tha cho họ", "Ta phó linh hồn Ta", "Ta khát"]',
'[0]',
'Giăng 19:30: Ngài phán: "Đã xong!" rồi tắt thở.',
'["Tân Ước","Thập tự","Hoàn tất"]','John 19:28-30','vi',true,NOW(),NOW()),

('q-joh2-020','John',20,24,29,'hard','multiple_choice_single',
'Tô-ma đã nói gì sau khi thấy các dấu đinh của Chúa?',
'["Lạy Chúa tôi và Đức Chúa Trời tôi!", "Con tin Ngài sống lại", "Xin thương xót con", "Xin Thánh Linh đến"]',
'[0]',
'Giăng 20:28: Tô-ma xưng Chúa Giê-su là Chúa và Đức Chúa Trời.',
'["Tân Ước","Xưng nhận","Đức tin"]','John 20:24-29','vi',true,NOW(),NOW());


