-- Repeatable migration: Old Testament questions (Genesis - Deuteronomy + Historical books)
-- Smart questions: context, connections, understanding, not just memorization

-- ==================== GENESIS ====================
INSERT IGNORE INTO questions (id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at) VALUES

-- Genesis: Creation & Fall
('q-gen-001', 'Genesis', 1, 1, 2, 'easy', 'multiple_choice_single',
'Điều đầu tiên Đức Chúa Trời tạo dựng là gì?',
'["Trời và đất", "Sự sáng", "Nước", "Con người"]',
'[0]',
'Sáng 1:1 - Ban đầu Đức Chúa Trời dựng nên trời đất. Đây là hành động sáng tạo đầu tiên được ghi lại.',
'["Cựu Ước","Sáng tạo"]', 'Genesis 1:1', 'vi', true, NOW(), NOW()),

('q-gen-002', 'Genesis', 1, 26, 27, 'easy', 'multiple_choice_single',
'Con người được tạo dựng theo hình ảnh của ai?',
'["Đức Chúa Trời", "Thiên sứ", "Thiên nhiên", "Các thần"]',
'[0]',
'Sáng 1:27 - Đức Chúa Trời dựng nên loài người theo hình ảnh Ngài.',
'["Cựu Ước","Sáng tạo","Con người"]', 'Genesis 1:26-27', 'vi', true, NOW(), NOW()),

('q-gen-003', 'Genesis', 2, 7, 7, 'medium', 'multiple_choice_single',
'Đức Chúa Trời dùng gì để nắn con người đầu tiên?',
'["Bụi đất", "Nước", "Lửa", "Đất sét"]',
'[0]',
'Sáng 2:7 - Chúa lấy bụi đất nắn nên loài người, hà sinh khí vào lỗ mũi thì người trở nên loài sanh linh.',
'["Cựu Ước","Sáng tạo","A-dam"]', 'Genesis 2:7', 'vi', true, NOW(), NOW()),

('q-gen-004', 'Genesis', 2, 18, 22, 'easy', 'multiple_choice_single',
'E-va được tạo dựng từ bộ phận nào của A-dam?',
'["Xương sườn", "Bụi đất", "Máu", "Tay"]',
'[0]',
'Sáng 2:21-22 - Chúa lấy một xương sườn của A-dam và tạo dựng nên người nữ.',
'["Cựu Ước","Sáng tạo","E-va"]', 'Genesis 2:18-22', 'vi', true, NOW(), NOW()),

('q-gen-005', 'Genesis', 3, 1, 6, 'easy', 'multiple_choice_single',
'Con vật nào đã cám dỗ E-va ăn trái cấm?',
'["Con rắn", "Con sói", "Con chim", "Con sư tử"]',
'[0]',
'Sáng 3:1 - Con rắn là loài quyến rũ nhất trong các loài vật, nó đã cám dỗ E-va.',
'["Cựu Ước","Sa ngã","E-va"]', 'Genesis 3:1-6', 'vi', true, NOW(), NOW()),

('q-gen-006', 'Genesis', 3, 15, 15, 'hard', 'multiple_choice_single',
'Sáng 3:15 được gọi là "Phúc Âm đầu tiên" (Proto-evangelium) vì lý do gì?',
'["Là lời tiên tri đầu tiên về Đấng Cứu Thế", "Là phúc âm được viết đầu tiên", "Là lời hứa đầu tiên cho A-dam", "Là giao ước đầu tiên của Chúa"]',
'[0]',
'Dòng dõi người nữ sẽ giày đạp đầu con rắn - đây là lời tiên tri đầu tiên về Chúa Giê-su sẽ chiến thắng Sa-tan.',
'["Cựu Ước","Tiên tri","Cứu Thế"]', 'Genesis 3:15', 'vi', true, NOW(), NOW()),

-- Genesis: Cain & Abel
('q-gen-008', 'Genesis', 4, 1, 8, 'easy', 'multiple_choice_single',
'Ai là người đầu tiên bị giết trong Kinh Thánh?',
'["A-bên", "Ca-in", "A-dam", "Sết"]',
'[0]',
'Sáng 4:8 - Ca-in giết A-bên, em trai mình, vì ganh tỵ với của lễ của A-bên được Chúa chấp nhận.',
'["Cựu Ước","Ca-in và A-bên"]', 'Genesis 4:1-8', 'vi', true, NOW(), NOW()),

