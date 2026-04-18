# Fix i18n — Admin Seasons Page + Audit toàn bộ Admin

> Fix hardcoded Vietnamese text trong admin Seasons page.
> Audit tất cả admin pages khác để tìm thiếu i18n.
> Paste vào Claude Code.

---

```
Page /admin/rankings (Seasons & Rankings) còn nhiều text tiếng Việt hardcoded.
Cần fix + audit toàn bộ admin pages.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

## Bước 0: Find file Seasons page

```bash
find apps/web/src -path "*admin*" \( -name "*Season*" -o -name "*Ranking*" \) | head
# Có thể là: apps/web/src/pages/admin/SeasonsPage.tsx hoặc admin/RankingsPage.tsx
```

## Bước 1: Audit hardcoded Vietnamese trong Seasons page

```bash
SEASONS_FILE="apps/web/src/pages/admin/SeasonsPage.tsx"  # Adjust path

echo "=== Hardcoded Vietnamese text trong Seasons page ==="
grep -n "['\"][A-ZĐ][a-zA-ZÀ-ỹ ]\{2,\}" "$SEASONS_FILE" | grep -v "import\|from\|className\|testID\|t(" 
```

Expected output (text cần fix):
- "Tên mùa giải"
- "Tạo mùa giải"
- "+ Tạo mùa mới"
- "ĐANG DIỄN RA"
- "Kết thúc sớm"
- "Đã kết thúc"
- "Tạo mùa mới"

## Bước 2: Update i18n files

### Vietnamese: `apps/web/src/i18n/vi.json`

Tìm hoặc tạo section `admin.seasons`:

```json
{
  "admin": {
    "seasons": {
      "pageTitle": "Mùa giải & Xếp hạng",
      "seasonCount_one": "{{count}} mùa giải",
      "seasonCount_other": "{{count}} mùa giải",
      
      "createNew": "+ Tạo mùa mới",
      "createForm": {
        "title": "Tạo mùa giải mới",
        "namePlaceholder": "Tên mùa giải",
        "startDatePlaceholder": "Ngày bắt đầu",
        "endDatePlaceholder": "Ngày kết thúc",
        "submitButton": "Tạo mùa giải",
        "creating": "Đang tạo...",
        
        "errors": {
          "nameRequired": "Vui lòng nhập tên mùa giải",
          "datesRequired": "Vui lòng chọn ngày bắt đầu và kết thúc",
          "invalidDateRange": "Ngày kết thúc phải sau ngày bắt đầu",
          "overlap": "Mùa giải này trùng thời gian với mùa giải khác"
        }
      },
      
      "status": {
        "active": "ĐANG DIỄN RA",
        "upcoming": "SẮP DIỄN RA",
        "ended": "Đã kết thúc"
      },
      
      "actions": {
        "endEarly": "Kết thúc sớm",
        "viewDetails": "Xem chi tiết",
        "edit": "Chỉnh sửa",
        "delete": "Xóa",
        "endEarlyConfirm": {
          "title": "Kết thúc mùa giải sớm?",
          "message": "Hành động này sẽ kết thúc mùa giải ngay lập tức và phân phối badges cho top 3 mỗi tier. Không thể hoàn tác.",
          "cancel": "Hủy",
          "confirm": "Kết thúc mùa giải"
        }
      },
      
      "details": {
        "duration": "{{start}} → {{end}}",
        "participants": "{{count}} người tham gia",
        "topPlayers": "Top người chơi"
      },
      
      "empty": {
        "title": "Chưa có mùa giải nào",
        "description": "Tạo mùa giải đầu tiên để bắt đầu cuộc thi",
        "action": "Tạo mùa giải"
      }
    }
  }
}
```

### English: `apps/web/src/i18n/en.json`

```json
{
  "admin": {
    "seasons": {
      "pageTitle": "Seasons & Rankings",
      "seasonCount_one": "{{count}} season",
      "seasonCount_other": "{{count}} seasons",
      
      "createNew": "+ New Season",
      "createForm": {
        "title": "Create New Season",
        "namePlaceholder": "Season name",
        "startDatePlaceholder": "Start date",
        "endDatePlaceholder": "End date",
        "submitButton": "Create Season",
        "creating": "Creating...",
        
        "errors": {
          "nameRequired": "Please enter a season name",
          "datesRequired": "Please select start and end dates",
          "invalidDateRange": "End date must be after start date",
          "overlap": "This season overlaps with an existing season"
        }
      },
      
      "status": {
        "active": "ACTIVE",
        "upcoming": "UPCOMING",
        "ended": "Ended"
      },
      
      "actions": {
        "endEarly": "End Early",
        "viewDetails": "View Details",
        "edit": "Edit",
        "delete": "Delete",
        "endEarlyConfirm": {
          "title": "End Season Early?",
          "message": "This will immediately end the season and distribute badges to the top 3 of each tier. This cannot be undone.",
          "cancel": "Cancel",
          "confirm": "End Season"
        }
      },
      
      "details": {
        "duration": "{{start}} → {{end}}",
        "participants": "{{count}} participants",
        "topPlayers": "Top Players"
      },
      
      "empty": {
        "title": "No seasons yet",
        "description": "Create your first season to start the competition",
        "action": "Create Season"
      }
    }
  }
}
```

Commit: "feat: i18n strings for admin seasons page (vi + en)"

## Bước 3: Update SeasonsPage component

Replace tất cả hardcoded strings bằng `t()`:

```typescript
// SeasonsPage.tsx
import { useTranslation } from 'react-i18next'

