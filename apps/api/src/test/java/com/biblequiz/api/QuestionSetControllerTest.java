package com.biblequiz.api;

import com.biblequiz.modules.adminai.AIGenerationService;
import com.biblequiz.modules.adminai.provider.AIGenerationResult;
import com.biblequiz.modules.adminai.provider.AIProviderRouter;
import com.biblequiz.modules.adminai.quota.AIQuotaService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import com.biblequiz.modules.userquiz.entity.QuestionSet;
import com.biblequiz.modules.userquiz.entity.QuestionSetItem;
import com.biblequiz.modules.userquiz.entity.UserQuestion;
import com.biblequiz.modules.userquiz.service.QuestionSetService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** AEU-1: personal quiz-set AI generate carries distractor-quality to the editor response. */
@WebMvcTest(QuestionSetController.class)
class QuestionSetControllerTest extends BaseControllerTest {

    @MockBean private QuestionSetService service;
    @MockBean private UserRepository userRepository;
    @MockBean private AIProviderRouter aiProviderRouter;
    @MockBean private AIGenerationService aiGenerationService;
    @MockBean private AIQuotaService aiQuotaService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setEmail("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    @SuppressWarnings("unchecked")
    void aiGenerateForSet_annotatesQuality_andPassesDistractorsThrough() throws Exception {
        when(aiQuotaService.tryAcquire(anyInt())).thenReturn(true);
        when(aiQuotaService.snapshot()).thenReturn(new AIQuotaService.Usage(1, 200, 199));

        Map<String, Object> draft = new LinkedHashMap<>();
        draft.put("content", "Q1");
        draft.put("options", List.of("A", "B", "C", "D"));
        draft.put("correctAnswer", 2);
        draft.put("distractors", List.of(
                Map.of("index", 0, "errorType", "nearby_passage", "almostRight", false),
                Map.of("index", 1, "errorType", "wrong_detail", "almostRight", true),
                Map.of("index", 3, "errorType", "true_but_off", "almostRight", false)));
        when(aiProviderRouter.generate(any(), any()))
                .thenReturn(new AIGenerationResult(List.of(draft), 100, 50, "deepseek"));

        // Real-like annotateQuality: mutate drafts in place.
        doAnswer(inv -> {
            List<Map<String, Object>> qs = inv.getArgument(0);
            for (Map<String, Object> q : qs) {
                q.put("_quality", Map.of("valid", true, "duplicateErrorType", false,
                        "almostRightCount", 1, "requiredAlmostRight", 1, "reasons", List.of()));
            }
            return null;
        }).when(aiGenerationService).annotateQuality(any());

        // saved is returned in draft order; the controller zips quality by saved[i].id.
        UserQuestion uq = new UserQuestion();
        uq.setId("uq-1");
        uq.setContent("Q1");
        uq.setOptions(List.of("A", "B", "C", "D"));
        uq.setCorrectAnswer(2);
        uq.setDifficulty(UserQuestion.Difficulty.MEDIUM);
        when(service.attachAIQuestions(eq("set-1"), eq("user-1"), anyList(),
                any(), anyInt(), anyInt(), anyInt(), any())).thenReturn(List.of(uq));

        QuestionSetItem item = new QuestionSetItem("item-1", new QuestionSet(), uq, 0);
        when(service.getItems("set-1")).thenReturn(List.of(item));

        String body = "{\"countMedium\":1,\"book\":\"John\",\"chapterFrom\":3}";
        mockMvc.perform(post("/api/question-sets/set-1/ai-generate")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.questions[0].distractors.length()").value(3))
                .andExpect(jsonPath("$.questions[0].distractors[1].errorType").value("wrong_detail"))
                .andExpect(jsonPath("$.questions[0]._quality.valid").value(true));

        verify(aiGenerationService).annotateQuality(any());
    }
}
