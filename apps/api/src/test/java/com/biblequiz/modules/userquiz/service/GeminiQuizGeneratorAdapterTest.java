package com.biblequiz.modules.userquiz.service;

import com.biblequiz.modules.adminai.AIGenerationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** AEU-3: personal-bank generation runs the same distractor-quality validation as admin. */
@ExtendWith(MockitoExtension.class)
class GeminiQuizGeneratorAdapterTest {

    @Mock
    private AIGenerationService aiGenerationService;

    @InjectMocks
    private GeminiQuizGeneratorAdapter adapter;

    private Map<String, Object> mcq() {
        Map<String, Object> q = new LinkedHashMap<>();
        q.put("content", "Q1");
        q.put("options", List.of("A", "B", "C", "D"));
        q.put("correctAnswer", 2);
        q.put("difficulty", "medium");
        return q;
    }

    @Test
    void generate_invokesAnnotateQualityOnRawQuestions() throws Exception {
        when(aiGenerationService.isConfigured()).thenReturn(true);
        List<Map<String, Object>> raw = new ArrayList<>(List.of(mcq()));
        when(aiGenerationService.generate(
                any(), anyInt(), anyInt(), anyInt(), any(), any(), any(), anyInt(), any(), any()))
                .thenReturn(raw);

        var params = new QuizGeneratorPort.QuizGenerationParams(
                "John", 3, 3, 1, 10, null, "MEDIUM", "vi", 1);
        adapter.generate(params);

        // Parity with admin: the same quality annotation runs on the generated batch.
        verify(aiGenerationService).annotateQuality(raw);
    }
}
