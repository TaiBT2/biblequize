package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupQuizSet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GroupQuizSetRepository extends JpaRepository<GroupQuizSet, String> {

    List<GroupQuizSet> findByGroupId(String groupId);

    @Query("SELECT s FROM GroupQuizSet s WHERE s.group.id = :groupId " +
           "AND (:status IS NULL OR s.publishStatus = :status) " +
           "AND (:folderId IS NULL OR s.folderId = :folderId) " +
           "AND (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<GroupQuizSet> findFiltered(@Param("groupId") String groupId,
                                     @Param("status") GroupQuizSet.PublishStatus status,
                                     @Param("folderId") String folderId,
                                     @Param("search") String search,
                                     Pageable pageable);

    @Query("SELECT s FROM GroupQuizSet s WHERE s.group.id = :groupId AND s.createdBy.id = :userId " +
           "AND s.publishStatus = com.biblequiz.modules.group.entity.GroupQuizSet$PublishStatus.DRAFT")
    List<GroupQuizSet> findMyDrafts(@Param("groupId") String groupId, @Param("userId") String userId);

    boolean existsByFolderId(String folderId);

    @Modifying
    @Query("DELETE FROM GroupQuizSet s WHERE s.publishStatus = " +
           "com.biblequiz.modules.group.entity.GroupQuizSet$PublishStatus.SOFT_DELETED " +
           "AND s.deletedAt < :cutoff")
    int hardDeleteSoftDeletedBefore(@Param("cutoff") LocalDateTime cutoff);
}