('q-gen-009', 'Genesis', 4, 3, 5, 'medium', 'multiple_choice_single',
'Tại sao Chúa chấp nhận của lễ của A-bên mà không chấp nhận của Ca-in?',
'["A-bên dâng của lễ bằng đức tin và tâm lòng thành", "Của lễ A-bên đắt giá hơn", "Ca-in dâng trễ quá", "A-bên là con đầu lòng"]',
'[0]',
'Hê-bơ-rơ 11:4 giải thích rằng A-bên dâng của lễ tốt hơn bởi đức tin. Vấn đề nằm ở tâm lòng, không phải giá trị vật chất.',
'["Cựu Ước","Đức tin","Của lễ"]', 'Genesis 4:3-5', 'vi', true, NOW(), NOW()),

-- Genesis: Noah
('q-gen-010', 'Genesis', 6, 9, 9, 'easy', 'multiple_choice_single',
'Kinh Thánh mô tả No-e là người như thế nào?',
'["Công bình và trọn vẹn", "Khôn ngoan nhất", "Mạnh mẽ nhất", "Giàu có nhất"]',
'[0]',
'Sáng 6:9 - No-e là người công bình, trọn vẹn giữa người đồng thời và đồng đi với Đức Chúa Trời.',
'["Cựu Ước","No-e","Công bình"]', 'Genesis 6:9', 'vi', true, NOW(), NOW()),

('q-gen-011', 'Genesis', 7, 2, 3, 'medium', 'multiple_choice_single',
'Ngoài 2 cặp thú vật thông thường, No-e mang bao nhiêu cặp thú vật thanh sạch lên tàu?',
'["7 cặp", "3 cặp", "5 cặp", "1 cặp"]',
'[0]',
'Sáng 7:2 - Thú vật thanh sạch được mang 7 cặp (14 con), còn thú vật không thanh sạch chỉ mang 1 cặp.',
'["Cựu Ước","No-e","Tàu No-e"]', 'Genesis 7:2-3', 'vi', true, NOW(), NOW()),

('q-gen-012', 'Genesis', 9, 12, 13, 'easy', 'multiple_choice_single',
'Sau cơn nước lũ, Chúa đặt dấu hiệu gì làm giao ước với No-e?',
'["Cầu vồng", "Ngôi sao", "Cây ô-liu", "Đám mây"]',
'[0]',
'Sáng 9:13 - Cầu vồng trên trời là dấu hiệu giao ước rằng Chúa sẽ không hủy diệt đất bằng nước lũ nữa.',
'["Cựu Ước","No-e","Giao ước"]', 'Genesis 9:12-13', 'vi', true, NOW(), NOW()),

-- Genesis: Abraham
('q-gen-013', 'Genesis', 12, 1, 3, 'easy', 'multiple_choice_single',
'Đức Chúa Trời gọi Áp-ram rời khỏi đâu để đi đến đâu?',
'["Một xứ mà Chúa sẽ chỉ cho", "Ai-cập", "Ba-by-lon", "Giu-đê"]',
'[0]',
'Sáng 12:1 - Chúa gọi Áp-ram rời khỏi quê hương và bà con đến xứ mà Ngài sẽ chỉ cho.',
'["Cựu Ước","Áp-ra-ham","Sự kêu gọi"]', 'Genesis 12:1-3', 'vi', true, NOW(), NOW()),

('q-gen-014', 'Genesis', 15, 5, 6, 'medium', 'multiple_choice_single',
'Khi Chúa hứa với Áp-ram rằng dòng dõi ông sẽ như sao trên trời, Áp-ram phản ứng thế nào?',
'["Tin Chúa và được kể là công bình", "Cười vì không tin", "Xin một dấu hiệu", "Im lặng không nói gì"]',
'[0]',
'Sáng 15:6 - Áp-ram tin Đức Giê-hô-va, thì Ngài kể sự đó là công bình cho người. Đây là nền tảng của sự xưng công bình bởi đức tin.',
'["Cựu Ước","Đức tin","Công bình"]', 'Genesis 15:5-6', 'vi', true, NOW(), NOW()),

