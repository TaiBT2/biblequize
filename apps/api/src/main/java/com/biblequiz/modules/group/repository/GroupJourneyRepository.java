package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupJourney;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupJourneyRepository extends JpaRepository<GroupJourney, String> {

    List<GroupJourney> findByGroupIdOrderByCreatedAtDesc(String groupId);

    List<GroupJourney> findByGroupIdAndStatusOrderByCreatedAtDesc(
            String groupId, GroupJourney.Status status);
}
