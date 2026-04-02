package com.biblequiz.modules.quiz.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * FIX-002: Periodically detect and mark abandoned ranked sessions.
 * Runs every 60 seconds. Sessions with no activity for 2+ minutes are abandoned,
 * and unanswered questions deduct 5 energy each.
 */
@Component
public class SessionAbandonmentScheduler {

    private static final Logger log = LoggerFactory.getLogger(SessionAbandonmentScheduler.class);

    private final SessionService sessionService;

    public SessionAbandonmentScheduler(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Scheduled(fixedRate = 60_000)
    public void detectAbandonedSessions() {
        int count = sessionService.processAbandonedSessions();
        if (count > 0) {
            log.info("[ABANDONMENT] Marked {} ranked sessions as abandoned", count);
        }
    }
}
