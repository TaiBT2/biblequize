package com.biblequiz.api;

import com.biblequiz.modules.quiz.entity.Question;
import com.biblequiz.modules.quiz.service.QuestionService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(QuestionController.class)
class QuestionControllerTest extends BaseControllerTest {

    @MockBean
    private QuestionService questionService;

    private Question sampleQuestion;

    @BeforeEach
    void setUp() {
        sampleQuestion = new Question();
        sampleQuestion.setId("q-1");
        sampleQuestion.setBook("Genesis");
        sampleQuestion.setChapter(1);
        sampleQuestion.setDifficulty(Question.Difficulty.easy);
        sampleQuestion.setType(Question.Type.multiple_choice_single);
        sampleQuestion.setContent("Ai đã tạo nên trời đất?");
        sampleQuestion.setOptions(Arrays.asList("Đức Chúa Trời", "Môi-se", "Áp-ra-ham", "Đa-vít"));
        sampleQuestion.setCorrectAnswer(Arrays.asList(0));
        sampleQuestion.setIsActive(true);
    }

    // ── GET /api/questions ───────────────────────────────────────────────────

    @Test
    void getQuestions_withDefaults_shouldReturn200() throws Exception {
        when(questionService.getRandomQuestions(isNull(), isNull(), eq(10), isNull()))
                .thenReturn(List.of(sampleQuestion));

        mockMvc.perform(get("/api/questions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].book").value("Genesis"))
                .andExpect(jsonPath("$[0].content").value("Ai đã tạo nên trời đất?"));
    }

    @Test
    void getQuestions_withBookFilter_shouldPassToService() throws Exception {
        when(questionService.getRandomQuestions(eq("Exodus"), isNull(), eq(10), isNull()))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/questions").param("book", "Exodus"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(questionService).getRandomQuestions("Exodus", null, 10, null);
    }

    @Test
    void getQuestions_withDifficultyFilter_shouldPassToService() throws Exception {
        when(questionService.getRandomQuestions(isNull(), eq("hard"), eq(5), isNull()))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/questions")
                        .param("difficulty", "hard")
                        .param("limit", "5"))
                .andExpect(status().isOk());

        verify(questionService).getRandomQuestions(null, "hard", 5, null);
    }

    @Test
    void getQuestions_withExcludeIds_shouldPassToService() throws Exception {
        when(questionService.getRandomQuestions(isNull(), isNull(), eq(10), anyList()))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/questions")
                        .param("excludeIds[]", "q-1", "q-2"))
                .andExpect(status().isOk());

        verify(questionService).getRandomQuestions(isNull(), isNull(), eq(10), anyList());
    }

    @Test
    void getQuestions_isPublicEndpoint_shouldNotRequireAuth() throws Exception {
        when(questionService.getRandomQuestions(any(), any(), anyInt(), any()))
                .thenReturn(List.of());

        // No authentication header - should still work (public endpoint)
        mockMvc.perform(get("/api/questions"))
                .andExpect(status().isOk());
    }

    // ── GET /api/questions/qotd ──────────────────────────────────────────────

    @Test
    void getQuestionOfTheDay_shouldReturn200WithDateAndQuestion() throws Exception {
        when(questionService.getQuestionOfTheDay("vi")).thenReturn(sampleQuestion);

        mockMvc.perform(get("/api/questions/qotd"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").isNotEmpty())
                .andExpect(jsonPath("$.question.book").value("Genesis"));
    }

    @Test
    void getQuestionOfTheDay_withLanguageParam_shouldPassToService() throws Exception {
        when(questionService.getQuestionOfTheDay("en")).thenReturn(sampleQuestion);

        mockMvc.perform(get("/api/questions/qotd").param("language", "en"))
                .andExpect(status().isOk());

        verify(questionService).getQuestionOfTheDay("en");
    }
}
