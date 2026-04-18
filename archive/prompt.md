tôi có sử dụng claude  search tạo spec-v2 từ file spec của repo. bạn dựa vào file SPEC-v2.md vào update code và logic, tất cả những thứ liên quan. Đọc CLAUDE.md để hiểu project structure.
Implement feature trong file SPEC-v2.md 
Yêu cầu:
- Tự chạy test sau mỗi thay đổi
- Nếu fail, tự fix và chạy lại
- Không dừng cho đến khi tất cả test pass
- Báo cáo kết quả cuối cùng

----
Đọc CLAUDE.md để hiểu project structure.
Đọc file BIBLEQUIZ_TEST_CASES.md.

Convert toàn bộ test cases sang code:
- [UT] + [IT] → JUnit 5 + Spring Boot Test + Mockito (trong apps/api)
- [E2E] → Playwright TypeScript (trong apps/web/e2e)
- [WS] → Java WebSocket client test
- [PERF] → k6 scripts (trong infra/k6)

Quy tắc:
- Mỗi module = 1 file test riêng (AuthTest.java, RankedModeTest.java...)
- Dùng @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
- Mock external services (Bedrock, FCM, S3)
- Tự chạy test sau khi viết xong từng module, fix nếu fail
- Không dừng cho đến khi tất cả test pass hoặc báo cáo lỗi không tự fix được
## Prompt mẫu mỗi khi bắt đầu session
```
Đọc CLAUDE.md, TODO.md, và DECISIONS.md trước.

Làm tiếp task đang dở trong TODO.md:
[Import JSON/CSV câu hỏi — TC-ADMIN-001]
Yêu cầu
- Sau khi xong: chạy test, cập nhật TODO.md, báo cáo kết quả.
- Tự chạy test sau mỗi thay đổi
- Nếu fail, tự fix và chạy lại
- Không dừng cho đến khi tất cả test pass
- Báo cáo kết quả cuối cùng
```
----
Tạo cấu trúc thư mục và seed data ban đầu:

scripts/
├── seed/
│   ├── README.md        ← hướng dẫn cách add content mới
│   ├── genesis.sql      ← 20 câu hỏi Genesis
│   ├── matthew.sql      ← 20 câu hỏi Matthew  
│   └── psalms.sql       ← 20 câu hỏi Psalms
└── utils/
    └── validate_seed.sql ← query kiểm tra pool size đủ chưa

Yêu cầu cho mỗi câu hỏi:
- Đủ 4 fields bắt buộc: content, options, correctAnswer, explanation
- explanation phải có trích dẫn câu Kinh Thánh cụ thể
- Mix difficulty: 40% easy, 40% medium, 20% hard
- Dùng Bản Truyền Thống 1926 (public domain)

Sau khi tạo xong: 
- Chạy validate_seed.sql để kiểm tra format
- Chạy ./mvnw test để đảm bảo import pipeline hoạt động
----
Dùng Stitch MCP để lấy design BibleQuiz vừa tạo.

Project ID: 534103079767883385267

Thực hiện theo thứ tự:

1. List tất cả screens trong project này
2. Với mỗi screen, lấy HTML/CSS code
3. Convert từng screen sang React + Tailwind:
   - Home screen     → apps/web/src/pages/Home.tsx
   - Quiz gameplay   → apps/web/src/pages/Quiz.tsx
   - Leaderboard     → apps/web/src/pages/Leaderboard.tsx
   - Church Group    → apps/web/src/pages/Groups.tsx
   - Tournament      → apps/web/src/pages/Tournament.tsx
   - Profile         → apps/web/src/pages/Profile.tsx

Quy tắc khi convert:
- Giữ đúng màu sắc, spacing, layout từ Stitch
- Dùng Tailwind classes, không dùng inline style
- Replace hardcode text bằng props hoặc placeholder
- Dùng React Router <Link> cho navigation
- Đảm bảo dark mode hoạt động
- Dùng TanStack Query cho data fetching

4. Sau mỗi component: chạy npm run build verify không lỗi
5. Cập nhật TODO.md sau khi xong
6. Báo cáo kết quả từng screen
---