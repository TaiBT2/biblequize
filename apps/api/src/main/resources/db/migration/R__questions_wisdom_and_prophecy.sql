-- Repeatable migration: Wisdom Literature & Prophets
-- Psalms, Proverbs, Ecclesiastes, Isaiah, Jeremiah, Ezekiel, Daniel, Minor Prophets

-- ==================== PSALMS ====================
INSERT IGNORE INTO questions (id, book, chapter, verse_start, verse_end, difficulty, type, content, options, correct_answer, explanation, tags, source, language, is_active, created_at, updated_at) VALUES

('q-psa-001', 'Psalms', 23, 1, 1, 'easy', 'multiple_choice_single',
'Thi thien 23 bat dau bang cau nao?',
'["Duc Gie-ho-va la Dang chan giu toi", "Troi ke ra su vinh hien Chua", "Hay ngoi khen Duc Gie-ho-va", "Duc Gie-ho-va la noi an nau toi"]',
'[0]',
'Thi 23:1 - Duc Gie-ho-va la Dang chan giu toi, toi se chang thieu thon gi. Mot trong nhung thi thien duoc yeu thich nhat.',
'["Cuu Uoc","Thi thien","Chan giu"]', 'Psalms 23:1', 'vi', true, NOW(), NOW()),

('q-psa-002', 'Psalms', 23, 4, 4, 'easy', 'fill_in_blank',
'Du khi toi di trong trung lung bong cua su chet, toi se chang ___ dieu tai hai nao (Thi 23:4)',
'[]', '[]',
'Thi 23:4 - Vi Chua o cung toi, gay va gon cua Chua an ui toi.',
'["Cuu Uoc","Thi thien","Binh an"]', 'Psalms 23:4', 'vi', true, NOW(), NOW()),

('q-psa-003', 'Psalms', 1, 1, 3, 'medium', 'multiple_choice_single',
'Thi thien 1 so sanh nguoi cong binh nhu gi?',
'["Cay trong gan suoi nuoc, sinh trai dung mua", "Nui cao vung chac", "Ngoi sao sang", "Suc manh cua su tu"]',
'[0]',
'Thi 1:3 - Nguoi ay giong nhu cay trong gan suoi nuoc, sinh trai dung mua, la khong he tan. Moi viec deu thanh tuu.',
'["Cuu Uoc","Thi thien","Cong binh"]', 'Psalms 1:1-3', 'vi', true, NOW(), NOW()),

('q-psa-004', 'Psalms', 46, 10, 10, 'easy', 'multiple_choice_single',
'Thi 46:10 noi: "Hay yen lang va biet rang ta la ___"',
'["Duc Chua Troi", "Chua", "Dang Toan Nang", "Dang Sang Tao"]',
'[0]',
'Thi 46:10 - Loi moi goi yen lang truoc su hien dien cua Chua, tin cay Ngai dang nam quyen kiem soat.',
'["Cuu Uoc","Thi thien","Tin cay"]', 'Psalms 46:10', 'vi', true, NOW(), NOW()),

('q-psa-005', 'Psalms', 119, 105, 105, 'easy', 'multiple_choice_single',
'Thi 119:105 so sanh Loi Chua nhu gi?',
'["Ngon den cho chan va anh sang cho duong", "Luoi guom hai luoi", "Lua chay", "Nuoc song"]',
'[0]',
'Thi 119:105 - Loi Chua la ngon den cho chan toi, anh sang cho duong loi toi. Soi sang huong di cho doi song.',
'["Cuu Uoc","Thi thien","Loi Chua"]', 'Psalms 119:105', 'vi', true, NOW(), NOW()),

