package com.biblequiz.modules.ranked.model;

public enum RankTier {

    TAN_TIN_HUU("Tân Tín Hữu", 0, "newcomer"),
    NGUOI_TIM_KIEM("Người Tìm Kiếm", 1_000, "seeker"),
    MON_DO("Môn Đồ", 5_000, "disciple"),
    HIEN_TRIET("Hiền Triết", 15_000, "sage"),
    TIEN_TRI("Tiên Tri", 40_000, "prophet"),
    SU_DO("Sứ Đồ", 100_000, "apostle");

    private final String displayName;
    private final int requiredPoints;
    private final String key;

    RankTier(String displayName, int requiredPoints, String key) {
        this.displayName = displayName;
        this.requiredPoints = requiredPoints;
        this.key = key;
    }

    public String getDisplayName() { return displayName; }
    public int getRequiredPoints() { return requiredPoints; }
    public String getKey() { return key; }

    /**
     * Returns the tier for the given all-time points total.
     */
    public static RankTier fromPoints(int totalPoints) {
        RankTier result = TAN_TIN_HUU;
        for (RankTier tier : values()) {
            if (totalPoints >= tier.requiredPoints) {
                result = tier;
            } else {
                break;
            }
        }
        return result;
    }

    /**
     * Returns the next tier above the current one, or null if already at max.
     */
    public RankTier next() {
        RankTier[] tiers = values();
        int idx = ordinal();
        return idx + 1 < tiers.length ? tiers[idx + 1] : null;
    }
}
