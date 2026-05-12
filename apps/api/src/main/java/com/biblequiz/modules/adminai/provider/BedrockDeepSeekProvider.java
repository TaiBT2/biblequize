package com.biblequiz.modules.adminai.provider;

import com.biblequiz.modules.adminai.AIGenerationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.ContentBlock;
import software.amazon.awssdk.services.bedrockruntime.model.ConversationRole;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseRequest;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseResponse;
import software.amazon.awssdk.services.bedrockruntime.model.InferenceConfiguration;
import software.amazon.awssdk.services.bedrockruntime.model.Message;
import software.amazon.awssdk.services.bedrockruntime.model.SystemContentBlock;

import java.util.List;
import java.util.Map;

/**
 * DeepSeek V3.2 via AWS Bedrock (default region: ap-northeast-1 / Tokyo).
 *
 * Credentials are resolved via {@link DefaultCredentialsProvider}: env vars / profile
 * for dev, IAM role for prod (EC2/ECS instance metadata).
 *
 * Disable by setting {@code biblequiz.ai.bedrock.enabled=false} (e.g. local dev without AWS creds).
 */
@Component
@ConditionalOnProperty(value = "biblequiz.ai.bedrock.enabled", havingValue = "true", matchIfMissing = true)
public class BedrockDeepSeekProvider implements AIProvider {

    private static final Logger log = LoggerFactory.getLogger(BedrockDeepSeekProvider.class);

    private final BedrockRuntimeClient client;
    private final String modelId;
    private final int maxTokens;
    private final float temperature;
    private final ObjectMapper mapper;
    private final AIGenerationService promptHelper;
    private volatile boolean clientHealthy;

    public BedrockDeepSeekProvider(
            @Value("${biblequiz.ai.bedrock.region:ap-northeast-1}") String region,
            @Value("${biblequiz.ai.bedrock.model-id:deepseek.v3.2}") String modelId,
            @Value("${biblequiz.ai.bedrock.max-tokens:4000}") int maxTokens,
            @Value("${biblequiz.ai.bedrock.temperature:0.7}") float temperature,
            ObjectMapper mapper,
            AIGenerationService promptHelper
    ) {
        this.modelId = modelId;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
        this.mapper = mapper;
        this.promptHelper = promptHelper;
        BedrockRuntimeClient built = null;
        boolean healthy = false;
        try {
            built = BedrockRuntimeClient.builder()
                    .region(Region.of(region))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
            healthy = true;
            log.info("[AI][Bedrock] Initialized client region={} modelId={}", region, modelId);
        } catch (Exception e) {
            // Initialization failures (missing creds in dev) should NOT crash the app;
            // the provider just reports isAvailable()==false so the router skips it.
            log.warn("[AI][Bedrock] Initialization failed: {} — provider disabled", e.getMessage());
        }
        this.client = built;
        this.clientHealthy = healthy;
    }

    /** Test seam: allow injecting a mock client (used by unit tests). */
    BedrockDeepSeekProvider(BedrockRuntimeClient client, String modelId, int maxTokens,
                            float temperature, ObjectMapper mapper, AIGenerationService promptHelper) {
        this.client = client;
        this.modelId = modelId;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
        this.mapper = mapper;
        this.promptHelper = promptHelper;
        this.clientHealthy = client != null;
    }

    @Override
    public String getProviderName() { return "deepseek"; }

    @Override
    public boolean isAvailable() { return clientHealthy && client != null; }

    @Override
    public AIGenerationResult generate(AIGenerationContext ctx) {
        if (!isAvailable()) {
            throw new AIProviderException("DeepSeek (Bedrock) client is not initialized");
        }

        String prompt = promptHelper.buildQuestionPrompt(
                ctx.book(), ctx.chapter(), ctx.verseStart(), ctx.verseEnd(),
                ctx.difficulty(), ctx.type(), ctx.language(), ctx.count(),
                ctx.scriptureText(), ctx.customPrompt());

        ConverseRequest converseRequest = ConverseRequest.builder()
                .modelId(modelId)
                .system(SystemContentBlock.builder()
                        .text("You are an expert Bible quiz question writer. Return ONLY a JSON array — no markdown fences, no prose.")
                        .build())
                .messages(Message.builder()
                        .role(ConversationRole.USER)
                        .content(ContentBlock.fromText(prompt))
                        .build())
                .inferenceConfig(InferenceConfiguration.builder()
                        .maxTokens(maxTokens)
                        .temperature(temperature)
                        .build())
                .build();

        log.info("[AI][Bedrock] Invoking modelId={} count={} book={} {}:{}-{}",
                modelId, ctx.count(), ctx.book(), ctx.chapter(), ctx.verseStart(), ctx.verseEnd());

        try {
            ConverseResponse response = client.converse(converseRequest);
            String rawText = response.output().message().content().get(0).text().strip();
            if (rawText.startsWith("```")) {
                rawText = rawText.replaceFirst("```(?:json)?\\s*", "").replaceAll("```\\s*$", "").strip();
            }
            String jsonArray = promptHelper.extractJsonArrayPublic(rawText);
            List<Map<String, Object>> questions = mapper.readValue(jsonArray, new TypeReference<>() {});

            int inputTokens = response.usage() != null && response.usage().inputTokens() != null
                    ? response.usage().inputTokens() : 0;
            int outputTokens = response.usage() != null && response.usage().outputTokens() != null
                    ? response.usage().outputTokens() : 0;

            log.info("[AI][Bedrock] Generated {}/{} questions, tokens in/out={}/{}",
                    questions.size(), ctx.count(), inputTokens, outputTokens);
            return new AIGenerationResult(questions, inputTokens, outputTokens, getProviderName());
        } catch (Exception e) {
            log.error("[AI][Bedrock] Generation failed: {}", e.getMessage(), e);
            throw new AIProviderException("DeepSeek (Bedrock) failed: " + e.getMessage(), e);
        }
    }
}
