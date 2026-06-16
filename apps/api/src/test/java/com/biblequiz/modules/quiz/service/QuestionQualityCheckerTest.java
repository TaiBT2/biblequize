package com.biblequiz.modules.quiz.service;

import com.biblequiz.modules.quiz.service.QuestionQualityChecker.LengthBias;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** QQA-2: length-bias detector. */
class QuestionQualityCheckerTest {

    @Test
    void longCorrectAmongShortDistractors_isBiased() {
        // correct (idx 1) ~5x the distractors
        LengthBias lb = QuestionQualityChecker.lengthBias(
                List.of("Môi-se", "Áp-ra-ham được Đức Chúa Trời gọi rời U-rơ đi đến đất hứa Ca-na-an", "Đa-vít", "Phao-lô"),
                List.of(1));
        assertTrue(lb.biased());
        assertTrue(lb.correctIsLongest());
        assertTrue(lb.ratio() >= QuestionQualityChecker.LENGTH_BIAS_RATIO);
    }

    @Test
    void balancedOptions_notBiased() {
        LengthBias lb = QuestionQualityChecker.lengthBias(
                List.of("Áp-ra-ham", "Y-sác con trai", "Gia-cốp anh", "Giô-sép em"),
                List.of(0));
        assertFalse(lb.biased());
    }

    @Test
    void correctIsShortest_notBiased() {
        LengthBias lb = QuestionQualityChecker.lengthBias(
                List.of("Giăng", "Ma-thi-ơ người thu thuế thành Ca-bê-na-um", "Lu-ca thầy thuốc", "Mác môn đồ"),
                List.of(0));
        assertFalse(lb.biased());
        assertFalse(lb.correctIsLongest());
    }

    @Test
    void degenerateInputs_notBiased() {
        assertFalse(QuestionQualityChecker.lengthBias(null, List.of(0)).biased());
        assertFalse(QuestionQualityChecker.lengthBias(List.of("a", "b"), null).biased());
        assertFalse(QuestionQualityChecker.lengthBias(List.of("a", "b"), List.of()).biased());
        // out-of-range index
        assertFalse(QuestionQualityChecker.lengthBias(List.of("a", "b"), List.of(9)).biased());
    }
}
