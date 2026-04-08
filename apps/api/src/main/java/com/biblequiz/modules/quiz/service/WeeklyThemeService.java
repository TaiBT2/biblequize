package com.biblequiz.modules.quiz.service;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.repository.QuestionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WeeklyThemeService {

    public record WeeklyTheme(String id, String name, String nameEn, List<String> books) {}

    private static final List<WeeklyTheme> THEMES = List.of(
        new WeeklyTheme("miracles", "Các phép lạ", "Miracles of the Bible",
            List.of("Exodus", "1 Kings", "2 Kings", "Matthew", "Mark", "Luke", "John", "Acts")),
        new WeeklyTheme("kings", "Các vị vua", "Kings & Rulers",
            List.of("1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles")),
        new WeeklyTheme("prophecy", "Lời tiên tri", "Prophecy & Fulfillment",
            List.of("Isaiah", "Jeremiah", "Ezekiel", "Daniel", "Matthew", "Revelation")),
        new WeeklyTheme("creation", "Sáng tạo & Thiên nhiên", "Creation & Nature",
            List.of("Genesis", "Job", "Psalms", "Proverbs")),
        new WeeklyTheme("women", "Phụ nữ trong Kinh Thánh", "Women of the Bible",
            List.of("Genesis", "Exodus", "Ruth", "Esther", "Luke", "Acts")),
        new WeeklyTheme("parables", "Các ẩn dụ", "Parables of Jesus",
            List.of("Matthew", "Mark", "Luke")),
        new WeeklyTheme("prayers", "Cầu nguyện", "Prayers in the Bible",
            List.of("Genesis", "Psalms", "Daniel", "Matthew", "Acts")),
        new WeeklyTheme("journeys", "Các cuộc hành trình", "Journeys & Travels",
            List.of("Genesis", "Exodus", "Numbers", "Acts")),
        new WeeklyTheme("love", "Tình yêu thương", "Love & Compassion",
            List.of("Ruth", "Song of Solomon", "John", "1 Corinthians", "1 John")),
        new WeeklyTheme("courage", "Can đảm", "Courage & Faith",
            List.of("Joshua", "Judges", "1 Samuel", "Daniel", "Hebrews"))
    );

    private final QuestionRepository questionRepository;
    private final SmartQuestionSelector smartQuestionSelector;

    public WeeklyThemeService(QuestionRepository questionRepository,
                               SmartQuestionSelector smartQuestionSelector) {
        this.questionRepository = questionRepository;
        this.smartQuestionSelector = smartQuestionSelector;
    }

    public WeeklyTheme getCurrentTheme() {
        int weekOfYear = LocalDate.now().get(WeekFields.ISO.weekOfYear());
        return THEMES.get(weekOfYear % THEMES.size());
    }

    public List<Question> getWeeklyQuestions(String userId, int count, String language) {
        WeeklyTheme theme = getCurrentTheme();

        // Collect questions from theme books
        List<Question> pool = new ArrayList<>();
        for (String book : theme.books()) {
            pool.addAll(questionRepository.findAllActiveByLanguageAndBook(language, book));
        }

        if (pool.isEmpty()) {
            // Fallback to any questions
            pool = questionRepository.findAllActiveByLanguage(language);
        }

        // Use smart selection from pool
        return smartQuestionSelector.selectFromPool(userId, pool, count);
    }

    public Map<String, Object> getWeeklyQuizResponse(String language) {
        WeeklyTheme theme = getCurrentTheme();

        // Calculate end of week
        LocalDate today = LocalDate.now();
        LocalDate endOfWeek = today.plusDays(7 - today.getDayOfWeek().getValue());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("themeId", theme.id());
        response.put("themeName", theme.name());
        response.put("themeNameEn", theme.nameEn());
        response.put("books", theme.books());
        response.put("expiresAt", endOfWeek.toString());
        response.put("daysLeft", java.time.temporal.ChronoUnit.DAYS.between(today, endOfWeek));
        return response;
    }
}
