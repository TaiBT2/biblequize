# 🎯 Bible Quiz — Học Kinh Thánh qua trắc nghiệm

[![Java](https://img.shields.io/badge/Java-17+-orange.svg)](https://openjdk.java.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7.x-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

Bible Quiz là ứng dụng **enterprise-grade** "chơi mà học" Kinh Thánh với kiến trúc microservices, bảo mật toàn diện, và performance tối ưu. Hỗ trợ luyện tập cá nhân, leo hạng hằng ngày, thi phòng nhiều người, giải đấu 1v1, và trang admin quản trị nội dung/câu hỏi (kể cả sinh tự động bằng AI).

## ✨ Tính năng chính

### 🎮 Game Modes
- **Single-player & Practice**: Chơi cá nhân không giới hạn, không ảnh hưởng leaderboard
- **Ranked Mode**: Leo hạng với giới hạn 50 câu/ngày, 30 mạng/ngày, tự động chuyển sách theo thứ tự Sáng Thế Ký → Khải Huyền
- **Multiplayer Rooms**: Phòng thi nhiều người với realtime scoreboard
- **Tournament Mode**: Giải đấu 1v1 loại trực tiếp (mỗi người 3 mạng/trận)
- **Achievement System**: Hệ thống thành tích và bookmark câu hỏi

### 🛠️ Admin Features
- **Question Management**: CRUD/import câu hỏi, duyệt góp ý, analytics
- **AI Question Generator**: Tự động sinh câu hỏi bằng AWS Bedrock
- **User Management**: Quản lý người dùng và phân quyền
- **Analytics Dashboard**: Thống kê chi tiết về người dùng và câu hỏi

### 🔒 Security & Performance
- **OAuth2 Authentication**: Google/Facebook SSO với JWT tokens
- **Rate Limiting**: API rate limiting và security headers
- **Performance Optimization**: Database indexing, Redis caching, query optimization
- **Monitoring**: Real-time performance monitoring và security auditing

## 🏗️ Tech Stack

### Backend
- **Framework**: Spring Boot 3.x với Java 17+
- **Database**: MySQL 8.0 với Flyway migrations
- **Cache**: Redis 7.x cho session và performance
- **Security**: OAuth2 + JWT với Spring Security
- **WebSocket**: STOMP cho realtime communication
- **Documentation**: Swagger/OpenAPI integration
- **Testing**: JUnit, Mockito, Load testing

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **State Management**: Context API + React Query
- **UI**: Tailwind CSS với custom components
- **Routing**: React Router v6
- **Error Handling**: Error Boundaries + Global error context

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Logback + Performance monitoring
- **Cloud**: AWS (RDS, ElastiCache, S3, CloudFront, ECS/ALB)

## 📁 Cấu trúc dự án

```
biblequiz/
├── apps/
│   ├── web/                    # React Frontend (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── components/     # UI Components
│   │   │   ├── pages/          # Page Components
│   │   │   ├── contexts/       # React Contexts
│   │   │   ├── hooks/          # Custom Hooks
│   │   │   ├── api/            # API Client
│   │   │   └── styles/         # Global Styles
│   │   └── package.json
│   └── api/                    # Spring Boot Backend
│       ├── src/main/java/com/biblequiz/
│       │   ├── controller/     # REST Controllers
│       │   ├── service/        # Business Logic
│       │   ├── repository/     # Data Access
│       │   ├── entity/         # JPA Entities
│       │   ├── security/       # Security Configuration
│       │   ├── business/       # Business Rules Engine
│       │   ├── consistency/    # Data Consistency
│       │   ├── performance/    # Performance Optimization
│       │   └── config/         # Configuration
│       ├── src/main/resources/
│       │   ├── db/migration/   # Flyway Migrations
│       │   └── application*.yml
│       └── pom.xml
├── infra/
│   └── docker/                 # Dockerfiles
├── compose.yml                 # Docker Compose
├── BUSINESS_RULES.md           # Business Rules Documentation
├── SPEC.md                     # Technical Specification
├── SPRINTS.md                  # Sprint Planning
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0
- Redis 7.x

### Local Development

1. **Clone repository**
```bash
git clone https://github.com/your-org/biblequiz.git
cd biblequiz
```

2. **Start infrastructure**
```bash
docker-compose up -d mysql redis
```

3. **Backend setup**
```bash
cd apps/api
./mvnw spring-boot:run
```

4. **Frontend setup**
```bash
cd apps/web
npm install
npm run dev
```

5. **Access application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- MySQL: localhost:3306
- Redis: localhost:6379

### Environment Configuration
- Copy `env.example` to `env.local` và cấu hình các biến môi trường
- OAuth2 credentials: Cấu hình Google/Facebook OAuth2
- Database: MySQL connection settings
- Redis: Cache configuration

## 📚 Documentation

- **[SPEC.md](./SPEC.md)**: Technical specification và architecture
- **[BUSINESS_RULES.md](./BUSINESS_RULES.md)**: Business rules và game mechanics
- **[SPRINTS.md](./SPRINTS.md)**: Sprint planning và roadmap
- **[SETUP.md](./SETUP.md)**: Detailed setup instructions
- **API Documentation**: Swagger UI tại `/swagger-ui.html`

## 🎯 Key Features

### 🏆 Ranking System
- **66-Book Progression**: Từ Sáng Thế Ký đến Khải Huyền
- **Mastery Requirements**: 70% accuracy + 100 questions per book
- **Daily Limits**: 50 questions/day, 30 lives/day
- **Scoring**: Base points + speed bonus + streak bonus

### 🎮 Game Modes
- **Practice Mode**: Unlimited practice với explanations
- **Ranked Mode**: Competitive ranking với daily limits
- **Multiplayer Rooms**: Real-time multiplayer với WebSocket
- **Tournament Mode**: 1v1 elimination tournaments

### 🛡️ Enterprise Features
- **Security**: OAuth2 + JWT, rate limiting, security headers
- **Performance**: Database optimization, Redis caching, monitoring
- **Scalability**: Microservices architecture, load balancing
- **Monitoring**: Real-time performance và security auditing

## 🧪 Testing

```bash
# Backend tests
cd apps/api
./mvnw test

# Frontend tests
cd apps/web
npm test

# Load testing
./mvnw test -Dtest=PerformanceTest
```

## 📊 Performance Metrics

- **API Response Time**: <200ms P95
- **Concurrent Users**: 10,000+ supported
- **Database Queries**: Optimized với strategic indexing
- **Cache Hit Rate**: >90% for frequently accessed data
- **Uptime**: 99.9%+ availability target

## 🔧 Development

### Code Quality
- **Linting**: ESLint (Frontend), Checkstyle (Backend)
- **Testing**: Jest (Frontend), JUnit (Backend)
- **Documentation**: JSDoc, JavaDoc
- **Git Hooks**: Pre-commit validation

### Contributing
1. Fork repository
2. Create feature branch
3. Follow coding standards
4. Add tests
5. Submit pull request

## 📈 Roadmap

### v1.0 (Current)
- ✅ Core game mechanics
- ✅ OAuth2 authentication
- ✅ Multiplayer rooms
- ✅ Admin panel
- ✅ Performance optimization

### v1.1 (Next)
- 🔄 Mobile app (React Native)
- 🔄 Advanced analytics
- 🔄 A/B testing framework
- 🔄 Full-text search

### v1.2 (Future)
- 📱 PWA support
- 🌐 Multi-language support
- 🤖 Advanced AI features
- 📊 Real-time analytics

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/biblequiz/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/biblequiz/discussions)
- **Email**: support@biblequiz.com

---

**Made with ❤️ for Bible education**

