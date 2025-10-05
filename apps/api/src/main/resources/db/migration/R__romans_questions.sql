-- Repeatable seed: Romans questions (20 diverse questions)

INSERT IGNORE INTO questions (
  id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at
) VALUES

-- Easy (6)
('q-rom2-001','Romans',1,16,17,'easy','multiple_choice_single',
'Phao-lô nói mình không hổ thẹn về điều gì?',
'["Tin Lành", "Luật pháp", "Dân tộc", "Triết học"]',
'[0]',
'Rô-ma 1:16: Tin Lành là quyền phép của Đức Chúa Trời để cứu mọi kẻ tin.',
'["Tân Ước","Tin Lành","Cứu rỗi"]','Romans 1:16-17','vi',true,NOW(),NOW()),

('q-rom2-002','Romans',3,23,24,'easy','multiple_choice_single',
'Theo Rô-ma 3:23, mọi người đều thế nào?',
'["Đã phạm tội, thiếu mất vinh hiển Đức Chúa Trời", "Trong vòng giao ước", "Giữ được luật pháp", "Tự xưng công bình"]',
'[0]',
'Rô-ma 3:23: Mọi người đều đã phạm tội và thiếu mất sự vinh hiển của Đức Chúa Trời.',
'["Tân Ước","Tội lỗi","Công chính hóa"]','Romans 3:23-24','vi',true,NOW(),NOW()),

('q-rom2-003','Romans',5,1,2,'easy','multiple_choice_single',
'Chúng ta được xưng công bình bởi điều gì?',
'["Bởi đức tin", "Bởi việc làm", "Bởi phép báp-têm", "Bởi lễ nghi"]',
'[0]',
'Rô-ma 5:1: Được xưng công bình bởi đức tin, được hòa thuận với Đức Chúa Trời.',
'["Tân Ước","Công chính hóa","Đức tin"]','Romans 5:1-2','vi',true,NOW(),NOW()),

('q-rom2-004','Romans',6,23,23,'easy','multiple_choice_single',
'Tiền công của tội lỗi là gì?',
'["Sự chết", "Bệnh tật", "Nghèo khó", "Lưu đày"]',
'[0]',
'Rô-ma 6:23: Tiền công của tội lỗi là sự chết; nhưng sự ban cho của Đức Chúa Trời là sự sống đời đời.',
'["Tân Ước","Tội lỗi","Sự sống"]','Romans 6:23','vi',true,NOW(),NOW()),

('q-rom2-005','Romans',8,1,2,'easy','multiple_choice_single',
'Cho những ai ở trong Chúa Giê-su Christ thì thế nào?',
'["Không còn bị đoán phạt", "Không còn đau khổ", "Không còn thử thách", "Không còn chết thân thể"]',
'[0]',
'Rô-ma 8:1: Hiện nay chẳng còn có sự đoán phạt nào cho những kẻ ở trong Chúa Giê-su Christ.',
'["Tân Ước","Cứu rỗi","Ân điển"]','Romans 8:1-2','vi',true,NOW(),NOW()),

('q-rom2-006','Romans',12,1,2,'easy','multiple_choice_single',
'Phao-lô kêu gọi dâng thân thể làm gì?',
'["Của lễ sống và thánh", "Của lễ thiêu", "Của lễ cảm tạ", "Của lễ chuộc tội"]',
'[0]',
'Rô-ma 12:1: Dâng thân thể làm của lễ sống và thánh, đẹp lòng Đức Chúa Trời.',
'["Tân Ước","Dâng mình","Thờ phượng"]','Romans 12:1-2','vi',true,NOW(),NOW()),

-- Medium (10)
('q-rom2-007','Romans',1,18,25,'medium','multiple_choice_single',
'Vì sao cơn thạnh nộ Đức Chúa Trời tỏ ra từ trời trên mọi kẻ không tin kính?',
'["Áp chế lẽ thật", "Phá hủy đền thờ", "Khinh dể người nghèo", "Bất trung với đồng bào"]',
'[0]',
'Rô-ma 1:18: Vì họ lấy sự không công bình mà ghìm giữ lẽ thật.',
'["Tân Ước","Cơn thạnh nộ","Lẽ thật"]','Romans 1:18-25','vi',true,NOW(),NOW()),

