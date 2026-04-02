-- C8: Group lock fields for admin management
ALTER TABLE church_groups ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE church_groups ADD COLUMN lock_reason VARCHAR(255) NULL;
ALTER TABLE church_groups ADD COLUMN locked_at TIMESTAMP NULL;
