-- Repeatable migration: Old Testament questions (Genesis - Deuteronomy + Historical books)
-- Smart questions: context, connections, understanding, not just memorization

-- ==================== GENESIS ====================
INSERT IGNORE INTO questions (id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at) VALUES

-- Genesis: Creation & Fall
('q-gen-001', 'Genesis', 1, 1, 2, 'easy', 'multiple_choice_single',
'Dieu dau tien Duc Chua Troi tao dung la gi?',
'["Troi va dat", "Su sang", "Nuoc", "Con nguoi"]',
'[0]',
'Sang 1:1 - Ban dau Duc Chua Troi dung nen troi dat. Day la hanh dong sang tao dau tien duoc ghi lai.',
'["Cuu Uoc","Sang tao"]', 'Genesis 1:1', 'vi', true, NOW(), NOW()),

('q-gen-002', 'Genesis', 1, 26, 27, 'easy', 'multiple_choice_single',
'Con nguoi duoc tao dung theo hinh anh cua ai?',
'["Duc Chua Troi", "Thien su", "Thien nhien", "Cac than"]',
'[0]',
'Sang 1:27 - Duc Chua Troi dung nen loai nguoi theo hinh anh Ngai.',
'["Cuu Uoc","Sang tao","Con nguoi"]', 'Genesis 1:26-27', 'vi', true, NOW(), NOW()),

('q-gen-003', 'Genesis', 2, 7, 7, 'medium', 'multiple_choice_single',
'Duc Chua Troi dung gi de nang con nguoi dau tien?',
'["Bui dat", "Nuoc", "Lua", "Dat set"]',
'[0]',
'Sang 2:7 - Chua lay bui dat nang nen loai nguoi, ha sinh khi vao lo mui thi nguoi tro nen loai sanh linh.',
'["Cuu Uoc","Sang tao","A-dam"]', 'Genesis 2:7', 'vi', true, NOW(), NOW()),

('q-gen-004', 'Genesis', 2, 18, 22, 'easy', 'multiple_choice_single',
'E-va duoc tao dung tu bo phan nao cua A-dam?',
'["Xuong suon", "Bui dat", "Mau", "Tay"]',
'[0]',
'Sang 2:21-22 - Chua lay mot xuong suon cua A-dam va tao dung nen nguoi nu.',
'["Cuu Uoc","Sang tao","E-va"]', 'Genesis 2:18-22', 'vi', true, NOW(), NOW()),

('q-gen-005', 'Genesis', 3, 1, 6, 'easy', 'multiple_choice_single',
'Con vat nao da cam do E-va an trai cam?',
'["Con ran", "Con soi", "Con chim", "Con su tu"]',
'[0]',
'Sang 3:1 - Con ran la loai quyen ru nhat trong cac loai vat, no da cam do E-va.',
'["Cuu Uoc","Sa nga","E-va"]', 'Genesis 3:1-6', 'vi', true, NOW(), NOW()),

('q-gen-006', 'Genesis', 3, 15, 15, 'hard', 'multiple_choice_single',
'Sang 3:15 duoc goi la "Phuc Am dau tien" (Proto-evangelium) vi ly do gi?',
'["La loi tien tri dau tien ve Dang Cuu The", "La phuc am duoc viet dau tien", "La loi hua dau tien cho A-dam", "La giao uoc dau tien cua Chua"]',
'[0]',
'Dong doi nguoi nu se giam dap dau con ran - day la loi tien tri dau tien ve Chua Gie-su se chien thang Sa-tan.',
'["Cuu Uoc","Tien tri","Cuu The"]', 'Genesis 3:15', 'vi', true, NOW(), NOW()),

('q-gen-007', 'Genesis', 3, 7, 7, 'medium', 'fill_in_blank',
'Sau khi an trai cam, A-dam va E-va nhan ra dieu gi? (Tra loi bang 2 tu)',
'[]', '[]',
'Ho nhan ra minh tran truong va lay la cay vat che than.',
'["Cuu Uoc","Sa nga"]', 'Genesis 3:7', 'vi', true, NOW(), NOW()),

-- Genesis: Cain & Abel
('q-gen-008', 'Genesis', 4, 1, 8, 'easy', 'multiple_choice_single',
'Ai la nguoi dau tien bi giet trong Kinh Thanh?',
'["A-ben", "Ca-in", "A-dam", "Set"]',
'[0]',
'Sang 4:8 - Ca-in giet A-ben, em trai minh, vi ganh ty voi cua le cua A-ben duoc Chua chap nhan.',
'["Cuu Uoc","Ca-in va A-ben"]', 'Genesis 4:1-8', 'vi', true, NOW(), NOW()),

