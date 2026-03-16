-- Repeatable migration: New Testament questions (Matthew - Revelation)
-- Smart questions: context, theology, connections, application

-- ==================== MATTHEW ====================
INSERT IGNORE INTO questions (id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at) VALUES

('q-mat-001', 'Matthew', 1, 21, 21, 'easy', 'multiple_choice_single',
'Tên "Giê-su" (Yeshua) có nghĩa là gì?',
'["Giê-hô-va cứu rỗi", "Đức Chúa Trời ở cùng chúng ta", "Đấng được xức dầu", "Vua của muôn vua"]',
'[0]',
'Ma 1:21 - Giê-su (Yeshua) có nghĩa là "Giê-hô-va cứu rỗi". Tên Ngài bày tỏ mục đích đến thế gian.',
'["Tân Ước","Giáng sinh","Danh Chúa"]', 'Matthew 1:21', 'vi', true, NOW(), NOW()),

('q-mat-003', 'Matthew', 3, 16, 17, 'medium', 'multiple_choice_single',
'Tại Lễ Báp-têm của Chúa Giê-su, cả Ba Ngôi Đức Chúa Trời hiện diện như thế nào?',
'["Con được báp-têm, Thánh Linh như chim bồ câu, Cha phán từ trời", "Chỉ có Con và Cha", "Chỉ có Thánh Linh", "Không rõ ràng"]',
'[0]',
'Ma 3:16-17 - Chúa Giê-su (Con) chịu báp-têm, Đức Thánh Linh ngự xuống như chim bồ câu, Đức Chúa Cha phán: Đây là Con yêu dấu của Ta.',
'["Tân Ước","Báp-têm","Ba Ngôi"]', 'Matthew 3:16-17', 'vi', true, NOW(), NOW()),

('q-mat-004', 'Matthew', 4, 4, 4, 'easy', 'multiple_choice_single',
'Khi bị Sa-tan cám dỗ biến đá thành bánh, Chúa Giê-su đáp gì?',
'["Người ta sống không chỉ nhờ bánh, nhưng bởi mọi lời Chúa", "Ngươi không được cám dỗ Chúa", "Hãy lui ra Sa-tan", "Ta không đói"]',
'[0]',
'Ma 4:4 - Chúa Giê-su dùng Lời Chúa (Phục truyền 8:3) để chống lại mọi cám dỗ của Sa-tan.',
'["Tân Ước","Cám dỗ","Lời Chúa"]', 'Matthew 4:4', 'vi', true, NOW(), NOW()),

('q-mat-005', 'Matthew', 5, 3, 3, 'medium', 'multiple_choice_single',
'Bát Phúc (Beatitudes) bắt đầu bằng: "Phúc cho những người ___"',
'["Có lòng khó khăn (nghèo khó trong tâm linh)", "Giàu có", "Thành công", "Khôn ngoan"]',
'[0]',
'Ma 5:3 - Phúc cho những ai ý thức sự nghèo nàn tâm linh của mình, vì nước thiên đàng thuộc về họ.',
'["Tân Ước","Bài Giảng Trên Núi","Bát Phúc"]', 'Matthew 5:3', 'vi', true, NOW(), NOW()),

('q-mat-006', 'Matthew', 5, 44, 44, 'medium', 'multiple_choice_single',
'Chúa Giê-su dạy điều gì về kẻ thù?',
'["Hãy yêu kẻ thù và cầu nguyện cho kẻ bắt bớ các ngươi", "Hãy tránh xa kẻ thù", "Hãy báo thù công bằng", "Hãy tha thứ nhưng không cần yêu"]',
'[0]',
'Ma 5:44 - Đây là sự dạy dỗ đẳng cấp nhất của Chúa Giê-su, vượt qua mọi luật pháp và đạo đức thường tình.',
'["Tân Ước","Bài Giảng Trên Núi","Yêu thương"]', 'Matthew 5:44', 'vi', true, NOW(), NOW()),

('q-mat-007', 'Matthew', 6, 9, 13, 'easy', 'multiple_choice_single',
'Bài cầu nguyện mẫu của Chúa Giê-su bắt đầu bằng lời nào?',
'["Lạy Cha chúng con ở trên trời", "Lạy Đức Chúa Trời", "Lạy Chúa", "Lạy Đấng Toàn Năng"]',
'[0]',
'Ma 6:9 - Chúa Giê-su dạy chúng ta gọi Chúa là Cha, thể hiện mối quan hệ gần gũi với Ngài.',
'["Tân Ước","Cầu nguyện","Bài cầu nguyện mẫu"]', 'Matthew 6:9-13', 'vi', true, NOW(), NOW()),

