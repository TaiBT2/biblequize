package com.biblequiz.modules.room.service;

import org.springframework.stereotype.Service;

/**
 * Tính điểm cho chế độ Speed Race.
 * Công thức: trả lời đúng → base 100 + floor((timeLimit_ms - responseMs) / timeLimit_ms * 50)
 * Trả lời sai hoặc timeout → 0 điểm
 * Điểm tối đa = 150, điểm tối thiểu khi đúng = 100
 */
@Service
public class SpeedRaceScoringService {

    public int calculateScore(boolean isCorrect, int timeLimitSeconds, int responseMs) {
        if (!isCorrect) return 0;
        long timeLimitMs = timeLimitSeconds * 1000L;
        if (responseMs <= 0 || responseMs >= timeLimitMs) return 100;
        int bonus = (int) Math.floor((double)(timeLimitMs - responseMs) / timeLimitMs * 50);
        return 100 + bonus;
    }
}