('q-psa-006', 'Psalms', 139, 13, 14, 'easy', 'multiple_choice_single',
'Thi 139:14 noi chung ta duoc dung nen cach nao?',
'["Cach dang so va dieu ky (la lung)", "Tu nhien", "Nganh nhien", "Don gian"]',
'[0]',
'Thi 139:14 - Toi ca ngoi Chua vi toi duoc dung nen cach dang so la lung. Cong viec Chua la ky dieu.',
'["Cuu Uoc","Thi thien","Gia tri con nguoi"]', 'Psalms 139:13-14', 'vi', true, NOW(), NOW()),

('q-psa-007', 'Psalms', 51, 10, 10, 'medium', 'fill_in_blank',
'Da-vit cau nguyen: "Duc Chua Troi oi, xin hay dung nen trong toi mot tam long ___" (Thi 51:10)',
'[]', '[]',
'Thi 51:10 - Da-vit xin Chua dung nen tam long trong sach sau khi pham toi voi Bat-se-ba.',
'["Cuu Uoc","Da-vit","An nan"]', 'Psalms 51:10', 'vi', true, NOW(), NOW()),

('q-psa-008', 'Psalms', 22, 1, 1, 'hard', 'multiple_choice_single',
'Thi thien 22 bat dau: "Duc Chua Troi toi oi, sao Ngai bo toi?" Cau nay duoc ai trich dan tren thap tu?',
'["Chua Gie-su", "Da-vit", "Phi-e-ro", "Phao-lo"]',
'[0]',
'Mat 27:46 - Chua Gie-su trich Thi 22:1 khi bi dong dinh. Thi 22 la thi thien tien tri chi tiet ve su dong dinh.',
'["Cuu Uoc","Tien tri","Thap tu"]', 'Psalms 22:1', 'vi', true, NOW(), NOW()),

-- ==================== PROVERBS ====================

('q-pro-001', 'Proverbs', 1, 7, 7, 'easy', 'multiple_choice_single',
'Theo Cham ngon 1:7, su khon ngoan bat dau tu dieu gi?',
'["Su kinh so Duc Gie-ho-va", "Hoc thuc", "Kinh nghiem", "Tuan theo luat phap"]',
'[0]',
'Cham 1:7 - Su kinh so Duc Gie-ho-va la khoi dau su tri thuc. Moi su khon ngoan that deu bat nguon tu Chua.',
'["Cuu Uoc","Khon ngoan","Kinh so Chua"]', 'Proverbs 1:7', 'vi', true, NOW(), NOW()),

('q-pro-002', 'Proverbs', 3, 5, 6, 'easy', 'multiple_choice_single',
'Cham ngon 3:5 day: "Hay het long tin cay Duc Gie-ho-va, cho nuong cay noi ___"',
'["Su thong sang cua con", "Suc manh cua con", "Su giau co", "Nguoi khac"]',
'[0]',
'Cham 3:5-6 - Hay tin cay Chua het long, dung dua vao tri hieu minh. Trong moi duong loi hay nhan biet Ngai.',
'["Cuu Uoc","Khon ngoan","Tin cay"]', 'Proverbs 3:5-6', 'vi', true, NOW(), NOW()),

('q-pro-003', 'Proverbs', 22, 6, 6, 'easy', 'multiple_choice_single',
'Cham ngon 22:6 day ve viec nuoi day con cai the nao?',
'["Hay day tre tho theo duong no phai di, den khi no gia cung khong roi khoi", "Hay de tre tu phat trien", "Hay nghiem khac", "Hay cho tre tu do hoan toan"]',
'[0]',
'Cham 22:6 - Nguyen tac giao duc: day dua tre tu nho theo duong loi cua Chua.',
'["Cuu Uoc","Khon ngoan","Giao duc"]', 'Proverbs 22:6', 'vi', true, NOW(), NOW()),

