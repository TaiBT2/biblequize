package com.biblequiz.modules.ranked.service;

import com.biblequiz.modules.ranked.model.RankTier;
import org.springframework.stereotype.Service;

/**
 * Calculates sub-tier star progress and milestone info.
 * Stars are computed purely from totalPoints — no DB column needed.
 */
@Service
public class TierProgressService {

    // XP per star for each tier level (1-based index)
    private static final int[] STAR_XP = { 0, 200, 800, 2000, 5000, 12000, 0 };

    public record StarInfo(
            int tierLevel,
            String tierName,
            long totalPoints,
            long nextTierPoints,
            double tierProgressPercent,
            int starIndex,        // 0–4
            long starXp,          // XP at start of current star
            long nextStarXp,      // XP at start of next star
            double starProgressPercent,
            String milestone      // "50" or "90" or null
    ) {}

    public record StarEvent(
            int newStarIndex,
            int bonusXp
    ) {}

    /**
     * Get full star/tier info for a given totalPoints value.
     */
    public StarInfo getStarInfo(long totalPoints) {
        RankTier tier = RankTier.fromPoints((int) totalPoints);
        int tierLevel = tier.ordinal() + 1;
        RankTier nextTier = tier.next();

        long tierStart = tier.getRequiredPoints();
        long nextTierStart = nextTier != null ? nextTier.getRequiredPoints() : tierStart;
        long tierRange = nextTierStart - tierStart;

        double tierProgressPercent = tierRange > 0
                ? Math.min(100.0, ((double) (totalPoints - tierStart) / tierRange) * 100.0)
                : 100.0;

        // Star calculation
        int starXpPerStar = STAR_XP[tierLevel];
        int starIndex = 0;
        long starXpStart = tierStart;
        long starXpEnd = tierStart;

        if (starXpPerStar > 0 && tierLevel < 6) {
            long pointsInTier = totalPoints - tierStart;
            starIndex = Math.min(4, (int) (pointsInTier / starXpPerStar));
            starXpStart = tierStart + (long) starIndex * starXpPerStar;
            starXpEnd = tierStart + (long) (starIndex + 1) * starXpPerStar;
            // Cap star end at next tier boundary
            if (starXpEnd > nextTierStart) {
                starXpEnd = nextTierStart;
            }
        } else {
            // Tier 6 (max) — no stars
            starXpStart = tierStart;
            starXpEnd = tierStart;
        }

        double starProgressPercent = (starXpEnd > starXpStart)
                ? Math.min(100.0, ((double) (totalPoints - starXpStart) / (starXpEnd - starXpStart)) * 100.0)
                : 100.0;

        return new StarInfo(
                tierLevel,
                tier.getDisplayName(),
                totalPoints,
                nextTierStart,
                Math.round(tierProgressPercent * 10.0) / 10.0,
                starIndex,
                starXpStart,
                starXpEnd,
                Math.round(starProgressPercent * 10.0) / 10.0,
                null // milestone set by caller if needed
        );
    }

    /**
     * Check if a star boundary was crossed between oldPoints and newPoints.
     * Returns StarEvent with bonus XP info, or null if no boundary crossed.
     */
    public StarEvent checkStarBoundary(long oldPoints, long newPoints) {
        if (newPoints <= oldPoints) return null;

        RankTier oldTier = RankTier.fromPoints((int) oldPoints);
        RankTier newTier = RankTier.fromPoints((int) newPoints);
        int tierLevel = newTier.ordinal() + 1;

        // Tier 6 has no stars
        if (tierLevel >= 6) return null;

        int xpPerStar = STAR_XP[tierLevel];
        if (xpPerStar <= 0) return null;

        long tierStart = newTier.getRequiredPoints();

        // If tier changed, the old star index is effectively -1 (came from different tier)
        int oldStarIndex;
        if (oldTier != newTier) {
            oldStarIndex = -1;
        } else {
            oldStarIndex = Math.min(4, (int) ((oldPoints - tierStart) / xpPerStar));
        }

        int newStarIndex = Math.min(4, (int) ((newPoints - tierStart) / xpPerStar));

        if (newStarIndex > oldStarIndex) {
            return new StarEvent(newStarIndex, 30);
        }

        return null;
    }

    /**
     * Check milestone percentage crossings (50% and 90%).
     * Returns "50", "90", or null.
     */
    public String checkMilestone(long oldPoints, long newPoints) {
        RankTier tier = RankTier.fromPoints((int) newPoints);
        RankTier nextTier = tier.next();
        if (nextTier == null) return null;

        long tierStart = tier.getRequiredPoints();
        long tierRange = nextTier.getRequiredPoints() - tierStart;
        if (tierRange <= 0) return null;

        double oldPercent = ((double) (oldPoints - tierStart) / tierRange) * 100.0;
        double newPercent = ((double) (newPoints - tierStart) / tierRange) * 100.0;

        if (oldPercent < 90.0 && newPercent >= 90.0) return "90";
        if (oldPercent < 50.0 && newPercent >= 50.0) return "50";

        return null;
    }
}
