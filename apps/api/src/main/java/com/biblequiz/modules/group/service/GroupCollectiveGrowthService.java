package com.biblequiz.modules.group.service;

import com.biblequiz.modules.group.entity.GroupQuizSet;
import com.biblequiz.modules.group.repository.GroupQuizSetMasteryRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * BL-23 Group Collective Growth — "Cùng nhau thuộc Lời".
 *
 * <p>Anti-leaderboard: gộp mastery (Q-A SAFE — solo practice các bộ câu hỏi của nhóm)
 * thành MỘT chỉ số tập thể, KHÔNG xếp hạng cá nhân. Cố ý KHÔNG đọc/ghi UserDailyProgress
 * hay group leaderboard (BL-16) → không tái sinh leaderboard đã sunset ở v1.4.
 *
 * <p>Hero = SUM(questionsLearned) toàn nhóm ("lượt câu cả nhóm đã thuộc") — là con số đếm
 * tiến tới cột mốc, KHÔNG phải phân số trên tổng câu (D1 = SUM, locked 2026-06-17).
 */
@Service
public class GroupCollectiveGrowthService {

    /** Cột mốc "lượt câu cả nhóm cùng thuộc" để tạo cảm giác tiến tới. */
    static final long[] MILESTONES = {50, 100, 250, 500, 1000, 2000, 5000, 10000};
    private static final long STEP_BEYOND = 5000;

    private final GroupQuizSetMasteryRepository masteryRepository;

    public GroupCollectiveGrowthService(GroupQuizSetMasteryRepository masteryRepository) {
        this.masteryRepository = masteryRepository;
    }

    public Map<String, Object> getCollectiveGrowth(String groupId) {
        List<Object[]> rows = masteryRepository.aggregateGrowthByGroupId(
                groupId, GroupQuizSet.PublishStatus.PUBLISHED);
        Object[] row = (rows == null || rows.isEmpty()) ? null : rows.get(0);

        long totalLearned = asLong(row, 0);
        long contributors = asLong(row, 1);
        long completions = asLong(row, 2);

        long floor = milestoneFloor(totalLearned);
        long target = milestoneTarget(totalLearned);
        int pct = target <= floor ? 100
                : (int) Math.round((totalLearned - floor) * 100.0 / (target - floor));

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("totalLearned", totalLearned);
        map.put("contributors", contributors);
        map.put("masteryCompletions", completions);
        map.put("milestoneFloor", floor);
        map.put("nextMilestone", target);
        map.put("milestonePct", pct);
        return map;
    }

    /** Cột mốc kế tiếp strictly &gt; total; vượt bảng thì bước theo lưới STEP_BEYOND. */
    static long milestoneTarget(long total) {
        for (long m : MILESTONES) {
            if (total < m) return m;
        }
        return ((total / STEP_BEYOND) + 1) * STEP_BEYOND;
    }

    /** Cột mốc đã đạt gần nhất (đáy của band hiện tại) cho thanh tiến độ. */
    static long milestoneFloor(long total) {
        long floor = 0;
        for (long m : MILESTONES) {
            if (total < m) return floor;
            floor = m;
        }
        return Math.max(floor, (total / STEP_BEYOND) * STEP_BEYOND);
    }

    private static long asLong(Object[] row, int idx) {
        if (row == null || idx >= row.length || row[idx] == null) return 0L;
        return ((Number) row[idx]).longValue();
    }
}
