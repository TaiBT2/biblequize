-- Repeatable seed: 1 Corinthians questions (20 diverse questions)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES

-- Easy (6)
('q-1co2-001','1 Corinthians',1,10,10,'easy','multiple_choice_single',
'Phao-lô khuyên hội thánh Cô-rinh-tô điều gì về sự chia rẽ?',
'["Hiệp một cùng một ý tưởng", "Mỗi nhóm theo một thầy", "Tránh gặp nhau", "Tự lập nhóm riêng"]',
'[0]',
'1 Cô-rinh-tô 1:10: Khuyên hiệp một, không chia rẽ, đồng một lòng và một ý tưởng.',
'["Tân Ước","Hiệp một","Hội thánh"]','1 Corinthians 1:10','vi',true,NOW(),NOW()),

('q-1co2-002','1 Corinthians',3,6,7,'easy','multiple_choice_single',
'Ai cho lớn lên trong công việc Chúa?',
'["Đức Chúa Trời", "Phao-lô", "A-bô-lô", "Phi-e-rơ"]',
'[0]',
'1 Cô 3:6-7: Phao-lô trồng, A-bô-lô tưới, nhưng Đức Chúa Trời làm cho lớn lên.',
'["Tân Ước","Hội thánh","Khiêm nhường"]','1 Corinthians 3:6-7','vi',true,NOW(),NOW()),

('q-1co2-003','1 Corinthians',6,19,20,'easy','multiple_choice_single',
'Thân thể tín hữu được gọi là gì?',
'["Đền thờ Đức Thánh Linh", "Lều tạm", "Đền thờ Sa-lô-môn", "Vật dơ bẩn"]',
'[0]',
'1 Cô 6:19: Thân thể các ngươi là đền thờ của Đức Thánh Linh.',
'["Tân Ước","Thánh Linh","Thánh khiết"]','1 Corinthians 6:19-20','vi',true,NOW(),NOW()),

('q-1co2-004','1 Corinthians',10,13,13,'easy','multiple_choice_single',
'Đức Chúa Trời làm gì khi tín hữu bị cám dỗ?',
'["Mở lối thoát", "Bỏ mặc", "Tăng cám dỗ", "Trách phạt ngay"]',
'[0]',
'1 Cô 10:13: Ngài trung tín, không để bị cám dỗ quá sức, nhưng mở lối thoát.',
'["Tân Ước","Cám dỗ","Trung tín"]','1 Corinthians 10:13','vi',true,NOW(),NOW()),

('q-1co2-005','1 Corinthians',13,4,7,'easy','multiple_choice_single',
'Theo 1 Cô 13, tình yêu thương có đặc tính nào sau đây?',
'["Hay nhịn nhục, hay nhân từ", "Hay ghen tị", "Tự cao", "Kiêu ngạo"]',
'[0]',
'1 Cô 13:4-7 mô tả tình yêu thương.',
'["Tân Ước","Tình yêu","Đức hạnh"]','1 Corinthians 13:4-7','vi',true,NOW(),NOW()),

('q-1co2-006','1 Corinthians',15,3,4,'easy','multiple_choice_single',
'Cốt lõi Tin Lành theo 1 Cô 15 là gì?',
'["Đấng Christ chịu chết, chôn và sống lại ngày thứ ba", "Giữ luật pháp", "Xây đền thờ", "Ăn chay cầu nguyện"]',
'[0]',
'1 Cô 15:3-4 trình bày cốt lõi Tin Lành.',
'["Tân Ước","Tin Lành","Phục sinh"]','1 Corinthians 15:3-4','vi',true,NOW(),NOW()),

