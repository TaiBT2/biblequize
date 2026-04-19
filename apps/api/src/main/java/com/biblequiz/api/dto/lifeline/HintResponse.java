package com.biblequiz.api.dto.lifeline;

/**
 * Response for a successful HINT invocation.
 *
 * @param eliminatedOptionIndex the option index to grey-out in the UI
 * @param hintsRemaining        hints left in this session ({@code -1} = unlimited)
 * @param method                {@code COMMUNITY_INFORMED} or {@code RANDOM}
 */
public class HintResponse {

    private final int eliminatedOptionIndex;
    private final int hintsRemaining;
    private final String method;

    public HintResponse(int eliminatedOptionIndex, int hintsRemaining, String method) {
        this.eliminatedOptionIndex = eliminatedOptionIndex;
        this.hintsRemaining = hintsRemaining;
        this.method = method;
    }

    public int getEliminatedOptionIndex() { return eliminatedOptionIndex; }
    public int getHintsRemaining() { return hintsRemaining; }
    public String getMethod() { return method; }
}
