# Approved Dependencies

> Extracted from CLAUDE.md on 2026-05-09. Referenced from CLAUDE.md §References.
> Updates: thay đổi → update file này, KHÔNG add lại vào CLAUDE.md.

## Frontend (web) — đã có, thoải mái dùng

- react 18.2, react-dom, react-router-dom
- @tanstack/react-query 5.56
- zustand 4.5
- axios
- @stomp/stompjs
- tailwindcss 3.4
- vitest 4.1, @testing-library/react, @testing-library/user-event
- @playwright/test
- react-i18next 17, react-helmet-async 3

## Frontend (web) — CẦN HỎI trước khi thêm

- Bất kỳ UI library mới (shadcn, radix, headless-ui, ...)
- Animation library (framer-motion, react-spring, ...)
- Form library (react-hook-form, formik, ...)
- Chart library mới (hiện dùng inline SVG)
- Bất kỳ dependency nào chưa có trong `package.json`

## Mobile (Expo) — đã có, thoải mái dùng

- expo ~54.0.33
- react-native 0.81.5
- expo-haptics ~15.0.8
- @react-navigation/* (navigation)

## Mobile — CẦN HỎI trước khi thêm

- Native modules cần build custom dev client
- State libraries khác Zustand (đã align với web)
- Animation/gesture libraries native

## Backend — đã có, thoải mái dùng

- Spring Boot 3.3.0 starters: web, data-jpa, security, websocket, validation, cache
- Flyway, JJWT, springdoc-openapi, spring-dotenv, MapStruct
- Testcontainers, JUnit 5, Mockito

## Backend — CẦN HỎI trước khi thêm

- Bất kỳ dependency nào chưa có trong `pom.xml`
- Native libraries cần OS-specific binaries
- Replacement cho core: ORM khác JPA, security framework khác Spring Security

---

## Process khi cần thêm dependency mới

1. Hỏi user TRƯỚC — không tự install
2. Nếu approved: ghi lý do + alternatives đã consider vào `DECISIONS.md`
3. Update file này thêm dep mới vào danh sách "đã có"
4. Verify license compatible (MIT/Apache/BSD ưu tiên)