('q-gen-015', 'Genesis', 22, 1, 14, 'hard', 'multiple_choice_single',
'Trong sự kiện Áp-ra-ham dâng Y-sác, con chiên được Chúa chuẩn bị để thay thế là hình bóng của điều gì?',
'["Chúa Giê-su chịu chết thay cho nhân loại", "Lễ Vượt Qua", "Hệ thống tế lễ Lê-vi", "Sự phục sinh"]',
'[0]',
'Con chiên mắc trong bụi gai thay Y-sác là hình bóng của Chúa Giê-su - Chiên Con của Đức Chúa Trời chịu chết thay cho chúng ta (Giăng 1:29).',
'["Cựu Ước","Hình bóng","Cứu chuộc"]', 'Genesis 22:1-14', 'vi', true, NOW(), NOW()),

-- Genesis: Jacob & Joseph
('q-gen-017', 'Genesis', 25, 29, 34, 'easy', 'multiple_choice_single',
'Ê-sau đã đổi quyền trưởng tử để lấy gì từ Gia-cốp?',
'["Một tô canh", "Một miền đất", "Vàng bạc", "Một bầy gia súc"]',
'[0]',
'Sáng 25:34 - Ê-sau đổi quyền trưởng tử lấy tô canh đậu đỏ. Ông khinh quyền trưởng tử của mình.',
'["Cựu Ước","Gia-cốp","Ê-sau"]', 'Genesis 25:29-34', 'vi', true, NOW(), NOW()),

('q-gen-018', 'Genesis', 28, 12, 12, 'easy', 'multiple_choice_single',
'Gia-cốp nằm mơ thấy gì tại Bê-tên?',
'["Cái thang bắt từ đất lên đến trời", "Đám cháy lớn", "Biển lớn", "Thành phố vàng"]',
'[0]',
'Sáng 28:12 - Gia-cốp mơ thấy cái thang bắt từ mặt đất cho đến trời, các thiên sứ lên xuống trên thang.',
'["Cựu Ước","Gia-cốp","Giấc mơ"]', 'Genesis 28:12', 'vi', true, NOW(), NOW()),

('q-gen-019', 'Genesis', 37, 3, 4, 'easy', 'multiple_choice_single',
'Gia-cốp tặng cho Giô-sép món quà đặc biệt nào khiến anh em ganh tỵ?',
'["Áo choàng nhiều màu", "Nhẫn vàng", "Đất đai", "Bầy chiên"]',
'[0]',
'Sáng 37:3 - Gia-cốp tặng cho Giô-sép chiếc áo dài có nhiều màu vì yêu Giô-sép hơn các con khác.',
'["Cựu Ước","Giô-sép"]', 'Genesis 37:3-4', 'vi', true, NOW(), NOW()),

('q-gen-020', 'Genesis', 45, 4, 8, 'hard', 'multiple_choice_single',
'Khi gặp lại anh em tại Ai-cập, Giô-sép nói rằng ai đã sai ông đến đây?',
'["Đức Chúa Trời, không phải anh em", "Pha-ra-ôn", "Sứ mệnh của ông", "Giấc mơ của ông"]',
'[0]',
'Sáng 45:8 - Giô-sép nhìn nhận chủ quyền của Chúa: "Không phải các anh sai tôi đến đây đâu, ấy là Đức Chúa Trời." Đây là sự tha thứ vì hiểu kế hoạch của Chúa.',
'["Cựu Ước","Giô-sép","Chủ quyền Chúa"]', 'Genesis 45:4-8', 'vi', true, NOW(), NOW()),

-- ==================== EXODUS ====================

('q-exo-001', 'Exodus', 1, 8, 14, 'easy', 'multiple_choice_single',
'Tại sao Pha-ra-ôn bắt đầu áp bức dân Y-sơ-ra-ên tại Ai-cập?',
'["Vì dân Y-sơ-ra-ên đông và mạnh quá", "Vì họ không chịu đóng thuế", "Vì họ thờ thần khác", "Vì Giô-sép đã chết"]',
'[0]',
'Xuất 1:9-10 - Pha-ra-ôn mới sợ rằng dân Y-sơ-ra-ên quá đông sẽ liên kết với kẻ thù chống lại Ai-cập.',
'["Cựu Ước","Xuất hành","Ai-cập"]', 'Exodus 1:8-14', 'vi', true, NOW(), NOW()),

('q-exo-002', 'Exodus', 3, 2, 4, 'easy', 'multiple_choice_single',
'Chúa hiện ra với Môi-se lần đầu qua hình ảnh gì?',
'["Bụi gai cháy mà không tàn", "Đám mây lớn", "Thiên sứ", "Cột lửa"]',
'[0]',
'Xuất 3:2 - Thiên sứ của Đức Giê-hô-va hiện ra trong ngọn lửa giữa bụi gai, bụi cháy mà không hề tàn.',
'["Cựu Ước","Môi-se","Sự kêu gọi"]', 'Exodus 3:2-4', 'vi', true, NOW(), NOW()),