('q-gen-009', 'Genesis', 4, 3, 5, 'medium', 'multiple_choice_single',
'Tai sao Chua chap nhan cua le cua A-ben ma khong chap nhan cua Ca-in?',
'["A-ben dang cua le bang duc tin va tam long thanh", "Cua le A-ben dat gia hon", "Ca-in dang tre qua", "A-ben la con dau long"]',
'[0]',
'He-bo-ro 11:4 giai thich rang A-ben dang cua le tot hon boi duc tin. Van de nam o tam long, khong phai gia tri vat chat.',
'["Cuu Uoc","Duc tin","Cua le"]', 'Genesis 4:3-5', 'vi', true, NOW(), NOW()),

-- Genesis: Noah
('q-gen-010', 'Genesis', 6, 9, 9, 'easy', 'multiple_choice_single',
'Kinh Thanh mo ta No-e la nguoi nhu the nao?',
'["Cong binh va tron ven", "Khon ngoan nhat", "Manh me nhat", "Giau co nhat"]',
'[0]',
'Sang 6:9 - No-e la nguoi cong binh, tron ven giua nguoi dong thoi va dong di voi Duc Chua Troi.',
'["Cuu Uoc","No-e","Cong binh"]', 'Genesis 6:9', 'vi', true, NOW(), NOW()),

('q-gen-011', 'Genesis', 7, 2, 3, 'medium', 'multiple_choice_single',
'Ngoai 2 cap thu vat thong thuong, No-e mang bao nhieu cap thu vat thanh sach len tau?',
'["7 cap", "3 cap", "5 cap", "1 cap"]',
'[0]',
'Sang 7:2 - Thu vat thanh sach duoc mang 7 cap (14 con), con thu vat khong thanh sach chi mang 1 cap.',
'["Cuu Uoc","No-e","Tau No-e"]', 'Genesis 7:2-3', 'vi', true, NOW(), NOW()),

('q-gen-012', 'Genesis', 9, 12, 13, 'easy', 'multiple_choice_single',
'Sau con nuoc lu, Chua dat dau hieu gi lam giao uoc voi No-e?',
'["Cau vong", "Ngoi sao", "Cay o-liu", "Dam may"]',
'[0]',
'Sang 9:13 - Cua vong tren troi la dau hieu giao uoc rang Chua se khong huy diet dat bang nuoc lu nua.',
'["Cuu Uoc","No-e","Giao uoc"]', 'Genesis 9:12-13', 'vi', true, NOW(), NOW()),

-- Genesis: Abraham
('q-gen-013', 'Genesis', 12, 1, 3, 'easy', 'multiple_choice_single',
'Duc Chua Troi goi Ap-ram roi khoi dau de di den dau?',
'["Mot xu ma Chua se chi cho", "Ai-cap", "Ba-by-lon", "Giu-de"]',
'[0]',
'Sang 12:1 - Chua goi Ap-ram roi khoi que huong va ba con den xu ma Ngai se chi cho.',
'["Cuu Uoc","Ap-ra-ham","Su keu goi"]', 'Genesis 12:1-3', 'vi', true, NOW(), NOW()),

('q-gen-014', 'Genesis', 15, 5, 6, 'medium', 'multiple_choice_single',
'Khi Chua hua voi Ap-ram rang dong doi ong se nhu sao tren troi, Ap-ram phan ung the nao?',
'["Tin Chua va duoc ke la cong binh", "Cuoi vi khong tin", "Xin mot dau hieu", "Im lang khong noi gi"]',
'[0]',
'Sang 15:6 - Ap-ram tin Duc Gie-ho-va, thi Ngai ke su do la cong binh cho nguoi. Day la nen tang cua su xung cong binh boi duc tin.',
'["Cuu Uoc","Duc tin","Cong binh"]', 'Genesis 15:5-6', 'vi', true, NOW(), NOW()),

('q-gen-015', 'Genesis', 22, 1, 14, 'hard', 'multiple_choice_single',
'Trong su kien Ap-ra-ham dang Y-sac, con chien duoc Chua chuan bi de thay the la hinh bong cua dieu gi?',
'["Chua Gie-su chiu chet thay cho nhan loai", "Le Vuot Qua", "He thong te le Le-vi", "Su phuc sinh"]',
'[0]',
'Con chien mac trong bui gai thay Y-sac la hinh bong cua Chua Gie-su - Chien Con cua Duc Chua Troi chiu chet thay cho chung ta (Giang 1:29).',
'["Cuu Uoc","Hinh bong","Cuu chuoc"]', 'Genesis 22:1-14', 'vi', true, NOW(), NOW()),