('q-mat-009', 'Matthew', 7, 13, 14, 'medium', 'multiple_choice_single',
'Chúa Giê-su nói về hai con đường: cửa hẹp dẫn đến đâu?',
'["Sự sống", "Thiên đàng", "Sự khôn ngoan", "Sự bình an"]',
'[0]',
'Ma 7:14 - Cửa hẹp, đường chật dẫn đến sự sống, và ít người tìm được. Cửa rộng, đường khoan dẫn đến sự hủy diệt.',
'["Tân Ước","Bài Giảng Trên Núi","Sự lựa chọn"]', 'Matthew 7:13-14', 'vi', true, NOW(), NOW()),

('q-mat-010', 'Matthew', 16, 16, 16, 'easy', 'multiple_choice_single',
'Phi-e-rơ tuyên bố về Chúa Giê-su: "Thầy là ___"',
'["Đấng Christ, Con Đức Chúa Trời hằng sống", "Một vị tiên tri", "Thầy giáo vĩ đại", "Vua Y-sơ-ra-ên"]',
'[0]',
'Ma 16:16 - Đây là lời tuyên xưng đức tin quan trọng nhất của Phi-e-rơ, được Chúa Giê-su khen ngợi.',
'["Tân Ước","Phi-e-rơ","Đức tin"]', 'Matthew 16:16', 'vi', true, NOW(), NOW()),

('q-mat-011', 'Matthew', 22, 37, 39, 'easy', 'multiple_choice_single',
'Chúa Giê-su nói điều răn nào là lớn nhất?',
'["Yêu Chúa hết lòng, hết linh hồn, hết trí", "Không giết người", "Giữ ngày Sa-bát", "Không thờ hình tượng"]',
'[0]',
'Ma 22:37-38 - Yêu Chúa hết lòng là điều răn lớn nhất, và yêu người như mình là điều răn thứ hai.',
'["Tân Ước","Điều răn","Yêu thương"]', 'Matthew 22:37-39', 'vi', true, NOW(), NOW()),

('q-mat-012', 'Matthew', 28, 19, 20, 'easy', 'multiple_choice_single',
'Đại mạng lệnh (Great Commission) của Chúa Giê-su là gì?',
'["Hãy đi khiến mọi dân tộc trở thành môn đồ", "Hãy xây nhà thờ", "Hãy giữ luật pháp", "Hãy cầu nguyện liên tục"]',
'[0]',
'Ma 28:19 - Hãy đi khiến mọi dân tộc trở thành môn đồ, làm báp-têm nhân danh Cha, Con và Thánh Linh.',
'["Tân Ước","Đại mạng lệnh","Môn đồ"]', 'Matthew 28:19-20', 'vi', true, NOW(), NOW()),

-- ==================== MARK ====================

('q-mar-001', 'Mark', 2, 17, 17, 'easy', 'multiple_choice_single',
'Chúa Giê-su nói: "Người khỏe mạnh không cần thầy thuốc, nhưng người ___ mới cần"',
'["Đau", "Nghèo", "Cô đơn", "Yếu đuối"]',
'[0]',
'Mác 2:17 - Chúa Giê-su đến không phải để gọi người công bình, nhưng để gọi kẻ có tội ăn năn.',
'["Tân Ước","Sứ vụ Giê-su","Ân điển"]', 'Mark 2:17', 'vi', true, NOW(), NOW()),

('q-mar-002', 'Mark', 10, 45, 45, 'medium', 'multiple_choice_single',
'Chúa Giê-su nói Con Người đến không phải để được ___, nhưng để ___',
'["Phục vụ / phục vụ và phó mạng sống làm giá chuộc", "Làm vua / làm vua", "Được tôn thờ / tôn thờ", "Xét đoán / tha thứ"]',
'[0]',
'Mác 10:45 - Đây là tóm tắt sứ vụ của Chúa Giê-su: phục vụ và hy sinh mạng sống chuộc tội cho nhiều người.',
'["Tân Ước","Phục vụ","Cứu chuộc"]', 'Mark 10:45', 'vi', true, NOW(), NOW()),

('q-mar-003', 'Mark', 12, 41, 44, 'easy', 'multiple_choice_single',
'Tại sao Chúa Giê-su khen bà goá bỏ 2 đồng xu nhỏ?',
'["Bà cho tất cả những gì bà có để sống", "Vì bà nghèo", "Vì bà có đức tin", "Vì bà làm công khai"]',
'[0]',
'Mác 12:44 - Người giàu cho từ sự dư, nhưng bà goá cho tất cả những gì bà có để sinh sống. Chúa nhìn tâm lòng và sự hy sinh.',
'["Tân Ước","Dâng hiến","Tâm lòng"]', 'Mark 12:41-44', 'vi', true, NOW(), NOW()),

-- ==================== LUKE ====================

('q-luk-002', 'Luke', 2, 7, 7, 'easy', 'multiple_choice_single',
'Chúa Giê-su được sinh ra ở đâu?',
'["Trong chuồng gia súc tại Bết-lê-hem", "Trong cung điện", "Trong nhà hội", "Trong nhà trọ"]',
'[0]',
'Lu-ca 2:7 - Ma-ri sinh con trai đầu lòng, bọc trong khăn, đặt nằm trong máng cỏ vì không có chỗ trong nhà trọ.',
'["Tân Ước","Giáng sinh","Khiêm nhường"]', 'Luke 2:7', 'vi', true, NOW(), NOW()),

