# SEO Audit + Fix — BibleQuiz

> Paste vào Claude Code.
> Audit 15 items → fix từng item → verify.

---

```
Audit SEO hiện tại của BibleQuiz và fix tất cả vấn đề tìm được.

BibleQuiz là React SPA (Vite + React 18) — client-side rendering.
Chỉ 4-5 pages cần SEO (public, không cần login). Còn lại (33+ pages sau login) KHÔNG cần SEO.

TRƯỚC KHI CODE: chia thành tasks trong TODO.md.

## PHẦN 1: AUDIT (không fix gì, chỉ kiểm tra)

### Check từng item:

```bash
# 1. index.html meta tags
cat apps/web/index.html

# 2. robots.txt
cat apps/web/public/robots.txt 2>/dev/null || echo "KHÔNG CÓ"

# 3. sitemap.xml
cat apps/web/public/sitemap.xml 2>/dev/null || echo "KHÔNG CÓ"

# 4. Prerender plugin
grep -r "prerender\|prerend\|ssg" apps/web/package.json apps/web/vite.config.ts 2>/dev/null

# 5. Per-page meta management (react-helmet hoặc tương tự)
grep -r "helmet\|react-helmet\|useHead\|useMeta\|document.title" apps/web/src/ --include="*.ts" --include="*.tsx" -l 2>/dev/null

# 6. OG tags
grep -rn "og:\|og:title\|og:image\|OpenGraph" apps/web/src/ apps/api/src/ --include="*.tsx" --include="*.java" 2>/dev/null

# 7. Landing Page
cat apps/web/src/pages/LandingPage.tsx | head -80

# 8. Share Card backend (OG tags cho Facebook/Zalo)
grep -rn "og:\|ShareCard\|/share/" apps/api/src/ --include="*.java" -l 2>/dev/null

# 9. Schema.org
grep -r "schema.org\|application/ld+json\|itemtype" apps/web/ 2>/dev/null

# 10. Canonical URL
grep -r "canonical" apps/web/ 2>/dev/null

# 11. Performance hints
grep -r "preload\|prefetch\|preconnect\|dns-prefetch" apps/web/index.html 2>/dev/null

# 12. Image alt texts
grep -rn "<img" apps/web/src/pages/LandingPage.tsx | grep -v "alt="

# 13. Heading structure (H1)
grep -rn "<h1\|<H1" apps/web/src/pages/LandingPage.tsx 2>/dev/null

# 14. 404 handling
cat apps/web/src/pages/NotFound.tsx | head -20

# 15. Server-side config (nginx, headers)
cat infra/docker/nginx.conf 2>/dev/null | head -40
```

### In bảng kết quả:
```
=== SEO AUDIT ===
| # | Item | Status | Detail |
|---|------|--------|--------|
| 1 | Title tag | ✅/❌ | ... |
| 2 | Meta description | ✅/❌ | ... |
| 3 | OG tags | ✅/❌ | ... |
| 4 | Viewport meta | ✅/❌ | ... |
| 5 | Lang attribute | ✅/❌ | ... |
| 6 | robots.txt | ✅/❌ | ... |
| 7 | sitemap.xml | ✅/❌ | ... |
| 8 | Prerender | ✅/❌ | ... |
| 9 | Per-page titles | ✅/❌ | ... |
| 10 | Share Card OG | ✅/❌ | ... |
| 11 | Landing H1 | ✅/❌ | ... |
| 12 | Image alt texts | ✅/❌ | ... |
| 13 | Schema.org | ✅/❌ | ... |
| 14 | Canonical URL | ✅/❌ | ... |
| 15 | Performance hints | ✅/❌ | ... |

