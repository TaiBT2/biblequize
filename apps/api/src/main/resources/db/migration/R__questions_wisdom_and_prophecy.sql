-- Repeatable migration: Wisdom Literature & Prophets
-- Psalms, Proverbs, Ecclesiastes, Isaiah, Jeremiah, Ezekiel, Daniel, Minor Prophets

-- ==================== PSALMS ====================
INSERT IGNORE INTO questions (id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at) VALUES

('q-psa-001', 'Psalms', 23, 1, 1, 'easy', 'multiple_choice_single',
'Thi thiên 23 bắt đầu bằng câu nào?',
'["Đức Giê-hô-va là Đấng chăn giữ tôi", "Trời kể ra sự vinh hiển Chúa", "Hãy ngợi khen Đức Giê-hô-va", "Đức Giê-hô-va là nơi ẩn náu tôi"]',
'[0]',
'Thi 23:1 - Đức Giê-hô-va là Đấng chăn giữ tôi, tôi sẽ chẳng thiếu thốn gì. Một trong những thi thiên được yêu thích nhất.',
'["Cựu Ước","Thi thiên","Chăn giữ"]', 'Psalms 23:1', 'vi', true, NOW(), NOW()),

('q-psa-003', 'Psalms', 1, 1, 3, 'medium', 'multiple_choice_single',
'Thi thiên 1 so sánh người công bình như gì?',
'["Cây trồng gần suối nước, sinh trái đúng mùa", "Núi cao vững chắc", "Ngôi sao sáng", "Sức mạnh của sư tử"]',
'[0]',
'Thi 1:3 - Người ấy giống như cây trồng gần suối nước, sinh trái đúng mùa, lá không hề tàn. Mọi việc đều thành tựu.',
'["Cựu Ước","Thi thiên","Công bình"]', 'Psalms 1:1-3', 'vi', true, NOW(), NOW()),

('q-psa-004', 'Psalms', 46, 10, 10, 'easy', 'multiple_choice_single',
'Thi 46:10 nói: "Hãy yên lặng và biết rằng ta là ___"',
'["Đức Chúa Trời", "Chúa", "Đấng Toàn Năng", "Đấng Sáng Tạo"]',
'[0]',
'Thi 46:10 - Lời mời gọi yên lặng trước sự hiện diện của Chúa, tin cậy Ngài đang nắm quyền kiểm soát.',
'["Cựu Ước","Thi thiên","Tin cậy"]', 'Psalms 46:10', 'vi', true, NOW(), NOW()),

('q-psa-005', 'Psalms', 119, 105, 105, 'easy', 'multiple_choice_single',
'Thi 119:105 so sánh Lời Chúa như gì?',
'["Ngọn đèn cho chân và ánh sáng cho đường", "Lưỡi gươm hai lưỡi", "Lửa cháy", "Nước sông"]',
'[0]',
'Thi 119:105 - Lời Chúa là ngọn đèn cho chân tôi, ánh sáng cho đường lối tôi. Soi sáng hướng đi cho đời sống.',
'["Cựu Ước","Thi thiên","Lời Chúa"]', 'Psalms 119:105', 'vi', true, NOW(), NOW()),

('q-psa-006', 'Psalms', 139, 13, 14, 'easy', 'multiple_choice_single',
'Thi 139:14 nói chúng ta được dựng nên cách nào?',
'["Cách đáng sợ và điều kỳ (lạ lùng)", "Tự nhiên", "Ngẫu nhiên", "Đơn giản"]',
'[0]',
'Thi 139:14 - Tôi ca ngợi Chúa vì tôi được dựng nên cách đáng sợ lạ lùng. Công việc Chúa là kỳ diệu.',
'["Cựu Ước","Thi thiên","Giá trị con người"]', 'Psalms 139:13-14', 'vi', true, NOW(), NOW()),

('q-psa-008', 'Psalms', 22, 1, 1, 'hard', 'multiple_choice_single',
'Thi thiên 22 bắt đầu: "Đức Chúa Trời tôi ơi, sao Ngài bỏ tôi?" Câu này được ai trích dẫn trên thập tự?',
'["Chúa Giê-su", "Da-vít", "Phi-e-rơ", "Phao-lô"]',
'[0]',
'Ma 27:46 - Chúa Giê-su trích Thi 22:1 khi bị đóng đinh. Thi 22 là thi thiên tiên tri chi tiết về sự đóng đinh.',
'["Cựu Ước","Tiên tri","Thập tự"]', 'Psalms 22:1', 'vi', true, NOW(), NOW()),

