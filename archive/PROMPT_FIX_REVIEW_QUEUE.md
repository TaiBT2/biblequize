# Fix Review Queue — Filter Out Already-Reviewed by Current User

> Admin đã duyệt/reject câu nào → câu đó KHÔNG hiện trong queue của họ nữa.
> Paste vào Claude Code.

---

```
Fix Review Queue UX issue: hiện tại admin đã duyệt câu rồi vẫn thấy câu đó trong queue → confusing.

Logic mới: Câu hỏi CHỈ hiển thị trong queue của 1 admin nếu:
1. Câu chưa có 2 approvals (chưa active)
2. Câu chưa bị reject
3. Admin đó CHƯA duyệt/reject câu này

TRƯỚC KHI CODE: đọc code hiện tại + chia tasks vào TODO.md.

## Bước 0: Đọc code hiện tại

```bash
# Backend review queue
find apps/api/src -name "*Review*" | xargs cat 2>/dev/null

# Entity nào lưu review actions?
grep -rn "approval\|approved_by\|reviewer\|review_action" apps/api/src/main/java/ --include="*.java" | head -20

# DB migrations cho review
ls apps/api/src/main/resources/db/migration/ | grep -i review

# Frontend
find apps/web/src -name "*Review*" -o -name "*review-queue*" | head
```

## Bước 1: Database table track per-user actions

Kiểm tra đã có chưa. Nếu CHƯA:

```sql
-- V{next}__add_question_review_actions.sql

CREATE TABLE question_review_actions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    action ENUM('APPROVED', 'REJECTED') NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_qra_question FOREIGN KEY (question_id) REFERENCES question(id),
    CONSTRAINT fk_qra_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id),
    CONSTRAINT uk_question_reviewer UNIQUE (question_id, reviewer_id),
    
    INDEX idx_qra_question (question_id),
    INDEX idx_qra_reviewer (reviewer_id)
);
```

Entity + Repository:

```java
@Entity
@Table(name = "question_review_actions")
public class QuestionReviewAction {
    @Id @GeneratedValue private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private Question question;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;
    
    @Enumerated(EnumType.STRING)
    private ReviewAction action;
    
    private String reason;
    private LocalDateTime createdAt;
}

public enum ReviewAction { APPROVED, REJECTED }

public interface QuestionReviewActionRepository extends JpaRepository<QuestionReviewAction, Long> {
    boolean existsByQuestionIdAndReviewerId(Long questionId, Long reviewerId);
    
    @Query("SELECT a.question.id FROM QuestionReviewAction a WHERE a.reviewer.id = :userId")
    List<Long> findQuestionIdsReviewedByUser(@Param("userId") Long userId);
    
    long countByQuestionIdAndAction(Long questionId, ReviewAction action);
    
    Page<QuestionReviewAction> findByReviewerIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    long countByReviewerIdAndCreatedAtAfter(Long userId, LocalDateTime after);
}
```

Commit: "feat: question_review_actions table + entity + repository"

## Bước 2: ReviewQueueService — Filter logic

```java
@Service
@RequiredArgsConstructor
public class ReviewQueueService {

    private final QuestionRepository questionRepository;
    private final QuestionReviewActionRepository reviewActionRepository;
    private final UserRepository userRepository;

    /**
     * Queue cho 1 admin: pending + chưa được admin này action.
     */
    public Page<Question> getPendingForUser(Long userId, Pageable pageable) {
        List<Long> alreadyReviewed = reviewActionRepository.findQuestionIdsReviewedByUser(userId);
        
        if (alreadyReviewed.isEmpty()) {
            return questionRepository.findByStatus("pending", pageable);
        }
        return questionRepository.findByStatusAndIdNotIn("pending", alreadyReviewed, pageable);
    }

    public long countPendingForUser(Long userId) {
        List<Long> alreadyReviewed = reviewActionRepository.findQuestionIdsReviewedByUser(userId);
        if (alreadyReviewed.isEmpty()) {
            return questionRepository.countByStatus("pending");
        }
        return questionRepository.countByStatusAndIdNotIn("pending", alreadyReviewed);
    }

