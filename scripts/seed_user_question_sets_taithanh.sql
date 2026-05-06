-- Seed 2 question sets cho user thanhtai18021994@gmail.com (TAI THANH)
-- User ID: 82d6f99c-1b6e-4f0d-b1c2-1bee42b376fb
--
-- Idempotent: dùng deterministic UUIDs với prefix `seed-tt`
-- Chạy lại sẽ INSERT IGNORE (không lỗi nếu đã tồn tại).
--
-- Cách chạy (BẮT BUỘC --default-character-set=utf8mb4 vì client mặc định = latin1):
--   docker exec -i biblequiz-mysql mysql -u biblequiz -ppass --default-character-set=utf8mb4 biblequiz < scripts/seed_user_question_sets_taithanh.sql
--
-- Cách rollback (xoá hết seed này):
--   DELETE FROM question_set_items WHERE id LIKE 'seed-tt-i%';
--   DELETE FROM question_sets      WHERE id LIKE 'seed-tt-s%';
--   DELETE FROM user_questions     WHERE id LIKE 'seed-tt-q%';

-- Force connection charset → utf8mb4 (DB schema utf8mb4, client default latin1)
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

SET @uid := '82d6f99c-1b6e-4f0d-b1c2-1bee42b376fb';
SET @set1 := 'seed-tt-s1-genesis-1-11---------------';
SET @set2 := 'seed-tt-s2-jesus-life-----------------';

-- Trim about UUID length (36 max)
SET @set1 := SUBSTRING(@set1, 1, 36);
SET @set2 := SUBSTRING(@set2, 1, 36);

-- ── Bộ 1: Khởi đầu cùng Sáng Thế Ký (10 câu EASY/MEDIUM) ─────────────

INSERT IGNORE INTO question_sets (id, name, description, user_id, visibility, question_count, created_at, updated_at) VALUES
(@set1,
 'Khởi đầu cùng Sáng Thế Ký',
 'Bộ 10 câu hỏi mở đầu về sự sáng tạo, Adam-Eva, Nô-ê và Tháp Ba-bên (Sáng Thế Ký 1–11).',
 @uid, 'PRIVATE', 10, NOW(), NOW());

INSERT IGNORE INTO user_questions (id, user_id, content, options, correct_answer, difficulty, book, chapter_start, chapter_end, verse_start, verse_end, theme, source, language, explanation) VALUES
('seed-tt-q1-01', @uid,
 'Trong ngày thứ mấy Đức Chúa Trời tạo nên mặt trời, mặt trăng và các ngôi sao?',
 JSON_ARRAY('Ngày thứ hai','Ngày thứ ba','Ngày thứ tư','Ngày thứ năm'),
 2, 'EASY', 'Genesis', 1, 1, 14, 19, 'Sáng tạo', 'MANUAL', 'vi',
 'Sáng Thế Ký 1:14-19 — Ngày thứ tư Đức Chúa Trời dựng nên các vì sáng để phân chia ngày và đêm.'),

('seed-tt-q1-02', @uid,
 'Đức Chúa Trời đã tạo ra loài người vào ngày thứ mấy?',
 JSON_ARRAY('Ngày thứ tư','Ngày thứ năm','Ngày thứ sáu','Ngày thứ bảy'),
 2, 'EASY', 'Genesis', 1, 1, 26, 31, 'Sáng tạo', 'MANUAL', 'vi',
 'Sáng Thế Ký 1:26-31 — Đức Chúa Trời tạo nên loài người theo hình ảnh Ngài vào ngày thứ sáu.'),

('seed-tt-q1-03', @uid,
 'Vườn Ê-đen có mấy con sông chảy ra từ vườn?',
 JSON_ARRAY('2','3','4','5'),
 2, 'MEDIUM', 'Genesis', 2, 2, 10, 14, 'Vườn Ê-đen', 'MANUAL', 'vi',
 'Sáng Thế Ký 2:10-14 — Có một con sông từ Ê-đen chảy ra rồi chia làm 4 ngả: Bi-sôn, Ghi-hôn, Hi-đê-ke, Ơ-phơ-rát.'),

