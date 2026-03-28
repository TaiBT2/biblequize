-- ============================================================
-- Seed: Revelation (Khải Huyền) — 60 câu hỏi
-- Bản Truyền Thống 1926 (BTT 1926)
-- Distribution: 25 easy, 22 medium, 13 hard
-- ============================================================

INSERT IGNORE INTO questions (id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, review_status, approvals_count, is_active, created_at, updated_at) VALUES

-- ======================== EASY (25) ========================

-- Seven Churches (1-3)
('bq-rev-001', 'Revelation', 1, 1, 1, 'easy', 'multiple_choice_single',
 'Sách Khải Huyền là sự mặc khải của ai?',
 '["Sứ đồ Phao-lô","Đức Chúa Jêsus Christ","Tiên tri Ê-sai","Sứ đồ Phi-e-rơ"]', '[1]',
 'Khải Huyền 1:1 — "Sự mặc khải của Đức Chúa Jêsus Christ, mà Đức Chúa Trời đã ban cho Ngài"', '["Khải Huyền","Mặc khải","Giới thiệu"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-002', 'Revelation', 1, 9, 9, 'easy', 'multiple_choice_single',
 'Sứ đồ Giăng ở đảo nào khi nhận được sự mặc khải?',
 '["Đảo Cơ-rết","Đảo Bát-mô","Đảo Chíp-rơ","Đảo Si-sin"]', '[1]',
 'Khải Huyền 1:9 — "Ta là Giăng...ở trong đảo gọi là Bát-mô"', '["Khải Huyền","Giăng","Bát-mô"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-003', 'Revelation', 1, 11, 11, 'easy', 'multiple_choice_single',
 'Giăng được lệnh viết thư cho bao nhiêu Hội thánh?',
 '["5","6","7","12"]', '[2]',
 'Khải Huyền 1:11 — "Hãy chép vào một quyển sách mà gởi cho bảy Hội thánh"', '["Khải Huyền","Bảy Hội thánh"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-004', 'Revelation', 2, 1, 1, 'easy', 'multiple_choice_single',
 'Hội thánh nào được nhắc đến đầu tiên trong bảy Hội thánh?',
 '["Si-miệc-nơ","Bẹt-găm","Ê-phê-sô","Thi-a-ti-rơ"]', '[2]',
 'Khải Huyền 2:1 — "Hãy viết cho thiên sứ của Hội thánh Ê-phê-sô"', '["Khải Huyền","Ê-phê-sô","Bảy Hội thánh"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-005', 'Revelation', 2, 10, 10, 'easy', 'multiple_choice_single',
 'Hội thánh Si-miệc-nơ được hứa ban điều gì nếu trung tín cho đến chết?',
 '["Vương miện bằng vàng","Mão triều thiên sự sống","Áo trắng","Ngôi sao mai"]', '[1]',
 'Khải Huyền 2:10 — "Khá giữ trung tín cho đến chết, rồi ta sẽ ban cho ngươi mão triều thiên của sự sống"', '["Khải Huyền","Si-miệc-nơ","Trung tín"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-006', 'Revelation', 3, 15, 16, 'easy', 'multiple_choice_single',
 'Hội thánh Lao-đi-xê bị quở trách vì điều gì?',
 '["Thờ hình tượng","Không lạnh cũng không nóng","Theo tà giáo","Bắt bớ tín đồ"]', '[1]',
 'Khải Huyền 3:15-16 — "Ta biết công việc của ngươi; ngươi không lạnh cũng không nóng"', '["Khải Huyền","Lao-đi-xê","Bảy Hội thánh"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-007', 'Revelation', 3, 20, 20, 'easy', 'multiple_choice_single',
 'Theo Khải Huyền 3:20, Chúa Jêsus đang làm gì?',
 '["Ngồi trên ngai","Đứng ngoài cửa mà gõ","Cưỡi ngựa trắng","Cầm sách"]', '[1]',
 'Khải Huyền 3:20 — "Nầy, ta đứng ngoài cửa mà gõ; nếu ai nghe tiếng ta mà mở cửa cho, thì ta sẽ vào cùng người ấy"', '["Khải Huyền","Lao-đi-xê","Lời mời gọi"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Throne Room (4-5)
('bq-rev-008', 'Revelation', 4, 4, 4, 'easy', 'multiple_choice_single',
 'Có bao nhiêu trưởng lão ngồi chung quanh ngôi?',
 '["12","7","24","70"]', '[2]',
 'Khải Huyền 4:4 — "Xung quanh ngôi có hai mươi bốn ngôi khác, trên có hai mươi bốn trưởng lão ngồi"', '["Khải Huyền","Trưởng lão","Ngôi"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-009', 'Revelation', 4, 6, 8, 'easy', 'multiple_choice_single',
 'Bốn sinh vật ở trước ngôi hô rằng gì không ngừng?',
 '["Ha-lê-lu-gia","A-men","Thánh thay, thánh thay, thánh thay","Vinh hiển cho Đức Chúa Trời"]', '[2]',
 'Khải Huyền 4:8 — "Thánh thay, thánh thay, thánh thay là Chúa, Đức Chúa Trời, Đấng Toàn năng"', '["Khải Huyền","Bốn sinh vật","Thờ phượng"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-010', 'Revelation', 5, 5, 5, 'easy', 'multiple_choice_single',
 'Ai được xứng đáng mở quyển sách có bảy ấn?',
 '["Thiên sứ Mi-ca-ên","Sư tử của chi phái Giu-đa","Trưởng lão","Môi-se"]', '[1]',
 'Khải Huyền 5:5 — "Kìa, sư tử của chi phái Giu-đa, tức là Chồi của vua Đa-vít, đã thắng"', '["Khải Huyền","Chiên Con","Quyển sách"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-011', 'Revelation', 5, 6, 6, 'easy', 'multiple_choice_single',
 'Chiên Con có bao nhiêu sừng và bao nhiêu mắt?',
 '["Bảy sừng, bảy mắt","Mười sừng, bảy mắt","Bảy sừng, mười mắt","Mười sừng, mười mắt"]', '[0]',
 'Khải Huyền 5:6 — "Một Chiên Con...có bảy sừng và bảy mắt, tức là bảy vị thần của Đức Chúa Trời"', '["Khải Huyền","Chiên Con","Biểu tượng"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Seals (6)
('bq-rev-012', 'Revelation', 6, 2, 2, 'easy', 'multiple_choice_single',
 'Khi mở ấn thứ nhất, con ngựa xuất hiện có màu gì?',
 '["Đỏ","Đen","Vàng","Trắng"]', '[3]',
 'Khải Huyền 6:2 — "Tôi nhìn xem, thấy một con ngựa bạch"', '["Khải Huyền","Bốn kỵ sĩ","Ấn"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-013', 'Revelation', 6, 4, 4, 'easy', 'multiple_choice_single',
 'Con ngựa hồng (ấn thứ hai) tượng trưng cho điều gì?',
 '["Đói kém","Chiến tranh","Dịch bệnh","Sự chết"]', '[1]',
 'Khải Huyền 6:4 — "Có một con ngựa khác sắc hồng hiện ra, kẻ ngồi trên được quyền cất lấy hòa bình khỏi thế gian"', '["Khải Huyền","Bốn kỵ sĩ","Chiến tranh"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- 144,000 (7)
('bq-rev-014', 'Revelation', 7, 4, 4, 'easy', 'multiple_choice_single',
 'Có bao nhiêu người được đóng ấn từ các chi phái Y-sơ-ra-ên?',
 '["12.000","24.000","70.000","144.000"]', '[3]',
 'Khải Huyền 7:4 — "Tôi nghe số người được đóng ấn là mười bốn vạn bốn ngàn"', '["Khải Huyền","144.000","Đóng ấn"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-015', 'Revelation', 7, 9, 9, 'easy', 'multiple_choice_single',
 'Đoàn người đông không đếm được mặc gì?',
 '["Áo đỏ","Áo xanh","Áo trắng","Áo tím"]', '[2]',
 'Khải Huyền 7:9 — "Một đoàn đông lắm...mặc áo dài trắng, tay cầm nhành chà là"', '["Khải Huyền","Đoàn người","Áo trắng"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Trumpets (8-11)
('bq-rev-016', 'Revelation', 8, 1, 1, 'easy', 'multiple_choice_single',
 'Khi mở ấn thứ bảy, trên trời im lặng bao lâu?',
 '["Một giờ","Ước chừng nửa giờ","Ba giờ","Một ngày"]', '[1]',
 'Khải Huyền 8:1 — "Khi Chiên Con mở ấn thứ bảy, trên trời im lặng ước chừng nửa giờ"', '["Khải Huyền","Ấn thứ bảy","Im lặng"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-017', 'Revelation', 8, 2, 2, 'easy', 'multiple_choice_single',
 'Bảy thiên sứ đứng trước mặt Đức Chúa Trời được ban cho điều gì?',
 '["Bảy bát","Bảy ống loa","Bảy mão","Bảy thanh gươm"]', '[1]',
 'Khải Huyền 8:2 — "Tôi thấy bảy vị thiên sứ đứng trước mặt Đức Chúa Trời; có kẻ trao cho bảy ống loa"', '["Khải Huyền","Bảy ống loa","Thiên sứ"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Dragon & Beasts (12-13)
('bq-rev-018', 'Revelation', 12, 3, 3, 'easy', 'multiple_choice_single',
 'Con rồng lớn sắc đỏ có bao nhiêu đầu?',
 '["Bảy đầu","Mười đầu","Ba đầu","Một đầu"]', '[0]',
 'Khải Huyền 12:3 — "Một con rồng lớn sắc đỏ, có bảy đầu, mười sừng"', '["Khải Huyền","Con rồng","Sa-tan"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-019', 'Revelation', 12, 9, 9, 'easy', 'multiple_choice_single',
 'Con rồng lớn được nhận diện là ai?',
 '["Con thú","Tiên tri giả","Ma quỉ, tức là Sa-tan","Nê-bu-cát-nết-sa"]', '[2]',
 'Khải Huyền 12:9 — "Con rồng lớn...tức là ma quỉ và Sa-tan, đã bị quăng xuống"', '["Khải Huyền","Con rồng","Sa-tan"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-020', 'Revelation', 13, 18, 18, 'easy', 'multiple_choice_single',
 'Số của con thú là bao nhiêu?',
 '["333","777","666","999"]', '[2]',
 'Khải Huyền 13:18 — "Số nó là sáu trăm sáu mươi sáu"', '["Khải Huyền","Con thú","666"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Babylon (17-18)
('bq-rev-021', 'Revelation', 17, 5, 5, 'easy', 'multiple_choice_single',
 'Tên viết trên trán người đàn bà trong Khải Huyền 17 là gì?',
 '["Giê-ru-sa-lem","Ba-by-lôn lớn","La-mã","Ni-ni-ve"]', '[1]',
 'Khải Huyền 17:5 — "Trên trán nó có đề một tên là: Ba-by-lôn lớn"', '["Khải Huyền","Ba-by-lôn","Người đàn bà"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Second Coming (19)
('bq-rev-022', 'Revelation', 19, 11, 11, 'easy', 'multiple_choice_single',
 'Trong Khải Huyền 19:11, Đấng cưỡi ngựa trắng được gọi là gì?',
 '["Đấng Cứu Thế","Đấng Trung tín và Chân thật","Vua các vua","Con người"]', '[1]',
 'Khải Huyền 19:11 — "Đấng cưỡi ngựa ấy gọi là Đấng Trung tín và Chân thật"', '["Khải Huyền","Tái lâm","Ngựa trắng"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- New Heaven (21-22)
('bq-rev-023', 'Revelation', 21, 1, 1, 'easy', 'multiple_choice_single',
 'Điều gì sẽ xuất hiện sau khi trời đất cũ qua đi?',
 '["Vườn Ê-đen mới","Trời mới đất mới","Nước ngàn năm","Đền thờ mới"]', '[1]',
 'Khải Huyền 21:1 — "Đoạn, tôi thấy trời mới và đất mới; vì trời thứ nhất và đất thứ nhất đã biến đi mất"', '["Khải Huyền","Trời mới đất mới","Tương lai"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-024', 'Revelation', 21, 4, 4, 'easy', 'multiple_choice_single',
 'Trong thành Giê-ru-sa-lem mới, Đức Chúa Trời sẽ lau hết điều gì?',
 '["Mọi tội lỗi","Mọi nước mắt","Mọi vết thương","Mọi sự đau ốm"]', '[1]',
 'Khải Huyền 21:4 — "Ngài sẽ lau ráo hết nước mắt khỏi mắt chúng, sẽ không có sự chết"', '["Khải Huyền","Giê-ru-sa-lem mới","An ủi"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-025', 'Revelation', 22, 13, 13, 'easy', 'multiple_choice_single',
 'Chúa Jêsus tự xưng là gì trong Khải Huyền 22:13?',
 '["Vua các vua","An-pha và Ô-mê-ga","Đấng Chăn chiên","Bánh Hằng sống"]', '[1]',
 'Khải Huyền 22:13 — "Ta là An-pha và Ô-mê-ga, là đầu tiên và cuối cùng, là đầu và rốt"', '["Khải Huyền","An-pha Ô-mê-ga","Danh xưng"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- ======================== MEDIUM (22) ========================

-- Seven Churches (1-3)
('bq-rev-026', 'Revelation', 1, 12, 13, 'medium', 'multiple_choice_single',
 'Giăng thấy Đấng giống như Con Người đứng giữa bao nhiêu chân đèn vàng?',
 '["Năm","Bảy","Mười hai","Ba"]', '[1]',
 'Khải Huyền 1:12-13 — "Tôi thấy bảy chân đèn bằng vàng, và ở giữa những chân đèn ấy có ai giống như con người"', '["Khải Huyền","Chân đèn","Con người"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-027', 'Revelation', 2, 4, 4, 'medium', 'multiple_choice_single',
 'Hội thánh Ê-phê-sô bị quở trách vì đã mất điều gì?',
 '["Đức tin","Lòng kính sợ","Tình yêu thương ban đầu","Sự hiệp một"]', '[2]',
 'Khải Huyền 2:4 — "Nhưng điều ta trách ngươi, là ngươi đã bỏ lòng kính mến ban đầu"', '["Khải Huyền","Ê-phê-sô","Tình yêu ban đầu"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-028', 'Revelation', 2, 17, 17, 'medium', 'multiple_choice_single',
 'Hội thánh Bẹt-găm được hứa ban viên đá gì?',
 '["Viên đá đen","Viên đá đỏ","Viên đá trắng","Viên đá xanh"]', '[2]',
 'Khải Huyền 2:17 — "Ta sẽ ban cho ma-na đương giấu kín; và ta sẽ cho nó một viên đá trắng"', '["Khải Huyền","Bẹt-găm","Viên đá trắng"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-029', 'Revelation', 3, 1, 1, 'medium', 'multiple_choice_single',
 'Hội thánh nào được mô tả là "có tiếng là sống nhưng mà là chết"?',
 '["Phi-la-đen-phi","Thi-a-ti-rơ","Sạt-đe","Lao-đi-xê"]', '[2]',
 'Khải Huyền 3:1 — "Ta biết công việc ngươi; ngươi có tiếng là sống, nhưng mà là chết"', '["Khải Huyền","Sạt-đe","Bảy Hội thánh"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-030', 'Revelation', 3, 7, 8, 'medium', 'multiple_choice_single',
 'Hội thánh Phi-la-đen-phi được khen vì điều gì?',
 '["Có tài sản lớn","Có ít năng lực mà đã giữ đạo Chúa","Đánh bại kẻ thù","Xây đền thờ lớn"]', '[1]',
 'Khải Huyền 3:8 — "Ngươi có ít năng lực, mà đã giữ đạo ta, và chẳng chối danh ta"', '["Khải Huyền","Phi-la-đen-phi","Trung tín"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Throne Room (4-5)
('bq-rev-031', 'Revelation', 4, 3, 3, 'medium', 'multiple_choice_single',
 'Cầu vồng bao quanh ngôi Đức Chúa Trời giống như đá gì?',
 '["Đá hồng ngọc","Đá bích ngọc","Đá mã não","Đá thạch anh"]', '[1]',
 'Khải Huyền 4:3 — "Một cái mống dường như bích ngọc ở chung quanh ngôi"', '["Khải Huyền","Ngôi","Bích ngọc"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-032', 'Revelation', 5, 8, 8, 'medium', 'multiple_choice_single',
 'Những bát vàng đầy hương mà các trưởng lão cầm tượng trưng cho điều gì?',
 '["Sự hy sinh","Những lời cầu nguyện của các thánh đồ","Phước lành","Sự thờ phượng"]', '[1]',
 'Khải Huyền 5:8 — "Mỗi vị cầm bát vàng đầy hương là những lời cầu nguyện của các thánh đồ"', '["Khải Huyền","Cầu nguyện","Bát vàng"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Seals (6)
('bq-rev-033', 'Revelation', 6, 5, 6, 'medium', 'multiple_choice_single',
 'Khi mở ấn thứ ba, kẻ ngồi trên ngựa ô cầm gì trong tay?',
 '["Thanh gươm","Cái cân","Cái cung","Ngọn giáo"]', '[1]',
 'Khải Huyền 6:5 — "Tôi nhìn xem, thấy một con ngựa ô; người cưỡi ngựa tay cầm cái cân"', '["Khải Huyền","Ấn thứ ba","Đói kém"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-034', 'Revelation', 6, 9, 10, 'medium', 'multiple_choice_single',
 'Khi mở ấn thứ năm, những linh hồn dưới bàn thờ kêu xin điều gì?',
 '["Được sống lại","Được nghỉ ngơi","Đức Chúa Trời báo thù huyết họ","Được vào thiên đàng"]', '[2]',
 'Khải Huyền 6:10 — "Lạy Chúa...Ngài chẳng xét đoán và chẳng báo thù huyết chúng tôi cho kẻ ở trên đất sao?"', '["Khải Huyền","Ấn thứ năm","Linh hồn tử đạo"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-035', 'Revelation', 6, 12, 13, 'medium', 'multiple_choice_single',
 'Khi mở ấn thứ sáu, mặt trời trở nên thế nào?',
 '["Sáng gấp bảy lần","Tối như bao gai","Đỏ như máu","Biến mất"]', '[1]',
 'Khải Huyền 6:12 — "Mặt trời bèn trở nên tối như bao gai, cả mặt trăng trở nên như huyết"', '["Khải Huyền","Ấn thứ sáu","Thiên tai"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- 144,000 (7)
('bq-rev-036', 'Revelation', 7, 14, 14, 'medium', 'multiple_choice_single',
 'Đoàn đông mặc áo trắng đã giặt áo mình trong gì?',
 '["Nước sông Giô-đanh","Huyết Chiên Con","Nước hằng sống","Nước từ đền thờ"]', '[1]',
 'Khải Huyền 7:14 — "Họ đã giặt và phiếu trắng áo mình trong huyết Chiên Con"', '["Khải Huyền","Áo trắng","Huyết Chiên Con"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Trumpets (8-11)
('bq-rev-037', 'Revelation', 8, 10, 11, 'medium', 'multiple_choice_single',
 'Ngôi sao lớn rơi xuống khi thổi loa thứ ba có tên là gì?',
 '["Ánh sáng","Ngôi sao mai","Ngải cứu","Lưu huỳnh"]', '[2]',
 'Khải Huyền 8:11 — "Tên ngôi sao đó gọi là Ngải cứu"', '["Khải Huyền","Loa thứ ba","Ngải cứu"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-038', 'Revelation', 9, 1, 2, 'medium', 'multiple_choice_single',
 'Khi thổi loa thứ năm, chìa khóa của vực sâu không đáy được trao cho ai?',
 '["Một thiên sứ","Một trưởng lão","Chiên Con","Con rồng"]', '[0]',
 'Khải Huyền 9:1 — "Tôi thấy một ngôi sao từ trời sa xuống đất, và có kẻ trao cho chìa khóa đáy vực sâu"', '["Khải Huyền","Loa thứ năm","Vực sâu"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-039', 'Revelation', 11, 3, 3, 'medium', 'multiple_choice_single',
 'Hai người chứng sẽ nói tiên tri trong bao nhiêu ngày?',
 '["1.000 ngày","1.260 ngày","1.400 ngày","2.000 ngày"]', '[1]',
 'Khải Huyền 11:3 — "Ta sẽ cho hai người chứng của ta mặc áo gai mà nói tiên tri trong một ngàn hai trăm sáu mươi ngày"', '["Khải Huyền","Hai người chứng","Tiên tri"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Dragon & Beasts (12-13)
('bq-rev-040', 'Revelation', 12, 1, 2, 'medium', 'multiple_choice_single',
 'Người đàn bà trong Khải Huyền 12 đội trên đầu bao nhiêu ngôi sao?',
 '["Bảy ngôi sao","Mười ngôi sao","Mười hai ngôi sao","Hai mươi bốn ngôi sao"]', '[2]',
 'Khải Huyền 12:1 — "Một người đàn bà...trên đầu có mão triều thiên bằng mười hai ngôi sao"', '["Khải Huyền","Người đàn bà","Mười hai ngôi sao"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-041', 'Revelation', 12, 7, 7, 'medium', 'multiple_choice_single',
 'Thiên sứ nào chiến đấu với con rồng trên trời?',
 '["Gáp-ri-ên","Mi-ca-ên","Ra-pha-ên","U-ri-ên"]', '[1]',
 'Khải Huyền 12:7 — "Mi-ca-ên cùng các sứ người chiến đấu với con rồng"', '["Khải Huyền","Mi-ca-ên","Chiến trận trên trời"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-042', 'Revelation', 13, 1, 1, 'medium', 'multiple_choice_single',
 'Con thú thứ nhất từ đâu lên?',
 '["Từ đất","Từ biển","Từ trời","Từ vực sâu"]', '[1]',
 'Khải Huyền 13:1 — "Tôi thấy ở dưới biển lên một con thú có mười sừng bảy đầu"', '["Khải Huyền","Con thú","Biển"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Babylon (17-18)
('bq-rev-043', 'Revelation', 17, 3, 4, 'medium', 'multiple_choice_single',
 'Người đàn bà Ba-by-lôn ngồi trên con thú màu gì?',
 '["Màu đỏ sậm","Màu đen","Màu trắng","Màu xanh"]', '[0]',
 'Khải Huyền 17:3 — "Tôi thấy một người đàn bà ngồi trên một con thú sắc đỏ sậm"', '["Khải Huyền","Ba-by-lôn","Con thú"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-044', 'Revelation', 18, 2, 2, 'medium', 'multiple_choice_single',
 'Thiên sứ rao báo điều gì về Ba-by-lôn lớn?',
 '["Đã được tha thứ","Đã đổ rồi","Sẽ được phục hưng","Đang hối cải"]', '[1]',
 'Khải Huyền 18:2 — "Ba-by-lôn lớn đã đổ rồi, đã đổ rồi!"', '["Khải Huyền","Ba-by-lôn","Sụp đổ"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Second Coming (19) & Millennium (20)
('bq-rev-045', 'Revelation', 19, 16, 16, 'medium', 'multiple_choice_single',
 'Danh hiệu viết trên áo và trên đùi Đấng cưỡi ngựa trắng là gì?',
 '["Đấng Toàn năng","Vua của các vua và Chúa của các chúa","Con Đức Chúa Trời","Đấng Đời đời"]', '[1]',
 'Khải Huyền 19:16 — "Trên áo và trên đùi Ngài có đề một danh: VUA CỦA CÁC VUA VÀ CHÚA CỦA CÁC CHÚA"', '["Khải Huyền","Tái lâm","Danh xưng"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-046', 'Revelation', 20, 2, 3, 'medium', 'multiple_choice_single',
 'Sa-tan bị xiềng lại trong bao lâu?',
 '["100 năm","500 năm","1.000 năm","Đời đời"]', '[2]',
 'Khải Huyền 20:2 — "Người bắt con rồng...mà xiềng nó lại đến ngàn năm"', '["Khải Huyền","Sa-tan","Ngàn năm"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- New Heaven (21-22)
('bq-rev-047', 'Revelation', 21, 2, 2, 'medium', 'multiple_choice_single',
 'Thành Giê-ru-sa-lem mới từ trời xuống được ví như gì?',
 '["Một vị vua vinh hiển","Một cô dâu trang sức cho chồng","Một đền thờ bằng vàng","Một ngọn hải đăng"]', '[1]',
 'Khải Huyền 21:2 — "Thành thánh, là Giê-ru-sa-lem mới...sửa soạn sẵn như một cô dâu trang sức cho chồng mình"', '["Khải Huyền","Giê-ru-sa-lem mới","Cô dâu"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- ======================== HARD (13) ========================

-- Seven Churches (1-3)
('bq-rev-048', 'Revelation', 1, 14, 16, 'hard', 'multiple_choice_single',
 'Trong khải tượng về Con Người, từ miệng Ngài ra điều gì?',
 '["Lửa","Một thanh gươm nhọn hai lưỡi","Hơi thở sự sống","Nước hằng sống"]', '[1]',
 'Khải Huyền 1:16 — "Từ miệng Ngài ra một thanh gươm nhọn hai lưỡi"', '["Khải Huyền","Con người","Gươm"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-049', 'Revelation', 2, 6, 6, 'hard', 'multiple_choice_single',
 'Hội thánh Ê-phê-sô được khen vì ghét việc làm của nhóm nào?',
 '["Nhóm Sa-đu-sê","Nhóm Ni-cô-la","Nhóm Pha-ri-si","Nhóm Hê-rốt"]', '[1]',
 'Khải Huyền 2:6 — "Ngươi ghét những việc làm của đảng Ni-cô-la, là điều ta cũng ghét"', '["Khải Huyền","Ê-phê-sô","Ni-cô-la"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-050', 'Revelation', 2, 20, 20, 'hard', 'multiple_choice_single',
 'Hội thánh Thi-a-ti-rơ bị quở vì dung túng người đàn bà nào?',
 '["Ða-li-la","Giê-sa-bên","Ra-háp","Hê-rô-đia"]', '[1]',
 'Khải Huyền 2:20 — "Ngươi còn dung cho Giê-sa-bên, người đàn bà xưng mình là nữ tiên tri"', '["Khải Huyền","Thi-a-ti-rơ","Giê-sa-bên"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Seals & Trumpets
('bq-rev-051', 'Revelation', 6, 8, 8, 'hard', 'multiple_choice_single',
 'Con ngựa vàng vàng (ấn thứ tư) — kẻ cưỡi có tên là gì?',
 '["Chiến tranh","Đói kém","Sự Chết","Hủy diệt"]', '[2]',
 'Khải Huyền 6:8 — "Tôi nhìn xem, thấy một con ngựa vàng vàng; kẻ cưỡi ngựa ấy tên là Sự Chết"', '["Khải Huyền","Bốn kỵ sĩ","Sự Chết"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-052', 'Revelation', 9, 13, 15, 'hard', 'multiple_choice_single',
 'Khi thổi loa thứ sáu, bốn thiên sứ bị trói ở sông nào được thả ra?',
 '["Sông Giô-đanh","Sông Ni-lơ","Sông Ơ-phơ-rát","Sông Ti-gơ-rơ"]', '[2]',
 'Khải Huyền 9:14 — "Hãy thả bốn thiên sứ bị trói ở bên sông lớn Ơ-phơ-rát"', '["Khải Huyền","Loa thứ sáu","Ơ-phơ-rát"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-053', 'Revelation', 9, 16, 16, 'hard', 'multiple_choice_single',
 'Đạo binh kỵ mã xuất hiện khi thổi loa thứ sáu có bao nhiêu quân?',
 '["Một trăm triệu","Hai trăm triệu","Ba trăm triệu","Một tỉ"]', '[1]',
 'Khải Huyền 9:16 — "Số quân-lính cưỡi ngựa là hai muôn lần một muôn (200 triệu)"', '["Khải Huyền","Loa thứ sáu","Đạo binh"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Dragon & Beasts (12-13)
('bq-rev-054', 'Revelation', 12, 4, 4, 'hard', 'multiple_choice_single',
 'Đuôi con rồng kéo bao nhiêu phần ngôi sao trên trời xuống đất?',
 '["Một phần ba","Một phần tư","Một nửa","Hai phần ba"]', '[0]',
 'Khải Huyền 12:4 — "Đuôi kéo một phần ba các ngôi sao trên trời, quăng xuống đất"', '["Khải Huyền","Con rồng","Ngôi sao"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-055', 'Revelation', 13, 11, 11, 'hard', 'multiple_choice_single',
 'Con thú thứ hai từ đất lên có đặc điểm gì?',
 '["Mười sừng, bảy đầu","Hai sừng như sừng chiên con","Một sừng lớn","Không có sừng"]', '[1]',
 'Khải Huyền 13:11 — "Tôi lại thấy từ dưới đất lên một con thú khác, có hai sừng như sừng chiên con"', '["Khải Huyền","Con thú thứ hai","Tiên tri giả"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Bowls of Wrath (15-16)
('bq-rev-056', 'Revelation', 16, 12, 12, 'hard', 'multiple_choice_single',
 'Khi thiên sứ đổ bát thứ sáu trên sông Ơ-phơ-rát, điều gì xảy ra?',
 '["Sông biến thành máu","Nước sông cạn khô","Đất rung chuyển","Sấm sét lớn"]', '[1]',
 'Khải Huyền 16:12 — "Thiên sứ thứ sáu trút bát mình trên sông lớn Ơ-phơ-rát; nước sông bèn cạn khô"', '["Khải Huyền","Bát thứ sáu","Ơ-phơ-rát"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-057', 'Revelation', 16, 16, 16, 'hard', 'multiple_choice_single',
 'Tên địa điểm nơi các vua nhóm lại cho trận chiến cuối cùng là gì?',
 '["Mê-ghi-đô","Ha-ma-ghê-đôn","Si-ôn","Gô-gô-tha"]', '[1]',
 'Khải Huyền 16:16 — "Ba tà thần nhóm các vua lại một chỗ, tiếng Hê-bơ-rơ gọi là Ha-ma-ghê-đôn"', '["Khải Huyền","Ha-ma-ghê-đôn","Trận chiến"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- Second Coming & Judgment (19-20)
('bq-rev-058', 'Revelation', 20, 11, 12, 'hard', 'multiple_choice_single',
 'Tại sự phán xét cuối cùng, kẻ chết bị xử theo điều gì?',
 '["Theo lời nói của họ","Theo việc làm ghi trong sách","Theo lòng tin của họ","Theo dòng dõi của họ"]', '[1]',
 'Khải Huyền 20:12 — "Những kẻ chết bị xử đoán tùy công việc mình làm, cứ như lời đã biên trong những sách ấy"', '["Khải Huyền","Phán xét","Sách"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

-- New Heaven (21-22)
('bq-rev-059', 'Revelation', 21, 16, 16, 'hard', 'multiple_choice_single',
 'Thành Giê-ru-sa-lem mới có hình dạng gì?',
 '["Hình tròn","Hình vuông (bề dài, rộng, cao bằng nhau)","Hình tam giác","Hình bầu dục"]', '[1]',
 'Khải Huyền 21:16 — "Bề dài, bề rộng và bề cao đều bằng nhau"', '["Khải Huyền","Giê-ru-sa-lem mới","Kích thước"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW()),

('bq-rev-060', 'Revelation', 22, 18, 19, 'hard', 'multiple_choice_single',
 'Điều gì sẽ xảy ra với ai thêm vào lời tiên tri trong sách này?',
 '["Sẽ bị đuổi khỏi Hội thánh","Đức Chúa Trời sẽ thêm cho họ những tai nạn đã ghi trong sách","Sẽ mất phước lành","Sẽ bị quên lãng"]', '[1]',
 'Khải Huyền 22:18 — "Nếu ai thêm vào sách tiên tri nầy điều gì, thì Đức Chúa Trời sẽ thêm cho người ấy những tai nạn đã chép trong sách nầy"', '["Khải Huyền","Cảnh cáo","Lời tiên tri"]', 'BTT 1926', 'vi', 'ACTIVE', 0, 1, NOW(), NOW());
