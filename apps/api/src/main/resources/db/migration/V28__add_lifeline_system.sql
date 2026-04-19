-- Lifeline system: track hint/ask-opinion usage per session + question.
-- v1 ships HINT only; ASK_OPINION type reserved for v2 (deferred due to
-- community-data cold-start — see DECISIONS.md 2026-04-18).
CREATE TABLE IF NOT EXISTS lifeline_usage (
    id                       VARCHAR(36) PRIMARY KEY,
    session_id               VARCHAR(36) NOT NULL,
    question_id              VARCHAR(36) NOT NULL,
    user_id                  VARCHAR(36) NOT NULL,
    -- Lifeline type: 'HINT' | 'ASK_OPINION' (v2). Store as string to allow
    -- future types without schema change.
    type                     VARCHAR(32) NOT NULL,
    -- For HINT: the option index that was eliminated for the user (0..n-1).
    -- For ASK_OPINION (v2): NULL (payload stored elsewhere or omitted).
    eliminated_option_index  INT NULL,
    created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- A given (session, question, user, type) combination is unique per
    -- use. For HINT, a user may use multiple hints on the same question
    -- (each with a distinct eliminated_option_index), so we DO NOT constrain
    -- on type alone — we include eliminated_option_index to allow multiple
    -- HINT rows per question while still preventing exact duplicates.
    UNIQUE KEY uk_lifeline_usage_unique (session_id, question_id, user_id, type, eliminated_option_index),

    -- Quota check: count usages per session+user+type — used by
    -- LifelineService.checkQuota().
    KEY idx_lifeline_session_user_type (session_id, user_id, type),

    -- Reserved for future community-poll queries (aggregating ASK_OPINION
    -- usage patterns). Safe to add now since index cost is negligible.
    KEY idx_lifeline_question_created (question_id, created_at),

    CONSTRAINT fk_lifeline_session  FOREIGN KEY (session_id)  REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_lifeline_question FOREIGN KEY (question_id) REFERENCES questions(id)     ON DELETE CASCADE,
    CONSTRAINT fk_lifeline_user     FOREIGN KEY (user_id)     REFERENCES users(id)         ON DELETE CASCADE
);

-- Composite index on answers for adaptive-hint community aggregation:
-- "find all answers for question X in last 90 days" — LifelineService
-- HintAlgorithm uses this to decide which wrong option to eliminate based
-- on community pick rates. Existing indexes (user_id, created_at) alone
-- don't support this query efficiently.
CREATE INDEX idx_answers_question_created_at ON answers(question_id, created_at);