('q-exo-003', 'Exodus', 3, 14, 14, 'hard', 'multiple_choice_single',
'Khi Môi-se hỏi tên Chúa, Ngài trả lời là gì?',
'["TA LÀ ĐẤNG TỰ HỮU (I AM WHO I AM)", "TA LÀ CHÚA CỦA ÁP-RA-HAM", "TA LÀ ĐẤNG TOÀN NĂNG", "TA LÀ ĐẤNG SÁNG TẠO"]',
'[0]',
'Xuất 3:14 - Đức Chúa Trời tự xưng là "TA LÀ ĐẤNG TỰ HỮU" (Ehyeh Asher Ehyeh) - bày tỏ bản chất tự hữu, vĩnh cửu của Ngài.',
'["Cựu Ước","Danh Chúa","Thần học"]', 'Exodus 3:14', 'vi', true, NOW(), NOW()),

('q-exo-004', 'Exodus', 7, 1, 12, 'medium', 'multiple_choice_single',
'Trong 10 tai vạ, tai vạ đầu tiên là gì?',
'["Nước biến thành huyết", "Ếch nhái", "Muỗi", "Bóng tối"]',
'[0]',
'Xuất 7:20 - Tai vạ đầu tiên là nước sông Ni-lô biến thành huyết (máu).',
'["Cựu Ước","10 tai vạ","Ai-cập"]', 'Exodus 7:14-25', 'vi', true, NOW(), NOW()),

('q-exo-005', 'Exodus', 12, 3, 7, 'medium', 'multiple_choice_single',
'Trong Lễ Vượt Qua, tại sao phải bôi huyết chiên con lên khung cửa?',
'["Để thiên sứ hủy diệt vượt qua nhà đó", "Để đánh dấu là người Y-sơ-ra-ên", "Để làm lễ tế", "Để xua đuổi tà linh"]',
'[0]',
'Xuất 12:13 - Huyết trên khung cửa là dấu hiệu để thiên sứ hủy diệt vượt qua. Hình bóng của huyết Chúa Giê-su bảo vệ chúng ta.',
'["Cựu Ước","Lễ Vượt Qua","Hình bóng"]', 'Exodus 12:3-13', 'vi', true, NOW(), NOW()),

('q-exo-006', 'Exodus', 12, 13, 13, 'hard', 'multiple_choice_single',
'Lễ Vượt Qua trong Xuất Ai-cập là hình bóng của sự kiện nào trong Tân Ước?',
'["Sự chết chuộc tội của Chúa Giê-su", "Lễ Báp-têm", "Lễ Ngũ Tuần", "Sự tái lâm của Chúa"]',
'[0]',
'1 Cô-rinh-tô 5:7 - Chúa Giê-su là Chiên Con Lễ Vượt Qua của chúng ta. Huyết Ngài bảo vệ chúng ta khỏi sự phán xét.',
'["Cựu Ước","Hình bóng","Cứu chuộc"]', 'Exodus 12:1-13', 'vi', true, NOW(), NOW()),

('q-exo-007', 'Exodus', 14, 21, 22, 'easy', 'multiple_choice_single',
'Chúa rẽ Biển Đỏ bằng phương tiện gì?',
'["Gió đông mạnh", "Gậy của Môi-se", "Động đất", "Sức mạnh siêu nhiên trực tiếp"]',
'[0]',
'Xuất 14:21 - Môi-se giơ tay trên biển, Đức Giê-hô-va dùng gió đông mạnh thổi cả đêm làm biển rẽ ra.',
'["Cựu Ước","Phép lạ","Biển Đỏ"]', 'Exodus 14:21-22', 'vi', true, NOW(), NOW()),

('q-exo-008', 'Exodus', 20, 1, 17, 'easy', 'multiple_choice_single',
'Điều răn đầu tiên trong Mười Điều Răn là gì?',
'["Trước ta ngươi không được có thần nào khác", "Không được làm tượng chạm", "Nhớ ngày Sa-bát", "Hiếu kính cha mẹ"]',
'[0]',
'Xuất 20:3 - Trước ta ra, ngươi không được có thần nào khác. Đây là điều răn căn bản nhất.',
'["Cựu Ước","Mười Điều Răn","Luật pháp"]', 'Exodus 20:1-17', 'vi', true, NOW(), NOW()),