('seed-tt-q1-04', @uid,
 'Đức Chúa Trời đã làm Ê-va từ bộ phận nào của A-đam?',
 JSON_ARRAY('Đất sét','Xương sườn','Hơi thở','Bụi đất'),
 1, 'EASY', 'Genesis', 2, 2, 21, 22, 'Adam-Eva', 'MANUAL', 'vi',
 'Sáng Thế Ký 2:21-22 — Đức Chúa Trời đã lấy một xương sườn của A-đam để dựng nên người nữ.'),

('seed-tt-q1-05', @uid,
 'Trái cấm trong vườn Ê-đen thuộc cây nào?',
 JSON_ARRAY('Cây sự sống','Cây nho','Cây ô-liu','Cây biết điều thiện và điều ác'),
 3, 'EASY', 'Genesis', 2, 2, 17, 17, 'Sa ngã', 'MANUAL', 'vi',
 'Sáng Thế Ký 2:17 — Đức Chúa Trời cấm A-đam ăn trái của cây biết điều thiện và điều ác.'),

('seed-tt-q1-06', @uid,
 'Ai là người đầu tiên giết em mình trong Kinh Thánh?',
 JSON_ARRAY('A-đam','Ca-in','A-bên','Sết'),
 1, 'EASY', 'Genesis', 4, 4, 8, 8, 'Cain-Abel', 'MANUAL', 'vi',
 'Sáng Thế Ký 4:8 — Ca-in giết em mình là A-bên vì ghen tỵ khi của lễ A-bên được Đức Chúa Trời nhậm.'),

('seed-tt-q1-07', @uid,
 'Nô-ê đã đóng tàu trong bao nhiêu ngày trận lụt mưa xuống đất?',
 JSON_ARRAY('7 ngày','40 ngày','100 ngày','150 ngày'),
 1, 'MEDIUM', 'Genesis', 7, 7, 12, 12, 'Đại hồng thuỷ', 'MANUAL', 'vi',
 'Sáng Thế Ký 7:12 — Mưa rơi xuống đất 40 ngày 40 đêm. (Nước dâng cao cả thảy 150 ngày — Sáng 7:24).'),

('seed-tt-q1-08', @uid,
 'Sau cơn nước lụt, dấu hiệu nào Đức Chúa Trời đặt làm giao ước với Nô-ê?',
 JSON_ARRAY('Mưa nhẹ','Cầu vồng','Chim bồ câu','Cây ô-liu'),
 1, 'EASY', 'Genesis', 9, 9, 12, 16, 'Giao ước Nô-ê', 'MANUAL', 'vi',
 'Sáng Thế Ký 9:12-16 — Đức Chúa Trời đặt cầu vồng trên mây làm dấu chỉ giao ước với muôn loài.'),

('seed-tt-q1-09', @uid,
 'Tháp Ba-bên được xây ở vùng đất nào?',
 JSON_ARRAY('Ê-đen','U-rơ','Si-nê-a','Ca-na-an'),
 2, 'MEDIUM', 'Genesis', 11, 11, 1, 9, 'Tháp Ba-bên', 'MANUAL', 'vi',
 'Sáng Thế Ký 11:1-9 — Loài người tụ tập tại đồng bằng Si-nê-a và xây tháp Ba-bên trước khi Chúa làm lộn xộn tiếng nói.'),

('seed-tt-q1-10', @uid,
 'Ai là tổ phụ thứ 10 từ A-đam đến Nô-ê?',
 JSON_ARRAY('Hê-nóc','Mê-tu-sê-la','Lê-méc','Nô-ê'),
 3, 'HARD', 'Genesis', 5, 5, 1, 32, 'Phả hệ', 'MANUAL', 'vi',
 'Sáng Thế Ký 5 — Phả hệ liệt kê: A-đam (1), Sết (2), Ê-nót (3), Kê-nan (4), Ma-ha-la-le (5), Giê-rệt (6), Hê-nóc (7), Mê-tu-sê-la (8), Lê-méc (9), Nô-ê (10).');

INSERT IGNORE INTO question_set_items (id, set_id, question_id, order_index) VALUES
('seed-tt-i1-01', @set1, 'seed-tt-q1-01', 0),
('seed-tt-i1-02', @set1, 'seed-tt-q1-02', 1),
('seed-tt-i1-03', @set1, 'seed-tt-q1-03', 2),
('seed-tt-i1-04', @set1, 'seed-tt-q1-04', 3),
('seed-tt-i1-05', @set1, 'seed-tt-q1-05', 4),
('seed-tt-i1-06', @set1, 'seed-tt-q1-06', 5),
('seed-tt-i1-07', @set1, 'seed-tt-q1-07', 6),
('seed-tt-i1-08', @set1, 'seed-tt-q1-08', 7),
('seed-tt-i1-09', @set1, 'seed-tt-q1-09', 8),
('seed-tt-i1-10', @set1, 'seed-tt-q1-10', 9);