('q-luk-003', 'Luke', 10, 30, 37, 'easy', 'multiple_choice_single',
'Trong chuyện ngụ ngôn Người Sa-ma-ri Nhân Lành, ai đã giúp người bị cướp?',
'["Người Sa-ma-ri", "Thầy tế lễ", "Người Lê-vi", "Quân lính La-mã"]',
'[0]',
'Lu-ca 10:33-34 - Người Sa-ma-ri (bị người Do-thái khinh chê) lại là người duy nhất động lòng thương xót và giúp đỡ.',
'["Tân Ước","Dụ ngôn","Yêu thương"]', 'Luke 10:30-37', 'vi', true, NOW(), NOW()),

('q-luk-004', 'Luke', 15, 4, 7, 'easy', 'multiple_choice_single',
'Trong dụ ngôn Chiên Con Lạc Mất, người chăn có bao nhiêu con chiên trước khi mất 1 con?',
'["100 con", "50 con", "200 con", "99 con"]',
'[0]',
'Lu-ca 15:4 - Người chăn có 100 con, mất 1, bỏ 99 con lại để đi tìm con bị lạc. Minh hoạ tình yêu của Chúa đối với kẻ tội lỗi.',
'["Tân Ước","Dụ ngôn","Tình yêu Chúa"]', 'Luke 15:4-7', 'vi', true, NOW(), NOW()),

('q-luk-005', 'Luke', 15, 11, 32, 'medium', 'multiple_choice_single',
'Trong dụ ngôn Đứa Con Hoang Đàng, khi con trở về, người cha làm gì?',
'["Chạy ra ôm hôn và làm tiệc mừng", "Trách mắng trước rồi tha thứ", "Từ chối gặp mặt", "Bắt làm tôi tớ"]',
'[0]',
'Lu-ca 15:20-24 - Cha chạy ra ôm và hôn con, mặc áo tốt nhất, đeo nhẫn, làm tiệc. Hình ảnh đẹp về Chúa chào đón kẻ tội lỗi ăn năn.',
'["Tân Ước","Dụ ngôn","Tha thứ"]', 'Luke 15:11-32', 'vi', true, NOW(), NOW()),

('q-luk-007', 'Luke', 23, 43, 43, 'medium', 'multiple_choice_single',
'Chúa Giê-su hứa gì với tên cướp ăn năn trên thập tự?',
'["Hôm nay người sẽ ở với ta trong Ba-ra-đi", "Người sẽ được phục sinh", "Tội của người đã được tha", "Người sẽ được nhớ đến"]',
'[0]',
'Lu-ca 23:43 - Sự cứu rỗi chỉ cần đức tin chân thật, không cần việc làm. Tên cướp chỉ cần tin và được Chúa hứa thiên đàng.',
'["Tân Ước","Thập tự","Ân điển"]', 'Luke 23:43', 'vi', true, NOW(), NOW()),

-- ==================== JOHN ====================

('q-joh-001', 'John', 1, 1, 1, 'medium', 'multiple_choice_single',
'Giăng 1:1 nói "Ban đầu có Ngôi Lời." Ngôi Lời là ai?',
'["Chúa Giê-su Christ", "Đức Chúa Cha", "Đức Thánh Linh", "Thiên sứ"]',
'[0]',
'Giăng 1:1,14 - Ngôi Lời là Chúa Giê-su, Đấng từ muôn đời ở cùng Đức Chúa Trời và chính là Đức Chúa Trời.',
'["Tân Ước","Thần tính Giê-su","Giăng"]', 'John 1:1', 'vi', true, NOW(), NOW()),

('q-joh-002', 'John', 1, 14, 14, 'hard', 'multiple_choice_single',
'Giăng 1:14 "Ngôi Lời đã trở nên xác thịt" dạy về giáo lý nào?',
'["Sự nhập thể (Incarnation) - Chúa trở nên con người", "Sự sáng tạo", "Sự phục sinh", "Sự tái lâm"]',
'[0]',
'Giăng 1:14 - Ngôi Lời (Chúa Giê-su) trở nên xác thịt, ở giữa chúng ta - đây là giáo lý nhập thể, Chúa trọn vẹn là Đức Chúa Trời và trọn vẹn là con người.',
'["Tân Ước","Thần học","Nhập thể"]', 'John 1:14', 'vi', true, NOW(), NOW()),