-- ==================== PROVERBS ====================

('q-pro-001', 'Proverbs', 1, 7, 7, 'easy', 'multiple_choice_single',
'Theo Châm ngôn 1:7, sự khôn ngoan bắt đầu từ điều gì?',
'["Sự kính sợ Đức Giê-hô-va", "Học thức", "Kinh nghiệm", "Tuân theo luật pháp"]',
'[0]',
'Châm 1:7 - Sự kính sợ Đức Giê-hô-va là khởi đầu sự tri thức. Mọi sự khôn ngoan thật đều bắt nguồn từ Chúa.',
'["Cựu Ước","Khôn ngoan","Kính sợ Chúa"]', 'Proverbs 1:7', 'vi', true, NOW(), NOW()),

('q-pro-002', 'Proverbs', 3, 5, 6, 'easy', 'multiple_choice_single',
'Châm ngôn 3:5 dạy: "Hãy hết lòng tin cậy Đức Giê-hô-va, chớ nương cậy nơi ___"',
'["Sự thông sáng của con", "Sức mạnh của con", "Sự giàu có", "Người khác"]',
'[0]',
'Châm 3:5-6 - Hãy tin cậy Chúa hết lòng, đừng dựa vào trí hiểu mình. Trong mọi đường lối hãy nhận biết Ngài.',
'["Cựu Ước","Khôn ngoan","Tin cậy"]', 'Proverbs 3:5-6', 'vi', true, NOW(), NOW()),

('q-pro-003', 'Proverbs', 22, 6, 6, 'easy', 'multiple_choice_single',
'Châm ngôn 22:6 dạy về việc nuôi dạy con cái thế nào?',
'["Hãy dạy trẻ thơ theo đường nó phải đi, đến khi nó già cũng không rời khỏi", "Hãy để trẻ tự phát triển", "Hãy nghiêm khắc", "Hãy cho trẻ tự do hoàn toàn"]',
'[0]',
'Châm 22:6 - Nguyên tắc giáo dục: dạy dỗ trẻ từ nhỏ theo đường lối của Chúa.',
'["Cựu Ước","Khôn ngoan","Giáo dục"]', 'Proverbs 22:6', 'vi', true, NOW(), NOW()),

('q-pro-004', 'Proverbs', 27, 17, 17, 'medium', 'multiple_choice_single',
'Châm ngôn 27:17 nói: "Sắt mài sắt cho bén. Cũng vậy ___ mài giữa bạn hữu"',
'["Người này làm cho người kia bén", "Mặt đối mặt", "Tâm lòng đối tâm lòng", "Lời nói đối lời nói"]',
'[0]',
'Châm 27:17 - Sắt mài sắt cho bén, bạn bè tốt giúp nhau trưởng thành qua mối quan hệ chân thật.',
'["Cựu Ước","Khôn ngoan","Tình bạn"]', 'Proverbs 27:17', 'vi', true, NOW(), NOW()),

-- ==================== ECCLESIASTES ====================

('q-ecc-001', 'Ecclesiastes', 3, 1, 1, 'easy', 'multiple_choice_single',
'Truyền đạo 3:1 nói điều gì về thời kỳ?',
'["Mọi sự đều có thời định, mọi việc dưới trời có kỳ hạn", "Thời gian là vàng bạc", "Không ai biết ngày mai", "Hãy tận dụng thời gian"]',
'[0]',
'Truyền đạo 3:1 - Mọi sự có thời định. Có kỳ sinh ra, kỳ chết; kỳ trồng, kỳ nhổ; kỳ khóc, kỳ cười...',
'["Cựu Ước","Khôn ngoan","Thời định"]', 'Ecclesiastes 3:1', 'vi', true, NOW(), NOW()),

('q-ecc-002', 'Ecclesiastes', 12, 13, 13, 'medium', 'multiple_choice_single',
'Kết luận của sách Truyền Đạo là gì?',
'["Hãy kính sợ Đức Chúa Trời và giữ các điều răn Ngài", "Đời sống là vô nghĩa", "Hãy hưởng thụ cuộc sống", "Hãy tìm kiếm sự khôn ngoan"]',
'[0]',
'Truyền đạo 12:13 - Sau khi khám phá mọi thứ dưới mặt trời, kết luận là: kính sợ Chúa và giữ điều răn. Đây là toàn bộ bổn phận con người.',
'["Cựu Ước","Khôn ngoan","Bổn phận"]', 'Ecclesiastes 12:13', 'vi', true, NOW(), NOW()),