-- Medium (10)
('q-1co2-007','1 Corinthians',1,18,25,'medium','multiple_choice_single',
'Vì sao lời về thập tự bị xem là dại đối với kẻ hư mất?',
'["Vì họ không nhận ra quyền phép Đức Chúa Trời", "Vì thiếu triết lý", "Vì ít bằng chứng", "Vì nghịch truyền thống"]',
'[0]',
'1 Cô 1:18: Thập tự là quyền phép Đức Chúa Trời cho kẻ được cứu.',
'["Tân Ước","Thập tự","Khôn ngoan"]','1 Corinthians 1:18-25','vi',true,NOW(),NOW()),

('q-1co2-008','1 Corinthians',2,12,14,'medium','multiple_choice_single',
'Những sự thuộc linh được hiểu bởi ai?',
'["Người có Thánh Linh", "Người trí thức", "Người đạo đức", "Người nhiều kinh nghiệm"]',
'[0]',
'1 Cô 2:14: Người thuộc xác thịt không nhận sự thuộc linh, phải nhờ Thánh Linh hiểu.',
'["Tân Ước","Mặc khải","Thánh Linh"]','1 Corinthians 2:12-14','vi',true,NOW(),NOW()),

('q-1co2-009','1 Corinthians',5,6,8,'medium','multiple_choice_single',
'Men ít làm dậy cả bột dạy bài học gì cho hội thánh?',
'["Thanh sạch kỷ luật", "Dung túng", "Tự do tuyệt đối", "Giữ hình thức"]',
'[0]',
'1 Cô 5:6-8: Hãy loại men cũ, để trở nên bột mới.',
'["Tân Ước","Kỷ luật","Thánh khiết"]','1 Corinthians 5:6-8','vi',true,NOW(),NOW()),

('q-1co2-010','1 Corinthians',7,1,7,'medium','multiple_choice_single',
'Phao-lô khuyên về hôn nhân và độc thân thế nào?',
'["Tùy ân tứ mỗi người", "Mọi người nên cưới", "Mọi người nên độc thân", "Do hoàn cảnh kinh tế"]',
'[0]',
'1 Cô 7:7: Mỗi người có ơn riêng của mình bởi Đức Chúa Trời.',
'["Tân Ước","Hôn nhân","Ân tứ"]','1 Corinthians 7:1-7','vi',true,NOW(),NOW()),

('q-1co2-011','1 Corinthians',8,4,13,'medium','multiple_choice_single',
'Về đồ cúng thần tượng, nguyên tắc nào được nêu ra?',
'["Tình yêu xây dựng, chớ nên gây vấp phạm", "Kiến thức quan trọng hơn", "Tự do là tối thượng", "Chỉ cần cầu nguyện trước khi ăn"]',
'[0]',
'1 Cô 8:1-13: Kiến thức sinh kiêu ngạo, tình yêu gây dựng; đừng làm cớ vấp phạm.',
'["Tân Ước","Tự do","Tình yêu"]','1 Corinthians 8:4-13','vi',true,NOW(),NOW()),

('q-1co2-012','1 Corinthians',9,19,23,'medium','multiple_choice_single',
'Phao-lô trở nên mọi sự cho mọi người nhằm mục đích gì?',
'["Được cứu một vài người", "Được khen ngợi", "Được phần mười", "Được tôn vinh"]',
'[0]',
'1 Cô 9:22-23: Hầu cho nhờ mọi cách cứu được một vài người.',
'["Tân Ước","Truyền giáo","Thích nghi"]','1 Corinthians 9:19-23','vi',true,NOW(),NOW()),

('q-1co2-013','1 Corinthians',11,23,26,'medium','multiple_choice_single',
'Tiệc Thánh nhằm mục đích gì theo 1 Cô 11?',
'["Tưởng niệm Chúa và rao truyền sự chết Ngài", "Gắn kết xã hội", "Chia sẻ của ăn", "Thực hành Do Thái giáo"]',
'[0]',
'1 Cô 11:24-26: Hãy làm điều này để nhớ Ta... rao truyền sự chết Ngài cho tới lúc Ngài đến.',
'["Tân Ước","Lễ nghi","Tiệc Thánh"]','1 Corinthians 11:23-26','vi',true,NOW(),NOW()),

