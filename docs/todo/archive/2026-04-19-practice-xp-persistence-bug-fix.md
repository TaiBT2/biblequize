# 2026-04-19 — Practice XP persistence bug fix [DONE — verified 2026-04-27]

### Task 1: Fix DTO field mismatch — @JsonAlias for clientElapsedMs [x] DONE
- File: [SubmitAnswerRequest.java](apps/api/src/main/java/com/biblequiz/api/dto/SubmitAnswerRequest.java) — `@JsonAlias("clientElapsedMs")` đặt trên field `elapsedMs` (L37 của file), kèm comment giải thích regression context (Jackson strict FAIL_ON_UNKNOWN_PROPERTIES → 400 → killed Practice XP persistence)
- Root cause documented in field comment

### Task 2: Verify regression [x] DONE
- File: [SessionControllerTest.java:96-111](apps/api/src/test/java/com/biblequiz/api/SessionControllerTest.java#L96-L111) — test `submitAnswer_withClientElapsedMsAlias_shouldReturn200AndUnwrapElapsed` pin alias behavior
- Comment trong test giải thích "before the alias, Jackson strict mode threw UnrecognizedPropertyException" để chống regression nếu ai đó rename field hoặc thêm @JsonIgnoreProperties

---