('q-joh-003', 'John', 3, 16, 16, 'easy', 'multiple_choice_single',
'Giăng 3:16 được gọi là "câu gốc của Phúc Âm" vì sao?',
'["Tóm tắt toàn bộ sứ điệp cứu rỗi: tình yêu Chúa, Con Ngài, đức tin, sự sống đời đời", "Vì là câu dài nhất", "Vì là câu đầu tiên", "Vì được viết bởi Chúa Giê-su"]',
'[0]',
'Giăng 3:16 - Vì Đức Chúa Trời yêu thương thế gian đến nỗi ban Con một Ngài, hầu cho hễ ai tin Con ấy không bị hư mất mà được sự sống đời đời.',
'["Tân Ước","Phúc Âm","Cứu rỗi"]', 'John 3:16', 'vi', true, NOW(), NOW()),

('q-joh-004', 'John', 3, 3, 3, 'medium', 'multiple_choice_single',
'Chúa Giê-su nói với Ni-cô-đêm điều kiện để vào nước Chúa là gì?',
'["Phải được sinh lại (tái sinh)", "Phải giữ luật pháp", "Phải dâng của lễ", "Phải làm việc lành"]',
'[0]',
'Giăng 3:3 - Phải được sinh lại từ nước và Thánh Linh. Không phải sinh thể xác lần nữa mà là sinh thuộc linh.',
'["Tân Ước","Tái sinh","Cứu rỗi"]', 'John 3:3', 'vi', true, NOW(), NOW()),

('q-joh-006', 'John', 11, 25, 26, 'easy', 'multiple_choice_single',
'Chúa Giê-su tuyên bố: "Ta là sự ___ và sự sống"',
'["Sống lại", "Bình an", "Yêu thương", "Công bình"]',
'[0]',
'Giăng 11:25 - Chúa Giê-su là sự sống lại và sự sống. Ai tin Ngài, dù đã chết, cũng sẽ sống.',
'["Tân Ước","Phục sinh","Đức tin"]', 'John 11:25-26', 'vi', true, NOW(), NOW()),

('q-joh-007', 'John', 13, 34, 35, 'easy', 'multiple_choice_single',
'Chúa Giê-su nói người ta sẽ nhận biết môn đồ Ngài nhờ dấu hiệu gì?',
'["Yêu thương nhau", "Làm phép lạ", "Kiến thức Kinh Thánh", "Đi nhà thờ"]',
'[0]',
'Giăng 13:35 - Dấu hiệu của môn đồ thật là tình yêu thương lẫn nhau, không phải tài năng hay kiến thức.',
'["Tân Ước","Môn đồ","Yêu thương"]', 'John 13:34-35', 'vi', true, NOW(), NOW()),

('q-joh-008', 'John', 14, 6, 6, 'easy', 'multiple_choice_single',
'Chúa Giê-su phán: "Ta là đường đi, lẽ thật và sự sống. Không ai đến được với Cha mà không ___"',
'["Bởi ta", "Bởi việc lành", "Bởi luật pháp", "Bởi tôn giáo"]',
'[0]',
'Giăng 14:6 - Chúa Giê-su là con đường duy nhất đến với Đức Chúa Cha, không có con đường nào khác.',
'["Tân Ước","Con đường","Độc nhất"]', 'John 14:6', 'vi', true, NOW(), NOW()),

('q-joh-010', 'John', 19, 30, 30, 'easy', 'multiple_choice_single',
'Lời cuối cùng của Chúa Giê-su trên thập tự theo sách Giăng là gì?',
'["Mọi việc đã được trọn (It is finished)", "Lạy Cha, con phó linh hồn con", "Lạy Cha, sao Cha bỏ con", "Con khát"]',
'[0]',
'Giăng 19:30 - "Tetelestai" - Đã hoàn tất! Công trình cứu chuộc đã được thanh toán trọn vẹn.',
'["Tân Ước","Thập tự","Cứu chuộc"]', 'John 19:30', 'vi', true, NOW(), NOW()),

('q-joh-011', 'John', 20, 29, 29, 'medium', 'multiple_choice_single',
'Sau khi Thô-ma sờ vào vết thương, Chúa Giê-su nói điều gì về đức tin?',
'["Phúc cho những kẻ không thấy mà tin", "Người phải tin nhiều hơn", "Đức tin cần chứng cớ", "Hãy nói cho người khác"]',
'[0]',
'Giăng 20:29 - Chúa Giê-su khen những ai tin mà không cần thấy bằng mắt, như chúng ta ngày nay.',
'["Tân Ước","Phục sinh","Đức tin"]', 'John 20:29', 'vi', true, NOW(), NOW()),

-- ==================== ACTS ====================

('q-act-001', 'Acts', 1, 8, 8, 'easy', 'multiple_choice_single',
'Trước khi thăng thiên, Chúa Giê-su hứa các môn đồ sẽ nhận được gì?',
'["Quyền phép khi Đức Thánh Linh giáng trên", "Vàng bạc", "Quyền lực chính trị", "Sự khôn ngoan"]',
'[0]',
'Công vụ 1:8 - Khi Đức Thánh Linh giáng trên, các ngươi sẽ nhận lãnh quyền phép và làm chứng ta khắp đất.',
'["Tân Ước","Thánh Linh","Làm chứng"]', 'Acts 1:8', 'vi', true, NOW(), NOW()),

