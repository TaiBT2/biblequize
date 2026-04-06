# Pre-Launch Mandatory — Bắt buộc trước khi lên Store

> Store reject nếu thiếu + Users bỏ app nếu thiếu.
> Chia 6 sections. Paste từng section hoặc toàn bộ vào Claude Code.

---

```
Fix tất cả vấn đề bắt buộc trước khi publish lên Google Play / Apple App Store.
Thiếu bất kỳ item nào → bị reject hoặc users uninstall ngay.

TRƯỚC KHI CODE: đọc code hiện tại. Chia tasks vào TODO.md.

## Bước 0: Kiểm tra hiện trạng

```bash
# 1. Onboarding — có flow cho user mới chưa?
grep -rn "onboard\|welcome\|tutorial\|first.*time\|isNewUser\|firstLogin" apps/web/src/ apps/api/src/ --include="*.tsx" --include="*.java" | head -10

# 2. Error handling — có Error Boundary chưa?
grep -rn "ErrorBoundary\|error.*boundary\|fallback\|componentDidCatch" apps/web/src/ --include="*.tsx" | head -10

# 3. Privacy + Terms — có pages chưa?
find apps/web/src -name "*Privacy*" -o -name "*Terms*" -o -name "*Policy*" | head -5
find apps/api/src -name "*Privacy*" -o -name "*Terms*" | head -5

# 4. Delete account — có endpoint + UI chưa?
grep -rn "delete.*account\|deleteAccount\|deactivate\|removeUser" apps/web/src/ apps/api/src/ --include="*.tsx" --include="*.java" | head -10

# 5. Loading states — có skeleton/shimmer chưa?
grep -rn "Skeleton\|skeleton\|shimmer\|placeholder" apps/web/src/ --include="*.tsx" | head -10

# 6. Offline detection
grep -rn "offline\|online\|navigator.onLine\|NetInfo" apps/web/src/ --include="*.tsx" | head -10

echo "=== Hiện trạng ==="
echo "Onboarding: $(grep -rl 'onboard\|welcome\|tutorial' apps/web/src/ --include='*.tsx' | wc -l) files"
echo "ErrorBoundary: $(grep -rl 'ErrorBoundary' apps/web/src/ --include='*.tsx' | wc -l) files"
echo "Privacy page: $(find apps/web/src -name '*Privacy*' -o -name '*Terms*' | wc -l) files"
echo "Delete account: $(grep -rl 'delete.*account\|deleteAccount' apps/api/src/ --include='*.java' | wc -l) files"
```

In kết quả trước khi code.

===================================================================
## Section 1: Onboarding Flow — Ấn tượng đầu tiên
===================================================================

User mới mở app → PHẢI biết app là gì + cách chơi trong 60 giây.

### Task 1.1: Welcome Slides (3 screens)

Hiện CHỈ lần đầu tiên mở app (check localStorage/AsyncStorage flag).

```typescript
// src/screens/onboarding/OnboardingScreen.tsx (mobile)
// hoặc src/pages/Onboarding.tsx (web)

const SLIDES = [
  {
    icon: '✝',
    title: t('onboarding.slide1Title'),  // "Chào mừng đến BibleQuiz"
    description: t('onboarding.slide1Desc'), // "Học Kinh Thánh qua quiz tương tác mỗi ngày"
    color: '#e8a832',
  },
  {
    icon: '⚔️',
    title: t('onboarding.slide2Title'),  // "Thi đấu cùng nhau"
    description: t('onboarding.slide2Desc'), // "4 chế độ chơi nhóm. Thách đấu anh chị em."
    color: '#3b82f6',
  },
  {
    icon: '🗺️',
    title: t('onboarding.slide3Title'),  // "Hành trình 66 sách"
    description: t('onboarding.slide3Desc'), // "Chinh phục từng sách. Theo dõi tiến trình."
    color: '#22c55e',
  },
]
```

UI: full screen, swipe giữa slides, dots indicator dưới, "Bỏ qua" trên góc, "Bắt đầu" ở slide cuối.

### Task 1.2: Try Before Login — Quiz thử 3 câu

Sau welcome slides → chơi thử 3 câu KHÔNG cần login:

```typescript
// src/screens/onboarding/TryQuizScreen.tsx