    @Transactional
    public void approve(Long questionId, Long reviewerId) {
        Question question = questionRepository.findById(questionId)
            .orElseThrow(() -> new NotFoundException("Question not found"));
        
        if (!"pending".equals(question.getStatus())) {
            throw new BadRequestException("Question is not pending review");
        }
        
        // Block double review
        if (reviewActionRepository.existsByQuestionIdAndReviewerId(questionId, reviewerId)) {
            throw new BadRequestException("Bạn đã review câu này rồi");
        }
        
        // Block self-approval (không tự duyệt câu mình tạo)
        if (question.getCreatedBy() != null && question.getCreatedBy().getId().equals(reviewerId)) {
            throw new BadRequestException("Không thể duyệt câu hỏi do chính bạn tạo");
        }
        
        // Save action
        QuestionReviewAction action = new QuestionReviewAction();
        action.setQuestion(question);
        action.setReviewer(userRepository.getReferenceById(reviewerId));
        action.setAction(ReviewAction.APPROVED);
        action.setCreatedAt(LocalDateTime.now());
        reviewActionRepository.save(action);
        
        // Check 2/2 → activate
        long approvalCount = reviewActionRepository.countByQuestionIdAndAction(questionId, ReviewAction.APPROVED);
        
        if (approvalCount >= 2) {
            question.setStatus("active");
            question.setIsActive(true);
            question.setReviewedAt(LocalDateTime.now());
            questionRepository.save(question);
        }
    }

    @Transactional
    public void reject(Long questionId, Long reviewerId, String reason) {
        if (reason == null || reason.trim().length() < 10) {
            throw new BadRequestException("Lý do từ chối phải có ít nhất 10 ký tự");
        }
        
        Question question = questionRepository.findById(questionId)
            .orElseThrow(() -> new NotFoundException("Question not found"));
        
        if (!"pending".equals(question.getStatus())) {
            throw new BadRequestException("Question is not pending");
        }
        
        if (reviewActionRepository.existsByQuestionIdAndReviewerId(questionId, reviewerId)) {
            throw new BadRequestException("Bạn đã review câu này rồi");
        }
        
        QuestionReviewAction action = new QuestionReviewAction();
        action.setQuestion(question);
        action.setReviewer(userRepository.getReferenceById(reviewerId));
        action.setAction(ReviewAction.REJECTED);
        action.setReason(reason);
        action.setCreatedAt(LocalDateTime.now());
        reviewActionRepository.save(action);
        
        // 1 reject = câu bị reject ngay
        question.setStatus("rejected");
        question.setIsActive(false);
        questionRepository.save(question);
    }

    public Page<QuestionReviewAction> getMyReviewHistory(Long userId, Pageable pageable) {
        return reviewActionRepository.findByReviewerIdOrderByCreatedAtDesc(userId, pageable);
    }

    public ReviewStats getStatsForUser(Long userId) {
        long pendingForMe = countPendingForUser(userId);
        long totalPending = questionRepository.countByStatus("pending");
        long approved = questionRepository.countByStatus("active");
        long rejected = questionRepository.countByStatus("rejected");
        
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long myActionsToday = reviewActionRepository.countByReviewerIdAndCreatedAtAfter(userId, startOfDay);
        
        return ReviewStats.builder()
            .pendingForMe(pendingForMe)
            .totalPending(totalPending)
            .approved(approved)
            .rejected(rejected)
            .myActionsToday(myActionsToday)
            .build();
    }
}
```

QuestionRepository thêm methods nếu chưa có:

```java
Page<Question> findByStatus(String status, Pageable pageable);
Page<Question> findByStatusAndIdNotIn(String status, List<Long> ids, Pageable pageable);
long countByStatus(String status);
long countByStatusAndIdNotIn(String status, List<Long> ids);
```

Commit: "feat: filter review queue by current user's actions"

## Bước 3: Update Controller

```java
@RestController
@RequestMapping("/api/admin/review")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewQueueService reviewQueueService;

    @GetMapping("/pending")
    public Page<QuestionDto> getPending(Authentication auth, Pageable pageable) {
        Long userId = getUserId(auth);
        return reviewQueueService.getPendingForUser(userId, pageable)
            .map(QuestionDto::from);
    }

    @PostMapping("/{questionId}/approve")
    public ResponseEntity<?> approve(@PathVariable Long questionId, Authentication auth) {
        reviewQueueService.approve(questionId, getUserId(auth));
        return ResponseEntity.ok(Map.of("message", "Đã duyệt"));
    }

    @PostMapping("/{questionId}/reject")
    public ResponseEntity<?> reject(@PathVariable Long questionId,
                                     @RequestBody RejectRequest request,
                                     Authentication auth) {
        reviewQueueService.reject(questionId, getUserId(auth), request.getReason());
        return ResponseEntity.ok(Map.of("message", "Đã từ chối"));
    }

    @GetMapping("/stats")
    public ReviewStats getStats(Authentication auth) {
        return reviewQueueService.getStatsForUser(getUserId(auth));
    }

    @GetMapping("/my-history")
    public Page<ReviewActionDto> getMyHistory(Authentication auth, Pageable pageable) {
        return reviewQueueService.getMyReviewHistory(getUserId(auth), pageable)
            .map(ReviewActionDto::from);
    }
}
```

## Bước 4: Frontend updates

```typescript
// ReviewQueuePage.tsx