('q-exo-010', 'Exodus', 16, 14, 15, 'easy', 'multiple_choice_single',
'Thức ăn gì từ trời rơi xuống nuôi dân Y-sơ-ra-ên trong đồng vắng?',
'["Ma-na", "Bánh mì", "Trái cây", "Thịt"]',
'[0]',
'Xuất 16:15 - Ma-na là bánh từ trời, mỗi sáng xuất hiện như sương trên mặt đất. Hình bóng của Chúa Giê-su - Bánh Sự Sống.',
'["Cựu Ước","Đồng vắng","Ma-na"]', 'Exodus 16:14-15', 'vi', true, NOW(), NOW()),

-- ==================== LEVITICUS ====================

('q-lev-001', 'Leviticus', 17, 11, 11, 'medium', 'multiple_choice_single',
'Theo Lê-vi 17:11, tại sao huyết quan trọng trong hệ thống tế lễ?',
'["Vì sự sống của xác thịt ở trong huyết, dùng để chuộc tội", "Vì huyết là thanh khiết", "Vì Chúa yêu cầu", "Vì truyền thống"]',
'[0]',
'Lê-vi 17:11 - Sự sống của xác thịt ở trong huyết. Ta cho các ngươi huyết rưới trên bàn thờ để làm lễ chuộc tội.',
'["Cựu Ước","Tế lễ","Chuộc tội"]', 'Leviticus 17:11', 'vi', true, NOW(), NOW()),

('q-lev-002', 'Leviticus', 19, 18, 18, 'easy', 'multiple_choice_single',
'Lê-vi 19:18 dạy điều răn quan trọng nào mà Chúa Giê-su sau này nhắc lại?',
'["Hãy yêu thương kẻ lân cận như chính mình", "Hãy thanh khiết", "Hãy giữ ngày Sa-bát", "Hãy dâng của lễ"]',
'[0]',
'Lê-vi 19:18 - Hãy yêu thương kẻ lân cận như chính mình. Chúa Giê-su gọi đây là điều răn thứ hai lớn nhất (Ma-thi-ơ 22:39).',
'["Cựu Ước","Luật pháp","Yêu thương"]', 'Leviticus 19:18', 'vi', true, NOW(), NOW()),

('q-lev-003', 'Leviticus', 16, 8, 10, 'hard', 'multiple_choice_single',
'Trong Ngày Lễ Chuộc Tội, hai con dê được dùng làm gì?',
'["Một con làm của lễ, một con mang tội lỗi vào đồng vắng", "Cả hai đều bị giết", "Một con để dâng, một con thả tự do", "Cả hai mang tội lỗi dân"]',
'[0]',
'Lê-vi 16:8-10 - Một con dê dâng cho Chúa làm tế lễ, một con (dê thát-xa-xên) mang tội lỗi dân được thả vào đồng vắng. Hình bóng của Chúa Giê-su gánh tội chúng ta.',
'["Cựu Ước","Lễ Chuộc Tội","Hình bóng"]', 'Leviticus 16:8-10', 'vi', true, NOW(), NOW()),

-- ==================== NUMBERS ====================

('q-num-001', 'Numbers', 13, 30, 33, 'medium', 'multiple_choice_single',
'Trong 12 thám tử, chỉ có 2 người tin Chúa có thể cho họ chiếm đất hứa. Đó là ai?',
'["Ca-lép và Giô-suê", "Môi-se và A-rôn", "Ca-lép và Môi-se", "Giô-suê và A-rôn"]',
'[0]',
'Dân 13:30, 14:6-9 - Ca-lép và Giô-suê tin rằng Chúa sẽ giúp họ chiếm đất, trong khi 10 thám tử khác bỏ cuộc.',
'["Cựu Ước","Đức tin","Đất Hứa"]', 'Numbers 13:30-33', 'vi', true, NOW(), NOW()),

('q-num-002', 'Numbers', 14, 33, 34, 'easy', 'multiple_choice_single',
'Dân Y-sơ-ra-ên phải đi lang thang trong đồng vắng bao nhiêu năm?',
'["40 năm", "20 năm", "70 năm", "12 năm"]',
'[0]',
'Dân 14:34 - Mỗi ngày thám tử đó xét đất (40 ngày) tương ứng với 1 năm lang thang trong đồng vắng.',
'["Cựu Ước","Đồng vắng","Hình phạt"]', 'Numbers 14:33-34', 'vi', true, NOW(), NOW()),