-- ==================== ISAIAH ====================

('q-isa-001', 'Isaiah', 6, 8, 8, 'easy', 'multiple_choice_single',
'Khi Chúa hỏi "Ta sẽ sai ai đi?", E-sai đáp thế nào?',
'["Có tôi đây, xin sai tôi", "Xin sai người khác", "Tôi không xứng đáng", "Để tôi suy nghĩ"]',
'[0]',
'E-sai 6:8 - Có tôi đây, xin hãy sai tôi! E-sai sẵn sàng vâng phục sau khi được thánh tẩy.',
'["Cựu Ước","E-sai","Vâng phục"]', 'Isaiah 6:8', 'vi', true, NOW(), NOW()),

('q-isa-002', 'Isaiah', 7, 14, 14, 'medium', 'multiple_choice_single',
'E-sai 7:14 tiên tri: "Nầy một gái đồng trinh sẽ mang thai, sinh một trai, đặt tên là ___"',
'["Em-ma-nu-en", "Giê-su", "Mi-ca-en", "Đấng Cứu Thế"]',
'[0]',
'E-sai 7:14 - Em-ma-nu-en (Đức Chúa Trời ở cùng chúng ta). Lời tiên tri này ứng nghiệm nơi Chúa Giê-su (Ma 1:23).',
'["Cựu Ước","Tiên tri","Giáng sinh"]', 'Isaiah 7:14', 'vi', true, NOW(), NOW()),

('q-isa-003', 'Isaiah', 9, 6, 6, 'medium', 'multiple_choice_single',
'E-sai 9:6 gọi Đấng Cứu Thế sắp đến bằng những danh hiệu nào?',
'["Đấng Mưu Luận Kỳ Diệu, Đức Chúa Trời Quyền Năng, Cha Đời Đời, Chúa Bình An", "Vua của Vua", "Chiên Con của Chúa", "Con Người"]',
'[0]',
'E-sai 9:6 - Bốn danh hiệu chỉ ra Chúa Giê-su vừa là Đức Chúa Trời vừa là người, vừa là vua vừa là thầy tế lễ.',
'["Cựu Ước","Tiên tri","Danh xưng"]', 'Isaiah 9:6', 'vi', true, NOW(), NOW()),

('q-isa-004', 'Isaiah', 40, 31, 31, 'easy', 'multiple_choice_single',
'E-sai 40:31 nói những ai trông đợi Chúa sẽ được gì?',
'["Đổi mới sức lực, bay như chim ưng", "Giàu có", "Quyền lực", "Tri thức"]',
'[0]',
'E-sai 40:31 - Ai trông đợi Đức Giê-hô-va sẽ được đổi mới sức, cất cánh bay cao như chim ưng, chạy không mệt, đi không mỏi.',
'["Cựu Ước","Hy vọng","Sức mạnh"]', 'Isaiah 40:31', 'vi', true, NOW(), NOW()),

('q-isa-006', 'Isaiah', 53, 6, 6, 'easy', 'multiple_choice_single',
'E-sai 53:6 so sánh loài người với con vật nào?',
'["Chiên đi lạc", "Bò đi hoang", "Chim bay mất", "Cá lội dòng"]',
'[0]',
'E-sai 53:6 - Chúng ta đều như chiên đi lạc, ai theo đường nấy. Nhưng Đức Giê-hô-va đã chất tội lỗi chúng ta trên Người (Chúa Giê-su).',
'["Cựu Ước","Tiên tri","Tội lỗi"]', 'Isaiah 53:6', 'vi', true, NOW(), NOW()),

