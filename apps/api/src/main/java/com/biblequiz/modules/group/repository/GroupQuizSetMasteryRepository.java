package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupQuizSet;
import com.biblequiz.modules.group.entity.GroupQuizSetMastery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupQuizSetMasteryRepository extends JpaRepository<GroupQuizSetMastery, String> {

    Optional<GroupQuizSetMastery> findByQuizSetIdAndUserId(String quizSetId, String userId);

    @Query("SELECT m FROM GroupQuizSetMastery m, GroupQuizSet s " +
           "WHERE m.quizSetId = s.id AND m.userId = :userId AND s.group.id = :groupId")
    List<GroupQuizSetMastery> findByUserIdAndGroupId(@Param("userId") String userId,
                                                      @Param("groupId") String groupId);

    /**
     * BL-23 Collective Growth — group-wide aggregate over PUBLISHED quiz sets.
     * Single row: [0] SUM(questionsLearned), [1] COUNT(DISTINCT userId),
     * [2] COUNT(completedMastery=true). Q-A SAFE: chỉ đọc mastery (solo practice),
     * KHÔNG đụng UserDailyProgress / group leaderboard.
     */
    @Query("SELECT COALESCE(SUM(m.questionsLearned), 0), COUNT(DISTINCT m.userId), " +
           "COALESCE(SUM(CASE WHEN m.completedMastery = true THEN 1 ELSE 0 END), 0) " +
           "FROM GroupQuizSetMastery m, GroupQuizSet s " +
           "WHERE m.quizSetId = s.id AND s.group.id = :groupId AND s.publishStatus = :status")
    List<Object[]> aggregateGrowthByGroupId(@Param("groupId") String groupId,
                                            @Param("status") GroupQuizSet.PublishStatus status);

    /**
     * BL-23 CG-2 — per-set breakdown (chỉ bộ PUBLISHED đã có người ôn).
     * Row: [0] quizSetId, [1] name, [2] totalQuestions, [3] COUNT(DISTINCT user),
     * [4] SUM(questionsLearned), [5] COUNT(completedMastery=true). Sắp theo lượt thuộc giảm dần.
     */
    @Query("SELECT s.id, s.name, s.totalQuestions, COUNT(DISTINCT m.userId), " +
           "COALESCE(SUM(m.questionsLearned), 0), " +
           "COALESCE(SUM(CASE WHEN m.completedMastery = true THEN 1 ELSE 0 END), 0) " +
           "FROM GroupQuizSetMastery m, GroupQuizSet s " +
           "WHERE m.quizSetId = s.id AND s.group.id = :groupId AND s.publishStatus = :status " +
           "GROUP BY s.id, s.name, s.totalQuestions " +
           "ORDER BY COALESCE(SUM(m.questionsLearned), 0) DESC")
    List<Object[]> aggregatePerSetByGroupId(@Param("groupId") String groupId,
                                            @Param("status") GroupQuizSet.PublishStatus status);

    /**
     * Per-set leaderboard ordered by best score DESC, ties broken by best accuracy DESC.
     * Pageable used as LIMIT.
     */
    @Query("SELECT m FROM GroupQuizSetMastery m WHERE m.quizSetId = :quizSetId " +
           "ORDER BY m.bestScore DESC, m.bestAccuracy DESC, m.lastPracticedAt ASC")
    List<GroupQuizSetMastery> findLeaderboardByQuizSetId(@Param("quizSetId") String quizSetId,
                                                          org.springframework.data.domain.Pageable pageable);

    long countByQuizSetId(String quizSetId);
}