('q-gen-016', 'Genesis', 22, 14, 14, 'medium', 'fill_in_blank',
'Ap-ra-ham dat ten cho dia diem dang Y-sac la gi? (Gie-ho-va ___)',
'[]', '[]',
'Sang 22:14 - Gie-ho-va Di-re, nghia la Duc Gie-ho-va se lo lieu, se san bi.',
'["Cuu Uoc","Danh Chua","Ap-ra-ham"]', 'Genesis 22:14', 'vi', true, NOW(), NOW()),

-- Genesis: Jacob & Joseph
('q-gen-017', 'Genesis', 25, 29, 34, 'easy', 'multiple_choice_single',
'E-sau da doi quyen truong tu de lay gi tu Gia-cop?',
'["Mot to canh", "Mot mien dat", "Vang bac", "Mot bay gia suc"]',
'[0]',
'Sang 25:34 - E-sau doi quyen truong tu lay to canh dau do. Ong khinh quyen truong tu cua minh.',
'["Cuu Uoc","Gia-cop","E-sau"]', 'Genesis 25:29-34', 'vi', true, NOW(), NOW()),

('q-gen-018', 'Genesis', 28, 12, 12, 'easy', 'multiple_choice_single',
'Gia-cop nam mo thay gi tai Be-ten?',
'["Cai thang bat tu dat len den troi", "Dam chay lon", "Bien lon", "Thanh pho vang"]',
'[0]',
'Sang 28:12 - Gia-cop mo thay cai thang bat tu mat dat cho den troi, cac thien su len xuong tren thang.',
'["Cuu Uoc","Gia-cop","Giac mo"]', 'Genesis 28:12', 'vi', true, NOW(), NOW()),

('q-gen-019', 'Genesis', 37, 3, 4, 'easy', 'multiple_choice_single',
'Gia-cop tang cho Gio-sep mon qua dac biet nao khien anh em ganh ty?',
'["Ao choang nhieu mau", "Nhan vang", "Dat dai", "Bay chien"]',
'[0]',
'Sang 37:3 - Gia-cop tang cho Gio-sep chiec ao dai co nhieu mau vi yeu Gio-sep hon cac con khac.',
'["Cuu Uoc","Gio-sep"]', 'Genesis 37:3-4', 'vi', true, NOW(), NOW()),

('q-gen-020', 'Genesis', 45, 4, 8, 'hard', 'multiple_choice_single',
'Khi gap lai anh em tai Ai-cap, Gio-sep noi rang ai da sai ong den day?',
'["Duc Chua Troi, khong phai anh em", "Pha-ra-on", "Su menh cua ong", "Giac mo cua ong"]',
'[0]',
'Sang 45:8 - Gio-sep nhin nhan chu quyen cua Chua: "Khong phai cac anh sai toi den day dau, ay la Duc Chua Troi." Day la su tha thu vi hieu ke hoach cua Chua.',
'["Cuu Uoc","Gio-sep","Chu quyen Chua"]', 'Genesis 45:4-8', 'vi', true, NOW(), NOW()),

('q-gen-021', 'Genesis', 50, 20, 20, 'medium', 'fill_in_blank',
'Gio-sep noi voi anh em: "Cac anh tinh hai toi, nhung Duc Chua Troi lai tinh cho thanh ___"',
'[]', '[]',
'Sang 50:20 - Cac anh tinh hai toi, nhung Duc Chua Troi lai tinh cho thanh lanh, hau giu su song cho nhieu nguoi.',
'["Cuu Uoc","Gio-sep","Chu quyen"]', 'Genesis 50:20', 'vi', true, NOW(), NOW()),

-- ==================== EXODUS ====================

('q-exo-001', 'Exodus', 1, 8, 14, 'easy', 'multiple_choice_single',
'Tai sao Pha-ra-on bat dau ap buc dan Y-so-ra-en tai Ai-cap?',
'["Vi dan Y-so-ra-en dong va manh qua", "Vi ho khong chiu dong thue", "Vi ho tho than khac", "Vi Gio-sep da chet"]',
'[0]',
'Xuat 1:9-10 - Pha-ra-on moi so rang dan Y-so-ra-en qua dong se lien ket voi ke thu chong lai Ai-cap.',
'["Cuu Uoc","Xuat hanh","Ai-cap"]', 'Exodus 1:8-14', 'vi', true, NOW(), NOW()),

('q-exo-002', 'Exodus', 3, 2, 4, 'easy', 'multiple_choice_single',
'Chua hien ra voi Moi-se lan dau qua hinh anh gi?',
'["Bui gai chay ma khong tan", "Dam may lon", "Thien su", "Cot lua"]',
'[0]',
'Xuat 3:2 - Thien su cua Duc Gie-ho-va hien ra trong ngon lua giua bui gai, bui chay ma khong he tan.',
'["Cuu Uoc","Moi-se","Su keu goi"]', 'Exodus 3:2-4', 'vi', true, NOW(), NOW()),