('q-num-003', 'Numbers', 21, 8, 9, 'hard', 'multiple_choice_single',
'Con rắn đồng mà Môi-se treo lên là hình bóng của sự kiện nào?',
'["Chúa Giê-su bị treo trên thập tự giá", "Sự phục sinh", "Lễ Báp-têm", "Sự tái lâm"]',
'[0]',
'Giăng 3:14-15 - Chúa Giê-su dẫn đến sự kiện này: Như Môi-se treo con rắn lên trong đồng vắng, Con Người cũng phải bị treo lên như vậy.',
'["Cựu Ước","Hình bóng","Thập tự"]', 'Numbers 21:8-9', 'vi', true, NOW(), NOW()),

-- ==================== DEUTERONOMY ====================

('q-deu-001', 'Deuteronomy', 6, 4, 5, 'easy', 'multiple_choice_single',
'Shema - lời tuyên bố đức tin quan trọng nhất của Do-thái giáo bắt đầu như thế nào?',
'["Hỡi Y-sơ-ra-ên! Giê-hô-va Đức Chúa Trời chúng ta là Giê-hô-va có một", "Hãy tin Chúa", "Ban đầu Đức Chúa Trời", "Hãy thanh khiết"]',
'[0]',
'Phục truyền 6:4 - Shema là lời tuyên bố tín kinh trung tâm: Đức Giê-hô-va là Chúa duy nhất.',
'["Cựu Ước","Luật pháp","Đức tin"]', 'Deuteronomy 6:4-5', 'vi', true, NOW(), NOW()),

('q-deu-002', 'Deuteronomy', 6, 5, 5, 'medium', 'multiple_choice_single',
'Theo Phục truyền 6:5, chúng ta phải yêu Chúa bằng mấy điều?',
'["Hết lòng, hết linh hồn, hết sức", "Hết lòng và hết linh hồn", "Chỉ cần hết lòng", "Hết lòng, hết sức, hết trí"]',
'[0]',
'Phục truyền 6:5 - Phải yêu Giê-hô-va Đức Chúa Trời ngươi hết lòng, hết linh hồn, hết sức lực mình. Chúa Giê-su gọi đây là điều răn lớn nhất.',
'["Cựu Ước","Điều răn","Yêu Chúa"]', 'Deuteronomy 6:5', 'vi', true, NOW(), NOW()),

('q-deu-004', 'Deuteronomy', 18, 15, 15, 'hard', 'multiple_choice_single',
'Khi Môi-se nói "Giê-hô-va sẽ dựng lên một đấng tiên tri như ta giữa anh em ngươi", ông tiên tri về ai?',
'["Chúa Giê-su Christ", "Giô-suê", "Sa-mu-ên", "Ê-li"]',
'[0]',
'Công vụ 3:22-23 - Phi-e-rơ xác nhận rằng lời này ứng nghiệm nơi Chúa Giê-su, Đấng Tiên Tri lớn nhất.',
'["Cựu Ước","Tiên tri","Chúa Giê-su"]', 'Deuteronomy 18:15', 'vi', true, NOW(), NOW()),

-- ==================== JOSHUA ====================

('q-jos-001', 'Joshua', 1, 8, 9, 'easy', 'multiple_choice_single',
'Chúa phán với Giô-suê trước khi vào đất hứa: "Hãy vững lòng ___"',
'["Bền chí", "Khôn ngoan", "Kiên nhẫn", "Khiêm nhường"]',
'[0]',
'Giô-suê 1:9 - Hãy vững lòng bền chí, chớ đừng kinh hãi. Vì Giê-hô-va Đức Chúa Trời ngươi ở cùng ngươi bất cứ nơi đâu ngươi đi.',
'["Cựu Ước","Giô-suê","Can đảm"]', 'Joshua 1:8-9', 'vi', true, NOW(), NOW()),

('q-jos-002', 'Joshua', 6, 3, 5, 'medium', 'multiple_choice_single',
'Dân Y-sơ-ra-ên phải đi vòng quanh thành Giê-ri-cô bao nhiêu ngày trước khi tường thành đổ?',
'["7 ngày", "3 ngày", "40 ngày", "12 ngày"]',
'[0]',
'Giô-suê 6:3-4 - Đi vòng 1 lần mỗi ngày trong 6 ngày, ngày thứ 7 đi vòng 7 lần rồi thổi kèn và la lớn thì tường thành đổ.',
'["Cựu Ước","Giô-suê","Phép lạ"]', 'Joshua 6:3-5', 'vi', true, NOW(), NOW()),

