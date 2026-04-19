package com.biblequiz.api.dto.lifeline;

import java.util.List;

/**
 * Lifeline status for the current session — used by the FE to hydrate UI
 * on load/reload.
 *
 * @param hintsRemaining       hints left in the session ({@code -1} = unlimited)
 * @param hintQuota            total hints allowed in the session (or {@code -1})
 * @param eliminatedOptions    for the queried {@code questionId}: indices
 *                             the user has already eliminated; empty if
 *                             no {@code questionId} was provided
 * @param mode                 session mode (e.g. {@code "ranked"})
 * @param askOpinionAvailable  always {@code false} in v1 (feature deferred)
 */
public class LifelineStatusResponse {

    private final int hintsRemaining;
    private final int hintQuota;
    private final List<Integer> eliminatedOptions;
    private final String mode;
    private final boolean askOpinionAvailable;

    public LifelineStatusResponse(int hintsRemaining, int hintQuota,
                                  List<Integer> eliminatedOptions, String mode,
                                  boolean askOpinionAvailable) {
        this.hintsRemaining = hintsRemaining;
        this.hintQuota = hintQuota;
        this.eliminatedOptions = eliminatedOptions;
        this.mode = mode;
        this.askOpinionAvailable = askOpinionAvailable;
    }

    public int getHintsRemaining() { return hintsRemaining; }
    public int getHintQuota() { return hintQuota; }
    public List<Integer> getEliminatedOptions() { return eliminatedOptions; }
    public String getMode() { return mode; }
    public boolean isAskOpinionAvailable() { return askOpinionAvailable; }
}
