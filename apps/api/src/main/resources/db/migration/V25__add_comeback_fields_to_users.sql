-- Comeback Bridge: track last active date and comeback claim
ALTER TABLE users ADD COLUMN last_active_date DATE NULL;
ALTER TABLE users ADD COLUMN comeback_claimed_at DATETIME NULL;
