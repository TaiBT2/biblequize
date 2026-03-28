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