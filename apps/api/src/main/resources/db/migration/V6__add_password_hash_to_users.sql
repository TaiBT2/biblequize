-- Add password_hash column for local (email/password) authentication.
-- Nullable because existing OAuth users do not have a password.
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL;
