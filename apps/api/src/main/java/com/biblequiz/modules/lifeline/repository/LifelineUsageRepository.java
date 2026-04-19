package com.biblequiz.modules.lifeline.repository;

import com.biblequiz.modules.lifeline.entity.LifelineType;
import com.biblequiz.modules.lifeline.entity.LifelineUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for {@link LifelineUsage}.
 *
 * <p>Query patterns:
 * <ul>
 *   <li>{@link #countBySessionAndUserAndType} — quota check (how many hints
 *       used so far in this session).</li>
 *   <li>{@link #findBySessionAndQuestionAndUser} — FE hydration after
 *       reload (which options are already eliminated for the current
 *       question).</li>
 * </ul>
 */
@Repository
public interface LifelineUsageRepository extends JpaRepository<LifelineUsage, String> {

    @Query("SELECT COUNT(l) FROM LifelineUsage l " +
           "WHERE l.session.id = :sessionId " +
           "AND l.user.id = :userId " +
           "AND l.type = :type")
    long countBySessionAndUserAndType(@Param("sessionId") String sessionId,
                                      @Param("userId") String userId,
                                      @Param("type") LifelineType type);

    @Query("SELECT l FROM LifelineUsage l " +
           "WHERE l.session.id = :sessionId " +
           "AND l.question.id = :questionId " +
           "AND l.user.id = :userId " +
           "AND l.type = :type")
    List<LifelineUsage> findBySessionAndQuestionAndUser(@Param("sessionId") String sessionId,
                                                       @Param("questionId") String questionId,
                                                       @Param("userId") String userId,
                                                       @Param("type") LifelineType type);
}