('q-rom2-008','Romans',4,1,5,'medium','multiple_choice_single',
'Áp-ra-ham được xưng công bình bởi gì theo Rô-ma 4?',
'["Bởi đức tin trước khi chịu cắt bì", "Bởi việc làm luật pháp", "Bởi của dâng", "Bởi phép báp-têm"]',
'[0]',
'Rô-ma 4:3-5: Áp-ra-ham tin Đức Chúa Trời, điều đó kể là công bình cho ông.',
'["Tân Ước","Gương đức tin","Công chính hóa"]','Romans 4:1-5','vi',true,NOW(),NOW()),

('q-rom2-009','Romans',5,12,21,'medium','multiple_choice_single',
'A-đam và Đấng Christ được so sánh để cho thấy điều gì?',
'["Tội lỗi vào bởi một người; sự công chính bởi một người", "Luật pháp tốt hơn ân điển", "Dòng dõi Do Thái trổi hơn", "Hy lễ quan trọng hơn"]',
'[0]',
'Rô-ma 5:18-19: Qua sự vâng phục của một người (Đấng Christ), nhiều người được xưng công bình.',
'["Tân Ước","Đối chiếu","Ân điển"]','Romans 5:12-21','vi',true,NOW(),NOW()),

('q-rom2-010','Romans',7,14,25,'medium','multiple_choice_single',
'Rô-ma 7 mô tả cuộc chiến nào bên trong con người?',
'["Xác thịt với luật của tâm trí", "Tâm linh với ma quỷ", "Người mới với người cũ", "Thần trí với trí tuệ"]',
'[0]',
'Rô-ma 7:22-25: Tôi khoái luật pháp Đức Chúa Trời theo người bề trong, nhưng thấy luật khác trong chi thể.',
'["Tân Ước","Thần học","Xưng công bình"]','Romans 7:14-25','vi',true,NOW(),NOW()),

('q-rom2-011','Romans',8,26,27,'medium','multiple_choice_single',
'Thánh Linh giúp đỡ sự yếu đuối của chúng ta trong cầu nguyện thế nào?',
'["Cầu thay bằng than thở không thể nói ra", "Dạy lời đúng", "Nhắc câu Kinh Thánh", "Sai thiên sứ"]',
'[0]',
'Rô-ma 8:26: Thánh Linh cầu thay cho chúng ta bằng những tiếng than thở không nói ra được.',
'["Tân Ước","Cầu nguyện","Thánh Linh"]','Romans 8:26-27','vi',true,NOW(),NOW()),

('q-rom2-012','Romans',9,10,16,'medium','multiple_choice_single',
'Sự lựa chọn của Đức Chúa Trời (Gie-cốp/Ê-sau) nhấn mạnh điều gì?',
'["Ân điển chủ quyền của Ngài", "Công đức con người", "Dòng dõi theo xác thịt", "Công lao giáo dục"]',
'[0]',
'Rô-ma 9:11-16: Không do việc làm, nhưng bởi Đấng gọi, hầu tỏ rõ ý muốn của Đức Chúa Trời.',
'["Tân Ước","Ân điển","Chủ quyền"]','Romans 9:10-16','vi',true,NOW(),NOW()),

('q-rom2-013','Romans',10,9,13,'medium','multiple_choice_single',
'Điều kiện cứu rỗi theo Rô-ma 10:9-10 là gì?',
'["Xưng miệng tin lòng", "Giữ mọi lễ nghi", "Dâng hiến nhiều", "Hành hương"]',
'[0]',
'Rô-ma 10:9-10: Nếu miệng xưng, lòng tin, thì được cứu.',
'["Tân Ước","Cứu rỗi","Đức tin"]','Romans 10:9-13','vi',true,NOW(),NOW()),

('q-rom2-014','Romans',11,17,24,'medium','multiple_choice_single',
'Hình ảnh ghép cây ô-liu nhằm dạy về điều gì?',
'["Dân ngoại được tháp vào", "Cắt bỏ dân Do Thái", "Cây mới thay cây cũ", "Phải trồng thêm cây"]',
'[0]',
'Rô-ma 11:17-24: Cành dại được tháp vào gốc tốt - dân ngoại được dự phần nhờ đức tin.',
'["Tân Ước","Hình ảnh","Dân ngoại"]','Romans 11:17-24','vi',true,NOW(),NOW()),

