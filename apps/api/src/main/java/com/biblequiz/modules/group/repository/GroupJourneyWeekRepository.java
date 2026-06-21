package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupJourneyWeek;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupJourneyWeekRepository extends JpaRepository<GroupJourneyWeek, String> {

    List<GroupJourneyWeek> findByJourneyIdOrderByWeekNumberAsc(String journeyId);

    long countByJourneyId(String journeyId);
}