// Lấy 3 câu dễ nhất, hardcode hoặc API public endpoint
const SAMPLE_QUESTIONS = [
  {
    content: "Sách đầu tiên trong Kinh Thánh là gì?",
    answers: ["Sáng Thế Ký", "Xuất Hành", "Ma-thi-ơ", "Thi Thiên"],
    correctAnswer: "Sáng Thế Ký",
  },
  // ... 2 câu nữa
]

// Sau 3 câu → hiện kết quả:
// "Bạn đúng 2/3! Đăng ký để tiếp tục hành trình."
// [Đăng ký miễn phí] [Để sau]
```

Backend: thêm endpoint public (không cần auth):
```java
// GET /api/public/sample-questions?language=vi
// Trả 3 câu dễ, random, cho onboarding
@GetMapping("/api/public/sample-questions")
public List<QuestionDto> getSampleQuestions(
    @RequestParam(defaultValue = "vi") String language) {
    return questionService.getRandomEasy(3, language);
}
```

SecurityConfig: cho phép `/api/public/**` không cần auth.

### Task 1.3: Language Selection — Ngay từ đầu

Trước welcome slides hoặc slide đầu tiên:

```
┌──────────────────────────────────────┐
│                                      │
│  Choose your language                │
│  Chọn ngôn ngữ                       │
│                                      │
│  ┌──────────────────────────┐        │
│  │ 🇻🇳  Tiếng Việt          │        │
│  └──────────────────────────┘        │
│  ┌──────────────────────────┐        │
│  │ 🇬🇧  English             │        │
│  └──────────────────────────┘        │
│                                      │
└──────────────────────────────────────┘
```

Lưu choice → i18n + quiz language.

### Task 1.4: First Login Tutorial Tooltips

Sau login lần đầu → hiện tooltips trên Home:

```typescript
// src/components/TutorialOverlay.tsx

// Tooltip 1: chỉ vào Daily Challenge card
// "Thử thách hàng ngày — 5 phút mỗi ngày!"

// Tooltip 2: chỉ vào Streak
// "Chơi mỗi ngày để giữ chuỗi liên tục!"

// Tooltip 3: chỉ vào Game Modes
// "Nhiều chế độ chơi — khám phá ngay!"

// User tap anywhere → next tooltip → done
// Lưu flag: tutorialCompleted = true
```

### Task 1.5: Onboarding Flag

```typescript
// Check xem user đã xem onboarding chưa
const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding')
// Web: localStorage.getItem('hasSeenOnboarding')

if (!hasSeenOnboarding) {
  // Show onboarding → sau khi xong:
  await AsyncStorage.setItem('hasSeenOnboarding', 'true')
}

// Check tutorial
const hasDoneTutorial = await AsyncStorage.getItem('hasDoneTutorial')
// Hiện tooltips lần đầu sau login
```

### Task 1.6: Navigation flow

```
App mở lần đầu:
  → Language Selection
  → Welcome Slides (3 screens)
  → Try Quiz (3 câu không cần login)
  → "Đăng ký để tiếp tục" → Login
  → Home + Tutorial Tooltips
  → Bình thường

App mở lần sau:
  → Đã login? → Home
  → Chưa login? → Login screen
```

```typescript
// RootNavigator logic:
const hasSeenOnboarding = useOnboardingStore(s => s.hasSeenOnboarding)
const isAuthenticated = useAuthStore(s => s.isAuthenticated)
const hasDoneTutorial = useAuthStore(s => s.hasDoneTutorial)

if (!hasSeenOnboarding) return <OnboardingStack />
if (!isAuthenticated) return <LoginScreen />
if (!hasDoneTutorial) return <HomeWithTutorial />
return <MainTabs />
```

Commit: "feat: onboarding flow — welcome slides + try quiz + language + tutorial"

===================================================================
## Section 2: Error Handling — Không bao giờ màn hình trắng
===================================================================

### Task 2.1: Global Error Boundary

```typescript
// src/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo } from 'react'

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error: Error | null }

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Sentry/analytics
    console.error('App Error:', error, errorInfo)
    // TODO: Sentry.captureException(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#11131e] text-white p-8">
          <span className="text-6xl mb-4">😔</span>
          <h1 className="text-xl font-bold mb-2">Có lỗi xảy ra</h1>
          <p className="text-white/60 text-center mb-6">
            Xin lỗi vì sự bất tiện. Vui lòng thử lại.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.href = '/'
            }}
            className="bg-[#e8a832] text-[#11131e] px-6 py-3 rounded-xl font-semibold"
          >
            Về trang chủ
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

Wrap toàn bộ app:
```typescript
// App.tsx hoặc main.tsx
<ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
</ErrorBoundary>
```

### Task 2.2: API Error Handling

```typescript
// src/api/client.ts — thêm global error handler

// TanStack Query — global error handler
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,                    // Retry 3 lần
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 5 * 60 * 1000,   // 5 phút
      
      // Không hiện error cho stale data (dùng cache cũ)
      useErrorBoundary: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Axios interceptor — friendly error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      error.userMessage = 'Không thể kết nối server. Kiểm tra kết nối mạng.'
      return Promise.reject(error)
    }
    
    switch (error.response.status) {
      case 401:
        error.userMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        // Auto logout
        break
      case 403:
        error.userMessage = 'Bạn không có quyền thực hiện thao tác này.'
        break
      case 404:
        error.userMessage = 'Nội dung không tìm thấy.'
        break
      case 429:
        error.userMessage = 'Bạn thao tác quá nhanh. Vui lòng chờ một chút.'
        break
      case 500:
        error.userMessage = 'Lỗi hệ thống. Chúng tôi đang xử lý.'
        break
      default:
        error.userMessage = 'Có lỗi xảy ra. Vui lòng thử lại.'
    }
    
    return Promise.reject(error)
  }
)
```

### Task 2.3: Offline Detection

```typescript
// src/hooks/useOnlineStatus.ts

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Mobile (React Native):
// import NetInfo from '@react-native-community/netinfo'
// const [isOnline, setIsOnline] = useState(true)
// useEffect(() => {
//   const unsubscribe = NetInfo.addEventListener(state => setIsOnline(state.isConnected))
//   return () => unsubscribe()
// }, [])
```

```typescript
// src/components/OfflineBanner.tsx

export const OfflineBanner = () => {
  const isOnline = useOnlineStatus()
  
  if (isOnline) return null
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-2 text-sm">
      📡 Mất kết nối mạng — Một số tính năng có thể không hoạt động
    </div>
  )
}

// Thêm vào AppLayout
<OfflineBanner />
```

### Task 2.4: Empty States

Mỗi list/page cần empty state khi không có data:

```typescript
// src/components/EmptyState.tsx

interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState = ({ icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-8">
    <span className="text-5xl mb-4">{icon}</span>
    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
    {description && <p className="text-white/50 text-center text-sm">{description}</p>}
    {actionLabel && onAction && (
      <button onClick={onAction} className="mt-4 bg-[#e8a832] text-[#11131e] px-5 py-2.5 rounded-xl font-semibold text-sm">
        {actionLabel}
      </button>
    )}
  </div>
)

// Dùng:
// <EmptyState icon="📖" title="Chưa có nhóm" description="Tham gia nhóm hội thánh để thi đấu cùng nhau" actionLabel="Tham gia nhóm" onAction={...} />
// <EmptyState icon="🏆" title="Chưa có giải đấu" description="Giải đấu sẽ được tổ chức sớm" />
// <EmptyState icon="🔔" title="Không có thông báo" />
```

Tìm TẤT CẢ list/page → thêm empty state:

```bash
grep -rn "\.map(" apps/web/src/pages/ apps/web/src/screens/ --include="*.tsx" -l
# Mỗi file có .map() → cần check empty state khi data = []
```

Commit: "feat: error boundary + API errors + offline detection + empty states"

===================================================================
## Section 3: Privacy Policy + Terms of Service
===================================================================

### Task 3.1: Privacy Policy Page

```typescript
// src/pages/PrivacyPolicy.tsx (web)
// Route: /privacy

const PrivacyPolicy = () => (
  <div className="max-w-3xl mx-auto px-6 py-12 text-white/80">
    <h1 className="text-2xl font-bold text-white mb-6">Chính sách Bảo mật</h1>
    <p className="text-sm text-white/40 mb-8">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
    
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">1. Thông tin chúng tôi thu thập</h2>
        <p>Khi bạn sử dụng BibleQuiz, chúng tôi thu thập:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Thông tin tài khoản: email, tên, ảnh đại diện (từ Google Sign-In)</li>
          <li>Dữ liệu quiz: điểm số, câu trả lời, streak, tier, thành tích</li>
          <li>Dữ liệu nhóm: nhóm hội thánh bạn tham gia, vai trò trong nhóm</li>
          <li>Dữ liệu thiết bị: loại thiết bị, hệ điều hành (cho push notification)</li>
        </ul>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">2. Cách chúng tôi sử dụng thông tin</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Cung cấp và cải thiện dịch vụ BibleQuiz</li>
          <li>Hiển thị bảng xếp hạng, thành tích, và tiến trình</li>
          <li>Gửi thông báo (nếu bạn cho phép): streak, daily challenge, nhóm</li>
          <li>Phân tích ẩn danh để cải thiện app</li>
        </ul>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">3. Chia sẻ thông tin</h2>
        <p>Chúng tôi KHÔNG bán hoặc chia sẻ thông tin cá nhân với bên thứ ba, ngoại trừ:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Bảng xếp hạng: tên và điểm hiển thị cho người dùng khác trong app</li>
          <li>Nhóm: thành viên cùng nhóm thấy tên và điểm của bạn</li>
          <li>Yêu cầu pháp luật: khi có yêu cầu từ cơ quan pháp luật</li>
        </ul>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">4. Lưu trữ dữ liệu</h2>
        <p>Dữ liệu được lưu trữ trên Amazon Web Services (AWS) tại khu vực Asia Pacific. Chúng tôi sử dụng mã hóa và biện pháp bảo mật phù hợp để bảo vệ dữ liệu của bạn.</p>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">5. Quyền của bạn</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Xem dữ liệu: xem thông tin cá nhân trong trang Profile</li>
          <li>Sửa dữ liệu: cập nhật tên, ảnh đại diện trong Settings</li>
          <li>Xóa dữ liệu: xóa tài khoản và toàn bộ dữ liệu trong Settings</li>
          <li>Rút consent: tắt thông báo, rời nhóm bất kỳ lúc nào</li>
        </ul>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">6. Trẻ em</h2>
        <p>BibleQuiz dành cho mọi lứa tuổi. Chúng tôi không cố ý thu thập thông tin của trẻ dưới 13 tuổi mà không có sự đồng ý của phụ huynh. Nếu phát hiện, chúng tôi sẽ xóa dữ liệu đó.</p>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">7. Liên hệ</h2>
        <p>Nếu có câu hỏi về chính sách bảo mật, vui lòng liên hệ: privacy@biblequiz.app</p>
      </div>
    </section>
  </div>
)
```

Tạo English version tương tự (hoặc dùng i18n).

### Task 3.2: Terms of Service Page

```typescript
// src/pages/TermsOfService.tsx
// Route: /terms

// Nội dung gồm:
// 1. Chấp nhận điều khoản
// 2. Tài khoản người dùng
// 3. Nội dung và hành vi (không spam, không xúc phạm)
// 4. Quyền sở hữu trí tuệ (câu hỏi thuộc BibleQuiz, Kinh Thánh là public domain)
// 5. Miễn trừ trách nhiệm
// 6. Chấm dứt (ban account nếu vi phạm)
// 7. Thay đổi điều khoản
// 8. Liên hệ
```

### Task 3.3: Routing + Footer links

```typescript
// Router thêm:
<Route path="/privacy" element={<PrivacyPolicy />} />
<Route path="/terms" element={<TermsOfService />} />

// SecurityConfig — public routes:
.requestMatchers("/privacy", "/terms").permitAll()

// Footer trên Landing page + Login page:
<footer>
  <a href="/privacy">Chính sách Bảo mật</a>
  <a href="/terms">Điều khoản Sử dụng</a>
</footer>

// Settings page:
// Mục "Pháp lý":
// → Chính sách Bảo mật
// → Điều khoản Sử dụng
```

Commit: "feat: privacy policy + terms of service pages"

===================================================================
## Section 4: Delete Account — Apple bắt buộc
===================================================================

### Task 4.1: Backend — Delete Account API

```java
// UserController.java hoặc AccountController.java

@DeleteMapping("/api/me/account")
public ResponseEntity<?> deleteAccount(
    Authentication auth,
    @RequestBody DeleteAccountRequest request) {
    
    Long userId = getUserId(auth);
    
    // Verify password hoặc confirm phrase
    if (!"XÓA TÀI KHOẢN".equals(request.getConfirmPhrase()) 
        && !"DELETE ACCOUNT".equals(request.getConfirmPhrase())) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Nhập 'XÓA TÀI KHOẢN' để xác nhận"));
    }
    
    // Delete tất cả data liên quan
    accountDeletionService.deleteUserAccount(userId);
    
    return ResponseEntity.ok(Map.of("message", "Tài khoản đã được xóa"));
}
```

```java
// AccountDeletionService.java

@Service
@RequiredArgsConstructor
@Transactional
public class AccountDeletionService {

    public void deleteUserAccount(Long userId) {
        // Thứ tự xóa quan trọng (foreign keys):
        
        // 1. Quiz data
        userQuestionHistoryRepository.deleteByUserId(userId);
        sessionAnswerRepository.deleteByUserId(userId);
        quizSessionRepository.deleteByUserId(userId);
        
        // 2. Social data
        groupMemberRepository.deleteByUserId(userId);
        tournamentParticipantRepository.deleteByUserId(userId);
        
        // 3. Achievement data
        userBadgeRepository.deleteByUserId(userId);
        userStreakRepository.deleteByUserId(userId);
        
        // 4. Notifications
        notificationRepository.deleteByUserId(userId);
        deviceTokenRepository.deleteByUserId(userId);
        
        // 5. Feedback
        feedbackRepository.deleteByUserId(userId);
        
        // 6. User record
        // Option A: Hard delete
        userRepository.deleteById(userId);
        
        // Option B: Soft delete (giữ record nhưng anonymize)
        // User user = userRepository.findById(userId).orElseThrow();
        // user.setEmail("deleted_" + userId + "@deleted.local");
        // user.setName("Deleted User");
        // user.setAvatar(null);
        // user.setActive(false);
        // user.setDeletedAt(LocalDateTime.now());
        // userRepository.save(user);
        
        // 7. Invalidate tất cả tokens
        // Redis: xóa refresh tokens, session data
        redisTemplate.delete("user:session:" + userId);
        redisTemplate.delete("user:refresh:" + userId);
        
        log.info("Account deleted: userId={}", userId);
    }
}
```

### Task 4.2: Frontend — Delete Account UI

```typescript
// Settings page → mục cuối cùng, màu đỏ

<div className="border-t border-white/10 pt-6 mt-8">
  <h3 className="text-red-400 font-semibold mb-2">Vùng nguy hiểm</h3>
  <button 
    onClick={() => setShowDeleteModal(true)}
    className="text-red-400 border border-red-400/30 px-4 py-2 rounded-lg text-sm hover:bg-red-400/10"
  >
    Xóa tài khoản
  </button>
</div>

{/* Delete confirmation modal */}
{showDeleteModal && (
  <Modal>
    <h2 className="text-xl font-bold text-red-400 mb-4">Xóa tài khoản</h2>
    
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
      <p className="text-sm text-red-300">⚠️ Hành động này KHÔNG THỂ hoàn tác. Tất cả dữ liệu sẽ bị xóa vĩnh viễn:</p>
      <ul className="text-sm text-red-300/80 mt-2 space-y-1 list-disc pl-5">
        <li>Điểm số, streak, tier, thành tích</li>
        <li>Lịch sử quiz và câu trả lời</li>
        <li>Nhóm hội thánh và bảng xếp hạng</li>
        <li>Tất cả dữ liệu cá nhân</li>
      </ul>
    </div>
    
    <p className="text-sm text-white/60 mb-2">Nhập <strong className="text-red-400">XÓA TÀI KHOẢN</strong> để xác nhận:</p>
    <input
      type="text"
      value={confirmPhrase}
      onChange={(e) => setConfirmPhrase(e.target.value)}
      placeholder="XÓA TÀI KHOẢN"
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white mb-4"
    />
    
    <div className="flex gap-3">
      <button onClick={() => setShowDeleteModal(false)} className="flex-1 btn-outline">
        Hủy
      </button>
      <button
        onClick={handleDeleteAccount}
        disabled={confirmPhrase !== 'XÓA TÀI KHOẢN' && confirmPhrase !== 'DELETE ACCOUNT'}
        className="flex-1 bg-red-500 text-white rounded-lg py-2 disabled:opacity-30"
      >
        Xóa vĩnh viễn
      </button>
    </div>
  </Modal>
)}
```

Sau khi xóa: clear local storage → redirect về Landing/Login page.

Commit: "feat: delete account — backend cleanup + confirmation UI"

===================================================================
## Section 5: Loading States — Skeleton UI
===================================================================

### Task 5.1: Skeleton Component

```typescript
// src/components/Skeleton.tsx

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded ${className}`} />
)

// Variants
export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
)

export const SkeletonCard = () => (
  <div className="bg-white/5 rounded-xl p-4 space-y-3">
    <Skeleton className="h-5 w-1/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
)

export const SkeletonAvatar = ({ size = 40 }: { size?: number }) => (
  <Skeleton className="rounded-full" style={{ width: size, height: size }} />
)

export const SkeletonLeaderboardRow = () => (
  <div className="flex items-center gap-3 p-3">
    <Skeleton className="h-6 w-6 rounded" />
    <SkeletonAvatar size={36} />
    <div className="flex-1 space-y-1">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
    <Skeleton className="h-5 w-16" />
  </div>
)
```

