# PROMPT: DeepSeek V3.2 Bedrock Integration

> **For Claude Code agent** — Verification-first, phase-separated, stop-and-confirm between phases.
> **Estimated effort:** ~1,200-1,700 LOC, ~5-7 days
> **Created:** 2026-05-12
> **Status:** Ready for execution

---

## 📋 Context & Locked Decisions

User wants to add **DeepSeek V3.2 via AWS Bedrock (Tokyo region)** as the default AI provider for question generation, replacing Gemini/Claude as fallbacks.

**6 decisions locked (do not re-litigate):**

| ID | Decision |
|---|---|
| D1 | Add DeepSeek as **default**, Gemini + Claude as **fallbacks** |
| D2 | Model: `deepseek.v3.2` via Bedrock region `ap-northeast-1` (Tokyo) |
| D3 | Model selector visible to **admin only**; group leader always uses default (invisible to them) |
| D4 | Approval workflow: group leader AI-gen → **skip admin review queue**, publish directly to group quiz set; admin AI-gen → existing 2-admin review queue (unchanged) |
| D5 | Quota: **shared global 200 câu/day** for admin + group leaders combined |
| D6 | AWS credentials: **IAM role** in prod (EC2/ECS auto-credentials); env vars for dev/staging |

---

## 🚫 Canonical Constraints (C1-C10) — DO NOT VIOLATE

- **C1** Tier names UNCHANGED: Tân Tín Hữu → Người Tìm Kiếm → Môn Đồ → Hiền Triết → Tiên Tri → Sứ Đồ. Do NOT touch tier-related code.
- **C2** Vietnamese language is default for both UI and prompts to DeepSeek. Bible version BTTHĐ 2011 (vi), ESV (en).
- **C3** Design system Sacred Modernist hardcoded hex values (no CSS vars in any new mockup if needed).
- **C4** Spring Boot 3.3 + Java 17. Do NOT upgrade Java or Spring version.
- **C5** Existing Gemini + Claude code must KEEP WORKING as fallback. Do NOT delete their code paths.
- **C6** No Stitch AI redesigns. Surgical edits to existing admin `AIQuestionGenerator.tsx` only.
- **C7** Daily quota counter resets at **00:00 UTC** (consistent with Daily Challenge per SPEC_USER §5.3 FIX-010).
- **C8** Audit log entries follow existing pattern (SPEC_ADMIN §16): new actions `ai.generate.deepseek`, `ai.fallback.triggered`.
- **C9** All new tests added; existing test counts must not drop. Pre-existing BE failures (QuestionReviewControllerTest etc.) are known baselines, leave them.
- **C10** Use `software.amazon.awssdk:bedrockruntime` v2.x SDK (NOT v1 `com.amazonaws:aws-java-sdk-bedrock`). Latest stable as of Feb 2026.

---

## 🛑 Stop-and-Confirm Checkpoints

After each phase, **STOP** and wait for human confirmation before proceeding:

```
Phase A (Audit) → STOP → human review of AUDIT_REPORT.md → "go Phase B"
Phase B (Backend) → STOP → human verify backend tests + manual API call → "go Phase C"
Phase C (Frontend) → STOP → human verify admin model selector + group leader flow unchanged → "go Phase D"
Phase D (Approval flow split) → STOP → human verify both paths work → "go Phase E"
Phase E (Final verification) → STOP → human approve before merge
```

Each phase = separate commit (rollback-safe per project pattern).

---

# Phase A — Audit (verification-first)

> **Goal:** Understand current AI generation architecture before touching anything. Output `AUDIT_REPORT_DEEPSEEK.md` with file:line citations.

## A.1 Verification protocol — MANDATORY

Before writing ANY code, you MUST grep the actual source files and cite `file:line`. Do NOT assume from spec docs or memory. The spec may be outdated; source is ground truth.

## A.2 Backend grep targets

Run these greps and capture findings:

```bash
# 1. Existing AI provider architecture
grep -rn "GeminiClient\|ClaudeClient\|AIProvider\|AIGenerationService" \
  apps/api/src/main/java --include="*.java" | head -50

# 2. Where is model param passed
grep -rn "\"gemini\"\|\"claude\"\|GeminiModel\|ClaudeModel" \
  apps/api/src/main/java --include="*.java"

# 3. Quota tracking mechanism
grep -rn "AI_DAILY_QUOTA\|dailyQuota\|aiQuota\|AIGenerationJob" \
  apps/api/src/main/java --include="*.java"

# 4. Cost tracking
grep -rn "costUSD\|aiCost\|AI_COST_ALERT" \
  apps/api/src/main/java --include="*.java"

# 5. Admin endpoint
grep -rn "@PostMapping.*ai/generate" \
  apps/api/src/main/java --include="*.java"

# 6. Group leader AI gen endpoint (Sprint 5)
grep -rn "groups.*quiz-sets.*ai\|GroupQuizSetController\|generateForGroup" \
  apps/api/src/main/java --include="*.java"

# 7. Existing AWS SDK dependency
grep -A1 "awssdk\|aws-java-sdk\|amazon" apps/api/pom.xml
```

## A.3 Frontend grep targets

```bash
# 1. Admin AI generator component
find apps/web/src -name "AIQuestionGenerator*"
grep -n "gemini\|claude\|model.*selector\|modelType" \
  apps/web/src/pages/admin/AIQuestionGenerator.tsx

# 2. Group leader create quiz set modal
find apps/web/src -name "*QuizSet*" -o -name "*CreateQuizSet*"
grep -rn "AI Tạo\|AI tạo\|AIGenerate" apps/web/src/pages/groups/

# 3. Frontend API calls to AI endpoints
grep -rn "/api/admin/ai/generate\|/api/groups/.*quiz-sets/.*ai" \
  apps/web/src --include="*.ts" --include="*.tsx"
```

## A.4 AWS region verification (CRITICAL)

Verify DeepSeek V3.2 is actually available in `ap-northeast-1`:

```bash
# Assumes AWS CLI configured with credentials
aws bedrock list-foundation-models --region ap-northeast-1 \
  --query "modelSummaries[?contains(modelId,'deepseek')].[modelId,modelName,modelLifecycle.status]" \
  --output table
```

**Decision tree based on output:**

| Result | Action |
|---|---|
| `deepseek.v3.2` available in ap-northeast-1 | ✅ Proceed as planned |
| Only `deepseek.v3.1` in ap-northeast-1 | ⚠️ STOP — ask human: "Fallback to V3.1 in Tokyo, or use V3.2 in us-west-2?" |
| No DeepSeek in ap-northeast-1 | 🛑 STOP — ask human: "Use us-west-2 (V3.2) or wait?" |
| AWS CLI not configured | Document in report, ask human for region confirmation |

Also test model invocation (no-op echo to verify access):

```bash
aws bedrock-runtime invoke-model \
  --region ap-northeast-1 \
  --model-id deepseek.v3.2 \
  --body '{"messages":[{"role":"user","content":[{"text":"test"}]}],"max_tokens":5}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/bedrock-test-out.json
cat /tmp/bedrock-test-out.json
```

## A.5 Critical questions to answer in AUDIT_REPORT

Answer each with `file:line` citation:

1. **Does an `AIProvider` interface/abstraction exist?**
   - If yes: where is it, what methods, who implements?
   - If no: how are Gemini and Claude called? (probably duplicated code or `if (model.equals("gemini"))` branches)

2. **Where is the daily quota enforced?**
   - DB column? Redis counter? In-memory? Both?
   - Reset mechanism (cron? on-read check?)

3. **Group leader AI gen endpoint status (Sprint 5)**
   - Does `POST /api/groups/{id}/quiz-sets/ai-generate` (or similar) exist?
   - If yes: which provider does it call?
   - If no: does the modal currently call admin endpoint with group context, or is the "AI Tạo" tab in screenshot non-functional yet?

4. **Question entity model**
   - Are admin-gen and group-gen questions stored in same `question` table or separate?
   - Field `Question.scope` (admin_pool vs group_only) or similar?
   - How does group quiz set link to questions (FK, junction table, JSON)?

5. **Existing AWS infra**
   - Any AWS SDK already in pom.xml? (e.g., S3 for avatars)
   - Existing IAM role / credentials chain config?

## A.6 Output `AUDIT_REPORT_DEEPSEEK.md`

Structure:

```markdown
# Audit Report: DeepSeek Bedrock Integration

## Section 1: AI Provider Architecture
- Abstraction status: [exists/missing] (file:line)
- Current providers: Gemini at <file:line>, Claude at <file:line>
- Recommended refactor: [yes/no, scope]

## Section 2: Quota & Cost Tracking
- Quota mechanism: [DB/Redis/in-memory] at <file:line>
- Cost tracking: <field/table at file:line>
- Reset job: <file:line or "missing">

## Section 3: Endpoints
- Admin: POST /api/admin/ai/generate at <controller:method>
- Group leader: <status>

## Section 4: Frontend
- Admin selector: <component:line>
- Group modal: <component:line>

## Section 5: AWS Bedrock Verification
- Region: ap-northeast-1
- DeepSeek V3.2 status: [available/not-available/V3.1-only]
- Test invocation: [success/fail with output]

## Section 6: Critical Gaps & Risks
- [list any blockers found]

## Section 7: Recommended Phase B Plan
- [refactor needed: yes/no]
- [migration needed: yes/no, V53/V54?]
- [estimated LOC delta]
```

## A.7 ✋ STOP at end of Phase A

Commit: `chore: DeepSeek Bedrock integration audit report`
Wait for human to review AUDIT_REPORT.md and say "go Phase B".

---

# Phase B — Backend Implementation

> **Conditional on audit findings.** If `AIProvider` abstraction doesn't exist, refactor first.

## B.1 Dependencies (pom.xml)

```xml
<!-- AWS SDK v2 BedrockRuntime -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>bedrockruntime</artifactId>
    <version>2.30.18</version> <!-- or latest stable -->
</dependency>

<!-- AWS SDK v2 core (if not already present via transitive) -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>auth</artifactId>
    <version>2.30.18</version>
</dependency>
```

Verify no v1 SDK conflict: `mvn dependency:tree | grep amazon`.

## B.2 Provider abstraction (if missing)

Create `apps/api/src/main/java/com/biblequiz/modules/ai/provider/AIProvider.java`:

```java
package com.biblequiz.modules.ai.provider;

public interface AIProvider {
    /**
     * Generate questions per the request. Throws on failure (caller handles fallback).
     */
    AIGenerationResponse generate(AIGenerationRequest request);

    /**
     * Unique short name: "deepseek", "gemini", "claude"
     */
    String getProviderName();

    /**
     * Whether provider is currently available (credentials present, not in cooldown).
     */
    boolean isAvailable();

    /**
     * Estimate cost in USD for given token counts. Returns BigDecimal for precision.
     */
    java.math.BigDecimal estimateCost(int inputTokens, int outputTokens);
}
```

`AIGenerationRequest` DTO (record):

```java
public record AIGenerationRequest(
    String scriptureBook,
    Integer chapterFrom,
    Integer chapterTo,
    String topic,           // "Chủ đề bài học hôm nay" or null
    String difficulty,      // "EASY", "MEDIUM", "HARD", "MIXED"
    String questionType,    // "MCQ", "TRUE_FALSE", "MIXED"
    Integer count,          // 1-20
    String language,        // "vi" | "en"
    String scriptureVersion // "VIE2011" | "ESV"
) {}
```

`AIGenerationResponse`:

```java
public record AIGenerationResponse(
    List<DraftQuestion> drafts,
    int inputTokens,
    int outputTokens,
    java.math.BigDecimal estimatedCostUSD,
    String providerUsed   // For audit log
) {}
```

Refactor existing `GeminiClient` and `ClaudeClient` to implement `AIProvider`. Keep public methods/behavior identical to avoid breaking callers.

## B.3 BedrockDeepSeekProvider implementation

`apps/api/src/main/java/com/biblequiz/modules/ai/provider/BedrockDeepSeekProvider.java`:

```java
@Service
@ConditionalOnProperty(value = "biblequiz.ai.bedrock.enabled", havingValue = "true", matchIfMissing = true)
public class BedrockDeepSeekProvider implements AIProvider {

    private final BedrockRuntimeClient client;
    private final String modelId;
    private final ObjectMapper mapper;
    private final Logger log = LoggerFactory.getLogger(BedrockDeepSeekProvider.class);

    // Pricing: verify against Bedrock pricing page before commit
    private static final BigDecimal INPUT_COST_PER_1M = new BigDecimal("0.35");  // placeholder
    private static final BigDecimal OUTPUT_COST_PER_1M = new BigDecimal("0.55"); // placeholder

    public BedrockDeepSeekProvider(
        @Value("${biblequiz.ai.bedrock.region:ap-northeast-1}") String region,
        @Value("${biblequiz.ai.bedrock.model-id:deepseek.v3.2}") String modelId,
        ObjectMapper mapper
    ) {
        this.client = BedrockRuntimeClient.builder()
            .region(Region.of(region))
            // IAM role auto-discovery via DefaultCredentialsProvider chain
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
        this.modelId = modelId;
        this.mapper = mapper;
    }

    @Override
    public AIGenerationResponse generate(AIGenerationRequest request) {
        String systemPrompt = PromptBuilder.buildSystemPrompt(request);
        String userPrompt = PromptBuilder.buildUserPrompt(request);

        // Use Converse API (recommended, unified across providers)
        ConverseRequest converseRequest = ConverseRequest.builder()
            .modelId(modelId)
            .system(SystemContentBlock.builder().text(systemPrompt).build())
            .messages(Message.builder()
                .role(ConversationRole.USER)
                .content(ContentBlock.fromText(userPrompt))
                .build())
            .inferenceConfig(InferenceConfiguration.builder()
                .maxTokens(4000)
                .temperature(0.7f)
                .build())
            .build();

        try {
            ConverseResponse response = client.converse(converseRequest);
            String rawText = response.output().message().content().get(0).text();

            List<DraftQuestion> drafts = JsonParser.parseDrafts(rawText, mapper);

            return new AIGenerationResponse(
                drafts,
                response.usage().inputTokens(),
                response.usage().outputTokens(),
                estimateCost(response.usage().inputTokens(), response.usage().outputTokens()),
                "deepseek"
            );
        } catch (BedrockRuntimeException e) {
            log.error("Bedrock DeepSeek invocation failed", e);
            throw new AIProviderException("DeepSeek (Bedrock) failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String getProviderName() { return "deepseek"; }

    @Override
    public boolean isAvailable() {
        // Simple ping check, cache result 60s to avoid AWS rate limits
        return true; // refine: use Resilience4j circuit breaker
    }

    @Override
    public BigDecimal estimateCost(int inputTokens, int outputTokens) {
        BigDecimal inCost = INPUT_COST_PER_1M
            .multiply(BigDecimal.valueOf(inputTokens))
            .divide(BigDecimal.valueOf(1_000_000), 6, RoundingMode.HALF_UP);
        BigDecimal outCost = OUTPUT_COST_PER_1M
            .multiply(BigDecimal.valueOf(outputTokens))
            .divide(BigDecimal.valueOf(1_000_000), 6, RoundingMode.HALF_UP);
        return inCost.add(outCost);
    }
}
```

⚠️ **Verify exact pricing** for `deepseek.v3.2` on Bedrock before commit. Check https://aws.amazon.com/bedrock/pricing/ — update constants if different.

## B.4 Fallback chain router

`AIProviderRouter.java`:

```java
@Service
public class AIProviderRouter {

    private final List<AIProvider> providersInOrder; // Spring injects all impls
    private final AppConfigService config;
    private final AuditLogService auditLog;

    public AIProviderRouter(
        BedrockDeepSeekProvider deepseek,
        GeminiProvider gemini,
        ClaudeProvider claude,
        AppConfigService config,
        AuditLogService auditLog
    ) {
        // Order per D1: DeepSeek default, Gemini + Claude fallback
        this.providersInOrder = List.of(deepseek, gemini, claude);
        this.config = config;
        this.auditLog = auditLog;
    }

    public AIGenerationResponse generate(AIGenerationRequest request, String requestedProvider, Long actorUserId) {
        // If admin explicitly selected a provider (D3), respect that and DO NOT fallback
        if (requestedProvider != null && !"auto".equalsIgnoreCase(requestedProvider)) {
            AIProvider provider = findProvider(requestedProvider);
            return provider.generate(request);
        }

        // Auto mode: try default → fallback chain
        Exception lastError = null;
        for (AIProvider provider : providersInOrder) {
            if (!provider.isAvailable()) continue;
            try {
                AIGenerationResponse response = provider.generate(request);

                // Log fallback if not the first provider
                if (provider != providersInOrder.get(0)) {
                    auditLog.log(actorUserId, "ai.fallback.triggered", Map.of(
                        "primaryProvider", providersInOrder.get(0).getProviderName(),
                        "actualProvider", provider.getProviderName(),
                        "lastError", lastError != null ? lastError.getMessage() : "unavailable"
                    ));
                }
                return response;
            } catch (Exception e) {
                lastError = e;
                log.warn("Provider {} failed, trying next", provider.getProviderName(), e);
            }
        }
        throw new AIProviderException("All AI providers failed. Last error: " +
            (lastError != null ? lastError.getMessage() : "none"));
    }

    private AIProvider findProvider(String name) {
        return providersInOrder.stream()
            .filter(p -> p.getProviderName().equalsIgnoreCase(name))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown provider: " + name));
    }
}
```

