package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupKickLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface GroupKickLogRepository extends JpaRepository<GroupKickLog, String> {

    /**
     * Returns true if {@code userId} was kicked from {@code groupId} after
     * {@code cutoff}. Used by joinGroup to enforce the 7-day cooldown
     * (SPEC v1.1 §12.2). Pass cutoff = NOW() - 7d.
     */
    @Query("SELECT COUNT(k) > 0 FROM GroupKickLog k " +
           "WHERE k.group.id = :groupId " +
           "AND k.kickedUser.id = :userId " +
           "AND k.kickedAt > :cutoff")
    boolean existsRecentKick(@Param("groupId") String groupId,
                             @Param("userId") String userId,
                             @Param("cutoff") LocalDateTime cutoff);
}
