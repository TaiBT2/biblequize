-- Tier Cosmetics: avatar frames + quiz themes unlocked per tier
CREATE TABLE IF NOT EXISTS user_cosmetics (
    user_id          VARCHAR(36) PRIMARY KEY,
    unlocked_frames  JSON NOT NULL DEFAULT ('["frame_tier1"]'),
    active_frame     VARCHAR(50) NOT NULL DEFAULT 'frame_tier1',
    unlocked_themes  JSON NOT NULL DEFAULT ('["theme_default"]'),
    active_theme     VARCHAR(50) NOT NULL DEFAULT 'theme_default',
    CONSTRAINT fk_cosmetics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