('q-act-002', 'Acts', 2, 1, 4, 'easy', 'multiple_choice_single',
'Ngày Lễ Ngũ Tuần, dấu hiệu Đức Thánh Linh giáng xuống là gì?',
'["Gió mạnh, lưỡi lửa, nói các thứ tiếng", "Chim bồ câu", "Đám mây sáng", "Động đất"]',
'[0]',
'Công vụ 2:2-4 - Gió từ trời, lưỡi lửa đậu trên đầu mỗi người, và họ nói các thứ tiếng khác bởi quyền năng Thánh Linh.',
'["Tân Ước","Lễ Ngũ Tuần","Thánh Linh"]', 'Acts 2:1-4', 'vi', true, NOW(), NOW()),

('q-act-003', 'Acts', 2, 38, 38, 'medium', 'multiple_choice_single',
'Phi-e-rơ rao giảng ngày Lễ Ngũ Tuần, kêu gọi mọi người làm gì?',
'["Ăn năn và chịu báp-têm nhân danh Chúa Giê-su", "Giữ luật Môi-se", "Rời Giê-ru-sa-lem", "Dâng của lễ"]',
'[0]',
'Công vụ 2:38 - Phi-e-rơ kêu gọi ăn năn (đổi hướng), báp-têm nhân danh Chúa, và nhận lãnh Đức Thánh Linh.',
'["Tân Ước","Giáo lý","Ăn năn"]', 'Acts 2:38', 'vi', true, NOW(), NOW()),

('q-act-004', 'Acts', 9, 3, 6, 'easy', 'multiple_choice_single',
'Sau-lơ (sau là sứ đồ Phao-lô) gặp Chúa Giê-su trên đường đi đâu?',
'["Đa-mách", "Giê-ru-sa-lem", "An-ti-ốt", "La-mã"]',
'[0]',
'Công vụ 9:3 - Trên đường Đa-mách, ánh sáng từ trời chiếu xuống và Chúa Giê-su phán với Sau-lơ.',
'["Tân Ước","Phao-lô","Biến đổi"]', 'Acts 9:3-6', 'vi', true, NOW(), NOW()),

-- ==================== ROMANS ====================

('q-rom-001', 'Romans', 3, 23, 23, 'easy', 'multiple_choice_single',
'Rô-ma 3:23 nói rằng ai đã phạm tội?',
'["Mọi người đều đã phạm tội", "Chỉ kẻ ác", "Chỉ người ngoại đạo", "Chỉ A-đam và Ê-va"]',
'[0]',
'Rô-ma 3:23 - Vì mọi người đều đã phạm tội, thiếu mất sự vinh hiển của Đức Chúa Trời. Không ai ngoại lệ.',
'["Tân Ước","Cứu rỗi","Tội lỗi"]', 'Romans 3:23', 'vi', true, NOW(), NOW()),

('q-rom-002', 'Romans', 5, 8, 8, 'easy', 'multiple_choice_single',
'Theo Rô-ma 5:8, Chúa bày tỏ tình yêu với chúng ta khi nào?',
'["Khi chúng ta còn là người có tội", "Khi chúng ta làm lành", "Khi chúng ta cầu nguyện", "Khi chúng ta ăn năn"]',
'[0]',
'Rô-ma 5:8 - Đang khi chúng ta còn là kẻ có tội, Chúa Giê-su đã chết thay cho chúng ta. Tình yêu vô điều kiện.',
'["Tân Ước","Ân điển","Tình yêu"]', 'Romans 5:8', 'vi', true, NOW(), NOW()),

('q-rom-003', 'Romans', 6, 23, 23, 'easy', 'multiple_choice_single',
'Rô-ma 6:23 nói: "Tiền công của tội lỗi là sự chết, nhưng ân điển của Đức Chúa Trời là ___"',
'["Sự sống đời đời trong Chúa Giê-su Christ", "Sự tha thứ", "Sự bình an", "Sự khôn ngoan"]',
'[0]',
'Rô-ma 6:23 - Tội lỗi dẫn đến sự chết, nhưng món quà miễn phí của Chúa là sự sống đời đời qua Chúa Giê-su.',
'["Tân Ước","Cứu rỗi","Ân điển"]', 'Romans 6:23', 'vi', true, NOW(), NOW()),

('q-rom-005', 'Romans', 8, 38, 39, 'medium', 'multiple_choice_single',
'Theo Rô-ma 8:38-39, điều gì có thể phân cách chúng ta khỏi tình yêu của Chúa?',
'["Không gì cả - không sự chết, sự sống, hay bất cứ điều gì", "Tội lỗi nghiêm trọng", "Sự bội đạo", "Sự phản bội"]',
'[0]',
'Rô-ma 8:38-39 - Không có gì có thể phân cách chúng ta khỏi tình yêu của Đức Chúa Trời trong Chúa Giê-su Christ.',
'["Tân Ước","Ân điển","Tình yêu"]', 'Romans 8:38-39', 'vi', true, NOW(), NOW()),

