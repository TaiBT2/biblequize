package com.biblequiz.api;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.entity.QuestionReview;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.QuestionReviewRepository;
import com.biblequiz.modules.user.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/review")
@PreAuthorize("hasAnyRole('ADMIN', 'CONTENT_MOD')")
public class QuestionReviewController {

    private static final Logger log = LoggerFactory.getLogger(QuestionReviewController.class);
    private static final int APPROVALS_REQUIRED = 2;

    private final QuestionRepository questionRepository;
    private final QuestionReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public QuestionReviewController(QuestionRepository questionRepository,
                                    QuestionReviewRepository reviewRepository,
                                    UserRepository userRepository) {
        this.questionRepository = questionRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
    }

    /** List PENDING questions NOT yet reviewed by current admin */
    @GetMapping("/pending")
    public ResponseEntity<?> listPending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        String adminEmail = userDetails.getUsername();
        List<String> alreadyReviewed = reviewRepository.findQuestionIdsReviewedByAdmin(adminEmail);

        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var questions = alreadyReviewed.isEmpty()
                ? questionRepository.findByReviewStatus(Question.ReviewStatus.PENDING, pageable)
                : questionRepository.findByReviewStatusAndIdNotIn(Question.ReviewStatus.PENDING, alreadyReviewed, pageable);