('q-exo-003', 'Exodus', 3, 14, 14, 'hard', 'multiple_choice_single',
'Khi Moi-se hoi ten Chua, Ngai tra loi la gi?',
'["TA LA DANG TU HUU (I AM WHO I AM)", "TA LA CHUA CUA AP-RA-HAM", "TA LA DANG TOAN NANG", "TA LA DANG SANG TAO"]',
'[0]',
'Xuat 3:14 - Duc Chua Troi tu xung la "TA LA DANG TU HUU" (Ehyeh Asher Ehyeh) - bay to ban chat tu huu, vinh cuu cua Ngai.',
'["Cuu Uoc","Danh Chua","Than hoc"]', 'Exodus 3:14', 'vi', true, NOW(), NOW()),

('q-exo-004', 'Exodus', 7, 1, 12, 'medium', 'multiple_choice_single',
'Trong 10 tai va, tai va dau tien la gi?',
'["Nuoc bien thanh huyet", "Ech nhai", "Muoi", "Bong toi"]',
'[0]',
'Xuat 7:20 - Tai va dau tien la nuoc song Ni-lo bien thanh huyet (mau).',
'["Cuu Uoc","10 tai va","Ai-cap"]', 'Exodus 7:14-25', 'vi', true, NOW(), NOW()),

('q-exo-005', 'Exodus', 12, 3, 7, 'medium', 'multiple_choice_single',
'Trong Le Vuot Qua, tai sao phai boi huyet chien con len khung cua?',
'["De thien su huy diet vuot qua nha do", "De danh dau la nguoi Y-so-ra-en", "De lam le te", "De xua duoi ta linh"]',
'[0]',
'Xuat 12:13 - Huyet tren khung cua la dau hieu de thien su huy diet vuot qua. Hinh bong cua huyet Chua Gie-su bao ve chung ta.',
'["Cuu Uoc","Le Vuot Qua","Hinh bong"]', 'Exodus 12:3-13', 'vi', true, NOW(), NOW()),

('q-exo-006', 'Exodus', 12, 13, 13, 'hard', 'multiple_choice_single',
'Le Vuot Qua trong Xuat Ai-cap la hinh bong cua su kien nao trong Tan Uoc?',
'["Su chet chuoc toi cua Chua Gie-su", "Le Bap-tem", "Le Ngu Tuan", "Su tai lam cua Chua"]',
'[0]',
'1 Co-rinh-to 5:7 - Chua Gie-su la Chien Con Le Vuot Qua cua chung ta. Huyet Ngai bao ve chung ta khoi su phan xet.',
'["Cuu Uoc","Hinh bong","Cuu chuoc"]', 'Exodus 12:1-13', 'vi', true, NOW(), NOW()),

('q-exo-007', 'Exodus', 14, 21, 22, 'easy', 'multiple_choice_single',
'Chua re Bien Do bang phuong tien gi?',
'["Gio dong manh", "Gay cua Moi-se", "Dong dat", "Suc manh sieu nhien truc tiep"]',
'[0]',
'Xuat 14:21 - Moi-se giang tay tren bien, Duc Gie-ho-va dung gio dong manh thoi ca dem lam bien re ra.',
'["Cuu Uoc","Phep la","Bien Do"]', 'Exodus 14:21-22', 'vi', true, NOW(), NOW()),

('q-exo-008', 'Exodus', 20, 1, 17, 'easy', 'multiple_choice_single',
'Dieu ran dau tien trong Muoi Dieu Ran la gi?',
'["Tru ta khong duoc co than nao khac", "Khong duoc lam tuong cham", "Nho ngay Sa-bat", "Hieu kinh cha me"]',
'[0]',
'Xuat 20:3 - Tru ta ra, nguoi khong duoc co than nao khac. Day la dieu ran co ban nhat.',
'["Cuu Uoc","Muoi Dieu Ran","Luat phap"]', 'Exodus 20:1-17', 'vi', true, NOW(), NOW()),

('q-exo-009', 'Exodus', 20, 8, 11, 'medium', 'fill_in_blank',
'Dieu ran thu may noi ve viec giu ngay Sa-bat? (Tra loi bang so)',
'[]', '[]',
'Xuat 20:8 - Dieu ran thu 4: Hay nho ngay nghi, de lam nen ngay thanh.',
'["Cuu Uoc","Muoi Dieu Ran","Sa-bat"]', 'Exodus 20:8-11', 'vi', true, NOW(), NOW()),

