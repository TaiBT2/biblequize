-- ADM-3 / DECISIONS 2026-06-16: APPROVALS_REQUIRED was lowered 2 -> 1 so a
-- single admin can activate a question. A 1-admin team could never reach two
-- independent approvals, so every imported/AI question sat PENDING forever.
-- The threshold check only runs at approval time, so questions already
-- approved once (approvals_count >= 1) under the old 2-approval rule stayed
-- PENDING after the change and became unreachable: the lone admin cannot
-- re-approve a question they already reviewed (existsByQuestionIdAndAdminId),
-- so these were invisible in "needs my review" yet still counted in "total
-- pending". Backfill them to ACTIVE to match the current single-approval rule.
-- Idempotent: re-running matches no rows.
UPDATE questions
SET review_status = 'ACTIVE',
    is_active     = TRUE,
    updated_at    = CURRENT_TIMESTAMP
WHERE review_status = 'PENDING'
  AND approvals_count >= 1;
