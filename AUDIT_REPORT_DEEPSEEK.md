# Audit Report: DeepSeek Bedrock Integration

**Date:** 2026-05-12
**Auditor:** Claude Code (Opus 4.7)
**Scope:** Phase A of `docs/prompts/PROMPT_DEEPSEEK_BEDROCK_INTEGRATION.md`
**Verdict:** ✅ Proceed to Phase B with **refactor required** (no `AIProvider` abstraction exists) and **quota model change** (current is per-admin in-memory, not shared-global Redis).

---

## Section 1: AI Provider Architecture

**Abstraction status:** ❌ **MISSING.**

There is **no** `AIProvider` interface. The two providers are invoked via inline string branching in the controller, and the generation logic is duplicated on two methods of a single class.

- Provider branching: [AIAdminController.java:109-119](apps/api/src/main/java/com/biblequiz/modules/adminai/AIAdminController.java#L109-L119)
  ```java
  boolean useGemini = "gemini".equals(provider) && aiGenerationService.isConfigured();
  boolean useClaude = "claude".equals(provider) && aiGenerationService.isClaudeConfigured();
  ...
  List<Map<String, Object>> questions = useClaude
          ? aiGenerationService.generateWithClaude(...)
          : aiGenerationService.generate(...);
  ```
- Gemini implementation: [AIGenerationService.java:78-120](apps/api/src/main/java/com/biblequiz/modules/adminai/AIGenerationService.java#L78-L120) — `generate(...)` calls `https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent` via `java.net.http.HttpClient`.
- Claude implementation: [AIGenerationService.java:137-219](apps/api/src/main/java/com/biblequiz/modules/adminai/AIGenerationService.java#L137-L219) — `generateWithClaude(...)` calls `https://api.anthropic.com/v1/messages`, supports multi-model parallel via `CompletableFuture`.
- Valid providers whitelist (only 2 today): [AIGenerationRequest.java:27](apps/api/src/main/java/com/biblequiz/modules/adminai/AIGenerationRequest.java#L27) — `Set.of("gemini", "claude")`.
- Separate "user quiz" generator (different module, not in scope of admin AI): [GeminiQuizGeneratorAdapter.java:24](apps/api/src/main/java/com/biblequiz/modules/userquiz/service/GeminiQuizGeneratorAdapter.java#L24) — guarded by `@ConditionalOnProperty(name = "app.quiz-generator.provider", havingValue = "gemini", matchIfMissing = true)`. **Out of scope** for this integration.

**Recommended refactor (Phase B):** YES. Introduce `AIProvider` interface + 3 implementations (`BedrockDeepSeekProvider`, `GeminiProvider`, `ClaudeProvider`) and an `AIProviderRouter` to centralize default + fallback chain. Refactor `AIGenerationService` to delegate (or split into per-provider classes). Public API surface of `/api/admin/ai/generate` and `/api/groups/{id}/ai-generate` should remain wire-compatible.

---

## Section 2: Quota & Cost Tracking

**Quota mechanism:** In-memory `ConcurrentHashMap<adminId, AtomicInteger>` — [AIAdminController.java:31](apps/api/src/main/java/com/biblequiz/modules/adminai/AIAdminController.java#L31).

- Constant: `DAILY_QUOTA = 200` per admin (per-actor, NOT shared) — [AIAdminController.java:25](apps/api/src/main/java/com/biblequiz/modules/adminai/AIAdminController.java#L25).
- Reset: lazy, on each read — when `LocalDate.now(ZoneOffset.UTC)` differs from `quotaDate`, the whole map is cleared. [AIAdminController.java:38-45](apps/api/src/main/java/com/biblequiz/modules/adminai/AIAdminController.java#L38-L45).
- ⚠️ **Lost on restart** (in-memory only), and ⚠️ **per-admin not global** — current quota model contradicts D5 ("shared global 200 câu/day for admin + group leaders combined").
- ⚠️ **Group leader endpoint has NO quota at all** — [ChurchGroupController.java:929-959](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L929-L959) does not consult `AIAdminController`'s counter (different class, private field).

**Cost tracking:** ❌ **NONE.** No `costUSD` field anywhere; only a static `COST_ALERT_USD = 10.0` constant returned by `/info` — [AIAdminController.java:26](apps/api/src/main/java/com/biblequiz/modules/adminai/AIAdminController.java#L26). No per-request accounting, no aggregation table, no Bedrock pricing constants.

**Reset job:** None — relies on lazy date-check (works fine for a single instance, but won't scale horizontally).

**Recommended Phase B change:** Replace in-memory counter with Redis-backed `AIQuotaService` (per prompt §B.5), key `ai:quota:{yyyy-MM-dd}` UTC TTL 25h, **shared by both admin and group leader endpoints**.

---

## Section 3: Endpoints

### Admin
- `POST /api/admin/ai/generate` — [AIAdminController.java:76-152](apps/api/src/main/java/com/biblequiz/modules/adminai/AIAdminController.java#L76-L152). Returns generated drafts inline (NOT persisted). Admin then calls `POST /api/admin/questions?pending=true` per-draft to save (see FE [AIQuestionGenerator.tsx:202](apps/web/src/pages/admin/AIQuestionGenerator.tsx#L202)).
- `GET /api/admin/ai/info` — [AIAdminController.java:52-74](apps/api/src/main/java/com/biblequiz/modules/adminai/AIAdminController.java#L52-L74). Returns providers configured + quota usage.
- `GET /api/admin/ai/models` — [AIAdminController.java:47-50](apps/api/src/main/java/com/biblequiz/modules/adminai/AIAdminController.java#L47-L50). Lists Gemini models from Google API.
- Authorization: `@PreAuthorize("hasRole('ADMIN')")` class-level — [AIAdminController.java:20](apps/api/src/main/java/com/biblequiz/modules/adminai/AIAdminController.java#L20).

### Group Leader (already exists — Sprint 5 done)
- `POST /api/groups/{id}/ai-generate` — [ChurchGroupController.java:929-959](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L929-L959). Returns drafts inline (NOT persisted), exactly like admin endpoint.
- **Provider:** hardcoded Gemini only — calls `aiGenerationService.generate(...)` directly, no provider param. Will need to route through `AIProviderRouter` in Phase B.
- **Persistence:** separate endpoint `POST /api/groups/{id}/quiz-sets/custom` — [ChurchGroupController.java:966+](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L966). Saves with `source='group-custom', isActive=false` (per comment at line 964). **No admin review queue involvement** — already matches D4 ("publish directly to group quiz set"). ✅
- Authorization: `requireLeaderOrMod(id, user.getId())` at line 936. Returns 403 on failure.
- **No quota check.** Quota is currently disjoint from admin's counter. **Will be unified in Phase B.5.**

### Frontend hardcodes
- FE never sends `model` field to group endpoint — [GroupDetail.tsx:227-237](apps/web/src/pages/GroupDetail.tsx#L227-L237). ✅ Already matches D3 ("group leader sees no selector").
- Admin FE explicitly selects provider: [AIQuestionGenerator.tsx:50](apps/web/src/pages/admin/AIQuestionGenerator.tsx#L50) `useState<'gemini' | 'claude'>('gemini')`. Default `'gemini'` → needs to change to `'deepseek'` in Phase C.

---

## Section 4: Frontend

- Admin AI generator: [apps/web/src/pages/admin/AIQuestionGenerator.tsx](apps/web/src/pages/admin/AIQuestionGenerator.tsx) (~620 LOC).
  - Provider selector segmented control: [lines 422-443](apps/web/src/pages/admin/AIQuestionGenerator.tsx#L422-L443) — only 2 options. Will become 3 (with DeepSeek as DEFAULT).
  - Claude model picker (auto/multi-select): [lines 446-510](apps/web/src/pages/admin/AIQuestionGenerator.tsx#L446-L510).
  - Drafts component: [apps/web/src/pages/admin/ai-generator/DraftCard.tsx](apps/web/src/pages/admin/ai-generator/DraftCard.tsx).
- Group AI gen modal: opened in [GroupDetail.tsx:210](apps/web/src/pages/GroupDetail.tsx#L210) (`openCreateModal` → `qsModalTab='ai'`). `handleAiGenerate` at [line 222](apps/web/src/pages/GroupDetail.tsx#L222). **No provider selector** — will require zero change for D3. ✅
- i18n: `admin.aiGenerator.*` keys present in [en.json](apps/web/src/i18n/en.json) / [vi.json](apps/web/src/i18n/vi.json). Will need new keys: `admin.aiGenerator.providerDeepseek`, `admin.aiGenerator.providerDefault`, etc.

---

## Section 5: AWS Bedrock Verification

**AWS CLI:** `aws-cli/2.23.4` ✅ available.

**Region:** `ap-northeast-1` (Tokyo).

**DeepSeek availability (verified live):**

```
+-------------------+-----------------+
|  deepseek.v3.2    |  DeepSeek V3.2  |
|  deepseek.v3-v1:0 |  DeepSeek-V3.1  |
+-------------------+-----------------+
```

✅ **Decision tree result: `deepseek.v3.2` available in `ap-northeast-1` — proceed as planned (D2 valid).**

**Test invocation:** SKIPPED in this audit (would consume real Bedrock credits + requires the project's prod IAM creds). Recommend deferring smoke-test until Phase B local integration test with dev-env AWS credentials.

**Pricing:** Bedrock public pricing page must be checked manually before Phase B commit — placeholders in `BedrockDeepSeekProvider` constants (`INPUT_COST_PER_1M`, `OUTPUT_COST_PER_1M`).

---

## Section 6: Critical Gaps & Risks

| # | Severity | Finding | Mitigation |
|---|---|---|---|
| 1 | **P0** | No `AIProvider` abstraction — Phase B must refactor first | Adds ~150 LOC up front but keeps controller logic clean and testable |
| 2 | **P0** | Quota model is **per-admin in-memory**, not **shared global Redis** (D5 mismatch) | Replace with `AIQuotaService` per prompt §B.5; remove `ConcurrentHashMap` in controller |
| 3 | **P0** | Group leader endpoint bypasses quota entirely | Wire `AIQuotaService.tryAcquire` into both endpoints |
| 4 | **P1** | No AWS SDK currently in `apps/api/pom.xml` (grep returned 0 matches) | Add `software.amazon.awssdk:bedrockruntime` v2.x per §B.1 |
| 5 | **P1** | No audit-log infrastructure used by AI calls (only `slf4j.info`) | Per prompt §D.2, need `AuditLogService` integration. **Verify exists in `com.biblequiz` codebase before Phase D** — may require additional discovery |
| 6 | **P1** | **Prompt's suggested migration `V53__ai_provider_config.sql` conflicts** — V53 already exists (`V53__quiz_sessions_group_quiz_set_id.sql`). Latest is `V55`. | Use **V56** instead. Also verify `app_config` table exists — current code uses `@Value` + env vars only, no DB-driven config |
| 7 | **P2** | No cost tracking field anywhere; `COST_ALERT_USD` is hardcoded `10.0` static | Phase B can add cost accumulator in `AIQuotaService` (Redis key `ai:cost:{date}`) or defer to follow-up task |
| 8 | **P2** | Group leader endpoint hardcodes Gemini call ([ChurchGroupController.java:948](apps/api/src/main/java/com/biblequiz/api/ChurchGroupController.java#L948)) | Replace with `aiProviderRouter.generate(...)` in Phase D |
| 9 | **P2** | `AIGenerationService` mixes Gemini + Claude in one class with shared `buildPrompt` — refactor risk to fallout in unrelated tests | Keep `AIGenerationService` as façade for now; have new provider classes call its helpers (or copy `buildPrompt` into a `PromptBuilder` utility per prompt §B.3) |
| 10 | **P2** | Spec doc `docs/spec/SPEC_ADMIN_v3.1` referenced in prompt — confirm exact §6.1/§6.2 anchors before Phase E patches | Skim spec during Phase E, not blocking now |

---

## Section 7: Recommended Phase B Plan

**Refactor needed:** ✅ YES — `AIProvider` interface + `AIProviderRouter` mandatory before adding DeepSeek (else code becomes 3-way `if/else` ball of mud).

**Migration needed:** Only if we decide to make AI config DB-driven via `app_config`. **Current code uses `@Value` + env vars** — recommend STAY with `application.yml` for Phase B (less risk, faster). Defer `app_config` migration to a follow-up task. **No V56 needed in Phase B.**

**Phase B file plan (estimated):**

| File | Change | LOC |
|------|--------|-----|
| `pom.xml` | Add `bedrockruntime` v2.30.x + `auth` deps | +12 |
| `application.yml` | Add `biblequiz.ai.*` block + `bedrock.*` config | +20 |
| `provider/AIProvider.java` (new) | Interface | +30 |
| `provider/AIGenerationRequest.java` (new record) | Move/adapt from existing DTO | +40 |
| `provider/AIGenerationResponse.java` (new record) | + `providerUsed`, `inputTokens`, etc. | +25 |
| `provider/BedrockDeepSeekProvider.java` (new) | Converse API + cost calc | ~200 |
| `provider/GeminiProvider.java` (new) | Wrapper around existing `AIGenerationService.generate(...)` | ~80 |
| `provider/ClaudeProvider.java` (new) | Wrapper around `AIGenerationService.generateWithClaude(...)` | ~90 |
| `provider/AIProviderRouter.java` (new) | Default + fallback chain logic + explicit-override | ~120 |
| `quota/AIQuotaService.java` (new) | Redis-backed shared quota | ~70 |
| `AIAdminController.java` | Replace `dailyQuota` map + branching → `quotaService` + `router` | -40 / +30 |
| `ChurchGroupController.java` | Wire `router` + `quotaService` into `aiGenerateQuestions` | +25 |
| `AIGenerationRequest` (admin DTO) | Add `"deepseek"` to `VALID_PROVIDERS` (or keep validation in router) | +1 |
| Tests | 12+ new (per prompt §B.8) | ~400 |
| **Total** | | **~1100 LOC** |

**Pricing constants to verify manually:** check AWS Bedrock pricing page for `deepseek.v3.2` on `ap-northeast-1` — values in prompt are placeholders.

**Things to confirm with user before Phase B:**

1. **`AuditLogService` discovery** — does a generic audit-log entity/service exist in the codebase that takes `(actorId, action, details)`? If not, we need to scope-down: either (a) defer audit-log entries to a follow-up task, or (b) add minimal `audit_log` table in Phase B.
2. **Cost tracking scope** — out-of-scope or in-scope for this PR? (Prompt §B.5 only counts requests, not cost. Recommend defer.)
3. **`app_config` migration** — keep `application.yml`-only for Phase B, or invest in DB-driven config now? (Recommend defer — no benefit for first integration.)
4. **Question entity for group endpoint** — confirm `source='group-custom', isActive=false` flow is correct for AI-generated group questions (currently same persistence path as manual leader-authored questions).

---

## Appendix: Files NOT modified during audit

All findings come from `grep` + `Read` only. No source files changed.

## Appendix: Open questions answered by audit (prompt §A.5)

1. **`AIProvider` interface exists?** ❌ No. Direct branching at `AIAdminController.java:109`.
2. **Where is daily quota enforced?** In-memory map at `AIAdminController.java:31`, per-admin, lazy date-reset. Not in DB, not in Redis. Group endpoint has none.
3. **Group leader AI gen endpoint status?** ✅ Exists at `ChurchGroupController.java:929`. Calls Gemini directly. Drafts returned inline; separate `POST /quiz-sets/custom` to persist.
4. **Question entity model?** Same `question` table for both admin-pool and group-custom. Source field differentiates: admin uses `pending=true` flag (review queue) + later `isActive=true`; group-custom skips review and saves directly with `source='group-custom'`. **Already matches D4.**
5. **Existing AWS infra?** ❌ None. No AWS SDK in `pom.xml`. No IAM/credentials wiring.

---

**End of Phase A audit. Awaiting human review and "go Phase B" confirmation.**