('q-exo-010', 'Exodus', 16, 14, 15, 'easy', 'multiple_choice_single',
'Thuc an gi tu troi roi xuong nuoi dan Y-so-ra-en trong dong vang?',
'["Ma-na", "Banh mi", "Trai cay", "Thit"]',
'[0]',
'Xuat 16:15 - Ma-na la banh tu troi, moi sang xuat hien nhu suong tren mat dat. Hinh bong cua Chua Gie-su - Banh Su Song.',
'["Cuu Uoc","Dong vang","Ma-na"]', 'Exodus 16:14-15', 'vi', true, NOW(), NOW()),

-- ==================== LEVITICUS ====================

('q-lev-001', 'Leviticus', 17, 11, 11, 'medium', 'multiple_choice_single',
'Theo Le-vi 17:11, tai sao huyet quan trong trong he thong te le?',
'["Vi su song cua xac thit o trong huyet, dung de chuoc toi", "Vi huyet la thanh khiet", "Vi Chua yeu cau", "Vi truyen thong"]',
'[0]',
'Le-vi 17:11 - Su song cua xac thit o trong huyet. Ta cho cac nguoi huyet rua tren ban tho de lam le chuoc toi.',
'["Cuu Uoc","Te le","Chuoc toi"]', 'Leviticus 17:11', 'vi', true, NOW(), NOW()),

('q-lev-002', 'Leviticus', 19, 18, 18, 'easy', 'multiple_choice_single',
'Le-vi 19:18 day dieu ran quan trong nao ma Chua Gie-su sau nay nhac lai?',
'["Hay yeu thuong ke lan can nhu chinh minh", "Hay thanh khiet", "Hay giu ngay Sa-bat", "Hay dang cua le"]',
'[0]',
'Le-vi 19:18 - Hay yeu thuong ke lan can nhu chinh minh. Chua Gie-su goi day la dieu ran thu hai lon nhat (Mat 22:39).',
'["Cuu Uoc","Luat phap","Yeu thuong"]', 'Leviticus 19:18', 'vi', true, NOW(), NOW()),

('q-lev-003', 'Leviticus', 16, 8, 10, 'hard', 'multiple_choice_single',
'Trong Ngay Le Chuoc Toi, hai con de duoc dung lam gi?',
'["Mot con lam cua le, mot con mang toi loi vao dong vang", "Ca hai deu bi giet", "Mot con de dang, mot con tha tu do", "Ca hai mang toi loi dan"]',
'[0]',
'Le-vi 16:8-10 - Mot con de dang cho Chua lam te le, mot con (de that-sa-xe) mang toi loi dan duoc tha vao dong vang. Hinh bong cua Chua Gie-su ganh toi chung ta.',
'["Cuu Uoc","Le Chuoc Toi","Hinh bong"]', 'Leviticus 16:8-10', 'vi', true, NOW(), NOW()),

-- ==================== NUMBERS ====================

('q-num-001', 'Numbers', 13, 30, 33, 'medium', 'multiple_choice_single',
'Trong 12 tham tu, chi co 2 nguoi tin Chua co the cho ho chiem dat hua. Do la ai?',
'["Ca-lep va Gio-sue", "Moi-se va A-ron", "Ca-lep va Moi-se", "Gio-sue va A-ron"]',
'[0]',
'Dan 13:30, 14:6-9 - Ca-lep va Gio-sue tin rang Chua se giup ho chiem dat, trong khi 10 tham tu khac bo cuoc.',
'["Cuu Uoc","Duc tin","Dat hua"]', 'Numbers 13:30-33', 'vi', true, NOW(), NOW()),

('q-num-002', 'Numbers', 14, 33, 34, 'easy', 'multiple_choice_single',
'Dan Y-so-ra-en phai di lang thang trong dong vang bao nhieu nam?',
'["40 nam", "20 nam", "70 nam", "12 nam"]',
'[0]',
'Dan 14:34 - Moi ngay tham tu do xet dat (40 ngay) tuong ung voi 1 nam lang thang trong dong vang.',
'["Cuu Uoc","Dong vang","Hinh phat"]', 'Numbers 14:33-34', 'vi', true, NOW(), NOW()),

('q-num-003', 'Numbers', 21, 8, 9, 'hard', 'multiple_choice_single',
'Con ran dong ma Moi-se treo len la hinh bong cua su kien nao?',
'["Chua Gie-su bi treo tren thap tu gia", "Su phuc sinh", "Le Bap-tem", "Su tai lam"]',
'[0]',
'Giang 3:14-15 - Chua Gie-su dan den su kien nay: Nhu Moi-se treo con ran len trong dong vang, Con Nguoi cung phai bi treo len nhu vay.',
'["Cuu Uoc","Hinh bong","Thap tu"]', 'Numbers 21:8-9', 'vi', true, NOW(), NOW()),