('q-pro-004', 'Proverbs', 27, 17, 17, 'medium', 'multiple_choice_single',
'Cham ngon 27:17 noi: "Sat mai sat cho ben. Cung vay ___ mai giua ban huu"',
'["Nguoi nay lam cho nguoi kia ben", "Mat doi mat", "Tam long doi tam long", "Loi noi doi loi noi"]',
'[0]',
'Cham 27:17 - Sat mai sat cho ben, ban be tot giup nhau truong thanh qua moi quan he chan that.',
'["Cuu Uoc","Khon ngoan","Tinh ban"]', 'Proverbs 27:17', 'vi', true, NOW(), NOW()),

('q-pro-005', 'Proverbs', 31, 30, 30, 'easy', 'fill_in_blank',
'Cham 31:30: "Duyen la gia doi, sac la hu khong; nhung nguoi nu nao ___ Duc Gie-ho-va se duoc khen ngoi"',
'[]', '[]',
'Cham 31:30 - Gia tri that cua nguoi phu nu nam o su kinh so Duc Gie-ho-va, khong phai ve ben ngoai.',
'["Cuu Uoc","Khon ngoan","Phu nu"]', 'Proverbs 31:30', 'vi', true, NOW(), NOW()),

-- ==================== ECCLESIASTES ====================

('q-ecc-001', 'Ecclesiastes', 3, 1, 1, 'easy', 'multiple_choice_single',
'Truyen dao 3:1 noi dieu gi ve thoi ky?',
'["Moi su deu co thoi dinh, moi viec duoi troi co ky han", "Thoi gian la vang bac", "Khong ai biet ngay mai", "Hay tan dung thoi gian"]',
'[0]',
'Truyen dao 3:1 - Moi su co thoi dinh. Co ky sinh ra, ky chet; ky trong, ky nho; ky khoc, ky cuoi...',
'["Cuu Uoc","Khon ngoan","Thoi dinh"]', 'Ecclesiastes 3:1', 'vi', true, NOW(), NOW()),

('q-ecc-002', 'Ecclesiastes', 12, 13, 13, 'medium', 'multiple_choice_single',
'Ket luan cua sach Truyen Dao la gi?',
'["Hay kinh so Duc Chua Troi va giu cac dieu ran Ngai", "Doi song la vo nghia", "Hay huong thu cuoc song", "Hay tim kiem su khon ngoan"]',
'[0]',
'Truyen dao 12:13 - Sau khi kham pha moi thu duoi mat troi, ket luan la: kinh so Chua va giu dieu ran. Day la toan bo bon phan con nguoi.',
'["Cuu Uoc","Khon ngoan","Bon phan"]', 'Ecclesiastes 12:13', 'vi', true, NOW(), NOW()),

-- ==================== ISAIAH ====================

('q-isa-001', 'Isaiah', 6, 8, 8, 'easy', 'multiple_choice_single',
'Khi Chua hoi "Ta se sai ai di?", E-sai dap the nao?',
'["Co toi day, xin sai toi", "Xin sai nguoi khac", "Toi khong xung dang", "De toi suy nghi"]',
'[0]',
'E-sai 6:8 - Co toi day, xin hay sai toi! E-sai san sang vang phuc sau khi duoc thanh tay.',
'["Cuu Uoc","E-sai","Vang phuc"]', 'Isaiah 6:8', 'vi', true, NOW(), NOW()),

('q-isa-002', 'Isaiah', 7, 14, 14, 'medium', 'multiple_choice_single',
'E-sai 7:14 tien tri: "Nay mot gai dong trinh se mang thai, sinh mot trai, dat ten la ___"',
'["Em-ma-nu-en", "Gie-su", "Mi-ca-en", "Dang Cuu The"]',
'[0]',
'E-sai 7:14 - Em-ma-nu-en (Duc Chua Troi o cung chung ta). Loi tien tri nay ung nghiem noi Chua Gie-su (Mat 1:23).',
'["Cuu Uoc","Tien tri","Giang sinh"]', 'Isaiah 7:14', 'vi', true, NOW(), NOW()),

