-- Genesis seed data: 20 questions (8 easy, 8 medium, 4 hard)
-- Source: Kinh Thanh Ban Truyen Thong 1926 (public domain)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end,
  difficulty, type, content, options, correct_answer,
  explanation, tags, source, language, review_status, approvals_count, is_active,
  created_at, updated_at
) VALUES

-- ═══════════════════════════════════════════════════════════════
-- EASY (8 questions)
-- ═══════════════════════════════════════════════════════════════

('seed-gen-001', 'Genesis', 1, 1, 1, 'easy', 'multiple_choice_single',
 'Theo Sáng Thế Ký 1:1, ai đã dựng nên trời đất?',
 '["Đức Chúa Trời","Thiên sứ","Môi-se","Áp-ra-ham"]',
 '[0]',
 'Sáng Thế Ký 1:1 — "Ban đầu Đức Chúa Trời dựng nên trời đất."',
 '["Sáng Thế Ký","Sáng tạo","Chương 1"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-002', 'Genesis', 1, 27, 27, 'easy', 'multiple_choice_single',
 'Theo Sáng Thế Ký 1:27, con người được dựng nên theo hình ảnh của ai?',
 '["Đức Chúa Trời","Thiên sứ","Các thần","Tự nhiên"]',
 '[0]',
 'Sáng Thế Ký 1:27 — "Đức Chúa Trời dựng nên loài người như hình Ngài; Ngài dựng nên loài người giống như hình Đức Chúa Trời."',
 '["Sáng Thế Ký","Sáng tạo","Con người"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-003', 'Genesis', 2, 7, 7, 'easy', 'multiple_choice_single',
 'Đức Chúa Trời nắn loài người bằng chất liệu gì? (Sáng 2:7)',
 '["Bụi đất","Đá","Nước","Lửa"]',
 '[0]',
 'Sáng Thế Ký 2:7 — "Giê-hô-va Đức Chúa Trời bèn lấy bụi đất nắn nên hình người, hà sanh khí vào lỗ mũi."',
 '["Sáng Thế Ký","Sáng tạo","A-đam"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-004', 'Genesis', 2, 22, 22, 'easy', 'multiple_choice_single',
 'Đức Chúa Trời dựng nên Ê-va từ phần nào của A-đam? (Sáng 2:22)',
 '["Xương sườn","Bụi đất","Tay","Chân"]',
 '[0]',
 'Sáng Thế Ký 2:22 — "Giê-hô-va Đức Chúa Trời bèn dùng xương sườn đã lấy nơi A-đam làm nên một người nữ."',
 '["Sáng Thế Ký","Sáng tạo","Ê-va"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-005', 'Genesis', 3, 6, 6, 'easy', 'multiple_choice_single',
 'Ê-va bị cám dỗ ăn trái cây gì trong vườn Ê-đen? (Sáng 2:17, 3:6)',
 '["Trái cây biết điều thiện và điều ác","Trái táo","Trái nho","Trái vả"]',
 '[0]',
 'Sáng Thế Ký 2:17 — "Nhưng về cây biết điều thiện và điều ác thì chớ hề ăn đến." Sáng 3:6 — "Người nữ thấy trái cây đó bèn hái ăn."',
 '["Sáng Thế Ký","Sa ngã","Vườn Ê-đen"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-006', 'Genesis', 6, 14, 14, 'easy', 'multiple_choice_single',
 'Đức Chúa Trời bảo Nô-ê đóng gì để tránh nước lụt? (Sáng 6:14)',
 '["Tàu","Nhà","Thuyền nhỏ","Cầu"]',
 '[0]',
 'Sáng Thế Ký 6:14 — "Ngươi hãy đóng một chiếc tàu bằng cây gô-phe."',
 '["Sáng Thế Ký","Nô-ê","Nước lụt"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-007', 'Genesis', 12, 1, 1, 'easy', 'multiple_choice_single',
 'Đức Chúa Trời kêu gọi ai ra khỏi quê hương để đi đến xứ Ngài sẽ chỉ cho? (Sáng 12:1)',
 '["Áp-ram","Nô-ê","Môi-se","Đa-vít"]',
 '[0]',
 'Sáng Thế Ký 12:1 — "Đức Giê-hô-va phán cùng Áp-ram rằng: Ngươi hãy ra khỏi quê hương, vòng bà con và nhà cha ngươi."',
 '["Sáng Thế Ký","Áp-ra-ham","Kêu gọi"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-008', 'Genesis', 25, 25, 26, 'easy', 'multiple_choice_single',
 'Ê-sau và Gia-cốp là con sinh đôi của ai? (Sáng 25:25-26)',
 '["Y-sác và Rê-be-ca","Áp-ra-ham và Sa-ra","Gia-cốp và Ra-chên","Giu-đa và Ta-ma"]',
 '[0]',
 'Sáng Thế Ký 25:25-26 — "Đứa ra trước đỏ hồng... đặt tên là Ê-sau. Kế em nó lại ra... đặt tên là Gia-cốp. Y-sác đã được sáu mươi tuổi khi Rê-be-ca sanh hai đứa đó."',
 '["Sáng Thế Ký","Ê-sau","Gia-cốp"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

-- ═══════════════════════════════════════════════════════════════
-- MEDIUM (8 questions)
-- ═══════════════════════════════════════════════════════════════

('seed-gen-009', 'Genesis', 1, 2, 2, 'medium', 'multiple_choice_single',
 'Trước khi Đức Chúa Trời sáng tạo, mặt đất được mô tả như thế nào? (Sáng 1:2)',
 '["Vô hình và trống không","Tràn đầy sự sống","Đầy ánh sáng","Có cây cối"]',
 '[0]',
 'Sáng Thế Ký 1:2 — "Vả, đất là vô hình và trống không, sự mờ tối ở trên mặt vực."',
 '["Sáng Thế Ký","Sáng tạo","Khởi nguyên"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-010', 'Genesis', 3, 15, 15, 'medium', 'multiple_choice_single',
 'Trong Sáng Thế Ký 3:15, Đức Chúa Trời phán dòng dõi người nữ sẽ làm gì với đầu con rắn?',
 '["Giày đạp","Cắt đứt","Trói lại","Đuổi đi"]',
 '[0]',
 'Sáng Thế Ký 3:15 — "Ta sẽ làm cho mầy cùng người nữ, dòng dõi mầy cùng dòng dõi người nữ nghịch thù nhau. Người sẽ giày đạp đầu mầy."',
 '["Sáng Thế Ký","Lời hứa","Mê-si-a"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-011', 'Genesis', 4, 8, 8, 'medium', 'multiple_choice_single',
 'Ca-in đã giết em mình là A-bên. Vì sao Ca-in giận? (Sáng 4:3-5)',
 '["Đức Chúa Trời nhận lễ vật A-bên nhưng không nhận lễ vật Ca-in","A-bên lấy đất của Ca-in","A-bên nói xấu Ca-in","A-bên giàu hơn Ca-in"]',
 '[0]',
 'Sáng Thế Ký 4:4-5 — "Đức Giê-hô-va đoái xem A-bên và lễ vật của người, nhưng chẳng đoái xem Ca-in và lễ vật của người. Ca-in giận lắm, sầm nét mặt."',
 '["Sáng Thế Ký","Ca-in","A-bên"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-012', 'Genesis', 7, 12, 12, 'medium', 'multiple_choice_single',
 'Mưa lụt thời Nô-ê kéo dài bao lâu? (Sáng 7:12)',
 '["40 ngày 40 đêm","7 ngày 7 đêm","30 ngày","1 năm"]',
 '[0]',
 'Sáng Thế Ký 7:12 — "Mưa sa trên mặt đất bốn mươi ngày và bốn mươi đêm."',
 '["Sáng Thế Ký","Nô-ê","Nước lụt"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-013', 'Genesis', 15, 5, 6, 'medium', 'multiple_choice_single',
 'Đức Chúa Trời hứa dòng dõi Áp-ram sẽ đông như gì? (Sáng 15:5)',
 '["Sao trên trời","Cát dưới biển","Lá trên cây","Cá dưới biển"]',
 '[0]',
 'Sáng Thế Ký 15:5 — "Hãy ngó lên trời, và nếu ngươi đếm được các ngôi sao thì hãy đếm đi. Dòng dõi ngươi cũng sẽ như vậy."',
 '["Sáng Thế Ký","Áp-ra-ham","Giao ước"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-014', 'Genesis', 22, 2, 2, 'medium', 'multiple_choice_single',
 'Đức Chúa Trời thử Áp-ra-ham bằng cách bảo ông dâng ai làm của lễ? (Sáng 22:2)',
 '["Y-sác","Ích-ma-ên","Ê-sau","Gia-cốp"]',
 '[0]',
 'Sáng Thế Ký 22:2 — "Hãy bắt đứa con một ngươi yêu dấu, là Y-sác... dâng đứa con đó làm của lễ thiêu."',
 '["Sáng Thế Ký","Áp-ra-ham","Đức tin"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-015', 'Genesis', 28, 12, 12, 'medium', 'multiple_choice_single',
 'Gia-cốp nằm chiêm bao thấy gì tại Bê-tên? (Sáng 28:12)',
 '["Cái thang bắc từ đất giơ lên trời, có các thiên sứ lên xuống","Biển lớn có cá nhiều","Bụi gai cháy lửa","Chiên bảy con béo và bảy con gầy"]',
 '[0]',
 'Sáng Thế Ký 28:12 — "Người chiêm bao thấy một cái thang bắc từ dưới đất giơ lên tận trời, các thiên sứ của Đức Chúa Trời đi lên xuống trên thang đó."',
 '["Sáng Thế Ký","Gia-cốp","Bê-tên"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-016', 'Genesis', 37, 3, 4, 'medium', 'multiple_choice_single',
 'Gia-cốp cho Giô-sép vật gì đặc biệt khiến các anh ghen ghét? (Sáng 37:3)',
 '["Áo dài có nhiều màu","Thanh gươm vàng","Đàn chiên riêng","Vương miện"]',
 '[0]',
 'Sáng Thế Ký 37:3 — "Y-sơ-ra-ên thương yêu Giô-sép hơn hết thảy các con trai mình, vì là con muộn mình; người may cho Giô-sép một cái áo dài có nhiều màu sắc."',
 '["Sáng Thế Ký","Giô-sép","Gia đình"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

-- ═══════════════════════════════════════════════════════════════
-- HARD (4 questions)
-- ═══════════════════════════════════════════════════════════════

('seed-gen-017', 'Genesis', 14, 18, 20, 'hard', 'multiple_choice_single',
 'Mên-chi-xê-đéc, vua Sa-lem, được mô tả với hai chức vụ nào? (Sáng 14:18)',
 '["Vua và thầy tế lễ","Tiên tri và quan xét","Vua và tướng quân","Thầy tế lễ và tiên tri"]',
 '[0]',
 'Sáng Thế Ký 14:18 — "Mên-chi-xê-đéc, vua Sa-lem, sai đem bánh và rượu ra. Vả, vua nầy là thầy tế lễ của Đức Chúa Trời Chí Cao."',
 '["Sáng Thế Ký","Mên-chi-xê-đéc","Thần học"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-018', 'Genesis', 15, 9, 10, 'hard', 'multiple_choice_single',
 'Trong giao ước với Áp-ram, Đức Chúa Trời bảo ông sắm mấy loài thú vật? (Sáng 15:9)',
 '["Ba loài: bò cái, dê cái, chiên đực (mỗi loài 3 tuổi) cùng chim cu và chim bồ câu con","Hai loài: chiên và bò","Một loài: chiên con","Bốn loài: bò, dê, chiên, lừa"]',
 '[0]',
 'Sáng Thế Ký 15:9 — "Hãy bắt đem cho ta một con bò cái ba tuổi, một con dê cái ba tuổi, một con chiên đực ba tuổi, một con cu rừng và một con bồ câu con."',
 '["Sáng Thế Ký","Giao ước","Áp-ra-ham"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-019', 'Genesis', 32, 28, 28, 'hard', 'multiple_choice_single',
 'Sau khi vật lộn với Đức Chúa Trời, Gia-cốp được đổi tên thành gì và có nghĩa gì? (Sáng 32:28)',
 '["Y-sơ-ra-ên — người vật lộn cùng Đức Chúa Trời","Giê-hô-va — Đức Chúa Trời cung ứng","Bê-tên — Nhà Đức Chúa Trời","Ê-bên-ê-xe — Đá giúp đỡ"]',
 '[0]',
 'Sáng Thế Ký 32:28 — "Tên ngươi sẽ chẳng là Gia-cốp nữa, nhưng tên là Y-sơ-ra-ên, vì ngươi đã vật lộn cùng Đức Chúa Trời."',
 '["Sáng Thế Ký","Gia-cốp","Y-sơ-ra-ên"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW()),

('seed-gen-020', 'Genesis', 49, 10, 10, 'hard', 'multiple_choice_single',
 'Trong lời chúc phước cho Giu-đa, Gia-cốp nói cây phủ việt sẽ không rời ai cho đến khi Đấng Si-lô đến? (Sáng 49:10)',
 '["Giu-đa","Giô-sép","Bên-gia-min","Lê-vi"]',
 '[0]',
 'Sáng Thế Ký 49:10 — "Cây phủ việt chẳng hề rời khỏi Giu-đa, kẻ lập pháp không dứt khỏi giữa chân nó, cho đến chừng Đấng Si-lô hiện tới."',
 '["Sáng Thế Ký","Lời tiên tri","Giu-đa","Mê-si-a"]', 'BTT 1926', 'vi','ACTIVE', 0, 1, NOW(), NOW());
