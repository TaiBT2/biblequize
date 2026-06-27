# 2026-06-27 — QuestionSeeder: skip content_hash duplicates (prod seed fix)

> **Source**: User — seed data mới nhất ở main lên prod. Seeder runtime bị abort vì 215 câu (Acts/Exodus/Isaiah/Luke/Revelation) trùng `content_hash` (V68 unique) → cả transaction rollback, 12 sách Lịch Sử không vào được.
> **Root cause**: dedup theo deterministic ID dùng `normalize()` GIỮ dấu câu; còn cột sinh `content_hash` STRIP 14 dấu câu. Câu chỉ khác dấu câu → ID khác (không skip) nhưng content_hash trùng → vi phạm `uq_questions_content_hash` → abort.
> **Status**: IN PROGRESS

### Tasks
- SCH-1 Repo: `findAllContentHashes()` native query
  - Status: [x] DONE · `QuestionRepository.java`
- SCH-2 Seeder: preload existing hashes + skip insert khi `content_hash` đã tồn tại (compute trong Java khớp SQL: SHA-256 của book|chapter|verseStart|verseEnd|language|normalized; normalized = lower + strip 14 dấu + collapse ws + trim)
  - Status: [x] DONE · `QuestionSeeder.java` (computeContentHash + guard insert path + dupHash log)
  - Verify: jshell so khớp 5 case (gồm dấu nháy/ngoặc) vs hash thật trong prod DB → khớp 100%
- SCH-3 Unit test `QuestionSeederContentHashTest` (property: 2 biến thể chỉ khác dấu câu → cùng hash)
  - Status: [x] DONE
- SCH-4 Rebuild BE + redeploy + re-seed prod + verify 12 sách Lịch Sử = 120/120 và 215 dup được skip (không abort)
  - Status: [x] DONE — seeder log: `inserted=3328, updated=6553, skipped=215, invalid=0, staleDeleted=0`. 12 sách Lịch Sử đủ 120/120 (1Chr/2Chr/Ezra 125, 1Sam 119). Health 200. Sau seed đã set `QUESTION_SEEDING_ENABLED=false` lại (one-shot pattern).
  - **Spec impact**: [x] (c) `[no-spec-impact]` (seeder robustness, không đổi business rule)

> **Status**: DONE (2026-06-27)