const ReviewQueuePage = () => {
  const queryClient = useQueryClient()
  
  const { data: stats } = useQuery({
    queryKey: ['admin', 'review', 'stats'],
    queryFn: () => apiClient.get('/api/admin/review/stats').then(r => r.data),
  })
  
  const { data: pending, isLoading } = useQuery({
    queryKey: ['admin', 'review', 'pending'],
    queryFn: () => apiClient.get('/api/admin/review/pending').then(r => r.data),
  })
  
  const approveMutation = useMutation({
    mutationFn: (questionId) => apiClient.post(`/api/admin/review/${questionId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'review'] })
      toast.success('Đã duyệt câu hỏi')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi'),
  })
  
  const rejectMutation = useMutation({
    mutationFn: ({ questionId, reason }) =>
      apiClient.post(`/api/admin/review/${questionId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'review'] })
      toast.success('Đã từ chối câu hỏi')
    },
  })
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hàng Chờ Duyệt</h1>
        <p className="text-white/60 mt-1">
          Câu hỏi AI tạo ra cần 2 admin duyệt mới trở thành chính thức
        </p>
      </div>
      
      {/* PERSONALIZED Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
          <div className="text-4xl font-bold text-yellow-400">
            {stats?.pendingForMe ?? '...'}
          </div>
          <div className="text-yellow-400/80 text-sm mt-1 font-medium">
            CẦN BẠN DUYỆT
          </div>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="text-4xl font-bold text-blue-400">
            {stats?.totalPending ?? '...'}
          </div>
          <div className="text-blue-400/80 text-sm mt-1 font-medium">
            TỔNG ĐANG CHỜ
          </div>
          {stats && stats.totalPending > stats.pendingForMe && (
            <div className="text-blue-400/50 text-xs mt-2">
              {stats.totalPending - stats.pendingForMe} câu admins khác đang xử lý
            </div>
          )}
        </div>
        
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
          <div className="text-4xl font-bold text-green-400">
            {stats?.myActionsToday ?? '...'}
          </div>
          <div className="text-green-400/80 text-sm mt-1 font-medium">
            BẠN ĐÃ DUYỆT HÔM NAY
          </div>
        </div>
      </div>
      
      {/* Empty state — celebrate */}
      {!isLoading && pending?.content?.length === 0 && (
        <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 
          border border-green-500/30 rounded-2xl p-12 text-center">
          <span className="text-6xl mb-4 block">🎉</span>
          <h3 className="text-2xl font-bold text-white mb-2">
            Tuyệt vời! Bạn đã duyệt hết queue
          </h3>
          <p className="text-white/60">
            Không còn câu nào cần bạn xem xét. Nghỉ ngơi một chút nhé!
          </p>
          <p className="text-white/40 text-sm mt-4">
            Câu hỏi mới sẽ tự động xuất hiện khi có.
          </p>
        </div>
      )}
      
      {/* Question list */}
      {pending?.content?.map(question => (
        <QuestionReviewCard
          key={question.id}
          question={question}
          onApprove={() => approveMutation.mutate(question.id)}
          onReject={(reason) => rejectMutation.mutate({ questionId: question.id, reason })}
          isLoading={approveMutation.isPending || rejectMutation.isPending}
        />
      ))}
      
      {/* My history tab */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Lịch sử duyệt của tôi</h2>
        <MyReviewHistoryList />
      </div>
    </div>
  )
}

