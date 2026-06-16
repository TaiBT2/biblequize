package com.biblequiz.modules.adminai;

import com.biblequiz.api.BaseControllerTest;
import com.biblequiz.modules.adminai.provider.AIProviderRouter;
import com.biblequiz.modules.adminai.quota.AIQuotaService;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AIAdminController.class)
class AIAdminControllerTest extends BaseControllerTest {

    @MockBean private AIGenerationService aiGenerationService;
    @MockBean private AIProviderRouter providerRouter;
    @MockBean private AIQuotaService quotaService;

    private static final String BODY =
            "{\"content\":\"Q?\",\"options\":[\"a\",\"b\",\"c\",\"d\"],\"correctAnswer\":[0]," +
            "\"type\":\"multiple_choice_single\",\"language\":\"vi\",\"difficulty\":\"medium\"}";

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void improve_noProvider_returnsAiUnavailable_notError() throws Exception {
        when(aiGenerationService.hasAnyProvider()).thenReturn(false);

        mockMvc.perform(post("/api/admin/ai/improve-question")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aiAvailable").value(false));
        verify(quotaService, never()).tryAcquire(anyInt());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void improve_withProvider_returnsSuggestion() throws Exception {
        when(aiGenerationService.hasAnyProvider()).thenReturn(true);
        when(quotaService.tryAcquire(1)).thenReturn(true);
        when(aiGenerationService.improveQuestion(any(), any(), anyInt(), any(), any(), any()))
                .thenReturn(Map.of("options", List.of("w", "x", "y", "z"), "correctAnswer", 2));

        mockMvc.perform(post("/api/admin/ai/improve-question")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aiAvailable").value(true))
                .andExpect(jsonPath("$.suggestion.correctAnswer").value(2));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = {"USER"})
    void improve_asUser_forbidden() throws Exception {
        mockMvc.perform(post("/api/admin/ai/improve-question")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isForbidden());
    }
}