('q-isa-007', 'Isaiah', 53, 7, 7, 'hard', 'multiple_choice_single',
'E-sai 53:7 mô tả Đấng chịu khổ "như chiên con bị dẫn đến chỗ hạt". Hình ảnh này liên kết với sự kiện nào?',
'["Chúa Giê-su im lặng trước Phi-lát và bị đóng đinh", "Lễ Vượt Qua", "Của lễ hằng ngày", "Dân Y-sơ-ra-ên bị bắt"]',
'[0]',
'E-sai 53:7 - Chúa Giê-su im lặng trước Phi-lát (Ma 27:12-14), như chiên con bị dẫn đi. Phi-líp dùng đoạn này giảng Phúc Âm cho hoạn quan (Công vụ 8:32-35).',
'["Cựu Ước","Tiên tri","Thập tự"]', 'Isaiah 53:7', 'vi', true, NOW(), NOW()),

-- ==================== JEREMIAH ====================

('q-jer-001', 'Jeremiah', 1, 5, 5, 'easy', 'multiple_choice_single',
'Chúa nói với Gie-rê-mi: "Trước khi tạo thành ngươi trong bụng mẹ, ta đã ___ ngươi"',
'["Biết ngươi", "Chọn ngươi", "Yêu ngươi", "Gọi ngươi"]',
'[0]',
'Giê 1:5 - Chúa biết chúng ta trước khi được sinh ra. Ngài có kế hoạch cho mỗi người từ trước.',
'["Cựu Ước","Gie-rê-mi","Sự kêu gọi"]', 'Jeremiah 1:5', 'vi', true, NOW(), NOW()),

('q-jer-002', 'Jeremiah', 29, 11, 11, 'easy', 'multiple_choice_single',
'Gie-rê-mi 29:11 nói kế hoạch của Chúa cho chúng ta là gì?',
'["Kế hoạch bình an, cho một tương lai và hy vọng", "Kế hoạch giàu có", "Kế hoạch hình phạt", "Kế hoạch thử thách"]',
'[0]',
'Giê 29:11 - Ta biết ý tưởng ta nghĩ đối cùng các ngươi, ý tưởng bình an, không phải tai họa, để cho các ngươi được sự cuối cùng tốt đẹp.',
'["Cựu Ước","Hy vọng","Kế hoạch Chúa"]', 'Jeremiah 29:11', 'vi', true, NOW(), NOW()),

('q-jer-004', 'Jeremiah', 31, 31, 33, 'hard', 'multiple_choice_single',
'Gie-rê-mi 31:31-33 tiên tri về "giao ước mới". Giao ước này khác giao ước cũ ở điểm nào?',
'["Luật pháp được viết trong lòng, không phải trên bảng đá", "Nhiều điều răn hơn", "Chỉ dành cho người Do-thái", "Cần nhiều tế lễ hơn"]',
'[0]',
'Giê 31:33 - Giao ước mới: Chúa viết luật trong lòng và tâm trí. Đây là giao ước được ứng nghiệm qua Chúa Giê-su và Đức Thánh Linh.',
'["Cựu Ước","Tiên tri","Giao ước mới"]', 'Jeremiah 31:31-33', 'vi', true, NOW(), NOW()),

-- ==================== EZEKIEL ====================

('q-eze-001', 'Ezekiel', 37, 1, 10, 'medium', 'multiple_choice_single',
'E-xê-chi-ên 37 mô tả khải tượng về thung lũng nào?',
'["Thung lũng xương khô được sống lại", "Thung lũng hoa", "Thung lũng bóng tối", "Thung lũng bình an"]',
'[0]',
'Exe 37:1-10 - Xương khô được phục hồi thành quân đội. Tiên tri về sự phục hồi dân Y-sơ-ra-ên và quyền năng phục sinh của Chúa.',
'["Cựu Ước","E-xê-chi-ên","Phục hồi"]', 'Ezekiel 37:1-10', 'vi', true, NOW(), NOW()),

-- ==================== DANIEL ====================

('q-dan-001', 'Daniel', 3, 17, 18, 'medium', 'multiple_choice_single',
'Ba bạn trẻ Do-thái từ chối thờ tượng vàng của vua. Họ nói gì khi bị đe dọa ném vào lò lửa?',
'["Chúa chúng tôi có thể giải cứu, nhưng dù không, chúng tôi vẫn không thờ tượng", "Chúa sẽ giải cứu chúng tôi", "Chúng tôi sẽ cầu nguyện", "Hãy tha cho chúng tôi"]',
'[0]',
'Đa-ni-ên 3:17-18 - Đức tin không điều kiện: tin Chúa có thể giải cứu nhưng vẫn trung tín dù kết quả nào.',
'["Cựu Ước","Đức tin","Can đảm"]', 'Daniel 3:17-18', 'vi', true, NOW(), NOW()),