('q-1co2-014','1 Corinthians',12,4,11,'medium','multiple_choice_single',
'Ai phân phát các ân tứ thuộc linh cho mỗi người?',
'["Thánh Linh theo ý Ngài", "Các sứ đồ", "Mục sư", "Tập thể tín hữu"]',
'[0]',
'1 Cô 12:11: Cùng một Thánh Linh làm mọi sự và phân phát cho mỗi người tùy ý Ngài.',
'["Tân Ước","Ân tứ","Thánh Linh"]','1 Corinthians 12:4-11','vi',true,NOW(),NOW()),

('q-1co2-015','1 Corinthians',14,26,33,'medium','multiple_choice_single',
'Nguyên tắc điều hành thờ phượng tập thể là gì?',
'["Mọi sự phải làm cho gây dựng, cách có trật tự", "Ai muốn nói thì nói", "Càng nhiều tiếng lạ càng tốt", "Không cần thông dịch"]',
'[0]',
'1 Cô 14:26-33: Đức Chúa Trời chẳng phải là tác giả sự loạn lạc, nhưng là của sự bình an.',
'["Tân Ước","Thờ phượng","Trật tự"]','1 Corinthians 14:26-33','vi',true,NOW(),NOW()),

-- Hard (4)
('q-1co2-016','1 Corinthians',9,24,27,'hard','multiple_choice_single',
'Hình ảnh chạy đua dạy điều gì cho môn đồ?',
'["Tiết chế và kỷ luật để đoạt giải không hay hư", "Cần sức mạnh thể chất", "Phải thắng người khác", "Khoe phần thưởng"]',
'[0]',
'1 Cô 9:24-27: Ta đánh thân thể ta và bắt phục nó.',
'["Tân Ước","Kỷ luật","Phần thưởng"]','1 Corinthians 9:24-27','vi',true,NOW(),NOW()),

('q-1co2-017','1 Corinthians',13,8,13,'hard','multiple_choice_single',
'Vì sao tình yêu lớn hơn đức tin và sự trông cậy?',
'["Vì tình yêu còn lại đời đời", "Vì ít khó hơn", "Vì dễ thực hành", "Vì được khen nhiều"]',
'[0]',
'1 Cô 13:13: Hiện nay còn có đức tin, sự trông cậy, tình yêu thương; nhưng lớn hơn hết là tình yêu thương.',
'["Tân Ước","Tình yêu","Ưu việt"]','1 Corinthians 13:8-13','vi',true,NOW(),NOW()),

('q-1co2-018','1 Corinthians',15,12,19,'hard','multiple_choice_single',
'Nếu Đấng Christ không sống lại thì hệ quả gì?',
'["Đức tin vô ích và vẫn còn trong tội", "Luật pháp vô ích", "Truyền giáo vô ích", "Cầu nguyện vô ích"]',
'[0]',
'1 Cô 15:14-19: Đức tin vô ích, các ngươi còn ở trong tội lỗi mình.',
'["Tân Ước","Phục sinh","Trọng tâm"]','1 Corinthians 15:12-19','vi',true,NOW(),NOW()),

('q-1co2-019','1 Corinthians',16,13,14,'hard','multiple_choice_single',
'Lời khuyên kết luận trọng tâm của 1 Cô-rinh-tô là gì?',
'["Hãy vững vàng, mạnh mẽ; mọi việc đều làm bằng tình yêu", "Hãy nhóm họp thường xuyên", "Hãy tìm ân tứ lớn", "Hãy tránh sự bắt bớ"]',
'[0]',
'1 Cô 16:13-14: Hãy giữ mình, đứng vững trong đức tin, mạnh mẽ, và làm mọi việc trong tình yêu thương.',
'["Tân Ước","Khích lệ","Kết luận"]','1 Corinthians 16:13-14','vi',true,NOW(),NOW());


