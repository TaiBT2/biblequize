package com.biblequiz.modules.room.service;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * MBV-3: Quick Match DATABASE pick honors book-scope expansion (group sentinel
 * → book set) and falls back to the whole pool when a scoped query is empty.
 */
@ExtendWith(MockitoExtension.class)
class QuickMatchQuestionSourceScopeTest {

    @Mock private QuestionRepository repo;

    private QuickMatchQuestionSourceService newService() {
        QuickMatchQuestionSourceService svc = new QuickMatchQuestionSourceService();
        ReflectionTestUtils.setField(svc, "questionRepository", repo);
        return svc;
    }

    private static Question q(String id) {
        Question q = new Question();
        q.setId(id);
        return q;
    }

    @Test
    void groupScope_queriesExpandedBookSet() {
        when(repo.findRandomQuestionsByLanguageAndBooksAndDifficultyExcludingIds(
                anyString(), anyList(), any(), anyList(), any(Pageable.class)))
                .thenReturn(List.of(q("a"), q("b")));

        newService().pickDatabaseIds("GOSPELS", 10, "vi");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<String>> books = ArgumentCaptor.forClass(List.class);
        verify(repo, atLeastOnce()).findRandomQuestionsByLanguageAndBooksAndDifficultyExcludingIds(
                eq("vi"), books.capture(), any(), anyList(), any(Pageable.class));
        assertEquals(List.of("Matthew", "Mark", "Luke", "John"), books.getValue());
        // No single-book query path should be used for a group scope.
        verify(repo, never()).findRandomQuestionsByLanguageAndBookAndDifficultyExcludingIds(
                anyString(), anyString(), any(), anyList(), any(Pageable.class));
    }

    @Test
    void allScope_usesNoBookFilter() {
        when(repo.findRandomQuestionsByLanguageAndDifficultyExcludingIds(
                anyString(), any(), anyList(), any(Pageable.class)))
                .thenReturn(List.of(q("a")));

        newService().pickDatabaseIds("ALL", 10, "vi");

        verify(repo, atLeastOnce()).findRandomQuestionsByLanguageAndDifficultyExcludingIds(
                eq("vi"), any(), anyList(), any(Pageable.class));
        verify(repo, never()).findRandomQuestionsByLanguageAndBooksAndDifficultyExcludingIds(
                anyString(), anyList(), any(), anyList(), any(Pageable.class));
    }

    @Test
    void emptyScopedResult_fallsBackToWholePool() {
        // Scoped query returns nothing → must fall back to the difficulty-only pool.
        when(repo.findRandomQuestionsByLanguageAndBooksAndDifficultyExcludingIds(
                anyString(), anyList(), any(), anyList(), any(Pageable.class)))
                .thenReturn(List.of());
        when(repo.findRandomQuestionsByLanguageAndDifficultyExcludingIds(
                anyString(), any(), anyList(), any(Pageable.class)))
                .thenReturn(List.of(q("fallback")));

        List<String> ids = newService().pickDatabaseIds("Obadiah", 10, "vi");

        verify(repo, atLeastOnce()).findRandomQuestionsByLanguageAndDifficultyExcludingIds(
                eq("vi"), any(), anyList(), any(Pageable.class));
        assertTrue(ids.contains("fallback"));
    }
}
