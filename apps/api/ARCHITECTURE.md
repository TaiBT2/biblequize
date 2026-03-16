# API Architecture Documentation

Dự án API của **BibleQuiz** được tổ chức theo mô hình **Modular Feature (Hướng tính năng)**. Cấu trúc này giúp mã nguồn dễ đọc, dễ bảo trì và mở rộng linh hoạt.

## 📁 Cấu trúc thư mục chính (4-Folder Pattern)

Mã nguồn nằm trong package `com.biblequiz` được chia thành 4 khu vực chính:

### 1. `api/` (Giao diện bên ngoài)
Nơi tiếp nhận các yêu cầu từ Client (Mobile, Web, System).
- **`controller/`**: Định nghĩa các REST endpoints.
- **`dto/`**: Các đối tượng chuyển đổi dữ liệu (Data Transfer Objects).
- **`websocket/`**: Xử lý giao tiếp thời gian thực.
- **`gateway/`**: Các cổng kết nối với dịch vụ bên ngoài.

### 2. `modules/` (Nghiệp vụ cốt lõi - CƠ CHẾ MODULAR)
Đây là phần quan trọng nhất. Mỗi folder con là một **Module độc lập** chứa toàn bộ logic của một tính năng.
- **Các module hiện có**: `quiz`, `user`, `auth`, `room`, `ranked`, `tournament`, `feedback`, `adminai`.
- **Cấu trúc bên trong mỗi module**:
    - `.entity`: Các model ánh xạ database.
    - `.repository`: Interface tương tác dữ liệu.
    - `.service`: Xử lý logic nghiệp vụ chính.

### 3. `infrastructure/` (Hạ tầng kỹ thuật)
Chứa các cài đặt kỹ thuật và các vấn đề xuyên suốt (Cross-cutting concerns).
- **`config/`**: Cấu hình Spring Boot (CORS, Database, Swagger...).
- **`security/`**: Bảo mật, phân quyền, JWT.
- **`exception/`**: Quản lý lỗi tập trung (Global Exception Handler).
- **`monitoring/`**: Theo dõi hiệu năng, sức khỏe hệ thống.

### 4. `shared/` (Tiện ích dùng chung)
Chứa các thành phần được sử dụng bởi nhiều module khác nhau.
- **`common/`**: Các Utility classes (Date, String, Math...).
- **`converter/`**: Chuyển đổi định dạng dữ liệu dùng chung.
- **`aspect/`**: Xử lý AOP (Logging, Metrics).

---

## 🚀 Nguyên tắc thiết kế (Coding Principles)

1.  **Tính đóng gói (Encapsulation)**: Nếu một Entity hoặc Service chỉ dùng cho tính năng Quiz, nó PHẢI nằm trong `modules/quiz`.
2.  **Phụ thuộc một chiều**: `api` gọi `modules`, `modules` gọi `shared` và `infrastructure`. Tránh phụ thuộc vòng quanh.
3.  **Dễ dàng mở rộng**: Khi thêm tính năng mới (ví dụ: `Shop`), chỉ cần tạo một folder mới trong `modules/shop` mà không ảnh hưởng đến các phần khác.

---
*Tài liệu này được cập nhật vào: 06/03/2026*