export const SeasonsPage = () => {
  const { t } = useTranslation()
  const { data: seasons } = useQuery(...)
  
  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {t('admin.seasons.pageTitle')}
          </h1>
          <p className="text-white/60 mt-1">
            {t('admin.seasons.seasonCount', { count: seasons?.length || 0 })}
          </p>
        </div>
        
        <button className="...">
          {t('admin.seasons.createNew')}
        </button>
      </div>
      
      {/* Create form */}
      <div className="bg-white/5 rounded-xl p-6 mb-6">
        <input
          type="text"
          placeholder={t('admin.seasons.createForm.namePlaceholder')}
          className="..."
        />
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <input
            type="date"
            placeholder={t('admin.seasons.createForm.startDatePlaceholder')}
            className="..."
          />
          <input
            type="date"
            placeholder={t('admin.seasons.createForm.endDatePlaceholder')}
            className="..."
          />
        </div>
        
        <button className="mt-4 ...">
          {isCreating 
            ? t('admin.seasons.createForm.creating')
            : t('admin.seasons.createForm.submitButton')}
        </button>
      </div>
      
      {/* Active season card */}
      {activeSeason && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-4">
          <span className="text-xs font-semibold text-emerald-400 tracking-wider">
            {t('admin.seasons.status.active')}
          </span>
          <h3 className="text-xl font-bold text-white mt-2">
            {activeSeason.name}
          </h3>
          <p className="text-white/60 text-sm mt-1">
            {t('admin.seasons.details.duration', {
              start: activeSeason.startDate,
              end: activeSeason.endDate
            })}
          </p>
          
          <button 
            onClick={() => handleEndEarly(activeSeason.id)}
            className="..."
          >
            {t('admin.seasons.actions.endEarly')}
          </button>
        </div>
      )}
      
      {/* Ended seasons */}
      {endedSeasons.map(season => (
        <div key={season.id} className="bg-white/5 rounded-xl p-4 mb-2">
          <h4 className="text-white font-semibold">{season.name}</h4>
          <p className="text-white/40 text-sm">
            {t('admin.seasons.details.duration', {
              start: season.startDate,
              end: season.endDate
            })}
          </p>
          <span className="text-white/40 text-sm">
            {t('admin.seasons.status.ended')}
          </span>
        </div>
      ))}
      
      {/* Empty state */}
      {seasons?.length === 0 && (
        <EmptyState
          icon="🏆"
          title={t('admin.seasons.empty.title')}
          description={t('admin.seasons.empty.description')}
          actionLabel={t('admin.seasons.empty.action')}
          onAction={handleCreate}
        />
      )}
    </AdminLayout>
  )
}
```

Commit: "fix: i18n for admin seasons page"

## Bước 4: Audit TẤT CẢ admin pages

Tìm hardcoded Vietnamese trong toàn bộ admin folder:

```bash
echo "=== Hardcoded Vietnamese trong tất cả admin pages ==="

