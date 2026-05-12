package com.biblequiz.modules.adminai.provider;

import com.biblequiz.modules.adminai.AIGenerationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.ContentBlock;
import software.amazon.awssdk.services.bedrockruntime.model.ConversationRole;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseRequest;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseResponse;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseOutput;
import software.amazon.awssdk.services.bedrockruntime.model.Message;
import software.amazon.awssdk.services.bedrockruntime.model.TokenUsage;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BedrockDeepSeekProviderTest {

    private BedrockRuntimeClient client;
    private AIGenerationService promptHelper;
    private BedrockDeepSeekProvider provider;
    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        client = mock(BedrockRuntimeClient.class);
        promptHelper = mock(AIGenerationService.class);
        when(promptHelper.buildQuestionPrompt(any(), anyInt(), anyInt(), anyInt(),
                any(), any(), any(), anyInt(), any(), any())).thenReturn("PROMPT");
        when(promptHelper.extractJsonArrayPublic(anyString())).thenAnswer(inv -> {
            String s = inv.getArgument(0);
            int start = s.indexOf('[');
            int end = s.lastIndexOf(']');
            return s.substring(start, end + 1);
        });
        provider = new BedrockDeepSeekProvider(client, "deepseek.v3.2", 4000, 0.7f, mapper, promptHelper);
    }

    @Test
    void providerName_isDeepseek() {
        assertEquals("deepseek", provider.getProviderName());
    }

    @Test
    void isAvailable_clientPresent_returnsTrue() {
        assertTrue(provider.isAvailable());
    }

    @Test
    void isAvailable_nullClient_returnsFalse() {
        BedrockDeepSeekProvider p = new BedrockDeepSeekProvider((BedrockRuntimeClient) null, "x", 1, 0.5f, mapper, promptHelper);
        assertFalse(p.isAvailable());
    }

    @Test
    void generate_validResponse_returnsQuestionsWithTokenUsage() {
        String json = "[{\"content\":\"Q1\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0}]";
        ConverseResponse response = ConverseResponse.builder()
                .output(ConverseOutput.builder()
                        .message(Message.builder()
                                .role(ConversationRole.ASSISTANT)
                                .content(ContentBlock.fromText(json))
                                .build())
                        .build())
                .usage(TokenUsage.builder().inputTokens(100).outputTokens(50).totalTokens(150).build())
                .build();
        when(client.converse(any(ConverseRequest.class))).thenReturn(response);

        AIGenerationContext ctx = AIGenerationContext.of("Genesis", 1, 1, 5, "easy",
                "multiple_choice_single", "vi", 1, null, null);
        AIGenerationResult result = provider.generate(ctx);

        assertEquals(1, result.questions().size());
        assertEquals("Q1", result.questions().get(0).get("content"));
        assertEquals(100, result.inputTokens());
        assertEquals(50, result.outputTokens());
        assertEquals("deepseek", result.providerUsed());
    }

    @Test
    void generate_clientThrows_wrapsInAIProviderException() {
        when(client.converse(any(ConverseRequest.class))).thenThrow(new RuntimeException("bedrock 500"));
        AIGenerationContext ctx = AIGenerationContext.of("Genesis", 1, 1, 5, "easy",
                "multiple_choice_single", "vi", 1, null, null);
        AIProviderException ex = assertThrows(AIProviderException.class, () -> provider.generate(ctx));
        assertTrue(ex.getMessage().contains("DeepSeek (Bedrock) failed"));
    }

    @Test
    void generate_unavailableClient_throws() {
        BedrockDeepSeekProvider p = new BedrockDeepSeekProvider((BedrockRuntimeClient) null, "x", 1, 0.5f, mapper, promptHelper);
        AIGenerationContext ctx = AIGenerationContext.of("Genesis", 1, 1, 5, "easy",
                "multiple_choice_single", "vi", 1, null, null);
        AIProviderException ex = assertThrows(AIProviderException.class, () -> p.generate(ctx));
        assertTrue(ex.getMessage().contains("not initialized"));
    }

    @Test
    void generate_responseWithCodeFence_stripsBeforeParsing() {
        String json = "```json\n[{\"content\":\"Q1\",\"options\":[]}]\n```";
        ConverseResponse response = ConverseResponse.builder()
                .output(ConverseOutput.builder()
                        .message(Message.builder()
                                .role(ConversationRole.ASSISTANT)
                                .content(ContentBlock.fromText(json))
                                .build())
                        .build())
                .usage(TokenUsage.builder().inputTokens(5).outputTokens(10).totalTokens(15).build())
                .build();
        when(client.converse(any(ConverseRequest.class))).thenReturn(response);

        AIGenerationContext ctx = AIGenerationContext.of("Genesis", 1, 1, 5, "easy",
                "multiple_choice_single", "vi", 1, null, null);
        AIGenerationResult result = provider.generate(ctx);
        assertEquals(1, result.questions().size());
    }
}