('q-rom-006', 'Romans', 10, 9, 10, 'medium', 'multiple_choice_single',
'Rô-ma 10:9 nói hai điều kiện để được cứu là gì?',
'["Miệng tuyên xưng Giê-su là Chúa và lòng tin Chúa đã sống lại", "Chịu báp-têm và giữ luật pháp", "Ăn năn và dâng của lễ", "Cầu nguyện và ăn chay"]',
'[0]',
'Rô-ma 10:9 - Nếu miệng người tuyên xưng Giê-su là Chúa và lòng người tin Đức Chúa Trời đã kéo Ngài từ kẻ chết sống lại thì người sẽ được cứu.',
'["Tân Ước","Cứu rỗi","Tuyên xưng"]', 'Romans 10:9-10', 'vi', true, NOW(), NOW()),

('q-rom-007', 'Romans', 12, 2, 2, 'medium', 'multiple_choice_single',
'Rô-ma 12:2 khuyên chúng ta đừng làm theo đời này nhưng hãy đổi mới thế nào?',
'["Đổi mới tâm trí", "Đổi mới hành vi", "Đổi mới hình thức", "Đổi mới môi trường"]',
'[0]',
'Rô-ma 12:2 - Sự biến đổi bắt đầu từ tâm trí. Khi tâm trí được đổi mới bởi Lời Chúa, hành vi sẽ thay đổi.',
'["Tân Ước","Biến đổi","Tâm trí"]', 'Romans 12:2', 'vi', true, NOW(), NOW()),

-- ==================== 1 & 2 CORINTHIANS ====================

('q-1co-001', '1 Corinthians', 13, 4, 7, 'easy', 'multiple_choice_single',
'Theo 1 Cô-rinh-tô 13, tình yêu thương bắt đầu bằng điều gì?',
'["Hay nhịn nhục và nhân từ", "Hay hy sinh", "Hay cho đi", "Hay tha thứ"]',
'[0]',
'1 Cô 13:4 - Tình yêu hay nhịn nhục, tình yêu hay nhân từ. Nhịn nhục và nhân từ là nền tảng của tình yêu thương thật.',
'["Tân Ước","Tình yêu","Đời sống"]', '1 Corinthians 13:4-7', 'vi', true, NOW(), NOW()),

('q-1co-002', '1 Corinthians', 13, 13, 13, 'easy', 'multiple_choice_single',
'Trong ba điều còn lại mãi: đức tin, sự trông cậy và tình yêu thương, điều nào lớn hơn hết?',
'["Tình yêu thương", "Đức tin", "Sự trông cậy (hy vọng)", "Cả ba bằng nhau"]',
'[0]',
'1 Cô 13:13 - Tình yêu thương lớn hơn hết vì nó là bản tính của Đức Chúa Trời (1 Giăng 4:8).',
'["Tân Ước","Tình yêu","Thần học"]', '1 Corinthians 13:13', 'vi', true, NOW(), NOW()),

('q-1co-003', '1 Corinthians', 15, 3, 4, 'hard', 'multiple_choice_single',
'Theo 1 Cô 15:3-4, Phúc Âm có thể tóm tắt trong mấy điều cốt lõi?',
'["3 điều: Christ chết vì tội, được chôn và sống lại ngày thứ ba", "1 điều: tin Chúa", "5 điều ràng buộc", "7 bí tích"]',
'[0]',
'1 Cô 15:3-4 - Phúc Âm là: Christ chết vì tội lỗi (1), được chôn (2), và sống lại ngày thứ ba (3) đúng như Kinh Thánh.',
'["Tân Ước","Phúc Âm","Cốt lõi"]', '1 Corinthians 15:3-4', 'vi', true, NOW(), NOW()),

('q-2co-001', '2 Corinthians', 5, 17, 17, 'easy', 'multiple_choice_single',
'2 Cô 5:17 nói khi ai ở trong Chúa Giê-su thì người ấy là gì?',
'["Tạo vật mới", "Người tốt hơn", "Thánh nhân", "Thiên sứ"]',
'[0]',
'2 Cô 5:17 - Nếu ai ở trong Đấng Christ thì người ấy là tạo vật mới. Những sự cũ đã qua đi, nay mọi sự đều trở nên mới.',
'["Tân Ước","Tái sinh","Đổi mới"]', '2 Corinthians 5:17', 'vi', true, NOW(), NOW()),

-- ==================== GALATIANS & EPHESIANS ====================