Score: X/15
```

---

## PHẦN 2: FIX

Pages cần SEO:
1. Landing Page (/landing hoặc /) — acquire users từ Google
2. Share Card (/share/:token) — Facebook/Zalo preview
3. Daily Challenge (/daily) — guest chơi thử
4. 404 page

### Task 1: index.html — Meta tags đầy đủ

Cập nhật apps/web/index.html <head>:
- lang="vi" trên <html>
- title: "BibleQuiz — Học Kinh Thánh qua Quiz & Thi đấu"
- meta description: 150-160 chars mô tả app
- OG tags: og:type, og:title, og:description, og:image (1200x630), og:url, og:site_name, og:locale
- Twitter card: summary_large_image
- Favicon: 16x16, 32x32, apple-touch-icon 180x180
- Canonical: https://biblequiz.app
- Performance: preconnect fonts.googleapis.com, dns-prefetch api domain
- theme-color: #11131e

Commit: "seo: comprehensive meta tags in index.html"

### Task 2: robots.txt

Tạo apps/web/public/robots.txt:
- Allow: /landing, /daily, /share/
- Disallow: /admin/, /quiz, /ranked, /practice, /profile, /groups, /tournaments, /room/, /review, /achievements, /multiplayer
- Sitemap: https://biblequiz.app/sitemap.xml

Commit: "seo: robots.txt — allow public pages only"

### Task 3: sitemap.xml

Tạo apps/web/public/sitemap.xml:
- / (priority 1.0, weekly)
- /landing (priority 0.9, weekly)
- /daily (priority 0.8, daily)

Commit: "seo: sitemap.xml"

### Task 4: Prerender public pages

Cài prerender plugin cho Vite:
```bash
cd apps/web && npm install vite-plugin-prerender --save-dev
```

Cập nhật vite.config.ts: prerender routes ['/', '/landing', '/daily']
Verify: npm run build → check dist/landing/index.html có HTML content thật (không phải empty div#root)

Commit: "seo: prerender landing + daily pages"

### Task 5: Landing Page optimize

Trong LandingPage.tsx:
- Đúng 1 H1: "BibleQuiz — Học Kinh Thánh qua Quiz & Thi đấu"
- H2 cho sub-sections
- Alt text cho MỌI image/icon
- Semantic HTML: <header>, <main>, <section>, <footer> thay vì toàn <div>
- Keywords tự nhiên: "quiz kinh thánh", "học kinh thánh", "trắc nghiệm"
- Internal links: CTA → /login, /daily

Commit: "seo: Landing Page — H1, alt texts, semantic HTML"

### Task 6: Schema.org structured data

Thêm JSON-LD vào index.html <head>:
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "BibleQuiz",
  "description": "Nền tảng học Kinh Thánh qua gamification",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web, Android, iOS",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Organization", "name": "Free Methodist Church" }
}
```

Commit: "seo: Schema.org structured data"

### Task 7: Share Card OG Tags (Backend)

Tạo/update ShareCardController.java:
- Detect bot (User-Agent: facebookexternalhit, Zalo, Twitterbot, Googlebot)
- Bot → trả HTML với OG tags (title, description, image 1200x630)
- User → redirect sang SPA

Share Card OG content:
- Quiz Result: "BibleQuiz — 8/10 câu đúng! Giỏi hơn 87%"
- Daily Challenge: "Thử thách ngày [date] hoàn thành!"
- Tier Up: "Đạt cấp [tier name]!"

Test: curl -H "User-Agent: facebookexternalhit/1.1" https://api.biblequiz.app/share/abc123

Commit: "seo: Share Card OG tags for social preview"

### Task 8: Per-page title management

Cài react-helmet-async:
```bash
cd apps/web && npm install react-helmet-async
```

Tạo PageMeta component. Wrap app trong HelmetProvider.
Thêm vào pages chính:
- Landing: "Học Kinh Thánh qua Quiz — BibleQuiz"
- Daily: "Thử thách hàng ngày — BibleQuiz"
- Login: "Đăng nhập — BibleQuiz"
- NotFound: "Trang không tìm thấy — BibleQuiz"

Commit: "seo: per-page title management with react-helmet"

### Task 9: OG Image

Tạo apps/web/public/og-image.png (1200x630px):
- Dark background #11131e
- "BibleQuiz" gold text
- Tagline
- Dùng SVG → convert PNG, hoặc tạo trên Canva

Commit: "seo: OG image 1200x630"

### Task 10: PWA Manifest

Tạo apps/web/public/manifest.json:
- name, short_name, description
- start_url: "/"
- display: "standalone"
- theme_color + background_color: "#11131e"
- icons: 192x192, 512x512

