-- V68: Chống trùng câu hỏi ở tầng DB.
--
-- Bối cảnh: trước đây chống trùng chỉ ở tầng app (DuplicateDetectionService +
-- deterministic seed UUID). Điều đó để lọt câu trùng từ các path bỏ qua service
-- (import legacy). Migration này:
--   1. Thêm cột sinh `content_hash` = SHA-256 của "logical identity" của câu hỏi.
--   2. Dedup các câu đã trùng sẵn: giữ bản canonical (ưu tiên source='seed:json'),
--      trỏ lại (repoint) mọi tham chiếu FK sang bản giữ, rồi xoá bản trùng.
--   3. Tạo UNIQUE index trên content_hash → DB tự chặn trùng về sau.
--
-- Logical identity = book | chapter | verse_start | verse_end | language | normalized(content)
-- normalized = lowercase + bỏ 14 dấu câu (?!.,;:"'()[]{}) + gộp whitespace
--            (khớp DuplicateDetectionService.normalizeText).
-- KHÔNG content-only: câu giống chữ nhưng khác verse là hợp lệ
-- (vd "Chúa Giê-su sinh ra ở đâu?" cho Luke 2:7 vs Matthew 2:1).
--
-- MySQL 8 only (REGEXP_REPLACE, generated column, window function).
-- Cột content_hash KHÔNG map vào entity Question → Hibernate bỏ qua.

-- 1. Cột sinh content_hash (STORED) ------------------------------------------
ALTER TABLE questions
  ADD COLUMN content_hash CHAR(64)
  GENERATED ALWAYS AS (
    SHA2(CONCAT(
      book, '|', IFNULL(chapter, ''), '|', IFNULL(verse_start, ''), '|',
      IFNULL(verse_end, ''), '|', language, '|',
      TRIM(REGEXP_REPLACE(
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
          LOWER(content),
          '?', ''), '!', ''), '.', ''), ',', ''), ';', ''), ':', ''), '"', ''),
          '''', ''), '(', ''), ')', ''), '[', ''), ']', ''), '{', ''), '}', ''),
        '[[:space:]]+', ' '))
    ), 256)
  ) STORED;

-- 2. Dedup câu đã trùng sẵn ---------------------------------------------------
-- 2a. Chọn bản giữ lại cho mỗi content_hash: ưu tiên seed:json, rồi cũ nhất, rồi id nhỏ nhất.
CREATE TEMPORARY TABLE _q_keep (
  hh        CHAR(64)     NOT NULL PRIMARY KEY,
  keep_id   VARCHAR(36)  NOT NULL
);
INSERT INTO _q_keep (hh, keep_id)
SELECT hh, keep_id FROM (
  SELECT content_hash AS hh, id AS keep_id,
         ROW_NUMBER() OVER (
           PARTITION BY content_hash
           ORDER BY (source LIKE 'seed:json%') DESC, created_at ASC, id ASC
         ) AS rn
  FROM questions
) t
WHERE t.rn = 1;

-- 2b. Bản đồ loser -> keep (chỉ các câu KHÔNG được giữ).
CREATE TEMPORARY TABLE _q_remap (
  loser_id  VARCHAR(36)  NOT NULL PRIMARY KEY,
  keep_id   VARCHAR(36)  NOT NULL
);
INSERT INTO _q_remap (loser_id, keep_id)
SELECT q.id, k.keep_id
FROM questions q
JOIN _q_keep k ON q.content_hash = k.hh
WHERE q.id <> k.keep_id;

-- 2c. Repoint mọi FK con từ loser sang keep.
--     UPDATE IGNORE: bỏ qua dòng đụng unique key (user/session đã có bản keep);
--     DELETE: dọn dòng loser còn sót lại (chính là dòng đụng key đó) trước khi xoá câu.
UPDATE IGNORE answers a               JOIN _q_remap r ON a.question_id = r.loser_id SET a.question_id = r.keep_id;
DELETE a FROM answers a               JOIN _q_remap r ON a.question_id = r.loser_id;

UPDATE IGNORE user_question_history u  JOIN _q_remap r ON u.question_id = r.loser_id SET u.question_id = r.keep_id;
DELETE u FROM user_question_history u  JOIN _q_remap r ON u.question_id = r.loser_id;

UPDATE IGNORE quiz_session_questions s JOIN _q_remap r ON s.question_id = r.loser_id SET s.question_id = r.keep_id;
DELETE s FROM quiz_session_questions s JOIN _q_remap r ON s.question_id = r.loser_id;

UPDATE IGNORE bookmarks b              JOIN _q_remap r ON b.question_id = r.loser_id SET b.question_id = r.keep_id;
DELETE b FROM bookmarks b              JOIN _q_remap r ON b.question_id = r.loser_id;

UPDATE IGNORE feedback f               JOIN _q_remap r ON f.question_id = r.loser_id SET f.question_id = r.keep_id;
DELETE f FROM feedback f               JOIN _q_remap r ON f.question_id = r.loser_id;

UPDATE IGNORE lifeline_usage l         JOIN _q_remap r ON l.question_id = r.loser_id SET l.question_id = r.keep_id;
DELETE l FROM lifeline_usage l         JOIN _q_remap r ON l.question_id = r.loser_id;

UPDATE IGNORE question_reviews qr      JOIN _q_remap r ON qr.question_id = r.loser_id SET qr.question_id = r.keep_id;
DELETE qr FROM question_reviews qr     JOIN _q_remap r ON qr.question_id = r.loser_id;

-- 2d. Xoá các câu trùng (giờ đã không còn FK con nào trỏ tới).
DELETE q FROM questions q JOIN _q_remap r ON q.id = r.loser_id;

DROP TEMPORARY TABLE _q_remap;
DROP TEMPORARY TABLE _q_keep;

-- 3. UNIQUE index -------------------------------------------------------------
CREATE UNIQUE INDEX uq_questions_content_hash ON questions (content_hash);