('q-num-004', 'Numbers', 6, 24, 26, 'easy', 'fill_in_blank',
'Hoan thanh loi chuc phuc: "Nguyen Duc Gie-ho-va ban phuc lanh cho nguoi va ___ nguoi"',
'[]', '[]',
'Dan 6:24 - Nguyen Duc Gie-ho-va ban phuc lanh cho nguoi va gin giu nguoi.',
'["Cuu Uoc","Chuc phuc","Te le"]', 'Numbers 6:24-26', 'vi', true, NOW(), NOW()),

-- ==================== DEUTERONOMY ====================

('q-deu-001', 'Deuteronomy', 6, 4, 5, 'easy', 'multiple_choice_single',
'Shema - loi tuyen bo duc tin quan trong nhat cua Do-thai giao bat dau nhu the nao?',
'["Hoi Y-so-ra-en! Gie-ho-va Duc Chua Troi chung ta la Gie-ho-va co mot", "Hay tin Chua", "Ban dau Duc Chua Troi", "Hay thanh khiet"]',
'[0]',
'Phuc truyen 6:4 - Shema la loi tuyen bo tin kinh trung tam: Duc Gie-ho-va la Chua duy nhat.',
'["Cuu Uoc","Luat phap","Duc tin"]', 'Deuteronomy 6:4-5', 'vi', true, NOW(), NOW()),

('q-deu-002', 'Deuteronomy', 6, 5, 5, 'medium', 'multiple_choice_single',
'Theo Phuc truyen 6:5, chung ta phai yeu Chua bang may dieu?',
'["Het long, het linh hon, het suc", "Het long va het linh hon", "Chi can het long", "Het long, het suc, het tri"]',
'[0]',
'Phuc truyen 6:5 - Phai yeu Gie-ho-va Duc Chua Troi nguoi het long, het linh hon, het suc luc minh. Chua Gie-su goi day la dieu ran lon nhat.',
'["Cuu Uoc","Dieu ran","Yeu Chua"]', 'Deuteronomy 6:5', 'vi', true, NOW(), NOW()),

('q-deu-003', 'Deuteronomy', 31, 6, 6, 'easy', 'fill_in_blank',
'Hoan thanh cau: "Hay vung long ben chi, chot dung ___ va run so truoc mat chung no"',
'[]', '[]',
'Phuc truyen 31:6 - Moi-se khuyen dan hay vung long ben chi, khong so hai vi Chua di cung ho.',
'["Cuu Uoc","Can dam","Moi-se"]', 'Deuteronomy 31:6', 'vi', true, NOW(), NOW()),

('q-deu-004', 'Deuteronomy', 18, 15, 15, 'hard', 'multiple_choice_single',
'Khi Moi-se noi "Gie-ho-va se dung len mot dang tien tri nhu ta giua anh em ngươi", ong tien tri ve ai?',
'["Chua Gie-su Christ", "Gio-sue", "Sa-mu-en", "E-li"]',
'[0]',
'Cong vu 3:22-23 - Phi-e-ro xac nhan rang loi nay ung nghiem noi Chua Gie-su, Dang Tien Tri lon nhat.',
'["Cuu Uoc","Tien tri","Chua Gie-su"]', 'Deuteronomy 18:15', 'vi', true, NOW(), NOW()),

-- ==================== JOSHUA ====================

('q-jos-001', 'Joshua', 1, 8, 9, 'easy', 'multiple_choice_single',
'Chua phan voi Gio-sue truoc khi vao dat hua: "Hay vung long ___"',
'["Ben chi", "Khon ngoan", "Kien nhan", "Khiem nhuong"]',
'[0]',
'Gio-sue 1:9 - Hay vung long ben chi, chot dung kinh hai. Vi Gie-ho-va Duc Chua Troi nguoi o cung nguoi bat cu noi dau nguoi di.',
'["Cuu Uoc","Gio-sue","Can dam"]', 'Joshua 1:8-9', 'vi', true, NOW(), NOW()),

('q-jos-002', 'Joshua', 6, 3, 5, 'medium', 'multiple_choice_single',
'Dan Y-so-ra-en phai di vong quanh thanh Gie-ri-co bao nhieu ngay truoc khi tuong thanh do?',
'["7 ngay", "3 ngay", "40 ngay", "12 ngay"]',
'[0]',
'Gio-sue 6:3-4 - Di vong 1 lan moi ngay trong 6 ngay, ngay thu 7 di vong 7 lan roi thoi ken va la lon thi tuong thanh do.',
'["Cuu Uoc","Gio-sue","Phep la"]', 'Joshua 6:3-5', 'vi', true, NOW(), NOW()),