-- ── Bộ 2: Cuộc đời và sứ vụ Chúa Giê-xu (10 câu MEDIUM/HARD) ────────

INSERT IGNORE INTO question_sets (id, name, description, user_id, visibility, question_count, created_at, updated_at) VALUES
(@set2,
 'Cuộc đời và sứ vụ Chúa Giê-xu',
 'Bộ 10 câu hỏi tổng hợp những sự kiện chính trong 4 sách Tin Lành: từ giáng sinh, báp-têm, các phép lạ đến thập tự giá và phục sinh.',
 @uid, 'PRIVATE', 10, NOW(), NOW());

INSERT IGNORE INTO user_questions (id, user_id, content, options, correct_answer, difficulty, book, chapter_start, chapter_end, verse_start, verse_end, theme, source, language, explanation) VALUES
('seed-tt-q2-01', @uid,
 'Chúa Giê-xu được sinh ra tại thành nào?',
 JSON_ARRAY('Na-xa-rét','Bết-lê-hem','Giê-ru-sa-lem','Ca-bê-na-um'),
 1, 'EASY', 'Matthew', 2, 2, 1, 1, 'Giáng sinh', 'MANUAL', 'vi',
 'Ma-thi-ơ 2:1 — "Đức Chúa Giê-xu đã sinh tại thành Bết-lê-hem, xứ Giu-đê, đang đời vua Hê-rốt."'),

('seed-tt-q2-02', @uid,
 'Ai đã làm phép báp-têm cho Chúa Giê-xu tại sông Giô-đanh?',
 JSON_ARRAY('Si-môn Phi-e-rơ','Giăng Báp-tít','Phao-lô','An-rê'),
 1, 'EASY', 'Matthew', 3, 3, 13, 17, 'Báp-têm', 'MANUAL', 'vi',
 'Ma-thi-ơ 3:13-17 — Chúa Giê-xu đến cùng Giăng Báp-tít tại sông Giô-đanh để chịu báp-têm.'),

('seed-tt-q2-03', @uid,
 'Chúa Giê-xu kiêng ăn bao nhiêu ngày trong đồng vắng trước khi bị ma quỷ cám dỗ?',
 JSON_ARRAY('7 ngày','12 ngày','40 ngày','70 ngày'),
 2, 'EASY', 'Matthew', 4, 4, 1, 2, 'Cám dỗ', 'MANUAL', 'vi',
 'Ma-thi-ơ 4:1-2 — Chúa Giê-xu kiêng ăn 40 ngày 40 đêm trong đồng vắng.'),

('seed-tt-q2-04', @uid,
 'Phép lạ đầu tiên Chúa Giê-xu làm tại Ca-na xứ Ga-li-lê là gì?',
 JSON_ARRAY('Chữa người mù','Hoá nước thành rượu','Đi trên mặt biển','Hoá bánh ra nhiều'),
 1, 'MEDIUM', 'John', 2, 2, 1, 11, 'Phép lạ', 'MANUAL', 'vi',
 'Giăng 2:1-11 — Tại tiệc cưới Ca-na, Chúa Giê-xu hoá nước thành rượu — đó là phép lạ đầu tiên Ngài làm.'),

('seed-tt-q2-05', @uid,
 'Bao nhiêu môn đồ được Chúa Giê-xu chọn lựa và lập làm sứ đồ?',
 JSON_ARRAY('7','10','12','70'),
 2, 'EASY', 'Mark', 3, 3, 13, 19, 'Môn đồ', 'MANUAL', 'vi',
 'Mác 3:13-19 — Chúa Giê-xu lập 12 sứ đồ. (Lưu ý: 70 môn đồ được Ngài sai đi trong Lu-ca 10:1.)'),