        List<Map<String, Object>> result = questions.stream().map(q -> {
            List<QuestionReview> reviews = reviewRepository.findByQuestionId(q.getId());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", q.getId());
            item.put("book", q.getBook());
            item.put("chapter", q.getChapter());
            item.put("verseStart", q.getVerseStart());
            item.put("verseEnd", q.getVerseEnd());
            item.put("difficulty", q.getDifficulty());
            item.put("type", q.getType());
            item.put("content", q.getContent());
            item.put("options", q.getOptions());
            item.put("correctAnswer", q.getCorrectAnswer());
            item.put("explanation", q.getExplanation());
            item.put("approvalsCount", q.getApprovalsCount());
            item.put("approvalsRequired", APPROVALS_REQUIRED);
            item.put("createdAt", q.getCreatedAt());
            item.put("reviews", reviews.stream().map(r -> Map.of(
                    "adminEmail", r.getAdminEmail() != null ? r.getAdminEmail() : "",
                    "action", r.getAction(),
                    "comment", r.getComment() != null ? r.getComment() : "",
                    "createdAt", r.getCreatedAt()
            )).collect(Collectors.toList()));
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "questions", result,
                "total", questions.getTotalElements(),
                "page", page,
                "size", size
        ));
    }

    /** Approve a pending question */
    @PostMapping("/{questionId}/approve")
    public ResponseEntity<?> approve(@PathVariable String questionId,
                                     @RequestBody(required = false) Map<String, String> body,
                                     @AuthenticationPrincipal UserDetails userDetails) {

        Optional<Question> opt = questionRepository.findById(questionId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Question q = opt.get();

        if (q.getReviewStatus() != Question.ReviewStatus.PENDING) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question is not PENDING"));
        }

        String adminEmail = userDetails.getUsername();
        if (reviewRepository.existsByQuestionIdAndAdminId(questionId, adminEmail)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bạn đã duyệt câu hỏi này rồi"));
        }

        String comment = body != null ? body.getOrDefault("comment", "") : "";

        QuestionReview review = new QuestionReview(
                UUID.randomUUID().toString(), questionId, adminEmail, adminEmail,
                QuestionReview.Action.APPROVE, comment);
        reviewRepository.save(review);

        int newCount = q.getApprovalsCount() + 1;
        q.setApprovalsCount(newCount);

        if (newCount >= APPROVALS_REQUIRED) {
            q.setReviewStatus(Question.ReviewStatus.ACTIVE);
            q.setIsActive(true);
            log.info("[REVIEW] Question {} ACTIVATED after {} approvals", questionId, newCount);
        }

        questionRepository.save(q);
        return ResponseEntity.ok(Map.of(
                "approvalsCount", newCount,
                "status", q.getReviewStatus(),
                "activated", q.getReviewStatus() == Question.ReviewStatus.ACTIVE,
                "approvalsRequired", APPROVALS_REQUIRED
        ));
    }

    /** Reject a pending question */
    @PostMapping("/{questionId}/reject")
    public ResponseEntity<?> reject(@PathVariable String questionId,
                                    @RequestBody(required = false) Map<String, String> body,
                                    @AuthenticationPrincipal UserDetails userDetails) {

        Optional<Question> opt = questionRepository.findById(questionId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Question q = opt.get();

        if (q.getReviewStatus() == Question.ReviewStatus.ACTIVE) {
            return ResponseEntity.badRequest().body(Map.of("error", "Không thể từ chối câu hỏi đã được duyệt"));
        }

        String adminEmail = userDetails.getUsername();
        String comment = body != null ? body.getOrDefault("comment", "") : "";

        reviewRepository.findByQuestionIdAndAdminId(questionId, adminEmail).ifPresentOrElse(
                r -> { r.setAction(QuestionReview.Action.REJECT); r.setComment(comment); reviewRepository.save(r); },
                () -> reviewRepository.save(new QuestionReview(
                        UUID.randomUUID().toString(), questionId, adminEmail, adminEmail,
                        QuestionReview.Action.REJECT, comment))
        );

        q.setReviewStatus(Question.ReviewStatus.REJECTED);
        q.setIsActive(false);
        questionRepository.save(q);

        log.info("[REVIEW] Question {} REJECTED by {}", questionId, adminEmail);
        return ResponseEntity.ok(Map.of("status", "REJECTED"));
    }

    /** Personalized stats for current admin */
    @GetMapping("/stats")
    public ResponseEntity<?> stats(@AuthenticationPrincipal UserDetails userDetails) {
        String adminEmail = userDetails.getUsername();
        List<String> alreadyReviewed = reviewRepository.findQuestionIdsReviewedByAdmin(adminEmail);

        long totalPending = questionRepository.countByReviewStatus(Question.ReviewStatus.PENDING);
        long pendingForMe = alreadyReviewed.isEmpty()
                ? totalPending
                : questionRepository.countByReviewStatusAndIdNotIn(Question.ReviewStatus.PENDING, alreadyReviewed);
        long active = questionRepository.countByReviewStatus(Question.ReviewStatus.ACTIVE);
        long rejected = questionRepository.countByReviewStatus(Question.ReviewStatus.REJECTED);
        long myActionsToday = reviewRepository.countByAdminIdAndCreatedAtAfter(
                adminEmail, LocalDate.now().atStartOfDay());

        return ResponseEntity.ok(Map.of(
                "pendingForMe", pendingForMe,
                "totalPending", totalPending,
                "active", active,
                "rejected", rejected,
                "myActionsToday", myActionsToday,
                "approvalsRequired", APPROVALS_REQUIRED
        ));
    }

    /** Review history for current admin */
    @GetMapping("/my-history")
    public ResponseEntity<?> myHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        String adminEmail = userDetails.getUsername();
        var history = reviewRepository.findByAdminIdOrderByCreatedAtDesc(
                adminEmail, PageRequest.of(page, size));

        // Enrich with question content
        List<Map<String, Object>> items = history.stream().map(r -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", r.getId());
            item.put("questionId", r.getQuestionId());
            item.put("action", r.getAction());
            item.put("comment", r.getComment());
            item.put("createdAt", r.getCreatedAt());

            questionRepository.findById(r.getQuestionId()).ifPresent(q -> {
                item.put("questionContent", q.getContent());
                item.put("questionBook", q.getBook());
            });

            return item;
        }).toList();

        return ResponseEntity.ok(Map.of(
                "content", items,
                "total", history.getTotalElements(),
                "page", page,
                "size", size
        ));
    }
}
