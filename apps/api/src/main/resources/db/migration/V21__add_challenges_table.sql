-- Challenge Friend: 1v1 challenge system
CREATE TABLE challenges (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    challenger_id VARCHAR(36) NOT NULL,
    challenged_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    room_id VARCHAR(36) NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_challenge_challenger FOREIGN KEY (challenger_id) REFERENCES users(id),
    CONSTRAINT fk_challenge_challenged FOREIGN KEY (challenged_id) REFERENCES users(id),
    CONSTRAINT fk_challenge_room FOREIGN KEY (room_id) REFERENCES rooms(id),

    INDEX idx_challenge_challenged_status (challenged_id, status),
    INDEX idx_challenge_expires (expires_at)
);