## B.5 Quota enforcement (D5: shared global 200/day)

Use Redis counter `ai:quota:{yyyy-MM-dd}` (UTC), TTL 25h:

```java
@Service
public class AIQuotaService {
    private final RedisTemplate<String, String> redis;
    private final AppConfigService config;

    public boolean tryAcquire(int count) {
        int quota = config.getInt("AI_DAILY_QUOTA", 200);
        String key = "ai:quota:" + LocalDate.now(ZoneOffset.UTC);
        Long newValue = redis.opsForValue().increment(key, count);
        redis.expire(key, Duration.ofHours(25));
        if (newValue > quota) {
            // Rollback the increment
            redis.opsForValue().increment(key, -count);
            return false;
        }
        return true;
    }

    public int getRemainingQuota() {
        int quota = config.getInt("AI_DAILY_QUOTA", 200);
        String key = "ai:quota:" + LocalDate.now(ZoneOffset.UTC);
        String used = redis.opsForValue().get(key);
        return quota - (used != null ? Integer.parseInt(used) : 0);
    }
}
```

Call `tryAcquire(count)` BEFORE invoking provider. Return HTTP 429 with body `{"error":"daily_quota_exhausted","remaining":0,"resetAt":"<utc>"}` if exhausted.

## B.6 application.yml config

```yaml
biblequiz:
  ai:
    default-provider: deepseek
    fallback-order: [gemini, claude]
    bedrock:
      enabled: true
      region: ap-northeast-1
      model-id: deepseek.v3.2
      max-tokens: 4000
      temperature: 0.7
    quota:
      daily-limit: 200
      cost-alert-usd: 10.00
```

`application-dev.yml` override if needed:

```yaml
biblequiz:
  ai:
    bedrock:
      # For dev: use AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY env vars
      # DefaultCredentialsProvider picks them up automatically
      region: ap-northeast-1
```

`application-prod.yml`:

```yaml
biblequiz:
  ai:
    bedrock:
      # IAM role auto-discovered via EC2 instance metadata / ECS task role
      region: ap-northeast-1
```

## B.7 Migration (if needed)

If audit shows `app_config` table doesn't have these keys, add migration `V53__ai_provider_config.sql`:

```sql
INSERT INTO app_config (config_key, config_value, default_value, description, category)
VALUES
  ('AI_DEFAULT_PROVIDER', 'deepseek', 'deepseek', 'Default AI provider (deepseek/gemini/claude)', 'ai'),
  ('AI_FALLBACK_ORDER', 'gemini,claude', 'gemini,claude', 'Comma-separated fallback chain', 'ai'),
  ('AI_BEDROCK_REGION', 'ap-northeast-1', 'ap-northeast-1', 'AWS region for Bedrock', 'ai'),
  ('AI_BEDROCK_MODEL_ID', 'deepseek.v3.2', 'deepseek.v3.2', 'Bedrock model ID', 'ai')
ON DUPLICATE KEY UPDATE config_value=config_value;
```

## B.8 Unit tests

Required tests (mock `BedrockRuntimeClient`):

```java
// apps/api/src/test/java/com/biblequiz/modules/ai/provider/BedrockDeepSeekProviderTest.java
@Test void generateQuestions_validRequest_returnsResponse()
@Test void generateQuestions_bedrockFails_throwsAIProviderException()
@Test void estimateCost_correctCalculation()
@Test void isAvailable_initiallyTrue()

// AIProviderRouterTest.java
@Test void generate_primarySucceeds_returnsImmediately()
@Test void generate_primaryFails_fallsBackToSecondary()
@Test void generate_allFail_throwsAIProviderException()
@Test void generate_explicitProvider_doesNotFallback()
@Test void generate_fallbackTriggered_logsAuditEntry()

// AIQuotaServiceTest.java
@Test void tryAcquire_belowLimit_returnsTrue()
@Test void tryAcquire_exceedsLimit_returnsFalseAndRollsBack()
@Test void getRemainingQuota_correctValue()
```