Link trong index.html: <link rel="manifest" href="/manifest.json">

Commit: "seo: PWA manifest"

### Task 11: Nginx/CloudFront config

Nếu có nginx config:
- /assets/*: Cache 1 year (immutable, hashed filenames)
- /index.html: no-cache
- SPA fallback: try_files → /index.html
- Security headers: X-Frame-Options, X-Content-Type-Options
- Gzip enabled

Nếu CloudFront:
- behaviors: /assets/* TTL 1yr, /* TTL 0
- Error pages: 403/404 → /index.html

Commit: "seo: server cache + security headers"

---

## PHẦN 3: VERIFY

```bash
echo "=== POST-FIX SEO AUDIT ==="
test -f apps/web/public/robots.txt && echo "✅ 1. robots.txt" || echo "❌ 1. robots.txt"
test -f apps/web/public/sitemap.xml && echo "✅ 2. sitemap.xml" || echo "❌ 2. sitemap.xml"
grep -q "og:title" apps/web/index.html && echo "✅ 3. OG tags" || echo "❌ 3. OG tags"
grep -q 'lang="vi"' apps/web/index.html && echo "✅ 4. Lang attr" || echo "❌ 4. Lang attr"
grep -q "description" apps/web/index.html && echo "✅ 5. Meta desc" || echo "❌ 5. Meta desc"
grep -q "canonical" apps/web/index.html && echo "✅ 6. Canonical" || echo "❌ 6. Canonical"
grep -q "schema.org\|ld+json" apps/web/index.html && echo "✅ 7. Schema" || echo "❌ 7. Schema"
grep -q "preconnect\|dns-prefetch" apps/web/index.html && echo "✅ 8. Perf hints" || echo "❌ 8. Perf hints"
grep -q "theme-color" apps/web/index.html && echo "✅ 9. Theme color" || echo "❌ 9. Theme color"
test -f apps/web/public/og-image.png -o -f apps/web/public/og-image.svg && echo "✅ 10. OG image" || echo "❌ 10. OG image"
test -f apps/web/public/manifest.json && echo "✅ 11. PWA manifest" || echo "❌ 11. PWA manifest"
grep -q "helmet\|react-helmet" apps/web/package.json && echo "✅ 12. Helmet" || echo "❌ 12. Helmet"
grep -q "prerender\|ssg" apps/web/package.json apps/web/vite.config.ts 2>/dev/null && echo "✅ 13. Prerender" || echo "❌ 13. Prerender"
H1=$(grep -c "<h1\|<H1" apps/web/src/pages/LandingPage.tsx 2>/dev/null)
[ "$H1" = "1" ] && echo "✅ 14. Landing H1=1" || echo "❌ 14. Landing H1=$H1"
NOALT=$(grep "<img" apps/web/src/pages/LandingPage.tsx 2>/dev/null | grep -vc "alt=" || echo 0)
[ "$NOALT" = "0" ] && echo "✅ 15. All imgs have alt" || echo "❌ 15. $NOALT imgs missing alt"
echo "=== Count ✅ above for score ==="
```

### Online tools (sau deploy):
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Google Rich Results: https://search.google.com/test/rich-results
- PageSpeed Insights: https://pagespeed.web.dev/
- Chrome DevTools → Lighthouse → SEO

### Keywords target:
- "quiz kinh thánh" (primary)
- "trắc nghiệm kinh thánh" (primary)
- "học kinh thánh online" (secondary)
- "bible quiz tiếng việt" (secondary)
- "app học kinh thánh cho giới trẻ" (long-tail)
- "thi đua kinh thánh nhóm hội thánh" (long-tail)

---

## Thứ tự:
Task 1 (meta tags) → 2 (robots) → 3 (sitemap) → 5 (Landing) → 6 (Schema) → 8 (helmet) → 9 (OG image) → 10 (manifest) → 7 (Share Card backend) → 4 (prerender) → 11 (nginx) → VERIFY

Expected: SEO score ~10% → ~90%.
Mỗi task commit riêng. Regression sau tất cả.
```