// MyReviewHistoryList component
const MyReviewHistoryList = () => {
  const { data: history } = useQuery({
    queryKey: ['admin', 'review', 'my-history'],
    queryFn: () => apiClient.get('/api/admin/review/my-history').then(r => r.data),
  })
  
  return (
    <div className="space-y-2">
      {history?.content?.map(item => (
        <div key={item.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80 truncate">
              {item.questionContent}
            </p>
            <p className="text-xs text-white/50 mt-1">
              {item.questionBook} • {formatRelativeTime(item.createdAt)}
            </p>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ml-3 ${
            item.action === 'APPROVED' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {item.action === 'APPROVED' ? '✓ Đã duyệt' : '✗ Đã từ chối'}
          </div>
        </div>
      ))}
      
      {history?.content?.length === 0 && (
        <p className="text-white/40 text-center py-8">
          Bạn chưa duyệt câu hỏi nào.
        </p>
      )}
    </div>
  )
}
```

Commit: "feat: review queue UI with personalized stats + history tab"

## Bước 5: Tests

```java
@Test
void getPendingForUser_excludesAlreadyReviewed() {
    // 5 câu pending. User A đã approve câu 1, 2
    var result = service.getPendingForUser(userA.getId(), PageRequest.of(0, 10));
    assertThat(result.getContent()).hasSize(3);
    assertThat(result.getContent()).extracting("id")
        .containsExactlyInAnyOrder(3L, 4L, 5L);
}

@Test
void getPendingForUser_returnsAllForNewUser() {
    var result = service.getPendingForUser(userB.getId(), PageRequest.of(0, 10));
    assertThat(result.getContent()).hasSize(5);
}

@Test
void approve_blocksDoubleReview() {
    service.approve(questionId, userA.getId());
    assertThrows(BadRequestException.class, () -> {
        service.approve(questionId, userA.getId());
    });
}

@Test
void approve_activatesQuestionAfter2Approvals() {
    service.approve(questionId, userA.getId());
    assertThat(repo.findById(questionId).get().getStatus()).isEqualTo("pending");
    
    service.approve(questionId, userB.getId());
    assertThat(repo.findById(questionId).get().getStatus()).isEqualTo("active");
}

@Test
void approve_blocksOwnQuestion() {
    var question = createQuestion(userA);
    assertThrows(BadRequestException.class, () -> {
        service.approve(question.getId(), userA.getId());
    });
}

@Test
void reject_immediatelyMarksRejected() {
    service.reject(questionId, userA.getId(), "Sai content nghiêm trọng");
    assertThat(repo.findById(questionId).get().getStatus()).isEqualTo("rejected");
}

@Test
void reject_requiresMinimum10CharReason() {
    assertThrows(BadRequestException.class, () -> {
        service.reject(questionId, userA.getId(), "short");
    });
}

@Test
void rejectedQuestion_doesNotAppearInAnyoneQueue() {
    service.reject(questionId, userA.getId(), "Sai content nghiêm trọng");
    var resultB = service.getPendingForUser(userB.getId(), PageRequest.of(0, 10));
    assertThat(resultB.getContent()).extracting("id").doesNotContain(questionId);
}

@Test
void stats_personalizedPerUser() {
    // 10 câu pending. User A đã approve 3
    var statsA = service.getStatsForUser(userA.getId());
    assertThat(statsA.getPendingForMe()).isEqualTo(7);
    assertThat(statsA.getTotalPending()).isEqualTo(10);
    
    var statsB = service.getStatsForUser(userB.getId());
    assertThat(statsB.getPendingForMe()).isEqualTo(10);
}
```

Commit: "test: review queue per-user filtering"

## Bước 6: Manual verify

```
1. Login as Admin A → vào /admin/review-queue → thấy 77 câu
2. Duyệt 5 câu → refresh → còn 72 câu
3. Stats: "CẦN BẠN DUYỆT: 72" + "BẠN ĐÃ DUYỆT HÔM NAY: 5"

4. Logout → login as Admin B → vẫn thấy 72 câu (B chưa action)
5. B duyệt câu đầu tiên (đã được A duyệt)
6. Câu đó 2/2 → active → biến mất khỏi tất cả queues

7. Login lại Admin A → còn 71 câu
8. Tab "Lịch sử của tôi" hiện 5 câu A đã duyệt
```

## Tổng kết thay đổi

| Tình huống | Trước | Sau |
|-----------|-------|-----|
| Admin A duyệt câu X | Câu vẫn hiện trong queue A | ✅ Câu biến mất khỏi queue A |
| Câu có 1/2 duyệt (bởi A) | A và B đều thấy | ✅ Chỉ B (và admins khác) thấy |
| Câu có 2/2 duyệt | Vẫn hiện | ✅ Active, biến mất |
| Câu bị reject | Vẫn hiện | ✅ Rejected, biến mất |
| Stats | Số tổng | ✅ Số CẦN admin hiện tại action |
| Empty state | Trống | ✅ Celebration |
| Lịch sử | Không có | ✅ Tab "Lịch sử của tôi" |

Effort: 1 ngày.
```
