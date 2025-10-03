-- Rooms and Room Players schema

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(36) PRIMARY KEY,
  room_code VARCHAR(8) NOT NULL UNIQUE,
  room_name VARCHAR(100) NOT NULL,
  max_players INT NOT NULL DEFAULT 4,
  current_players INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 10,
  time_per_question INT NOT NULL DEFAULT 30,
  status VARCHAR(20) NOT NULL,
  host_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rooms_host FOREIGN KEY (host_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS room_players (
  room_id VARCHAR(36) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  CONSTRAINT fk_room_players_room FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS room_room_players (
  id VARCHAR(36) PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  username VARCHAR(50) NOT NULL,
  avatar_url VARCHAR(255),
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  score INT NOT NULL DEFAULT 0,
  total_answered INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  average_reaction_time DOUBLE NOT NULL DEFAULT 0,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_room_player_room FOREIGN KEY (room_id) REFERENCES rooms(id),
  CONSTRAINT fk_room_player_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS room_player_answers (
  room_player_id VARCHAR(36) NOT NULL,
  question_index INT NOT NULL,
  answer_data TEXT,
  PRIMARY KEY (room_player_id, question_index),
  CONSTRAINT fk_answers_room_player FOREIGN KEY (room_player_id) REFERENCES room_room_players(id)
);


