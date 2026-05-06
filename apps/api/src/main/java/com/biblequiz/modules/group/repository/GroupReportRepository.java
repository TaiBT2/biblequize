package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupReportRepository extends JpaRepository<GroupReport, String> {

    /**
     * Anti-spam guard: prevent the same user submitting an OPEN report
     * for the same group repeatedly. Admin must dismiss/action the existing
     * one before a new one is accepted.
     */
    boolean existsByGroupIdAndReporterIdAndStatus(String groupId,
                                                  String reporterId,
                                                  GroupReport.Status status);
}
