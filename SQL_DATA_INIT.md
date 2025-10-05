# SQL Data Initialization

## Tổng quan
Hệ thống sử dụng file SQL để khởi tạo dữ liệu mẫu với nội dung hay và chi tiết. Dữ liệu bao gồm:
- 66 sách Kinh Thánh (39 Cựu Ước + 27 Tân Ước)
- 10 user mẫu
- Câu hỏi trắc nghiệm chất lượng cao với nội dung sâu sắc

## Cấu trúc file SQL

### 1. `data.sql` - Dữ liệu cơ bản
- 66 sách Kinh Thánh với tên tiếng Anh và tiếng Việt
- 10 user mẫu
- Cấu trúc dữ liệu cơ bản

### 2. `questions.sql` - Câu hỏi chất lượng cao
- Câu hỏi về Sáng Thế Ký, Xuất Ê-díp-tô Ký, Thi Thiên
- Câu hỏi về Ma-thi-ơ, Giăng, Rô-ma, Khải Huyền
- Nội dung sâu sắc về ngôn ngữ Hê-bơ-rơ và Hy Lạp

### 3. `more-questions.sql` - Câu hỏi bổ sung
- Câu hỏi về Châm Ngôn, Ê-sai, Lu-ca, Công Vụ
- Câu hỏi về 1 Cô-rinh-tô, Ê-phê-sô
- Nội dung phong phú và đa dạng

## Đặc điểm câu hỏi

### 1. Nội dung chất lượng cao
- Câu hỏi về ngôn ngữ gốc (Hê-bơ-rơ, Hy Lạp)
- Giải thích chi tiết và sâu sắc
- Tags phân loại rõ ràng
- Nguồn tham khảo uy tín

### 2. Độ khó đa dạng
- **Dễ**: Câu hỏi cơ bản về tên, sự kiện
- **Trung bình**: Câu hỏi về ý nghĩa từ ngữ
- **Khó**: Câu hỏi sâu về ngôn ngữ học và thần học

### 3. Chủ đề phong phú
- Ngôn ngữ Hê-bơ-rơ và Hy Lạp
- Tiên tri Mê-si-a
- Thần học cơ bản
- Lịch sử Kinh Thánh

## Cách sử dụng

### 1. Cấu hình Hibernate
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: create-drop
  sql:
    init:
      mode: always
      data-locations: classpath:data.sql,classpath:questions.sql,classpath:more-questions.sql
      continue-on-error: false
```

### 2. Khởi động ứng dụng
```bash
cd apps/api
./mvnw spring-boot:run
```

### 3. Test dữ liệu
```bash
node test-sql-init.js
```

## Ví dụ câu hỏi

### Câu hỏi dễ
**Sách**: Sáng Thế Ký 1:1
**Nội dung**: "Ban đầu Đức Chúa Trời dựng nên trời đất" - từ "ban đầu" trong tiếng Hê-bơ-rơ có nghĩa gì?
**Đáp án**: Beresheet - Khởi nguyên tuyệt đối
**Giải thích**: Beresheet (בראשית) có nghĩa là "khởi nguyên tuyệt đối", không chỉ là thời gian mà còn là nguyên lý cơ bản của vũ trụ.

### Câu hỏi trung bình
**Sách**: Ma-thi-ơ 5:3
**Nội dung**: "Phước cho những kẻ có lòng nghèo khó" - từ "nghèo khó" trong tiếng Hy Lạp có nghĩa gì?
**Đáp án**: Ptochos - Nghèo khó về tinh thần
**Giải thích**: Ptochos (πτωχός) có nghĩa là "nghèo khó về tinh thần", nhận biết sự cần thiết của mình trước Đức Chúa Trời.

### Câu hỏi khó
**Sách**: Ê-sai 53:5
**Nội dung**: "Người đã bị vì tội lỗi chúng ta mà bị thương" - từ "bị thương" trong tiếng Hê-bơ-rơ có nghĩa gì?
**Đáp án**: Chalal - Bị đâm thủng, bị thương
**Giải thích**: Chalal (חלל) có nghĩa là "bị đâm thủng, bị thương", ám chỉ đến sự chết của Chúa Giê-su trên thập tự.

## Lợi ích

### 1. Nội dung chất lượng
- Câu hỏi được nghiên cứu kỹ lưỡng
- Giải thích chi tiết và chính xác
- Nguồn tham khảo uy tín

### 2. Học tập hiệu quả
- Người học hiểu sâu về ngôn ngữ gốc
- Tăng kiến thức thần học
- Phát triển tư duy phản biện

### 3. Dễ dàng mở rộng
- Có thể thêm câu hỏi mới vào file SQL
- Dễ dàng chỉnh sửa nội dung
- Hỗ trợ nhiều ngôn ngữ

## Lưu ý

### 1. Database
- Đảm bảo MySQL đang chạy
- Database `biblequiz` đã được tạo
- User có quyền tạo bảng

### 2. Cấu hình
- `ddl-auto: create-drop` sẽ xóa và tạo lại dữ liệu mỗi lần start
- `mode: always` sẽ luôn chạy file SQL
- `continue-on-error: false` sẽ dừng nếu có lỗi

### 3. Performance
- File SQL sẽ được chạy mỗi lần start ứng dụng
- Có thể chuyển sang `mode: embedded` để chỉ chạy trong môi trường test

## Troubleshooting

### 1. Lỗi encoding
```
Incorrect string value: '\xE1\xBA\xA1' for column 'name_vi'
```
**Giải pháp**: Đảm bảo database sử dụng UTF-8 encoding

### 2. Lỗi foreign key
```
Cannot add or update a child row: a foreign key constraint fails
```
**Giải pháp**: Kiểm tra thứ tự insert trong file SQL

### 3. Lỗi syntax SQL
```
You have an error in your SQL syntax
```
**Giải pháp**: Kiểm tra cú pháp SQL trong file
