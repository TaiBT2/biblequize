# 2026-06-16 — Quét i18n toàn admin (AIS)

> **Source**: User — chọn VI nhưng admin còn nhiều chỗ tiếng Anh. Chốt: quét toàn admin. · **Scope**: dịch các key `admin.*` trong vi.json còn để English + tên sách coverage (useBookName). Hardcoded-VN-breaks-EN ghi nhận riêng.

### Tasks
- **AIS-1 Dịch tên sách trong CoverageChart** — áp `useBookName` để tên sách theo ngôn ngữ.
- **AIS-2 Dịch các key `admin.*` trong vi.json đang = English** — tìm bằng diff vi==en, dịch sang VI.

### Ghi chú
- Hardcoded VN trong .tsx (QEV/editor: "Đánh giá chất lượng"…) hiển thị VN luôn → VI OK nhưng EN chưa đổi. Ngoài scope đợt VI-fix này.