find apps/web/src -path "*admin*" -name "*.tsx" | while read file; do
  # Tìm Vietnamese text không qua t()
  HARDCODED=$(grep -nE "['\"][A-ZĐ][a-zA-ZÀ-ỹ ]{3,}['\"]" "$file" 2>/dev/null | \
    grep -v "import\|from\|className\|testID\|t('\|t(\"" | wc -l)
  
  if [ "$HARDCODED" -gt 0 ]; then
    echo ""
    echo "📄 $file ($HARDCODED hardcoded strings)"
    grep -nE "['\"][A-ZĐ][a-zA-ZÀ-ỹ ]{3,}['\"]" "$file" 2>/dev/null | \
      grep -v "import\|from\|className\|testID\|t('\|t(\"" | head -10
  fi
done
```

Expected: list các files cần fix.

## Bước 5: Fix các admin pages còn lại

Theo audit ở Bước 4, fix từng file. Pattern chung:

1. Identify hardcoded strings
2. Add vào `vi.json` + `en.json` theo namespace `admin.{pageName}.*`
3. Replace `"Text"` → `{t('admin.pageName.key')}`
4. Test cả 2 language

### Admin pages cần check:

```
admin/DashboardPage.tsx        → namespace: admin.dashboard
admin/UsersPage.tsx            → namespace: admin.users  
admin/QuestionsPage.tsx        → namespace: admin.questions
admin/AIGeneratorPage.tsx      → namespace: admin.aiGenerator
admin/ReviewQueuePage.tsx      → namespace: admin.reviewQueue
admin/FeedbackPage.tsx         → namespace: admin.feedback
admin/SeasonsPage.tsx          → namespace: admin.seasons (DONE)
admin/EventsPage.tsx           → namespace: admin.events
admin/GroupsPage.tsx           → namespace: admin.groups
admin/NotificationsPage.tsx    → namespace: admin.notifications
admin/ConfigurationPage.tsx    → namespace: admin.configuration
admin/ExportPage.tsx           → namespace: admin.export
admin/QuestionQualityPage.tsx  → namespace: admin.questionQuality
```

### Common admin strings (shared):

```json
// admin.common namespace
{
  "admin": {
    "common": {
      "search": "Tìm kiếm...",
      "filter": "Lọc",
      "export": "Xuất",
      "refresh": "Làm mới",
      "loading": "Đang tải...",
      "noData": "Không có dữ liệu",
      "error": "Có lỗi xảy ra",
      
      "actions": {
        "create": "Tạo mới",
        "edit": "Chỉnh sửa",
        "delete": "Xóa",
        "save": "Lưu",
        "cancel": "Hủy",
        "confirm": "Xác nhận",
        "view": "Xem",
        "approve": "Duyệt",
        "reject": "Từ chối",
        "ban": "Khóa",
        "unban": "Mở khóa"
      },
      
      "status": {
        "active": "Đang hoạt động",
        "inactive": "Không hoạt động",
        "pending": "Chờ duyệt",
        "approved": "Đã duyệt",
        "rejected": "Đã từ chối",
        "banned": "Đã khóa"
      },
      
      "confirmDelete": {
        "title": "Xác nhận xóa?",
        "message": "Hành động này không thể hoàn tác.",
        "cancel": "Hủy",
        "confirm": "Xóa"
      }
    }
  }
}
```

English version tương tự.

Commit per page: "fix: i18n for admin {pageName} page"

## Bước 6: Sidebar navigation labels

```bash
# Sidebar có thể cũng hardcoded
find apps/web/src -name "*Sidebar*" -path "*admin*" | xargs grep -l "Dashboard\|Users\|Questions"
```

```json
// admin.nav namespace
{
  "admin": {
    "nav": {
      "dashboard": "Dashboard",
      "users": "Users",
      "questions": "Questions",
      "aiGenerator": "AI Generator",
      "reviewQueue": "Review Queue",
      "feedback": "Feedback",
      "seasons": "Seasons & Rankings",
      "events": "Events & Tournaments",
      "groups": "Groups",
      "notifications": "Notifications",
      "configuration": "Configuration",
      "export": "Export Center",
      "questionQuality": "Question Quality",
      "backToMain": "Về trang chính"
    }
  }
}
```

Note: Tên navigation thường giữ nguyên tiếng Anh (Dashboard, Users) cho cả 2 ngôn ngữ vì đây là technical terms quen thuộc. Nhưng "Về trang chính" cần dịch.

```json
// English
"backToMain": "Back to Main"
```

## Bước 7: Top bar elements

Trong screenshot mình thấy "Search analytics or logs..." — placeholder này cũng nên qua i18n:

```json
{
  "admin": {
    "topBar": {
      "searchPlaceholder": "Tìm kiếm analytics hoặc logs...",  // vi
      "searchPlaceholder": "Search analytics or logs...",     // en
      "newQuiz": "+ Quiz mới",                                // vi
      "newQuiz": "+ New Quiz",                                // en
      "notifications": "Thông báo",                           // vi
      "history": "Lịch sử"                                    // vi
    }
  }
}
```

## Bước 8: Verify

```bash
# Switch sang English mode
# Mở /admin/rankings
# Verify tất cả text đã dịch

