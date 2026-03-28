package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupAnnouncementRepository extends JpaRepository<GroupAnnouncement, String> {

    List<GroupAnnouncement> findByGroupIdOrderByCreatedAtDesc(String groupId);
}
