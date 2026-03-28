package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupAnnouncement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupAnnouncementRepository extends JpaRepository<GroupAnnouncement, String> {

    List<GroupAnnouncement> findByGroupIdOrderByCreatedAtDesc(String groupId);

    @Query("SELECT a FROM GroupAnnouncement a WHERE a.group.id = :groupId ORDER BY a.createdAt DESC")
    List<GroupAnnouncement> findByGroupIdPaginated(@Param("groupId") String groupId, Pageable pageable);

    long countByGroupId(String groupId);
}