# Switch về Vietnamese
# Verify lại
```

Manual checklist:
- [ ] Page title đã i18n
- [ ] Form placeholders đã i18n
- [ ] Buttons đã i18n
- [ ] Status badges đã i18n
- [ ] Confirm dialogs đã i18n
- [ ] Empty states đã i18n
- [ ] Error messages đã i18n
- [ ] Date format theo locale (Intl.DateTimeFormat)
- [ ] Số đếm có pluralization (1 season vs 2 seasons)

## Bước 9: Fix date formatting

Date "2026-03-01 → 2026-05-31" hiện chỉ format ISO. Nên dùng locale:

```typescript
// utils/formatters.ts
import { useTranslation } from 'react-i18next'

export const useDateFormatter = () => {
  const { i18n } = useTranslation()
  
  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN'
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const formatDateRange = (start: string | Date, end: string | Date) => {
    return `${formatDate(start)} → ${formatDate(end)}`
  }
  
  return { formatDate, formatDateRange }
}

// Usage trong SeasonsPage:
const { formatDateRange } = useDateFormatter()
// ...
<p>{formatDateRange(season.startDate, season.endDate)}</p>

// vi: "1 thg 3, 2026 → 31 thg 5, 2026"
// en: "Mar 1, 2026 → May 31, 2026"
```

Commit: "feat: locale-aware date formatting"

## Bước 10: Pluralization

```typescript
// Thay vì hardcoded "{count} seasons"
// Dùng pluralization của i18next:

t('admin.seasons.seasonCount', { count: 1 })  // → "1 season" / "1 mùa giải"
t('admin.seasons.seasonCount', { count: 5 })  // → "5 seasons" / "5 mùa giải"

// Vietnamese không có số nhiều phức tạp → key giống nhau
"seasonCount_one": "{{count}} mùa giải",
"seasonCount_other": "{{count}} mùa giải",

// English:
"seasonCount_one": "{{count}} season",
"seasonCount_other": "{{count}} seasons",
```

## Tổng kết

Files cần thay đổi:
1. `vi.json` — thêm `admin.seasons.*`, `admin.common.*`, `admin.nav.*`, `admin.topBar.*`
2. `en.json` — tương tự
3. `SeasonsPage.tsx` — replace hardcoded strings
4. (audit kết quả) — các admin pages khác
5. `formatters.ts` — date formatter helper
6. Sidebar component — i18n nav labels

Effort: 
- Seasons page only: 30 phút
- Toàn bộ admin pages: 3-4 giờ

Sau khi fix xong, switch language test cả 2 ngôn ngữ trong tất cả admin pages.
```
