package com.biblequiz.modules.lifeline.entity;

/**
 * Types of lifelines a user can invoke during a quiz.
 *
 * <ul>
 *   <li>{@link #HINT} — eliminate one wrong answer option (v1, shipped).</li>
 *   <li>{@link #ASK_OPINION} — show community answer distribution (v2,
 *       deferred due to cold-start data problem; see DECISIONS.md
 *       2026-04-18).</li>
 * </ul>
 *
 * Stored as {@code VARCHAR(32)} via {@code @Enumerated(EnumType.STRING)} so
 * new values can be added without a schema migration.
 */
public enum LifelineType {
    HINT,
    ASK_OPINION
}