### Task 5.2: Apply cho mỗi page

```typescript
// Home page loading:
if (isLoading) return (
  <div className="space-y-4 p-4">
    <SkeletonCard />           {/* Daily challenge */}
    <SkeletonCard />           {/* Streak + energy */}
    <div className="grid grid-cols-2 gap-3">
      <SkeletonCard />         {/* Game mode 1 */}
      <SkeletonCard />         {/* Game mode 2 */}
    </div>
    <SkeletonCard />           {/* Leaderboard mini */}
  </div>
)

// Leaderboard loading:
if (isLoading) return (
  <div className="space-y-1">
    {Array.from({ length: 10 }).map((_, i) => (
      <SkeletonLeaderboardRow key={i} />
    ))}
  </div>
)

// Profile loading:
if (isLoading) return (
  <div className="p-4 space-y-4">
    <div className="flex items-center gap-4">
      <SkeletonAvatar size={64} />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
)
```

Tìm TẤT CẢ pages có loading state → thay spinner bằng skeleton:

```bash
grep -rn "isLoading\|loading\|Loading\|Spinner\|spinner" apps/web/src/pages/ --include="*.tsx" -l
```

Commit: "feat: skeleton loading states for all pages"

===================================================================
## Section 6: Crash Monitoring — Sentry
===================================================================