('q-rom2-015','Romans',13,1,7,'medium','multiple_choice_single',
'Rô-ma 13 dạy về mối quan hệ với nhà cầm quyền như thế nào?',
'["Vâng phục vì là chức việc của Đức Chúa Trời", "Chống đối khi bất công", "Phớt lờ thuế", "Chỉ vâng phục khi thuận lợi"]',
'[0]',
'Rô-ma 13:1-7: Quyền bính đến từ Đức Chúa Trời; phải nộp thuế và tôn trọng.',
'["Tân Ước","Công dân","Quyền bính"]','Romans 13:1-7','vi',true,NOW(),NOW()),

-- Hard (4)
('q-rom2-016','Romans',8,28,30,'hard','multiple_choice_single',
'Chuỗi vàng cứu rỗi (đã biết trước, đã định trước...) dạy điều gì?',
'["Mục đích đời đời của Đức Chúa Trời trong Đấng Christ", "Con người tự quyết hoàn toàn", "Luật pháp làm nên công bình", "Ân điển dành cho một dân tộc"]',
'[0]',
'Rô-ma 8:29-30: Những kẻ Ngài đã biết trước thì cũng đã định trước... gọi, xưng công bình và làm vinh hiển.',
'["Tân Ước","Định trước","Vinh hiển"]','Romans 8:28-30','vi',true,NOW(),NOW()),

('q-rom2-017','Romans',9,22,24,'hard','multiple_choice_single',
'Các "đồ dùng của cơn thạnh nộ" và "đồ dùng của lòng thương xót" nêu bật điều gì?',
'["Sự nhẫn nại và vinh quang của Đức Chúa Trời", "Công bình của loài người", "Sự khôn ngoan của luật pháp", "Sự mạnh mẽ của dân Do Thái"]',
'[0]',
'Rô-ma 9:22-24: Đức Chúa Trời tỏ bày vinh quang trên đồ dùng của lòng thương xót, bởi Ngài đã sắm sẵn cho vinh hiển.',
'["Tân Ước","Chủ quyền","Vinh quang"]','Romans 9:22-24','vi',true,NOW(),NOW()),

('q-rom2-018','Romans',11,33,36,'hard','multiple_choice_single',
'Tụng ca cuối đoạn 11 nêu bật điều gì về Đức Chúa Trời?',
'["Sự khôn ngoan, thẩm lý và vinh hiển vô cùng", "Sự phán xét nghiêm khắc", "Sự chu cấp vật chất", "Sự hiện diện hữu hình"]',
'[0]',
'Rô-ma 11:33-36: Muôn vật đều là từ Ngài, bởi Ngài và hướng về Ngài; vinh hiển cho Ngài đời đời.',
'["Tân Ước","Tụng ca","Vinh hiển"]','Romans 11:33-36','vi',true,NOW(),NOW()),

('q-rom2-019','Romans',14,1,4,'hard','multiple_choice_single',
'Về kẻ yếu đức tin, Phao-lô dạy điều gì?',
'["Chớ phê phán; Đức Chúa Trời có quyền làm cho đứng vững", "Phải uốn nắn nghiêm", "Hãy tránh giao tiếp", "Hãy gỡ khỏi hội thánh"]',
'[0]',
'Rô-ma 14:1-4: Đừng phê phán kẻ yếu đức tin; mỗi người tự chủ trước Chúa.',
'["Tân Ước","Tình yêu","Tự do Cơ-đốc"]','Romans 14:1-4','vi',true,NOW(),NOW()),

('q-rom2-020','Romans',15,20,21,'hard','multiple_choice_single',
'Châm ngôn truyền giáo của Phao-lô trong Rô-ma 15 là gì?',
'["Rao Tin Lành nơi chưa ai đã rao", "Giữ nền cũ", "Tập trung một nơi", "Dạy môn đồ cũ"]',
'[0]',
'Rô-ma 15:20-21: Không xây trên nền người khác, nhưng đến nơi chưa nghe danh Ngài.',
'["Tân Ước","Truyền giáo","Sứ mạng"]','Romans 15:20-21','vi',true,NOW(),NOW());