Minimum 12 new tests.

## B.9 ✋ STOP at end of Phase B

```bash
# Run before commit
cd apps/api && ./mvnw test

# Manual integration test (requires real AWS creds in env)
curl -X POST http://localhost:8080/api/admin/ai/generate \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"scriptureBook":"Genesis","chapterFrom":1,"chapterTo":3,"count":3,"difficulty":"EASY","language":"vi"}'
```

Commit: `feat(ai): DeepSeek V3.2 Bedrock provider with fallback chain`

---

# Phase C — Frontend (admin model selector update)

> **Per D3**, group leader modal needs **NO change**. Only admin `AIQuestionGenerator.tsx` gets new option.

## C.1 Admin AI generator update

`apps/web/src/pages/admin/AIQuestionGenerator.tsx`:

Add DeepSeek as 3rd model option, mark as Default:

```tsx
const MODEL_OPTIONS = [
  {
    id: 'deepseek',
    label: 'DeepSeek V3.2',
    sublabel: 'Mặc định · Bedrock Tokyo',
    badge: 'DEFAULT',
    description: 'Reasoning mạnh, chi phí thấp. Recommended cho hầu hết use cases.'
  },
  {
    id: 'gemini',
    label: 'Gemini 2.5 Pro',
    sublabel: 'Fallback',
    description: 'Google fallback.'
  },
  {
    id: 'claude',
    label: 'Claude Sonnet 4.6',
    sublabel: 'Fallback',
    description: 'Anthropic fallback. Đắt nhất.'
  },
];

// Default selected: 'deepseek'
const [selectedModel, setSelectedModel] = useState<string>('deepseek');
```

UI: 3 tabs/cards with "DEFAULT" badge on DeepSeek (gold color `#e8a832`). Use existing tab pattern, do NOT redesign.

## C.2 Group leader modal — verify unchanged

Per D3, group leader sees NO model selector. Just verify:

```bash
# Read but do NOT modify these files:
apps/web/src/pages/groups/components/CreateQuizSetModal.tsx  # or wherever the modal is
# (path discovered in Phase A audit)
```

The modal's "AI Tạo" tab should already submit without a `model` field, defaulting to backend's `AI_DEFAULT_PROVIDER` = "deepseek". If audit shows it currently hardcodes `model: "gemini"`, **remove that hardcode** so backend default takes over.

## C.3 Frontend tests

Update `AIQuestionGenerator.test.tsx`:

```tsx
test('DeepSeek is default selected model', () => { ... })
test('shows DEFAULT badge on DeepSeek option', () => { ... })
test('admin can switch to Gemini fallback', () => { ... })
test('admin can switch to Claude fallback', () => { ... })
```

Group leader modal tests: verify NO model field in submitted payload.

## C.4 ✋ STOP at end of Phase C

```bash
cd apps/web && npx vitest run
# Expect: all existing tests pass + 4+ new tests
```

Commit: `feat(admin): DeepSeek as default AI provider in model selector`

---

# Phase D — Approval workflow split (D4)

> Per D4: group leader AI-gen → **skip review queue**, publish directly. Admin AI-gen → existing 2-admin queue (unchanged).

## D.1 Endpoint behavior

**Admin endpoint** `POST /api/admin/ai/generate` (existing):
- Behavior UNCHANGED — drafts go to `ReviewQueue` (status=pending), require 2 admin approvals.
- New: response includes `providerUsed` field.

**Group leader endpoint** `POST /api/groups/{id}/quiz-sets/ai-generate` (Sprint 5 — verify exists in audit):
- After generation, save questions directly into the group's quiz set.
- Per Sprint 5 workflow statuses: questions go to `DRAFT` status, group leader can publish to `PUBLISHED` manually.
- Do NOT enter admin review queue.
- Group leader sees drafts inline in modal → edit if needed → "Lưu bộ câu hỏi" (existing button).

## D.2 Audit log entries

Add to `AuditLogService` (per SPEC_ADMIN §16):

```java
"ai.generate.deepseek"     // any provider, log which one used
"ai.fallback.triggered"    // when fallback path activates
"group.ai_generate"        // group leader AI gen action
"quizset.published"        // group leader publishes set
```

## D.3 Permission guard

Group leader endpoint must verify:
- Actor is `group_leader` or `mod` of THIS group (not just any group)
- Group not locked/deleted
- Quota available (calls `AIQuotaService.tryAcquire`)

