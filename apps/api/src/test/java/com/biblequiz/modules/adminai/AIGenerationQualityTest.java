package com.biblequiz.modules.adminai;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** AEQ-2: annotateQuality enforces distinct distractor error types + almost-right minimum. */
class AIGenerationQualityTest {

    private final AIGenerationService service = new AIGenerationService();

    private Map<String, Object> distractor(String errorType, boolean almostRight) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("errorType", errorType);
        m.put("almostRight", almostRight);
        return m;
    }

    private Map<String, Object> mcq(String difficulty, List<Map<String, Object>> distractors) {
        Map<String, Object> q = new LinkedHashMap<>();
        q.put("type", "multiple_choice_single");
        q.put("difficulty", difficulty);
        q.put("distractors", distractors);
        return q;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> quality(Map<String, Object> q) {
        return (Map<String, Object>) q.get("_quality");
    }

    @Test
    void validMedium_distinctTypesAndOneAlmostRight() {
        Map<String, Object> q = mcq("medium", List.of(
                distractor("nearby_passage", false),
                distractor("wrong_detail", true),
                distractor("true_but_off", false)));
        service.annotateQuality(new ArrayList<>(List.of(q)));
        Map<String, Object> qual = quality(q);
        assertEquals(true, qual.get("valid"));
        assertEquals(false, qual.get("duplicateErrorType"));
        assertEquals(1, qual.get("almostRightCount"));
    }

    @Test
    void duplicateErrorType_isInvalid() {
        Map<String, Object> q = mcq("medium", List.of(
                distractor("wrong_detail", true),
                distractor("wrong_detail", false),
                distractor("true_but_off", false)));
        service.annotateQuality(new ArrayList<>(List.of(q)));
        Map<String, Object> qual = quality(q);
        assertEquals(false, qual.get("valid"));
        assertEquals(true, qual.get("duplicateErrorType"));
        assertTrue(((List<?>) qual.get("reasons")).contains("duplicate_error_type"));
    }

    @Test
    void hard_requiresTwoAlmostRight() {
        Map<String, Object> q = mcq("hard", List.of(
                distractor("nearby_passage", true),
                distractor("wrong_detail", false),
                distractor("true_but_off", false)));
        service.annotateQuality(new ArrayList<>(List.of(q)));
        Map<String, Object> qual = quality(q);
        assertEquals(false, qual.get("valid"));
        assertEquals(2, qual.get("requiredAlmostRight"));
        assertTrue(((List<?>) qual.get("reasons")).contains("insufficient_almost_right"));
    }

    @Test
    void missingDistractors_isInvalid() {
        Map<String, Object> q = new LinkedHashMap<>();
        q.put("type", "multiple_choice_single");
        q.put("difficulty", "easy");
        service.annotateQuality(new ArrayList<>(List.of(q)));
        Map<String, Object> qual = quality(q);
        assertEquals(false, qual.get("valid"));
        assertTrue(((List<?>) qual.get("reasons")).contains("missing_distractors"));
    }

    @Test
    void nonMcq_isNotAnnotated() {
        Map<String, Object> q = new LinkedHashMap<>();
        q.put("type", "true_false");
        q.put("difficulty", "easy");
        service.annotateQuality(new ArrayList<>(List.of(q)));
        assertNull(q.get("_quality"));
    }
}
