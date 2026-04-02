-- C5: User ban fields for admin user management
ALTER TABLE users ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN ban_reason VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN banned_at TIMESTAMP NULL;