-- ==================== JUDGES & RUTH ====================

('q-jdg-001', 'Judges', 16, 17, 17, 'easy', 'multiple_choice_single',
'Bí mật sức mạnh của Sam-sôn nằm ở đâu?',
'["Mái tóc chưa hề bị cắt (lời hứa Na-xi-rê)", "Cơ bắp", "Vũ khí đặc biệt", "Áo giáp"]',
'[0]',
'Các Quan Xét 16:17 - Sức mạnh Sam-sôn đến từ lời hứa Na-xi-rê với Đức Chúa Trời, biểu tượng qua mái tóc.',
'["Cựu Ước","Sam-sôn","Lời hứa"]', 'Judges 16:17', 'vi', true, NOW(), NOW()),

('q-rut-001', 'Ruth', 1, 16, 16, 'easy', 'multiple_choice_single',
'Ru-tơ nói với Na-ô-mi: "Đức Chúa Trời của mẹ tức là ___"',
'["Đức Chúa Trời của con", "Đấng Toàn Năng", "Đức Giê-hô-va", "Chúa của mọi người"]',
'[0]',
'Ru-tơ 1:16 - Ru-tơ chọn gắn bó với Na-ô-mi và Đức Chúa Trời của bà. Sự trung tín của Ru-tơ là tấm gương đức tin.',
'["Cựu Ước","Ru-tơ","Trung tín"]', 'Ruth 1:16', 'vi', true, NOW(), NOW()),

('q-rut-002', 'Ruth', 4, 13, 17, 'medium', 'multiple_choice_single',
'Ru-tơ là bà cố của vị vua nổi tiếng nào trong Kinh Thánh?',
'["Vua Đa-vít", "Vua Sa-lô-môn", "Vua Sau-lơ", "Vua Giô-si-a"]',
'[0]',
'Ru-tơ 4:17 - Ru-tơ sinh Ô-bết, Ô-bết sinh Giê-sê, Giê-sê sinh Đa-vít. Ru-tơ cũng ở trong gia phả của Chúa Giê-su (Ma-thi-ơ 1:5).',
'["Cựu Ước","Ru-tơ","Gia phả"]', 'Ruth 4:13-17', 'vi', true, NOW(), NOW()),

-- ==================== 1 & 2 SAMUEL ====================

('q-1sa-001', '1 Samuel', 3, 10, 10, 'easy', 'multiple_choice_single',
'Sa-mu-ên đáp lại tiếng Chúa gọi vào ban đêm như thế nào?',
'["Xin Chúa hãy phán, vì đây tôi tớ Chúa đang nghe", "Đây con đây", "Con đang nghe", "Xin Chúa đợi"]',
'[0]',
'1 Sa-mu-ên 3:10 - Hê-li dạy Sa-mu-ên cách đáp lại tiếng Chúa. Đây là sự sẵn sàng lắng nghe và vâng phục.',
'["Cựu Ước","Sa-mu-ên","Lắng nghe"]', '1 Samuel 3:10', 'vi', true, NOW(), NOW()),

('q-1sa-002', '1 Samuel', 16, 7, 7, 'medium', 'multiple_choice_single',
'Khi chọn Đa-vít làm vua, Chúa dạy Sa-mu-ên bài học gì?',
'["Chúa nhìn tâm lòng, không phải bên ngoài", "Hãy chọn người trẻ nhất", "Hãy chọn người mạnh nhất", "Hãy chọn con trưởng"]',
'[0]',
'1 Sa-mu-ên 16:7 - Loài người nhìn bên ngoài nhưng Đức Giê-hô-va nhìn thấy trong lòng. Đa-vít được chọn vì tâm lòng hướng về Chúa.',
'["Cựu Ước","Đa-vít","Tâm lòng"]', '1 Samuel 16:7', 'vi', true, NOW(), NOW()),

('q-1sa-003', '1 Samuel', 17, 45, 47, 'easy', 'multiple_choice_single',
'Đa-vít dùng vũ khí gì để hạ Gô-li-át?',
'["Trái đá và cái trành ném", "Gươm", "Giáo", "Cung tên"]',
'[0]',
'1 Sa-mu-ên 17:49-50 - Đa-vít dùng trái đá và trành ném, tin cậy Chúa chiến trận cho mình.',
'["Cựu Ước","Đa-vít","Đức tin"]', '1 Samuel 17:45-50', 'vi', true, NOW(), NOW()),