('seed-tt-q2-06', @uid,
 'Trong phép lạ hoá bánh nuôi 5.000 người, Chúa Giê-xu khởi đầu với bao nhiêu ổ bánh và mấy con cá?',
 JSON_ARRAY('3 bánh, 1 cá','5 bánh, 2 cá','7 bánh, 3 cá','12 bánh, 5 cá'),
 1, 'MEDIUM', 'John', 6, 6, 9, 11, 'Phép lạ', 'MANUAL', 'vi',
 'Giăng 6:9-11 — Có 5 ổ bánh lúa mạch và 2 con cá nhỏ; Chúa Giê-xu hoá ra đủ cho hơn 5.000 người ăn no.'),

('seed-tt-q2-07', @uid,
 'Chúa Giê-xu đã sống lại cho người nào trong các nhân vật sau đây?',
 JSON_ARRAY('Phi-e-rơ','Ni-cô-đem','La-xa-rơ','Giô-sép thành A-ri-ma-thê'),
 2, 'MEDIUM', 'John', 11, 11, 38, 44, 'Phục sinh người chết', 'MANUAL', 'vi',
 'Giăng 11:38-44 — Chúa Giê-xu kêu lớn tiếng: "Hỡi La-xa-rơ, hãy ra!" và La-xa-rơ đã sống lại sau 4 ngày trong mồ.'),

('seed-tt-q2-08', @uid,
 'Trong bữa Tiệc Thánh cuối cùng, Chúa Giê-xu báo trước ai sẽ phản Ngài?',
 JSON_ARRAY('Phi-e-rơ','Giăng','Giu-đa Ích-ca-ri-ốt','Thô-ma'),
 2, 'EASY', 'Matthew', 26, 26, 20, 25, 'Tiệc Thánh', 'MANUAL', 'vi',
 'Ma-thi-ơ 26:20-25 — Chúa Giê-xu chỉ rõ Giu-đa Ích-ca-ri-ốt là người sẽ phản Ngài.'),

('seed-tt-q2-09', @uid,
 'Chúa Giê-xu bị đóng đinh tại đồi nào?',
 JSON_ARRAY('Si-na-i','Sô-rếch','Gô-gô-tha (Đồi Sọ)','Ô-li-ve'),
 2, 'MEDIUM', 'John', 19, 19, 17, 18, 'Thập tự giá', 'MANUAL', 'vi',
 'Giăng 19:17-18 — "Họ đem Ngài đến nơi gọi là Đồi Sọ, theo tiếng Hê-bơ-rơ là Gô-gô-tha."'),

('seed-tt-q2-10', @uid,
 'Vào ngày thứ ba sau khi chôn, ai là người ĐẦU TIÊN gặp Chúa Giê-xu phục sinh theo sách Giăng?',
 JSON_ARRAY('Phi-e-rơ','Giăng','Ma-ri Ma-đơ-len','Cleo-pa'),
 2, 'HARD', 'John', 20, 20, 11, 18, 'Phục sinh', 'MANUAL', 'vi',
 'Giăng 20:11-18 — Sau khi Phi-e-rơ và Giăng rời mộ, Ma-ri Ma-đơ-len ở lại khóc và là người đầu tiên gặp Chúa Giê-xu phục sinh.');

INSERT IGNORE INTO question_set_items (id, set_id, question_id, order_index) VALUES
('seed-tt-i2-01', @set2, 'seed-tt-q2-01', 0),
('seed-tt-i2-02', @set2, 'seed-tt-q2-02', 1),
('seed-tt-i2-03', @set2, 'seed-tt-q2-03', 2),
('seed-tt-i2-04', @set2, 'seed-tt-q2-04', 3),
('seed-tt-i2-05', @set2, 'seed-tt-q2-05', 4),
('seed-tt-i2-06', @set2, 'seed-tt-q2-06', 5),
('seed-tt-i2-07', @set2, 'seed-tt-q2-07', 6),
('seed-tt-i2-08', @set2, 'seed-tt-q2-08', 7),
('seed-tt-i2-09', @set2, 'seed-tt-q2-09', 8),
('seed-tt-i2-10', @set2, 'seed-tt-q2-10', 9);

-- ── Sanity check ────────────────────────────────────────────────────
SELECT s.id, s.name, s.question_count, COUNT(i.id) AS actual_items
FROM question_sets s
LEFT JOIN question_set_items i ON i.set_id = s.id
WHERE s.user_id = @uid AND s.id LIKE 'seed-tt-%'
GROUP BY s.id, s.name, s.question_count;