('q-isa-003', 'Isaiah', 9, 6, 6, 'medium', 'multiple_choice_single',
'E-sai 9:6 goi Dang Cuu The sap den bang nhung danh hieu nao?',
'["Dang Muu Luan Ky Dieu, Duc Chua Troi Quyen Nang, Cha Doi Doi, Chua Binh An", "Vua cua Vua", "Chien Con cua Chua", "Con Nguoi"]',
'[0]',
'E-sai 9:6 - Bon danh hieu chi ra Chua Gie-su vua la Duc Chua Troi vua la nguoi, vua la vua vua la thay te le.',
'["Cuu Uoc","Tien tri","Danh xung"]', 'Isaiah 9:6', 'vi', true, NOW(), NOW()),

('q-isa-004', 'Isaiah', 40, 31, 31, 'easy', 'multiple_choice_single',
'E-sai 40:31 noi nhung ai trong doi Chua se duoc gi?',
'["Doi moi suc luc, bay nhu chim ung", "Giau co", "Quyen luc", "Tri thuc"]',
'[0]',
'E-sai 40:31 - Ai trong doi Duc Gie-ho-va se duoc doi moi suc, cat canh bay cao nhu chim ung, chay khong met, di khong moi.',
'["Cuu Uoc","Hy vong","Suc manh"]', 'Isaiah 40:31', 'vi', true, NOW(), NOW()),

('q-isa-005', 'Isaiah', 53, 5, 5, 'medium', 'fill_in_blank',
'E-sai 53:5: "Nguoi bi thuong vi ___ chung ta, bi bam nau vi gian ac chung ta"',
'[]', '[]',
'E-sai 53:5 - Chuong 53 la tien tri chi tiet nhat ve su chiu kho va chuoc toi cua Chua Gie-su, viet 700 nam truoc.',
'["Cuu Uoc","Tien tri","Cuu chuoc"]', 'Isaiah 53:5', 'vi', true, NOW(), NOW()),

('q-isa-006', 'Isaiah', 53, 6, 6, 'easy', 'multiple_choice_single',
'E-sai 53:6 so sanh loai nguoi voi con vat nao?',
'["Chien di lac", "Bo di hoang", "Chim bay mat", "Ca loi dong"]',
'[0]',
'E-sai 53:6 - Chung ta deu nhu chien di lac, ai theo duong nay. Nhung Duc Gie-ho-va da chat toi loi chung ta tren Nguoi (Chua Gie-su).',
'["Cuu Uoc","Tien tri","Toi loi"]', 'Isaiah 53:6', 'vi', true, NOW(), NOW()),

('q-isa-007', 'Isaiah', 53, 7, 7, 'hard', 'multiple_choice_single',
'E-sai 53:7 mo ta Dang chiu kho "nhu chien con bi dan den cho hat". Hinh anh nay lien ket voi su kien nao?',
'["Chua Gie-su im lang truoc Phi-lat va bi dong dinh", "Le Vuot Qua", "Cua le hang ngay", "Dan Y-so-ra-en bi bat"]',
'[0]',
'E-sai 53:7 - Chua Gie-su im lang truoc Phi-lat (Mat 27:12-14), nhu chien con bi dan di. Phi-lip dung doan nay giang Phuc Am cho hoan quan (Cong vu 8:32-35).',
'["Cuu Uoc","Tien tri","Thap tu"]', 'Isaiah 53:7', 'vi', true, NOW(), NOW()),

-- ==================== JEREMIAH ====================

('q-jer-001', 'Jeremiah', 1, 5, 5, 'easy', 'multiple_choice_single',
'Chua noi voi Gie-re-mi: "Truoc khi tao thanh nguoi trong bung me, ta da ___ nguoi"',
'["Biet nguoi", "Chon nguoi", "Yeu nguoi", "Goi nguoi"]',
'[0]',
'Gie 1:5 - Chua biet chung ta truoc khi duoc sinh ra. Ngai co ke hoach cho moi nguoi tu truoc.',
'["Cuu Uoc","Gie-re-mi","Su keu goi"]', 'Jeremiah 1:5', 'vi', true, NOW(), NOW()),