('q-jos-003', 'Joshua', 24, 15, 15, 'easy', 'fill_in_blank',
'Gio-sue tuyen bo: "Con ta va nha ta se ___ Duc Gie-ho-va"',
'[]', '[]',
'Gio-sue 24:15 - Cau noi noi tieng the hien su quyet tam phuc vu Chua bat ke nguoi khac chon gi.',
'["Cuu Uoc","Gio-sue","Quyet dinh"]', 'Joshua 24:15', 'vi', true, NOW(), NOW()),

-- ==================== JUDGES & RUTH ====================

('q-jdg-001', 'Judges', 16, 17, 17, 'easy', 'multiple_choice_single',
'Bi mat suc manh cua Sam-son nam o dau?',
'["Mai toc chua he bi cat (loi hua Na-xi-re)", "Co bap", "Vu khi dac biet", "Ao giap"]',
'[0]',
'Cac Quan Xet 16:17 - Suc manh Sam-son den tu loi hua Na-xi-re voi Duc Chua Troi, bieu tuong qua mai toc.',
'["Cuu Uoc","Sam-son","Loi hua"]', 'Judges 16:17', 'vi', true, NOW(), NOW()),

('q-rut-001', 'Ruth', 1, 16, 16, 'easy', 'multiple_choice_single',
'Ru-to noi voi Na-o-mi: "Duc Chua Troi cua me tuc la ___"',
'["Duc Chua Troi cua con", "Dang Toan Nang", "Duc Gie-ho-va", "Chua cua moi nguoi"]',
'[0]',
'Ru-to 1:16 - Ru-to chon gan bo voi Na-o-mi va Duc Chua Troi cua ba. Su trung tin cua Ru-to la tam guong duc tin.',
'["Cuu Uoc","Ru-to","Trung tin"]', 'Ruth 1:16', 'vi', true, NOW(), NOW()),

('q-rut-002', 'Ruth', 4, 13, 17, 'medium', 'multiple_choice_single',
'Ru-to la ba co cua vi vua noi tieng nao trong Kinh Thanh?',
'["Vua Da-vit", "Vua Sa-lo-mon", "Vua Sau-lo", "Vua Gio-si-a"]',
'[0]',
'Ru-to 4:17 - Ru-to sinh O-bet, O-bet sinh Gie-se, Gie-se sinh Da-vit. Ru-to cung o trong gia pha cua Chua Gie-su (Mat 1:5).',
'["Cuu Uoc","Ru-to","Gia pha"]', 'Ruth 4:13-17', 'vi', true, NOW(), NOW()),

-- ==================== 1 & 2 SAMUEL ====================

('q-1sa-001', '1 Samuel', 3, 10, 10, 'easy', 'multiple_choice_single',
'Sa-mu-en dap lai tieng Chua goi vao ban dem nhu the nao?',
'["Xin Chua hay phan, vi day toi cua Chua dang nghe", "Day con day", "Con dang nghe", "Xin Chua doi"]',
'[0]',
'1 Sa-mu-en 3:10 - He-li day Sa-mu-en cach dap lai tieng Chua. Day la su san sang lang nghe va vang phuc.',
'["Cuu Uoc","Sa-mu-en","Lang nghe"]', '1 Samuel 3:10', 'vi', true, NOW(), NOW()),

('q-1sa-002', '1 Samuel', 16, 7, 7, 'medium', 'multiple_choice_single',
'Khi chon Da-vit lam vua, Chua day Sa-mu-en bai hoc gi?',
'["Chua nhin tam long, khong phai ben ngoai", "Hay chon nguoi tre nhat", "Hay chon nguoi manh nhat", "Hay chon con truong"]',
'[0]',
'1 Sa-mu-en 16:7 - Loai nguoi nhin ben ngoai nhung Duc Gie-ho-va nhin thay trong long. Da-vit duoc chon vi tam long huong ve Chua.',
'["Cuu Uoc","Da-vit","Tam long"]', '1 Samuel 16:7', 'vi', true, NOW(), NOW()),

('q-1sa-003', '1 Samuel', 17, 45, 47, 'easy', 'multiple_choice_single',
'Da-vit dung vu khi gi de ha Go-li-at?',
'["Trai da va cai trang nom", "Guom", "Giao", "Cung ten"]',
'[0]',
'1 Sa-mu-en 17:49-50 - Da-vit dung trai da va trang nom, tin cay Chua chien tran cho minh.',
'["Cuu Uoc","Da-vit","Duc tin"]', '1 Samuel 17:45-50', 'vi', true, NOW(), NOW()),