```java
@PreAuthorize("@groupSecurity.isLeaderOrMod(#groupId, principal)")
@PostMapping("/api/groups/{groupId}/quiz-sets/ai-generate")
public ResponseEntity<?> generateForGroup(
    @PathVariable Long groupId,
    @RequestBody AIGenerationRequest request,
    @AuthenticationPrincipal AppUser actor
) {
    if (!quotaService.tryAcquire(request.count())) {
        return ResponseEntity.status(429).body(Map.of(
            "error", "daily_quota_exhausted",
            "remaining", quotaService.getRemainingQuota()
        ));
    }
    AIGenerationResponse response = router.generate(request, null /* auto */, actor.getId());
    // Save directly to quiz set, skip review queue
    quizSetService.addDraftQuestions(groupId, response.drafts(), actor.getId());
    auditLog.log(actor.getId(), "group.ai_generate", Map.of("groupId", groupId, "count", response.drafts().size()));
    return ResponseEntity.ok(response);
}
```

## D.4 Tests

```java
@Test void groupLeaderAIGen_skipsReviewQueue_savesDirectly()
@Test void adminAIGen_entersReviewQueue_unchanged()
@Test void groupLeaderAIGen_quotaExhausted_returns429()
@Test void groupLeaderAIGen_notLeader_returns403()
```

## D.5 ✋ STOP at end of Phase D

```bash
# Run full test suite
cd apps/api && ./mvnw test
cd apps/web && npx vitest run

# Manual flow tests:
# 1. Login as admin → /admin/ai-generator → generate 3 questions → verify they appear in /admin/review-queue
# 2. Login as group leader → group page → create quiz set → "AI Tạo" tab → generate 3 questions → verify they appear in the group's quiz set directly (no review queue)
```

Commit: `feat(ai): split approval workflow — group leader AI-gen publishes directly, admin AI-gen requires review`

---

# Phase E — Final Verification

## E.1 Manual test matrix

| # | Scenario | Expected |
|---|---|---|
| 1 | Admin gen with DeepSeek (default) | Hits Bedrock, drafts in review queue, audit log `ai.generate.deepseek` |
| 2 | Admin gen with Gemini (manual select) | Hits Gemini, drafts in review queue, no fallback triggered |
| 3 | Group leader gen | Hits Bedrock, drafts in group quiz set directly, NO review queue |
| 4 | Bedrock fails (simulate by invalid model ID) | Fallback to Gemini, audit log `ai.fallback.triggered` |
| 5 | Quota exhausted (set Redis counter to 200) | 429 response, friendly error |
| 6 | Group leader not in group | 403 response |
| 7 | Admin explicit Gemini, Gemini fails | NO fallback (admin override = no auto-fallback) |
| 8 | DEV env without AWS creds | Friendly error, no crash |

## E.2 Regression

```bash
# Backend
cd apps/api && ./mvnw test
# Expect: >= baseline tests pass (note pre-existing failures per C9)

# Frontend
cd apps/web && npx vitest run
# Expect: 387+ tests pass

# Playwright smoke (admin AI gen flow)
cd apps/web && npx playwright test admin-ai-generator
```

## E.3 CloudWatch alarm setup (documentation only, infra task)

Document in `docs/dev/aws-setup.md` (or update if exists):
- CloudWatch alarm: monthly Bedrock spend > $50 → SNS topic → email
- Tag all Bedrock requests with `Project: BibleQuiz` for cost allocation

## E.4 Final commit

```
feat(ai): DeepSeek V3.2 Bedrock integration complete

- BedrockDeepSeekProvider as default, Gemini/Claude as fallbacks
- AIProviderRouter with explicit-vs-auto routing logic
- Shared global quota 200/day in Redis
- Admin AI gen → review queue (unchanged)
- Group leader AI gen → publishes directly (new)
- AWS IAM role auto-discovery in prod
- 16+ new tests, all green

Closes BL-AD-7
```

---

# 📜 Spec Patches (to apply after Phase E approval)

## Patch 1: `SPEC_ADMIN_v3.1` §6 update

Replace section 6.1 "Configuration":

