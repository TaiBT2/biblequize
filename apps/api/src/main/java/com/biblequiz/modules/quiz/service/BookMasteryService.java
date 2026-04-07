package com.biblequiz.modules.quiz.service;

import com.biblequiz.modules.quiz.entity.Book;
import com.biblequiz.modules.quiz.repository.BookRepository;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.repository.UserQuestionHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookMasteryService {

    private final BookRepository bookRepository;
    private final QuestionRepository questionRepository;
    private final UserQuestionHistoryRepository historyRepository;

    public static final double COMPLETION_THRESHOLD = 80.0;

    public enum BookStatus {
        COMPLETED, IN_PROGRESS, LOCKED
    }

    public record BookProgress(
            String book, String bookVi, int order, String testament,
            int totalQuestions, int masteredQuestions, double masteryPercent,
            BookStatus status
    ) {}

    public record JourneySummary(
            int totalBooks, int completedBooks, int inProgressBooks, int lockedBooks,
            double overallMasteryPercent,
            int oldTestamentCompleted, int newTestamentCompleted,
            String currentBook
    ) {}

    public record JourneyResponse(JourneySummary summary, List<BookProgress> books) {}

    public List<BookProgress> getJourneyProgress(String userId, String language) {
        List<Book> books = bookRepository.findAllOrderByOrderIndex();
        List<BookProgress> progress = new ArrayList<>();

        for (int i = 0; i < books.size(); i++) {
            Book book = books.get(i);
            String bookName = book.getName();

            long totalQuestions = questionRepository.countByBookAndLanguageAndIsActiveTrue(bookName, language);
            long mastered = historyRepository.countCorrectByUserIdAndBook(userId, bookName);

            double masteryPct = totalQuestions > 0
                    ? (double) mastered / totalQuestions * 100
                    : 0;
            masteryPct = Math.round(masteryPct * 10) / 10.0;

            BookStatus status;
            if (masteryPct >= COMPLETION_THRESHOLD) {
                status = BookStatus.COMPLETED;
            } else if (masteryPct > 0 || i == 0 || isUnlocked(progress, i)) {
                status = BookStatus.IN_PROGRESS;
            } else {
                status = BookStatus.LOCKED;
            }

            progress.add(new BookProgress(
                    bookName, book.getNameVi(), i + 1,
                    book.getTestament().name(),
                    (int) totalQuestions, (int) mastered, masteryPct, status
            ));
        }

        return progress;
    }

    private boolean isUnlocked(List<BookProgress> progress, int index) {
        if (index == 0) return true;
        return progress.get(index - 1).status() == BookStatus.COMPLETED;
    }

    public JourneySummary getJourneySummary(String userId, String language) {
        List<BookProgress> progress = getJourneyProgress(userId, language);

        long completed = progress.stream().filter(b -> b.status() == BookStatus.COMPLETED).count();
        long inProgress = progress.stream().filter(b -> b.status() == BookStatus.IN_PROGRESS).count();
        double overallMastery = progress.stream().mapToDouble(BookProgress::masteryPercent).average().orElse(0);

        return new JourneySummary(
                progress.size(),
                (int) completed,
                (int) inProgress,
                progress.size() - (int) completed - (int) inProgress,
                Math.round(overallMastery * 10) / 10.0,
                (int) progress.stream().filter(b -> "OLD".equals(b.testament()) && b.status() == BookStatus.COMPLETED).count(),
                (int) progress.stream().filter(b -> "NEW".equals(b.testament()) && b.status() == BookStatus.COMPLETED).count(),
                progress.stream().filter(b -> b.status() == BookStatus.IN_PROGRESS).findFirst().map(BookProgress::book).orElse(null)
        );
    }

    public JourneyResponse getJourney(String userId, String language) {
        List<BookProgress> books = getJourneyProgress(userId, language);
        // Build summary from progress to avoid double calculation
        long completed = books.stream().filter(b -> b.status() == BookStatus.COMPLETED).count();
        long inProgress = books.stream().filter(b -> b.status() == BookStatus.IN_PROGRESS).count();
        double overallMastery = books.stream().mapToDouble(BookProgress::masteryPercent).average().orElse(0);

        JourneySummary summary = new JourneySummary(
                books.size(), (int) completed, (int) inProgress,
                books.size() - (int) completed - (int) inProgress,
                Math.round(overallMastery * 10) / 10.0,
                (int) books.stream().filter(b -> "OLD".equals(b.testament()) && b.status() == BookStatus.COMPLETED).count(),
                (int) books.stream().filter(b -> "NEW".equals(b.testament()) && b.status() == BookStatus.COMPLETED).count(),
                books.stream().filter(b -> b.status() == BookStatus.IN_PROGRESS).findFirst().map(BookProgress::book).orElse(null)
        );

        return new JourneyResponse(summary, books);
    }
}