### Task 6.1: Setup Sentry (free tier đủ)

```bash
# Web
cd apps/web && npm install @sentry/react

# Mobile (nếu RN)
# npm install @sentry/react-native
```

```typescript
// src/sentry.ts
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,  // Từ sentry.io dashboard
  environment: import.meta.env.MODE,       // 'development' | 'production'
  tracesSampleRate: 0.1,                   // 10% transactions tracked
  
  // Chỉ report production errors
  enabled: import.meta.env.PROD,
  
  // Ignore common noise
  ignoreErrors: [
    'ResizeObserver loop',
    'Network Error',
    'Load failed',
  ],
})
```

```typescript
// main.tsx
import './sentry'

// Error Boundary tích hợp Sentry
import * as Sentry from '@sentry/react'

const SentryErrorBoundary = Sentry.withErrorBoundary(App, {
  fallback: <ErrorFallback />,
})
```

Backend — Spring Boot:
```xml
<!-- pom.xml -->
<dependency>
  <groupId>io.sentry</groupId>
  <artifactId>sentry-spring-boot-starter</artifactId>
  <version>7.0.0</version>
</dependency>
```

```yaml
# application.yml
sentry:
  dsn: ${SENTRY_DSN:}
  environment: ${SPRING_PROFILES_ACTIVE:dev}
  traces-sample-rate: 0.1
```

