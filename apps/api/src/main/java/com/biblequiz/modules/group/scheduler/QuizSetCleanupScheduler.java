package com.biblequiz.modules.group.scheduler;

import com.biblequiz.modules.group.repository.GroupQuizSetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Sprint 5 — hard-delete quiz sets đã SOFT_DELETED quá 30 ngày.
 * Tách riêng với RoomCleanupScheduler vì lifecycle khác hoàn toàn.
 * Cron: 2:00 AM hàng ngày.
 */
@Component
public class QuizSetCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(QuizSetCleanupScheduler.class);
    private static final int RETENTION_DAYS = 30;

    @Autowired
    private GroupQuizSetRepository repository;

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void purgeSoftDeletedQuizSets() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(RETENTION_DAYS);
        int deleted = repository.hardDeleteSoftDeletedBefore(cutoff);
        if (deleted > 0) {
            log.info("QuizSetCleanup: hard-deleted {} quiz sets older than {} days", deleted, RETENTION_DAYS);
        }
    }
}