('q-dan-002', 'Daniel', 6, 16, 22, 'easy', 'multiple_choice_single',
'Đa-ni-ên bị ném vào hang gì vì từ chối ngừng cầu nguyện?',
'["Hang sư tử", "Lò lửa", "Ngục tối", "Hố sâu"]',
'[0]',
'Đa-ni-ên 6:16 - Đa-ni-ên bị ném vào hang sư tử nhưng Chúa sai thiên sứ bịt miệng sư tử. Trung tín với Chúa bất kể hậu quả.',
'["Cựu Ước","Đa-ni-ên","Đức tin"]', 'Daniel 6:16-22', 'vi', true, NOW(), NOW()),

-- ==================== MINOR PROPHETS ====================

('q-mic-001', 'Micah', 5, 2, 2, 'medium', 'multiple_choice_single',
'Mi-chê 5:2 tiên tri Đấng Cứu Thế sẽ sinh ra tại thành nào?',
'["Bết-lê-hem", "Giê-ru-sa-lem", "Na-xa-rét", "Hê-bron"]',
'[0]',
'Mi-chê 5:2 - Bết-lê-hem Ép-ra-ta... từ nơi người sẽ ra một Đấng cai trị Y-sơ-ra-ên. Ứng nghiệm Ma 2:1.',
'["Cựu Ước","Tiên tri","Giáng sinh"]', 'Micah 5:2', 'vi', true, NOW(), NOW()),

('q-mic-002', 'Micah', 6, 8, 8, 'easy', 'multiple_choice_single',
'Mi-chê 6:8 tóm tắt điều Chúa đòi hỏi con người là gì?',
'["Làm sự công bình, yêu sự nhân từ, và khiêm nhượng đi cùng Chúa", "Dâng của lễ", "Xây đền thờ", "Chinh phục các dân tộc"]',
'[0]',
'Mi-chê 6:8 - Ba điều Chúa đòi hỏi: công bình, nhân từ, khiêm nhượng. Đơn giản nhưng sâu sắc.',
'["Cựu Ước","Đời sống","Công bình"]', 'Micah 6:8', 'vi', true, NOW(), NOW()),

('q-hab-001', 'Habakkuk', 2, 4, 4, 'hard', 'multiple_choice_single',
'Ha-ba-cúc 2:4 "Người công bình sẽ sống bởi đức tin" được trích dẫn ở đâu trong Tân Ước?',
'["Rô-ma 1:17, Ga-la-ti 3:11, Hê-bơ-rơ 10:38 (cả ba)", "Chỉ Rô-ma", "Chỉ Ga-la-ti", "Không được trích"]',
'[0]',
'Ha-ba-cúc 2:4 là câu Cựu Ước quan trọng nhất cho thần học Cải Cách: xưng công bình bởi đức tin, được trích 3 lần trong Tân Ước.',
'["Cựu Ước","Đức tin","Thần học"]', 'Habakkuk 2:4', 'vi', true, NOW(), NOW()),

('q-mal-001', 'Malachi', 3, 10, 10, 'medium', 'multiple_choice_single',
'Ma-la-chi 3:10 là câu Kinh Thánh duy nhất Chúa thách thức con người làm gì?',
'["Thử Chúa bằng sự dâng hiến phần mười", "Cầu nguyện nhiều hơn", "Ăn chay", "Rao giảng"]',
'[0]',
'Ma-la-chi 3:10 - Hãy đem phần mười đầy đủ vào kho, hãy thử ta. Chúa hứa sẽ mở các cửa sổ trời ban phước dư đầy.',
'["Cựu Ước","Dâng hiến","Phần mười"]', 'Malachi 3:10', 'vi', true, NOW(), NOW()),

('q-jon-001', 'Jonah', 1, 17, 17, 'easy', 'multiple_choice_single',
'Giona ở trong bụng cá lớn bao lâu?',
'["3 ngày 3 đêm", "7 ngày", "1 ngày", "40 ngày"]',
'[0]',
'Giona 1:17 - 3 ngày 3 đêm. Chúa Giê-su dùng sự kiện này làm hình bóng về sự phục sinh của Ngài (Ma 12:40).',
'["Cựu Ước","Giona","Hình bóng"]', 'Jonah 1:17', 'vi', true, NOW(), NOW());