### Task 6.2: Đăng ký Sentry

1. Vào https://sentry.io → Sign up (free tier: 5K errors/month)
2. Create project → React → copy DSN
3. Thêm DSN vào .env:

```bash
# .env
VITE_SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
```

Commit: "feat: Sentry crash monitoring — frontend + backend"

===================================================================
## Section 7: Verify Checklist
===================================================================

```bash
echo "=== PRE-LAUNCH CHECKLIST ==="

# Onboarding
grep -q "onboard\|Onboarding\|welcome.*slide" apps/web/src/ -r --include="*.tsx" && echo "✅ 1. Onboarding flow" || echo "❌ 1. Onboarding"

# Error Boundary
grep -q "ErrorBoundary\|error.*boundary" apps/web/src/ -r --include="*.tsx" && echo "✅ 2. Error Boundary" || echo "❌ 2. Error Boundary"

# Offline detection
grep -q "onLine\|offline\|NetInfo" apps/web/src/ -r --include="*.tsx" && echo "✅ 3. Offline detection" || echo "❌ 3. Offline detection"

# Privacy Policy
find apps/web/src -name "*Privacy*" -o -name "*privacy*" | grep -q . && echo "✅ 4. Privacy Policy" || echo "❌ 4. Privacy Policy"

# Terms
find apps/web/src -name "*Terms*" -o -name "*terms*" | grep -q . && echo "✅ 5. Terms of Service" || echo "❌ 5. Terms of Service"

# Delete Account
grep -rq "delete.*account\|deleteAccount\|DELETE.*me/account" apps/api/src/ --include="*.java" && echo "✅ 6. Delete Account API" || echo "❌ 6. Delete Account API"
grep -rq "delete.*account\|Xóa tài khoản\|Delete Account" apps/web/src/ --include="*.tsx" && echo "✅ 7. Delete Account UI" || echo "❌ 7. Delete Account UI"

# Skeleton/Loading
grep -rq "Skeleton\|skeleton\|shimmer" apps/web/src/ --include="*.tsx" && echo "✅ 8. Skeleton loading" || echo "❌ 8. Skeleton loading"

# Empty states
grep -rq "EmptyState\|empty.*state\|no.*data" apps/web/src/ --include="*.tsx" && echo "✅ 9. Empty states" || echo "❌ 9. Empty states"

# Sentry
grep -q "sentry\|Sentry" apps/web/package.json && echo "✅ 10. Crash monitoring" || echo "❌ 10. Crash monitoring"

echo "=== Target: 10/10 ✅ ==="
```

---

## Thứ tự thực hiện:

1. Section 2: Error Handling (foundation — phải có trước mọi thứ khác)
2. Section 5: Loading States (cải thiện UX ngay)
3. Section 4: Delete Account (Apple reject nếu thiếu)
4. Section 3: Privacy + Terms (Store reject nếu thiếu)
5. Section 1: Onboarding (retention — users bỏ nếu thiếu)
6. Section 6: Sentry (monitoring cho production)
7. Section 7: Verify checklist

Mỗi section commit riêng. Total effort: 5-7 ngày.
Expected: app ready cho Store submission.
```