('q-gal-001', 'Galatians', 2, 20, 20, 'medium', 'multiple_choice_single',
'Phao-lô nói: "Tôi đã bị đóng đinh vào thập tự giá với Đấng Christ, mà tôi sống, không phải là tôi sống nữa, nhưng ___"',
'["Đấng Christ sống trong tôi", "Tôi sống cho Chúa", "Tôi là tạo vật mới", "Tôi được tự do"]',
'[0]',
'Ga-la-ti 2:20 - Đời sống Cơ Đốc là để Đấng Christ sống qua chúng ta, không phải tự lực mình.',
'["Tân Ước","Đời sống mới","Đấng Christ"]', 'Galatians 2:20', 'vi', true, NOW(), NOW()),

('q-gal-002', 'Galatians', 5, 22, 23, 'easy', 'multiple_choice_single',
'Trái của Thánh Linh bắt đầu bằng gì?',
'["Yêu thương", "Vui mừng", "Bình an", "Nhịn nhục"]',
'[0]',
'Ga 5:22 - Trái Thánh Linh: yêu thương, vui mừng, bình an, nhịn nhục, nhân từ, hiền lành, trung tín, mềm mại, tiết độ.',
'["Tân Ước","Thánh Linh","Trái Linh"]', 'Galatians 5:22-23', 'vi', true, NOW(), NOW()),

('q-eph-001', 'Ephesians', 2, 8, 9, 'easy', 'multiple_choice_single',
'Theo Ê-phê-sô 2:8-9, chúng ta được cứu bởi điều gì?',
'["Bởi ân điển, qua đức tin, không phải bởi việc làm", "Bởi việc lành", "Bởi giữ luật pháp", "Bởi báp-têm"]',
'[0]',
'Ê-phê 2:8-9 - Vì nhờ ân điển, bởi đức tin, mà anh em được cứu. Điều này không phải tự nơi anh em, ấy là sự ban cho của Đức Chúa Trời.',
'["Tân Ước","Cứu rỗi","Ân điển"]', 'Ephesians 2:8-9', 'vi', true, NOW(), NOW()),

('q-eph-002', 'Ephesians', 6, 11, 13, 'medium', 'multiple_choice_single',
'Ê-phê-sô 6 nói về khí giới toàn thân của Đức Chúa Trời. Tại sao chúng ta cần mặc khí giới này?',
'["Để đứng vững chống lại mưu kế của ma quỷ", "Để tấn công kẻ thù", "Để được mạnh mẽ", "Để bảo vệ gia đình"]',
'[0]',
'Ê-phê 6:11 - Chúng ta chiến trận không phải với loài người mà với các thế lực thuộc linh ở các miền trên trời.',
'["Tân Ước","Chiến trận thuộc linh","Khí giới"]', 'Ephesians 6:11-13', 'vi', true, NOW(), NOW()),

-- ==================== PHILIPPIANS & COLOSSIANS ====================

('q-phi-001', 'Philippians', 4, 6, 7, 'easy', 'multiple_choice_single',
'Phi-líp 4:6 dạy chúng ta làm gì thay vì lo lắng?',
'["Cầu nguyện, nài xin với sự tạ ơn", "Cố gắng hơn nữa", "Đừng suy nghĩ về vấn đề", "Nhờ người khác giúp"]',
'[0]',
'Phi 4:6-7 - Đừng lo lắng gì hết, nhưng trong mọi sự hãy dùng lời cầu nguyện, nài xin và tạ ơn trình các sự cầu xin mình cho Đức Chúa Trời.',
'["Tân Ước","Cầu nguyện","Bình an"]', 'Philippians 4:6-7', 'vi', true, NOW(), NOW()),

-- ==================== HEBREWS ====================

('q-heb-001', 'Hebrews', 11, 1, 1, 'medium', 'multiple_choice_single',
'Hê-bơ-rơ 11:1 định nghĩa đức tin là gì?',
'["Sự vững tin điều mình đang trông đợi, bằng chứng điều mình không thấy", "Tin không cần lý do", "Cảm giác tốt đẹp", "Sự lạc quan"]',
'[0]',
'Hê 11:1 - Đức tin là sự vững tin về những điều mình trông đợi, bằng chứng về những điều mình không thấy.',
'["Tân Ước","Đức tin","Định nghĩa"]', 'Hebrews 11:1', 'vi', true, NOW(), NOW()),

('q-heb-002', 'Hebrews', 11, 6, 6, 'easy', 'multiple_choice_single',
'Theo Hê-bơ-rơ 11:6, không có đức tin thì không thể nào làm gì?',
'["Đẹp lòng Đức Chúa Trời (đẹp lòng Ngài)", "Cầu nguyện", "Vào nhà thờ", "Đọc Kinh Thánh"]',
'[0]',
'Hê 11:6 - Không có đức tin thì không thể nào đẹp lòng Ngài. Ai đến gần Chúa phải tin rằng Ngài hiện hữu và thưởng những kẻ tìm kiếm Ngài.',
'["Tân Ước","Đức tin","Đẹp lòng Chúa"]', 'Hebrews 11:6', 'vi', true, NOW(), NOW()),