```markdown
### 6.1 Configuration

- Scripture selector: book → chapter range → verse range (optional)
- **Model: DeepSeek V3.2 (default, via Bedrock) / Gemini / Claude** (3-tab selector for admin only)
- AI mode: `auto` (default → fallback chain) vs explicit provider
- Difficulty: Easy/Medium/Hard/Mixed
- Question type: MCQ/True-False/Mixed
- Count: 1-20 (default 10)
- Language: Tiếng Việt (default), English
- Scripture version: VIE2011 (vi), NIV/ESV/KJV (en)

**Provider routing:**
- Default: DeepSeek V3.2 via Bedrock (ap-northeast-1 / Tokyo)
- Fallback chain on failure: Gemini 2.5 Pro → Claude Sonnet 4.6
- Explicit provider selection: no auto-fallback (admin must retry)
- Group leader AI gen: always uses default (DeepSeek), no selector visible
```

## Patch 2: `SPEC_ADMIN_v3.1` §6.2 quota

Replace section 6.2:

```markdown
### 6.2 Quota & Cost

- **Daily quota: 200 câu/day shared globally** (admin + group leaders combined)
- Counter: Redis `ai:quota:{yyyy-MM-dd}` UTC, TTL 25h
- Reset: 00:00 UTC daily
- Cost alert: $10/day (cumulative across all providers)
- Display in admin UI: "45/200 câu hôm nay" + "$3.42/$10.00"
- 429 response when quota exhausted: `{"error":"daily_quota_exhausted","remaining":0,"resetAt":"<utc>"}`
- Group leader sees friendly toast: "Đã đạt giới hạn hôm nay. Vui lòng thử lại ngày mai."
```

## Patch 3: `SPEC_GROUP_v1.3` add group leader AI gen section

Add new section 6.X "Group AI Question Generation":

```markdown
### 6.X Group AI Question Generation (Sprint 5)

Group leader/mod có thể dùng AI để tạo câu hỏi cho quiz set của nhóm.

**Endpoint:** `POST /api/groups/{groupId}/quiz-sets/ai-generate`

**Workflow:**
1. Group leader/mod mở modal "Tạo bộ câu hỏi mới" → tab "AI Tạo"
2. Nhập: tên bộ, sách Kinh Thánh, chương từ/đến, chủ đề bài học, số câu, độ khó
3. Submit → backend calls `AIProviderRouter` với default provider (DeepSeek)
4. Drafts trả về → hiện inline trong modal cho leader review/edit
5. Leader bấm "Lưu bộ câu hỏi" → save với status `DRAFT` hoặc `PUBLISHED` (per Sprint 5 workflow)

**Không có:**
- Model selector (admin-only)
- Admin review queue (group leader tự verify, publish ngay)

**Quota:** Cùng pool 200/day shared với admin (xem SPEC_ADMIN §6.2).

**Permission:** Chỉ `group_leader` hoặc `mod` của nhóm đó. Member → 403.

**Audit log:** `group.ai_generate` (groupId, count, providerUsed)
```

## Patch 4: `SPEC_ADMIN_v3.1` §16 audit log table

Add 3 rows:

```markdown
| ai.generate.deepseek | Any provider used (logs which one) |
| ai.fallback.triggered | Fallback chain activated |
| group.ai_generate | Group leader AI generation |
```

---

# 📊 Severity Classification

- **P0 (blocking):** AWS Bedrock V3.2 not available in Tokyo (audit reveal) → fallback decision needed
- **P0 (blocking):** Existing `AIProvider` abstraction missing AND refactor estimated >2 days → split into prep PR first
- **P1:** Bedrock pricing constants in code outdated → manual verify before deploy
- **P1:** No CloudWatch cost alarm set up → infra task post-merge
- **P2:** Group leader modal currently hardcodes `model: "gemini"` → remove hardcode (audit will reveal)
- **P2:** Audit log filter UI doesn't show new action names → minor UX polish

---

# 🔗 BACKLOG entry

```markdown
## BL-AD-7 — DeepSeek V3.2 Bedrock Integration

**Status:** In progress (2026-05-12)
**Decisions locked:** D1-D6 (see PROMPT_DEEPSEEK_BEDROCK_INTEGRATION.md)
**Spec impact:**
- SPEC_ADMIN_v3.1 §6.1, §6.2, §16 (patches inline in prompt)
- SPEC_GROUP_v1.3 new section 6.X (patch inline)
**Estimated:** 1,200-1,700 LOC, 5-7 days, migration V53
**Dependencies:** None
**Blocks:** None
**Linked:** Sprint 5 Quiz Set Professional (BL-AD-5 if exists)
```