('q-jer-002', 'Jeremiah', 29, 11, 11, 'easy', 'multiple_choice_single',
'Gie-re-mi 29:11 noi ke hoach cua Chua cho chung ta la gi?',
'["Ke hoach binh an, cho mot tuong lai va hy vong", "Ke hoach giau co", "Ke hoach hinh phat", "Ke hoach thu thach"]',
'[0]',
'Gie 29:11 - Ta biet y tuong ta nghi doi cung cac nguoi, y tuong binh an, khong phai tai hoa, de cho cac nguoi duoc su cuoi cung tot dep.',
'["Cuu Uoc","Hy vong","Ke hoach Chua"]', 'Jeremiah 29:11', 'vi', true, NOW(), NOW()),

('q-jer-003', 'Jeremiah', 29, 13, 13, 'easy', 'fill_in_blank',
'Cac nguoi se tim kiem ta va gap duoc khi cac nguoi tim kiem ta het ___ (Gie 29:13)',
'[]', '[]',
'Gie 29:13 - Tim kiem Chua het long, khong phai nua voi nua von, thi se gap duoc Ngai.',
'["Cuu Uoc","Tim kiem","Het long"]', 'Jeremiah 29:13', 'vi', true, NOW(), NOW()),

('q-jer-004', 'Jeremiah', 31, 31, 33, 'hard', 'multiple_choice_single',
'Gie-re-mi 31:31-33 tien tri ve "giao uoc moi". Giao uoc nay khac giao uoc cu o diem nao?',
'["Luat phap duoc viet trong long, khong phai tren bang da", "Nhieu dieu ran hon", "Chi danh cho nguoi Do-thai", "Can nhieu te le hon"]',
'[0]',
'Gie 31:33 - Giao uoc moi: Chua viet luat trong long va tam tri. Day la giao uoc duoc ung nghiem qua Chua Gie-su va Duc Thanh Linh.',
'["Cuu Uoc","Tien tri","Giao uoc moi"]', 'Jeremiah 31:31-33', 'vi', true, NOW(), NOW()),

-- ==================== EZEKIEL ====================

('q-eze-001', 'Ezekiel', 37, 1, 10, 'medium', 'multiple_choice_single',
'E-xe-chi-en 37 mo ta khai tuong ve trung lung nao?',
'["Trung lung xuong kho duoc song lai", "Trung lung hoa", "Trung lung bong toi", "Trung lung binh an"]',
'[0]',
'Exe 37:1-10 - Xuong kho duoc phuc hoi thanh quan doi. Tien tri ve su phuc hoi dan Y-so-ra-en va quyen nang phuc sinh cua Chua.',
'["Cuu Uoc","E-xe-chi-en","Phuc hoi"]', 'Ezekiel 37:1-10', 'vi', true, NOW(), NOW()),

-- ==================== DANIEL ====================

('q-dan-001', 'Daniel', 3, 17, 18, 'medium', 'multiple_choice_single',
'Ba ban tre Do-thai tu choi tho tuong vang cua vua. Ho noi gi khi bi de doa nem vao lo lua?',
'["Chua chung toi co the giai cuu, nhung du khong, chung toi van khong tho tuong", "Chua se giai cuu chung toi", "Chung toi se cau nguyen", "Hay tha cho chung toi"]',
'[0]',
'Da-ni-en 3:17-18 - Duc tin khong dieu kien: tin Chua co the giai cuu nhung van trung tin du ket qua nao.',
'["Cuu Uoc","Duc tin","Can dam"]', 'Daniel 3:17-18', 'vi', true, NOW(), NOW()),