('q-2sa-001', '2 Samuel', 12, 7, 7, 'medium', 'multiple_choice_single',
'Ai là người tiên tri đã đối diện Đa-vít về tội lỗi với Bát-sê-ba?',
'["Na-than", "Sa-mu-ên", "Ga-át", "A-sáp"]',
'[0]',
'2 Sa-mu-ên 12:7 - Tiên tri Na-than dùng dụ ngôn con chiên để Đa-vít tự kết án mình, rồi tuyên bố: "Ngươi là người đó!"',
'["Cựu Ước","Đa-vít","Ăn năn"]', '2 Samuel 12:7', 'vi', true, NOW(), NOW()),

-- ==================== 1 & 2 KINGS ====================

('q-1ki-001', '1 Kings', 3, 9, 9, 'easy', 'multiple_choice_single',
'Khi Chúa cho Sa-lô-môn xin bất cứ điều gì, ông xin gì?',
'["Sự khôn ngoan để xét đoán dân sự", "Sự giàu có", "Đời sống dài lâu", "Chiến thắng kẻ thù"]',
'[0]',
'1 Các Vua 3:9 - Sa-lô-môn xin tâm lòng khôn ngoan để phân biệt phải trái. Chúa rất vui và ban thêm sự giàu có và vinh hiển.',
'["Cựu Ước","Sa-lô-môn","Khôn ngoan"]', '1 Kings 3:9', 'vi', true, NOW(), NOW()),

('q-1ki-002', '1 Kings', 18, 38, 39, 'medium', 'multiple_choice_single',
'Trên núi Cát-mên, khi Ê-li thách thức các tiên tri Ba-anh, điều gì đã xảy ra?',
'["Lửa từ trời rơi xuống thiêu của lễ", "Mưa rơi xuống", "Đất rung", "Gió bão nổi lên"]',
'[0]',
'1 Các Vua 18:38 - Lửa của Đức Giê-hô-va từ trời giáng xuống thiêu sạch của lễ, củi, đá, bụi và nước. Dân sự sấp mặt xuống nói: Giê-hô-va là Đức Chúa Trời!',
'["Cựu Ước","Ê-li","Phép lạ"]', '1 Kings 18:38-39', 'vi', true, NOW(), NOW()),

('q-2ki-001', '2 Kings', 2, 11, 11, 'easy', 'multiple_choice_single',
'Ê-li được cất lên trời bằng phương tiện gì?',
'["Xe lửa và ngựa lửa trong cơn gió lốc", "Đám mây", "Thiên sứ", "Cột lửa"]',
'[0]',
'2 Các Vua 2:11 - Xe lửa và ngựa lửa phân cách hai người, rồi Ê-li được cất lên trời trong cơn gió lốc.',
'["Cựu Ước","Ê-li","Phép lạ"]', '2 Kings 2:11', 'vi', true, NOW(), NOW()),

-- ==================== NEHEMIAH & ESTHER ====================

('q-neh-001', 'Nehemiah', 2, 17, 18, 'easy', 'multiple_choice_single',
'Nê-hê-mi trở về Giê-ru-sa-lem để làm gì?',
'["Xây lại tường thành", "Xây lại đền thờ", "Làm tổng trấn", "Dạy luật pháp"]',
'[0]',
'Nê-hê-mi 2:17 - Nê-hê-mi kêu gọi dân sự xây lại tường thành Giê-ru-sa-lem đã bị hư nát.',
'["Cựu Ước","Nê-hê-mi","Phục hồi"]', 'Nehemiah 2:17-18', 'vi', true, NOW(), NOW()),

('q-est-001', 'Esther', 4, 14, 14, 'medium', 'multiple_choice_single',
'Mọt-đô-chê nói với Ê-xơ-tê: "Biết đâu ngươi được làm hoàng hậu chính vì ___?"',
'["Thời điểm này đây", "Sắc đẹp của ngươi", "Dòng dõi của ngươi", "Sự khôn ngoan của ngươi"]',
'[0]',
'Ê-xơ-tê 4:14 - Mọt-đô-chê tin rằng Chúa đặt Ê-xơ-tê vào vị trí hoàng hậu đúng lúc dân Do-thái cần được giải cứu.',
'["Cựu Ước","Ê-xơ-tê","Chủ quyền Chúa"]', 'Esther 4:14', 'vi', true, NOW(), NOW());
