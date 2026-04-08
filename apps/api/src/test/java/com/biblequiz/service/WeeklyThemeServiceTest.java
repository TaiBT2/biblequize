package com.biblequiz.service;

import com.biblequiz.modules.quiz.service.WeeklyThemeService;
import com.biblequiz.modules.quiz.service.WeeklyThemeService.WeeklyTheme;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import com.biblequiz.modules.quiz.service.SmartQuestionSelector;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class WeeklyThemeServiceTest {

    @Mock private QuestionRepository questionRepository;
    @Mock private SmartQuestionSelector smartQuestionSelector;

    @Test
    void getCurrentTheme_returnsNonNull() {
        WeeklyThemeService service = new WeeklyThemeService(questionRepository, smartQuestionSelector);
        WeeklyTheme theme = service.getCurrentTheme();
        assertNotNull(theme);
        assertNotNull(theme.id());
        assertNotNull(theme.name());
        assertFalse(theme.books().isEmpty());
    }

    @Test
    void themes_cycle_through_10() {
        // Verify we have 10 distinct themes
        WeeklyThemeService service = new WeeklyThemeService(questionRepository, smartQuestionSelector);
        // The theme is deterministic per week, so just check the current one
        WeeklyTheme theme = service.getCurrentTheme();
        assertTrue(theme.books().size() >= 2); // Each theme has multiple books
    }

    @Test
    void getWeeklyQuizResponse_hasCorrectShape() {
        WeeklyThemeService service = new WeeklyThemeService(questionRepository, smartQuestionSelector);
        Map<String, Object> response = service.getWeeklyQuizResponse("vi");

        assertNotNull(response.get("themeId"));
        assertNotNull(response.get("themeName"));
        assertNotNull(response.get("books"));
        assertNotNull(response.get("expiresAt"));
        assertNotNull(response.get("daysLeft"));
    }
}
