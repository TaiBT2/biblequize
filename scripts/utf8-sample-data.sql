-- Insert sample books
INSERT INTO books (id, name, name_vi, testament, order_index, created_at) VALUES
('01', 'Genesis', 'Sáng Thế Ký', 'OLD', 1, NOW()),
('02', 'Exodus', 'Xuất Ê-díp-tô Ký', 'OLD', 2, NOW()),
('03', 'Matthew', 'Ma-thi-ơ', 'NEW', 40, NOW()),
('04', 'John', 'Giăng', 'NEW', 43, NOW()),
('05', 'Acts', 'Công Vụ', 'NEW', 44, NOW());

-- Insert sample questions
INSERT INTO questions (id, book, chapter, difficulty, type, content, options, correct_answer, explanation) VALUES
('q1', 'Genesis', 1, 'easy', 'multiple_choice_single', 'Trong Sáng Thế Ký 1:1, Đức Chúa Trời đã làm gì?', JSON_ARRAY('Dựng nên trời và đất', 'Dựng nên con người', 'Phán xét thế gian', 'Lập giao ước với Áp-ra-ham'), JSON_ARRAY(0), 'Sáng Thế Ký 1:1: "Ban đầu Đức Chúa Trời dựng nên trời và đất."'),
('q2', 'Genesis', 1, 'easy', 'multiple_choice_single', 'Ngày thứ mấy Đức Chúa Trời tạo ra con người?', JSON_ARRAY('Ngày thứ 5', 'Ngày thứ 6', 'Ngày thứ 7', 'Ngày thứ 8'), JSON_ARRAY(1), 'Sáng Thế Ký 1:26-31: Đức Chúa Trời tạo ra con người vào ngày thứ 6.'),
('q3', 'Genesis', 2, 'medium', 'multiple_choice_single', 'Cây nào trong vườn Ê-đen mà Đức Chúa Trời cấm con người ăn?', JSON_ARRAY('Cây sự sống', 'Cây biết điều thiện và điều ác', 'Cây tri thức', 'Cây khôn ngoan'), JSON_ARRAY(1), 'Sáng Thế Ký 2:17: "Nhưng về cây biết điều thiện và điều ác thì chớ hề ăn đến."'),
('q4', 'Genesis', 3, 'easy', 'multiple_choice_single', 'Ai đã cám dỗ Ê-va ăn trái cấm?', JSON_ARRAY('Con rắn', 'Con quỷ', 'Thiên sứ sa ngã', 'Con người'), JSON_ARRAY(0), 'Sáng Thế Ký 3:1: "Vả, con rắn là giống quỉ quyệt hơn mọi loài ngoài đồng."'),
('q5', 'Genesis', 4, 'medium', 'multiple_choice_single', 'Ca-in đã giết em trai mình là ai?', JSON_ARRAY('A-bên', 'Sết', 'Ê-nót', 'Kê-nan'), JSON_ARRAY(0), 'Sáng Thế Ký 4:8: "Ca-in nói cùng A-bên, em mình, rằng: Chúng ta hãy ra ngoài đồng. Khi hai người đang ở ngoài đồng, Ca-in xông vào A-bên, em mình, và giết đi."'),
('q6', 'Genesis', 6, 'easy', 'multiple_choice_single', 'Nô-ê đã đóng tàu để làm gì?', JSON_ARRAY('Đi du lịch', 'Tránh nạn lụt', 'Đánh cá', 'Vận chuyển hàng hóa'), JSON_ARRAY(1), 'Sáng Thế Ký 6:13-14: Đức Chúa Trời bảo Nô-ê đóng tàu để cứu gia đình và các loài động vật khỏi nạn lụt.'),
('q7', 'Genesis', 12, 'medium', 'multiple_choice_single', 'Áp-ra-ham được Đức Chúa Trời hứa ban cho điều gì?', JSON_ARRAY('Vàng bạc', 'Đất đai', 'Con cái đông như sao trên trời', 'Sự khôn ngoan'), JSON_ARRAY(2), 'Sáng Thế Ký 15:5: "Đức Giê-hô-va dẫn người ra ngoài, mà phán rằng: Ngươi hãy ngước mắt lên trời, đếm các ngôi sao, nếu đếm được. Ngài lại phán: Dòng dõi ngươi cũng sẽ như vậy."'),
('q8', 'Genesis', 22, 'hard', 'multiple_choice_single', 'Áp-ra-ham đã dâng con trai mình là Y-sác lên làm của lễ thiêu ở đâu?', JSON_ARRAY('Núi Mô-ri-a', 'Núi Si-na-i', 'Núi Ô-li-ve', 'Núi Ca-na-an'), JSON_ARRAY(0), 'Sáng Thế Ký 22:2: "Đức Chúa Trời phán: Hãy bắt đứa con một ngươi yêu dấu, là Y-sác, và đi đến xứ Mô-ri-a, nơi đó dâng đứa con làm của lễ thiêu."'),
('q9', 'Genesis', 25, 'medium', 'multiple_choice_single', 'Ê-sau và Gia-cốp là con trai của ai?', JSON_ARRAY('Áp-ra-ham', 'Y-sác', 'Gia-cốp', 'Giô-sép'), JSON_ARRAY(1), 'Sáng Thế Ký 25:19-26: "Đây là dòng dõi của Y-sác, con trai Áp-ra-ham... Rê-bê-ca vợ người thọ thai... Hai đứa con trai đang đánh nhau trong lòng mẹ... Đứa ra trước đỏ hồng, lông cùng mình như một áo tơi lông, đặt tên là Ê-sau. Kế em nó ra, tay nắm lấy gót Ê-sau, nên đặt tên là Gia-cốp."'),
('q10', 'Genesis', 37, 'easy', 'multiple_choice_single', 'Giô-sép có bao nhiêu anh em?', JSON_ARRAY('10', '11', '12', '13'), JSON_ARRAY(1), 'Sáng Thế Ký 37:2: "Đây là dòng dõi của Gia-cốp. Giô-sép, tuổi mười bảy, đi chăn chiên với các anh em mình." Giô-sép có 11 anh em.');
