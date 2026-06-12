-- Normal (non-quickmatch) rooms select DATABASE questions at quiz start via
-- loadQuestionsFromDatabase, which had no language filter -> vi/en questions
-- mixed in the same match. Quick Match already filtered (language was only
-- used in its create-time pre-pick). Persist the room's language so the
-- start-time selection can filter too.
ALTER TABLE rooms
    ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT 'vi' AFTER book_scope;
