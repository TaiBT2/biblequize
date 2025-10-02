# Sử dụng Maven với JDK 17
FROM maven:3.9.9-eclipse-temurin-17 AS build

# Đặt thư mục làm việc
WORKDIR /app

# Copy toàn bộ source vào container
COPY . .

# Build ứng dụng Spring Boot (bỏ test nếu muốn nhanh hơn)
RUN mvn clean package -DskipTests

# -------------------------------------
# Stage chạy ứng dụng
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy file jar từ stage build
COPY --from=build /app/target/biblequiz-api-0.1.0.jar app.jar

# Expose port
EXPOSE 8080

# Command chạy app
ENTRYPOINT ["java", "-jar", "app.jar"]

