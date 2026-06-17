package com.biblequiz.modules.group.service;

import com.biblequiz.modules.group.repository.GroupQuizSetMasteryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * BL-23 CG-1: aggregation + milestone band assembly. Q-A SAFE — service chỉ phụ thuộc
 * mastery repository (mocked); KHÔNG có dependency tới UserDailyProgress / leaderboard.
 */
@ExtendWith(MockitoExtension.class)
class GroupCollectiveGrowthServiceTest {

    @Mock private GroupQuizSetMasteryRepository masteryRepository;
    @InjectMocks private GroupCollectiveGrowthService service;

    /** Stub a single aggregate row: SUM, COUNT(DISTINCT user), COUNT(completed). */
    private void stub(String groupId, long sum, long users, long completed) {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{sum, users, completed});
        when(masteryRepository.aggregateGrowthByGroupId(eq(groupId), any())).thenReturn(rows);
    }

    @Test
    void assemblesAggregateAndMilestoneBand() {
        stub("g1", 120L, 4L, 2L);
        Map<String, Object> r = service.getCollectiveGrowth("g1");
        assertEquals(120L, r.get("totalLearned"));
        assertEquals(4L, r.get("contributors"));
        assertEquals(2L, r.get("masteryCompletions"));
        assertEquals(100L, r.get("milestoneFloor"));
        assertEquals(250L, r.get("nextMilestone"));
        assertEquals(13, r.get("milestonePct")); // (120-100)/(250-100) = 13.3 → 13
    }

    @Test
    void emptyGroup_allZeros_firstMilestoneIs50() {
        stub("g1", 0L, 0L, 0L);
        Map<String, Object> r = service.getCollectiveGrowth("g1");
        assertEquals(0L, r.get("totalLearned"));
        assertEquals(0L, r.get("milestoneFloor"));
        assertEquals(50L, r.get("nextMilestone"));
        assertEquals(0, r.get("milestonePct"));
    }

    @Test
    void noRows_safeZeros() {
        when(masteryRepository.aggregateGrowthByGroupId(eq("g1"), any())).thenReturn(List.of());
        Map<String, Object> r = service.getCollectiveGrowth("g1");
        assertEquals(0L, r.get("totalLearned"));
        assertEquals(50L, r.get("nextMilestone"));
    }

    @Test
    void beyondTable_snapsToStepGrid() {
        stub("g1", 12000L, 30L, 9L);
        Map<String, Object> r = service.getCollectiveGrowth("g1");
        assertEquals(10000L, r.get("milestoneFloor"));
        assertEquals(15000L, r.get("nextMilestone"));
        assertEquals(40, r.get("milestonePct")); // (12000-10000)/5000 = 40
    }

    @Test
    void milestoneHelpers_bands() {
        assertEquals(50L, GroupCollectiveGrowthService.milestoneTarget(0));
        assertEquals(100L, GroupCollectiveGrowthService.milestoneTarget(50));
        assertEquals(0L, GroupCollectiveGrowthService.milestoneFloor(49));
        assertEquals(50L, GroupCollectiveGrowthService.milestoneFloor(50));
    }
}
