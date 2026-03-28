package com.biblequiz.service;

import com.biblequiz.modules.quiz.service.BookProgressionService;
import com.biblequiz.modules.quiz.service.BookProgressionService.BookProgress;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class BookProgressionServiceTest {

    private final BookProgressionService service = new BookProgressionService();

    // ── getNextBook ──────────────────────────────────────────────────────────

    @Test
    void getNextBook_fromGenesis_shouldReturnExodus() {
        assertEquals("Exodus", service.getNextBook("Genesis"));
    }

    @Test
    void getNextBook_fromRevelation_shouldReturnNull() {
        assertNull(service.getNextBook("Revelation"));
    }

    @Test
    void getNextBook_fromNull_shouldReturnGenesis() {
        assertEquals("Genesis", service.getNextBook(null));
    }

    @Test
    void getNextBook_fromInvalidBook_shouldReturnNull() {
        assertNull(service.getNextBook("InvalidBook"));
    }

    @Test
    void getNextBook_fromMalachi_shouldReturnMatthew() {
        assertEquals("Matthew", service.getNextBook("Malachi"));
    }

    // ── getPreviousBook ──────────────────────────────────────────────────────

    @Test
    void getPreviousBook_fromExodus_shouldReturnGenesis() {
        assertEquals("Genesis", service.getPreviousBook("Exodus"));
    }

    @Test
    void getPreviousBook_fromGenesis_shouldReturnNull() {
        assertNull(service.getPreviousBook("Genesis"));
    }

    @Test
    void getPreviousBook_fromNull_shouldReturnNull() {
        assertNull(service.getPreviousBook(null));
    }

    // ── isCompletedAllBooks ──────────────────────────────────────────────────

    @Test
    void isCompletedAllBooks_atRevelation_shouldReturnTrue() {
        assertTrue(service.isCompletedAllBooks("Revelation"));
    }

    @Test
    void isCompletedAllBooks_atGenesis_shouldReturnFalse() {
        assertFalse(service.isCompletedAllBooks("Genesis"));
    }

    // ── getBookProgress ──────────────────────────────────────────────────────

    @Test
    void getBookProgress_genesis_shouldReturnIndex1() {
        BookProgress progress = service.getBookProgress("Genesis");

        assertEquals(1, progress.currentIndex);
        assertEquals(66, progress.totalBooks);
        assertEquals("Genesis", progress.currentBook);
        assertEquals("Exodus", progress.nextBook);
        assertFalse(progress.isCompleted);
        assertTrue(progress.progressPercentage > 0);
    }

    @Test
    void getBookProgress_revelation_shouldBeCompleted() {
        BookProgress progress = service.getBookProgress("Revelation");

        assertEquals(66, progress.currentIndex);
        assertTrue(progress.isCompleted);
        assertNull(progress.nextBook);
        assertEquals(100.0, progress.progressPercentage, 0.1);
    }

    @Test
    void getBookProgress_invalidBook_shouldDefaultToGenesis() {
        BookProgress progress = service.getBookProgress("InvalidBook");

        assertEquals(1, progress.currentIndex);
    }

    // ── shouldAdvanceToNextBook ──────────────────────────────────────────────

    @ParameterizedTest
    @CsvSource({
            "Genesis, 50, 30, true",   // 50 questions, 60% correct → advance
            "Genesis, 50, 31, true",   // 50 questions, 62% correct → advance
            "Genesis, 49, 30, false",  // Not enough questions
            "Genesis, 50, 29, false",  // Below 60% accuracy
            "Genesis, 100, 60, true",  // More questions, exactly 60%
            "Genesis, 100, 59, false", // More questions, below 60%
    })
    void shouldAdvanceToNextBook_variousScenarios(String book, int questions, int correct, boolean expected) {
        assertEquals(expected, service.shouldAdvanceToNextBook(book, questions, correct));
    }

    @Test
    void shouldAdvanceToNextBook_atRevelation_shouldReturnFalse() {
        assertFalse(service.shouldAdvanceToNextBook("Revelation", 100, 90));
    }
}