('q-1sa-004', '1 Samuel', 17, 45, 45, 'medium', 'fill_in_blank',
'Da-vit noi voi Go-li-at: "Nguoi can ta voi guom, giao, lao; con ta can nguoi nhan danh ___"',
'[]', '[]',
'1 Sa-mu-en 17:45 - Da-vit den nhan danh Duc Gie-ho-va van quan - khong dua vao vu khi ma dua vao Chua.',
'["Cuu Uoc","Da-vit","Duc tin"]', '1 Samuel 17:45', 'vi', true, NOW(), NOW()),

('q-2sa-001', '2 Samuel', 12, 7, 7, 'medium', 'multiple_choice_single',
'Ai la nguoi tien tri da doi dien Da-vit ve toi loi voi Bat-se-ba?',
'["Na-than", "Sa-mu-en", "Ga-at", "A-sap"]',
'[0]',
'2 Sa-mu-en 12:7 - Tien tri Na-than dung du ngon con chien de Da-vit tu ket an minh, roi tuyen bo: "Nguoi la nguoi do!"',
'["Cuu Uoc","Da-vit","An nan"]', '2 Samuel 12:7', 'vi', true, NOW(), NOW()),

-- ==================== 1 & 2 KINGS ====================

('q-1ki-001', '1 Kings', 3, 9, 9, 'easy', 'multiple_choice_single',
'Khi Chua cho Sa-lo-mon xin bat cu dieu gi, ong xin gi?',
'["Su khon ngoan de xet doan dan su", "Su giau co", "Doi song dai lau", "Chien thang ke thu"]',
'[0]',
'1 Cac Vua 3:9 - Sa-lo-mon xin tam long khon ngoan de phan biet phai trai. Chua rat vui va ban them su giau co va vinh hien.',
'["Cuu Uoc","Sa-lo-mon","Khon ngoan"]', '1 Kings 3:9', 'vi', true, NOW(), NOW()),

('q-1ki-002', '1 Kings', 18, 38, 39, 'medium', 'multiple_choice_single',
'Tren nui Cat-men, khi E-li thach thuc cac tien tri Ba-al, dieu gi da xay ra?',
'["Lua tu troi roi xuong thieu cua le", "Mua roi xuong", "Dat nung", "Gio bao noi len"]',
'[0]',
'1 Cac Vua 18:38 - Lua cua Duc Gie-ho-va tu troi giang xuong thieu sach cua le, cui, da, bui va nuoc. Dan su sap mat xuong noi: Gie-ho-va la Duc Chua Troi!',
'["Cuu Uoc","E-li","Phep la"]', '1 Kings 18:38-39', 'vi', true, NOW(), NOW()),

('q-2ki-001', '2 Kings', 2, 11, 11, 'easy', 'multiple_choice_single',
'E-li duoc cat len troi bang phuong tien gi?',
'["Xe lua va ngua lua trong con gio loc", "Dam may", "Thien su", "Cot lua"]',
'[0]',
'2 Cac Vua 2:11 - Xe lua va ngua lua phan cach hai nguoi, roi E-li duoc cat len troi trong con gio loc.',
'["Cuu Uoc","E-li","Phep la"]', '2 Kings 2:11', 'vi', true, NOW(), NOW()),

-- ==================== NEHEMIAH & ESTHER ====================

('q-neh-001', 'Nehemiah', 2, 17, 18, 'easy', 'multiple_choice_single',
'Ne-he-mi tro ve Gie-ru-sa-lem de lam gi?',
'["Xay lai tuong thanh", "Xay lai den tho", "Lam tong tran", "Day luat phap"]',
'[0]',
'Ne-he-mi 2:17 - Ne-he-mi keu goi dan su xay lai tuong thanh Gie-ru-sa-lem da bi hu nai.',
'["Cuu Uoc","Ne-he-mi","Phuc hoi"]', 'Nehemiah 2:17-18', 'vi', true, NOW(), NOW()),

('q-est-001', 'Esther', 4, 14, 14, 'medium', 'multiple_choice_single',
'Mot-do-che noi voi E-xo-te: "Biet dau nguoi duoc lam hoang hau chinh vi ___?"',
'["Thoi diem nay day", "Sac dep cua nguoi", "Dong doi cua nguoi", "Su khon ngoan cua nguoi"]',
'[0]',
'E-xo-te 4:14 - Mot-do-che tin rang Chua dat E-xo-te vao vi tri hoang hau dung luc dan Do-thai can duoc giai cuu.',
'["Cuu Uoc","E-xo-te","Chu quyen Chua"]', 'Esther 4:14', 'vi', true, NOW(), NOW());
