# Design System — "The Sacred Modernist"

> Extracted from CLAUDE.md on 2026-05-09. Referenced from CLAUDE.md §References.
> Updates: thay đổi → update file này, KHÔNG add lại vào CLAUDE.md.

## Stitch MCP
- **Server**: `https://stitch.googleapis.com/mcp` (HTTP transport)
- **Project ID**: `5341030797678838526`
- **Auth**: Google OAuth2 Bearer token (refresh: `gcloud auth print-access-token`)
- **Config**: `.mcp.json` at project root

## Design Tokens (bắt buộc tuân theo)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#11131e` | Page background |
| Surface Container | `#1d1f2a` | Cards, panels |
| Secondary (Gold) | `#e8a832` | CTA buttons, highlights, accents |
| Tertiary | `#e7c268` | Gold gradient end |
| On-Surface | `#e1e1f1` | Primary text |
| Error | Standard red | Error states |
| Font | Be Vietnam Pro | All text |
| Icons | Material Symbols Outlined | All icons |

## CSS Utilities (`global.css` — KHÔNG tạo mới, dùng đúng class đã có)

```css
.glass-card     → Cards: rgba(50,52,64,0.6) + backdrop-blur(12px)
.glass-panel    → Panels: rgba(50,52,64,0.6) + backdrop-blur(20px)
.gold-gradient  → CTA buttons: linear-gradient(135deg, #e8a832, #e7c268)
.gold-glow      → Hover effect: box-shadow 0 0 20px rgba(232,168,50,0.2)
.streak-grid    → Heatmap: grid 20 columns
.timer-svg      → Quiz timer: rotate(-90deg)
```

## Quy tắc UI bắt buộc

- Mọi screen mới phải dùng design tokens ở trên — KHÔNG hardcode màu khác
- Card → dùng `.glass-card`, KHÔNG tự tạo card style mới
- CTA button → dùng `.gold-gradient`, KHÔNG dùng màu khác cho primary action
- Background → luôn `#11131e`, KHÔNG dùng black hay dark gray khác
- Font → Be Vietnam Pro only, import từ Google Fonts
- Khi có Stitch design → phải match pixel-perfect
- Khi không có Stitch design (custom) → follow cùng design tokens + pattern từ screens đã sync
- Responsive: mobile-first, breakpoints theo Tailwind default (sm/md/lg/xl)

## Answer color palette (C5 lock)

| Option | Color | Usage |
|--------|-------|-------|
| A | Coral | Quiz answer A button |
| B | Sky | Quiz answer B button |
| C | Gold | Quiz answer C button |
| D | Sage | Quiz answer D button |

## Khi nghi ngờ về design

1. Check Stitch MCP TRƯỚC, KHÔNG tự design
2. Nếu Stitch không có → follow design tokens + pattern từ screens đã sync
3. Workflow Stitch sync chi tiết → `docs/dev/workflows.md`
