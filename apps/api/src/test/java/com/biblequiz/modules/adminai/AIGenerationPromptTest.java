package com.biblequiz.modules.adminai;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** QQA-1: the MCQ prompt must carry anti-guessing (distractor quality) rules. */
class AIGenerationPromptTest {

    private final AIGenerationService service = new AIGenerationService();

    private String mcqPrompt(String language) {
        return service.buildQuestionPrompt(
                "Genesis", 1, 1, 1,
                "medium", "multiple_choice_single", language, 3, null, null);
    }

    @Test
    void mcqPrompt_vi_hasDistractorRules() {
        String p = mcqPrompt("vi");
        assertTrue(p.contains("cùng độ dài"), "homogeneous length rule missing");
        assertTrue(p.contains("MỘT LOẠI LỖI KHÁC NHAU"), "distinct-error-type rule missing");
        assertTrue(p.contains("gần đúng"), "almost-right rule missing");
        assertTrue(p.contains("NGẪU NHIÊN"), "randomize-position rule missing");
        // example index must not anchor on A (index 0)
        assertTrue(p.contains("\"correctAnswer\": 2"), "example correctAnswer should be non-zero");
        assertFalse(p.contains("\"correctAnswer\": 0"), "example must not anchor on index 0");
    }

    @Test
    void mcqPrompt_en_hasDistractorRules() {
        String p = mcqPrompt("en");
        assertTrue(p.contains("HOMOGENEOUS"), "homogeneous length rule missing (en)");
        assertTrue(p.contains("DIFFERENT ERROR TYPE"), "distinct-error-type rule missing (en)");
        assertTrue(p.contains("almost-right"), "almost-right rule missing (en)");
        assertTrue(p.contains("Randomize the correct answer's position"), "randomize-position rule missing (en)");
    }

    @Test
    void nonMcq_skipsDistractorRules() {
        String tf = service.buildQuestionPrompt(
                "Genesis", 1, 1, 1,
                "easy", "true_false", "vi", 1, null, null);
        assertFalse(tf.contains("Quy tắc chất lượng đáp án"),
                "true_false should not carry MCQ distractor rules");
    }
}