('q-dan-002', 'Daniel', 6, 16, 22, 'easy', 'multiple_choice_single',
'Da-ni-en bi nem vao hang gi vi tu choi ngung cau nguyen?',
'["Hang su tu", "Lo lua", "Nguc toi", "Ho sau"]',
'[0]',
'Da-ni-en 6:16 - Da-ni-en bi nem vao hang su tu nhung Chua sai thien su bung mieng su tu. Tin trung voi Chua bat ke hau qua.',
'["Cuu Uoc","Da-ni-en","Duc tin"]', 'Daniel 6:16-22', 'vi', true, NOW(), NOW()),

-- ==================== MINOR PROPHETS ====================

('q-mic-001', 'Micah', 5, 2, 2, 'medium', 'multiple_choice_single',
'Mi-che 5:2 tien tri Dang Cuu The se sinh ra tai thanh nao?',
'["Bet-le-hem", "Gie-ru-sa-lem", "Na-xa-ret", "He-bron"]',
'[0]',
'Mi-che 5:2 - Bet-le-hem Ep-ra-ta... tu noi nguoi se ra mot Dang cai tri Y-so-ra-en. Ung nghiem Mat 2:1.',
'["Cuu Uoc","Tien tri","Giang sinh"]', 'Micah 5:2', 'vi', true, NOW(), NOW()),

('q-mic-002', 'Micah', 6, 8, 8, 'easy', 'multiple_choice_single',
'Mi-che 6:8 tom tat dieu Chua doi hoi con nguoi la gi?',
'["Lam su cong binh, yeu su nhan tu, va khiem nhuong di cung Chua", "Dang cua le", "Xay den tho", "Chinh phuc cac dan toc"]',
'[0]',
'Mi-che 6:8 - Ba dieu Chua doi hoi: cong binh, nhan tu, khiem nhuong. Don gian nhung sau sac.',
'["Cuu Uoc","Doi song","Cong binh"]', 'Micah 6:8', 'vi', true, NOW(), NOW()),

('q-hab-001', 'Habakkuk', 2, 4, 4, 'hard', 'multiple_choice_single',
'Ha-ba-cuc 2:4 "Nguoi cong binh se song boi duc tin" duoc trich dan o dau trong Tan Uoc?',
'["Ro-ma 1:17, Ga-la-ti 3:11, He-bo-ro 10:38 (ca ba)", "Chi Ro-ma", "Chi Ga-la-ti", "Khong duoc trich"]',
'[0]',
'Ha-ba-cuc 2:4 la cau Cuu Uoc quan trong nhat cho than hoc Cai Cach: xung cong binh boi duc tin, duoc trich 3 lan trong Tan Uoc.',
'["Cuu Uoc","Duc tin","Than hoc"]', 'Habakkuk 2:4', 'vi', true, NOW(), NOW()),

('q-mal-001', 'Malachi', 3, 10, 10, 'medium', 'multiple_choice_single',
'Ma-la-chi 3:10 la cau Kinh Thanh duy nhat Chua thach thuc con nguoi lam gi?',
'["Thu Chua bang su dang hien phan muoi", "Cau nguyen nhieu hon", "An chay", "Rao giang"]',
'[0]',
'Ma-la-chi 3:10 - Hay dem phan muoi day du vao kho, hay thu ta. Chua hua se mo cac cua so troi ban phuc du day.',
'["Cuu Uoc","Dang hien","Phan muoi"]', 'Malachi 3:10', 'vi', true, NOW(), NOW()),

('q-jon-001', 'Jonah', 1, 17, 17, 'easy', 'multiple_choice_single',
'Giona o trong bung ca lon bao lau?',
'["3 ngay 3 dem", "7 ngay", "1 ngay", "40 ngay"]',
'[0]',
'Giona 1:17 - 3 ngay 3 dem. Chua Gie-su dung su kien nay lam hinh bong ve su phuc sinh cua Ngai (Mat 12:40).',
'["Cuu Uoc","Giona","Hinh bong"]', 'Jonah 1:17', 'vi', true, NOW(), NOW());
