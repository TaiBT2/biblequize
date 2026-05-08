package com.biblequiz.modules.quiz.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically detect and mark abandoned sessions.
 * Ranked sessions: every 60s, 2 min inactivity → abandoned + energy penalty (FIX-002).
 * Practice/single sessions: every 5 min, 30 min inactivity → abandoned (no penalty).
 */
@Component
public class SessionAbandonmentScheduler {

    private static final Logger log = LoggerFactory.getLogger(SessionAbandonmentScheduler.class);

    private final SessionService sessionService;

    public SessionAbandonmentScheduler(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Scheduled(fixedRate = 60_000)
    public void detectAbandonedRankedSessions() {
        int count = sessionService.processAbandonedSessions();
        if (count > 0) {
            log.info("[ABANDONMENT] Marked {} ranked sessions as abandoned", count);
        }
    }

    @Scheduled(fixedRate = 300_000)
    public void detectAbandonedPracticeSessions() {
        int count = sessionService.processAbandonedPracticeSessions();
        if (count > 0) {
            log.info("[ABANDONMENT] Marked {} practice/single sessions as abandoned", count);
        }
    }

    /**
     * Daily 3 AM (server TZ): hard-delete practice/single sessions whose endedAt
     * is older than 30 days. Ranked sessions are kept indefinitely.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupOldPracticeSessions() {
        int count = sessionService.cleanupOldPracticeSessions();
        if (count > 0) {
            log.info("[CLEANUP] Deleted {} practice/single sessions older than 30 days", count);
        }
    }
}
