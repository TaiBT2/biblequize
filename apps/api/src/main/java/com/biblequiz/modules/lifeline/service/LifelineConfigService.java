package com.biblequiz.modules.lifeline.service;

import com.biblequiz.infrastructure.ConfigurationService;
import com.biblequiz.modules.quiz.entity.QuizSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Reads lifeline-related configuration (quotas, community-data thresholds).
 *
 * <p>All values have sensible defaults embedded here; admin can override at
 * runtime via {@link ConfigurationService#updateConfig(String, Object)} with
 * the exposed keys. Changes apply immediately (next call picks up new
 * value).
 *
 * <h3>Quota semantics</h3>
 * <ul>
 *   <li>{@code -1} — unlimited (no quota enforcement)</li>
 *   <li>{@code 0}  — disabled (user cannot use the lifeline)</li>
 *   <li>{@code N>0} — up to N uses per quiz session</li>
 * </ul>
 *
 * <h3>Config keys</h3>
 * <ul>
 *   <li>{@code lifeline.hint.quota.<mode>} — per-mode hint quota (one per
 *       {@link QuizSession.Mode}).</li>
 *   <li>{@code lifeline.hint.community_threshold} — minimum community
 *       samples required before the adaptive algorithm kicks in (else
 *       falls back to random).</li>
 *   <li>{@code lifeline.hint.community_window_days} — how far back to look
 *       for community answers (rolling window).</li>
 * </ul>
 */
@Service
public class LifelineConfigService {

    private static final String HINT_QUOTA_PREFIX = "lifeline.hint.quota.";
    private static final String COMMUNITY_THRESHOLD_KEY = "lifeline.hint.community_threshold";
    private static final String COMMUNITY_WINDOW_KEY = "lifeline.hint.community_window_days";

    // Default quotas per mode. Rationale:
    //   practice    : unlimited — learning aid, no competitive concern
    //   ranked      : 2         — strategic resource, must choose wisely
    //   single      : 2         — standalone quiz, treat like ranked
    //   weekly_quiz : 2         — longer sessions, slight help ok
    //   mystery_mode: 2         — same as above
    //   speed_round : 0         — pacing too fast, hint would break flow
    private static final int DEFAULT_QUOTA_PRACTICE = -1;
    private static final int DEFAULT_QUOTA_RANKED = 2;
    private static final int DEFAULT_QUOTA_SINGLE = 2;
    private static final int DEFAULT_QUOTA_WEEKLY_QUIZ = 2;
    private static final int DEFAULT_QUOTA_MYSTERY_MODE = 2;
    private static final int DEFAULT_QUOTA_SPEED_ROUND = 0;

    private static final int DEFAULT_COMMUNITY_THRESHOLD = 10;
    private static final int DEFAULT_COMMUNITY_WINDOW_DAYS = 90;

    private final ConfigurationService configurationService;

    @Autowired
    public LifelineConfigService(ConfigurationService configurationService) {
        this.configurationService = configurationService;
    }

    /**
     * Returns the hint quota (number of hint uses allowed per session) for
     * the given session mode. Returns {@code -1} for unlimited.
     */
    public int getHintQuota(QuizSession.Mode mode) {
        return configurationService.getIntConfig(
                HINT_QUOTA_PREFIX + mode.name(),
                defaultQuotaFor(mode));
    }

    /**
     * Returns the minimum number of community answer samples required for
     * the adaptive hint algorithm to use community data; below this the
     * algorithm falls back to random elimination.
     */
    public int getCommunityThreshold() {
        return configurationService.getIntConfig(
                COMMUNITY_THRESHOLD_KEY, DEFAULT_COMMUNITY_THRESHOLD);
    }

    /**
     * Returns the rolling window (in days) used to sample community answers
     * for the adaptive hint algorithm.
     */
    public int getCommunityWindowDays() {
        return configurationService.getIntConfig(
                COMMUNITY_WINDOW_KEY, DEFAULT_COMMUNITY_WINDOW_DAYS);
    }

    private int defaultQuotaFor(QuizSession.Mode mode) {
        switch (mode) {
            case practice:     return DEFAULT_QUOTA_PRACTICE;
            case ranked:       return DEFAULT_QUOTA_RANKED;
            case single:       return DEFAULT_QUOTA_SINGLE;
            case weekly_quiz:  return DEFAULT_QUOTA_WEEKLY_QUIZ;
            case mystery_mode: return DEFAULT_QUOTA_MYSTERY_MODE;
            case speed_round:  return DEFAULT_QUOTA_SPEED_ROUND;
            default:
                // Unknown mode — be conservative (no hint)
                return 0;
        }
    }
}
