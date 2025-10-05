# Hibernate Data Initialization

## Tổng quan
Hệ thống sử dụng Hibernate để tự động khởi tạo dữ liệu mẫu khi ứng dụng Spring Boot khởi động. Dữ liệu bao gồm:
- 66 sách Kinh Thánh (39 Cựu Ước + 27 Tân Ước)
- 10 user mẫu
- 20 câu hỏi trắc nghiệm cho mỗi sách (tổng cộng 1,320 câu hỏi)

## Cách hoạt động

### 1. Hibernate Configuration
- `ddl-auto: update` - Hibernate sẽ tự động tạo/cập nhật schema
- `flyway.enabled: false` - Tắt Flyway để Hibernate có thể quản lý schema
- `CommandLineRunner` - Tự động chạy khi ứng dụng khởi động

### 2. DataInitService
Service này implement `CommandLineRunner` và sẽ:
- Kiểm tra xem đã có dữ liệu chưa (tránh tạo trùng lặp)
- Tạo 66 sách Kinh Thánh với tên tiếng Anh và tiếng Việt
- Tạo 10 user mẫu
- Tạo 20 câu hỏi cho mỗi sách với độ khó khác nhau

## Cách sử dụng

### 1. Khởi động ứng dụng
```bash
cd apps/api
./mvnw spring-boot:run
```

### 2. Kiểm tra dữ liệu
```bash
# Kiểm tra trạng thái
curl -X GET http://localhost:8080/api/admin/data-status

# Lấy danh sách sách
curl -X GET http://localhost:8080/api/books

# Lấy câu hỏi
curl -X GET "http://localhost:8080/api/questions?book=Genesis&limit=5"
```

### 3. Chạy test script
```bash
node test-hibernate-init.js
```

## Cấu trúc dữ liệu

### Sách Kinh Thánh
```json
{
  "id": "uuid",
  "name": "Genesis",
  "nameVi": "Sáng Thế Ký",
  "testament": "OLD",
  "orderIndex": 1
}
```

### Câu hỏi
```json
{
  "id": "uuid",
  "book": "Genesis",
  "chapter": 1,
  "verseStart": 1,
  "verseEnd": 3,
  "difficulty": "easy",
  "type": "multiple_choice_single",
  "content": "Sách Sáng Thế Ký có bao nhiêu chương?",
  "options": ["1-5 chương", "6-10 chương", "11-15 chương", "16-20 chương"],
  "correctAnswer": [0],
  "explanation": "Đây là câu hỏi mẫu về sách Sáng Thế Ký.",
  "language": "vi"
}
```

### User mẫu
```json
{
  "id": "uuid",
  "name": "Nguyễn Văn An",
  "email": "an.nguyen@example.com",
  "provider": "local",
  "role": "USER"
}
```

## Lợi ích

### 1. Tự động hóa
- Không cần chạy script thủ công
- Dữ liệu được tạo ngay khi ứng dụng start
- Kiểm tra trùng lặp tự động

### 2. Hibernate Integration
- Sử dụng JPA/Hibernate để quản lý schema
- Transaction support
- Lazy loading và caching

### 3. Development Friendly
- Dữ liệu mẫu sẵn có cho testing
- Không cần cấu hình database phức tạp
- Dễ dàng reset dữ liệu

## Lưu ý

### 1. Production
- Chỉ nên sử dụng trong môi trường development
- Trong production, nên sử dụng Flyway với dữ liệu thực tế

### 2. Database
- Đảm bảo MySQL đang chạy
- Database `biblequiz` đã được tạo
- User có quyền tạo bảng

### 3. Performance
- Lần đầu chạy có thể mất vài giây để tạo 1,320 câu hỏi
- Hibernate sẽ tối ưu hóa việc insert batch

## Troubleshooting

### 1. Lỗi kết nối database
```
Caused by: java.sql.SQLException: Access denied for user 'root'@'localhost'
```
**Giải pháp**: Kiểm tra username/password trong `application.yml`

### 2. Lỗi tạo bảng
```
Caused by: java.sql.SQLSyntaxErrorException: Table 'biblequiz.books' doesn't exist
```
**Giải pháp**: Đảm bảo `ddl-auto: update` và `flyway.enabled: false`

### 3. Dữ liệu không được tạo
```
Dữ liệu đã tồn tại, bỏ qua khởi tạo...
```
**Giải pháp**: Xóa dữ liệu cũ hoặc thay đổi logic kiểm tra trong `DataInitService`