('q-heb-003', 'Hebrews', 12, 1, 2, 'medium', 'multiple_choice_single',
'Hê-bơ-rơ 12:2 khuyên chúng ta chạy đua bằng cách nhìn vào ai?',
'["Chúa Giê-su, Đấng khởi đầu và hoàn tất đức tin", "Các vị anh hùng đức tin", "Chính mình", "Thiên sứ"]',
'[0]',
'Hê 12:2 - Mắt hướng về Đức Chúa Giê-su, là cớ Đấng khởi đầu và hoàn tất đức tin chúng ta.',
'["Tân Ước","Đức tin","Kiên nhẫn"]', 'Hebrews 12:1-2', 'vi', true, NOW(), NOW()),

-- ==================== JAMES & 1 PETER ====================

('q-jam-001', 'James', 1, 2, 3, 'medium', 'multiple_choice_single',
'Gia-cơ 1:2 dạy chúng ta phản ứng thế nào khi gặp thử thách?',
'["Hãy có sự vui mừng trọn vẹn", "Hãy kiên nhẫn chịu đựng", "Hãy cầu nguyện liên tục", "Hãy tìm cách thoát"]',
'[0]',
'Gia-cơ 1:2-3 - Hãy có sự vui mừng trọn vẹn vì thử thách sinh sự nhịn nhục, và nhịn nhục sinh sự trọn vẹn.',
'["Tân Ước","Thử thách","Vui mừng"]', 'James 1:2-3', 'vi', true, NOW(), NOW()),

('q-jam-002', 'James', 2, 17, 17, 'easy', 'multiple_choice_single',
'Gia-cơ 2:17 nói đức tin không có ___ thì là đức tin chết',
'["Việc làm", "Cầu nguyện", "Kiến thức", "Cảm xúc"]',
'[0]',
'Gia-cơ 2:17 - Đức tin thật sẽ thể hiện qua hành động. Không có việc làm, đức tin chỉ là lý thuyết.',
'["Tân Ước","Đức tin","Hành động"]', 'James 2:17', 'vi', true, NOW(), NOW()),

-- ==================== 1 JOHN & REVELATION ====================

('q-1jo-001', '1 John', 4, 8, 8, 'easy', 'multiple_choice_single',
'1 Giăng 4:8 định nghĩa Đức Chúa Trời là gì?',
'["Đức Chúa Trời là sự yêu thương", "Đức Chúa Trời là sự sáng", "Đức Chúa Trời là thần", "Đức Chúa Trời là lửa"]',
'[0]',
'1 Giăng 4:8 - Đức Chúa Trời là sự yêu thương. Ai không yêu thương thì không biết Đức Chúa Trời.',
'["Tân Ước","Bản tính Chúa","Yêu thương"]', '1 John 4:8', 'vi', true, NOW(), NOW()),

('q-1jo-002', '1 John', 1, 9, 9, 'easy', 'multiple_choice_single',
'Nếu chúng ta xưng nhận tội mình, Chúa sẽ làm gì theo 1 Giăng 1:9?',
'["Tha tội và làm sạch mọi sự gian ác", "Hình phạt chúng ta", "Quay mặt đi", "Đòi chúng ta chứng minh"]',
'[0]',
'1 Giăng 1:9 - Chúa thành tín và công bình sẽ tha tội và làm sạch mọi sự gian ác. Chỉ cần xưng nhận chân thật.',
'["Tân Ước","Tha thứ","Xưng tội"]', '1 John 1:9', 'vi', true, NOW(), NOW()),

('q-rev-001', 'Revelation', 3, 20, 20, 'easy', 'multiple_choice_single',
'Khải huyền 3:20 nói: "Nầy ta đứng trước cửa mà gõ. Nếu ai nghe tiếng ta mà ___, ta sẽ vào"',
'["Mở cửa", "Cầu nguyện", "Gọi tên ta", "Chạy đến"]',
'[0]',
'Khải 3:20 - Chúa Giê-su đứng trước cửa lòng mỗi người và gõ. Ngài không ép buộc mà cho chúng ta tự mở cửa.',
'["Tân Ước","Lời mời","Tự do ý chí"]', 'Revelation 3:20', 'vi', true, NOW(), NOW()),

('q-rev-002', 'Revelation', 21, 4, 4, 'easy', 'multiple_choice_single',
'Khải huyền 21:4 mô tả thiên đàng như thế nào?',
'["Không còn nước mắt, sự chết, tang chế, đau khổ", "Đường phố vàng", "Thiên thần ca hát", "Âm nhạc bất tận"]',
'[0]',
'Khải 21:4 - Chúa sẽ lau mọi nước mắt, không còn sự chết, tang chế, kêu la hay đau đớn nữa. Sự cũ đã qua rồi.',
'["Tân Ước","Thiên đàng","Hy vọng"]', 'Revelation 21:4', 'vi', true, NOW(), NOW());
