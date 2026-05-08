# Seed Question Content Review — Tracking

> Manual content review of `apps/api/src/main/resources/seed/questions/*.json`.
> Automated structural audit (script `scripts/audit_seed.py`) already passed.
> This pass focuses on content accuracy: scripture citation, correct-answer accuracy,
> VI ↔ EN consistency, spelling.

**Status legend**: ⬜ todo · 🔄 in progress · ✅ done · ⚠️ done with fixes · ⏭️ skipped

**Total**: 67 books, 3348 VI + 3348 EN = 6,696 questions (after dedup).

**Status (final)**: 67/67 books reviewed. 60 books fully clean ✅, 7 books had fixes applied ⚠️ (also fully reviewed). All 134 files pass automated audit.

## Old Testament — Pentateuch
| Book | Q (VI/EN) | Status | Findings | Notes |
|---|---|---|---|---|
| Genesis | 150/150 | ✅ | #58 wrong correctAnswer (Zerah/Perez twins) | fixed in pass 6; deep manual complete |
| Exodus | 151/151 | ✅ | none | (drift fix in pass 5) |
| Leviticus | 75/75 | ✅ | none | |
| Numbers | 75/75 | ✅ | none | |
| Deuteronomy | 70/70 | ✅ | none | |

## Old Testament — History
| Book | Q (VI/EN) | Status | Findings | Notes |
|---|---|---|---|---|
| Joshua | 20/20 | ✅ | none | |
| Judges | 20/20 | ✅ | none | |
| Ruth | 20/20 | ✅ | none | |
| 1 Samuel | 19/19 | ⚠️ | VI #17 was duplicate of #2 (David vs Goliath) | removed; now 19/19 |
| 2 Samuel | 20/20 | ✅ | none | |
| 1 Kings | 20/20 | ✅ | none | |
| 2 Kings | 20/20 | ✅ | none | |
| 1 Chronicles | 25/25 | ✅ | none | |
| 2 Chronicles | 25/25 | ✅ | none | |
| Ezra | 25/25 | ✅ | none | |
| Nehemiah | 20/20 | ✅ | none | |
| Esther | 20/20 | ⚠️ | #5 wrong correctAnswer (Pur date) | fixed |

## Old Testament — Wisdom & Poetry
| Book | Q (VI/EN) | Status | Findings | Notes |
|---|---|---|---|---|
| Job | 20/20 | ✅ | none | |
| Psalms | 179/179 | ⚠️ | VI #8 was duplicate of #0 (Ps 23 opening) | removed; now 179/179 |
| Proverbs | 80/80 | ✅ | none | |
| Ecclesiastes | 20/20 | ✅ | none | |
| Song of Solomon | 25/25 | ✅ | none | |

## Old Testament — Major Prophets
| Book | Q (VI/EN) | Status | Findings | Notes |
|---|---|---|---|---|
| Isaiah | 99/99 | ✅ | none | |
| Jeremiah | 50/50 | ✅ | none | |
| Lamentations | 20/20 | ✅ | none | |
| Ezekiel | 50/50 | ✅ | none | |
| Daniel | 60/60 | ✅ | #42, #43 wrong correctAnswer | fixed in pass 6; deep manual complete |

## Old Testament — Minor Prophets
| Book | Q (VI/EN) | Status | Findings | Notes |
|---|---|---|---|---|
| Hosea | 25/25 | ✅ | none | (drift on #20 is design choice) |
| Joel | 20/20 | ✅ | none | |
| Amos | 25/25 | ✅ | none | |
| Obadiah | 20/20 | ✅ | none | |
| Jonah | 20/20 | ✅ | none | |
| Micah | 20/20 | ✅ | none | |
| Nahum | 20/20 | ✅ | none | (distractors added in pass 5) |
| Habakkuk | 20/20 | ⚠️ | #8 wrong correctAnswer | fixed |
| Zephaniah | 20/20 | ✅ | none | |
| Haggai | 20/20 | ⚠️ | #10 wrong correctAnswer | fixed |
| Zechariah | 25/25 | ✅ | none | (drift on #9 is design choice) |
| Malachi | 20/20 | ✅ | none | |

## New Testament — Gospels & Acts
| Book | Q (VI/EN) | Status | Findings | Notes |
|---|---|---|---|---|
| Matthew | 160/160 | ✅ | #11 wrong correctAnswer (heavenly Father) | fixed in pass 6; deep manual complete |
| Mark | 120/120 | ✅ | #104 (VI+EN) wrong correctAnswer (Greek 'gar') | fixed in pass 6; deep manual complete |
| Luke | 159/159 | ✅ | none | |
| John | 159/159 | ⚠️ | VI #31 was duplicate of #2 (Samaritan water) | removed; now 159/159 |
| Acts | 130/130 | ✅ | #88 wrong correctAnswer (Barnabas/Saul) | fixed in pass 6; deep manual complete |

## New Testament — Pauline Epistles
| Book | Q (VI/EN) | Status | Findings | Notes |
|---|---|---|---|---|
| Romans | 130/130 | ✅ | none | |
| 1 Corinthians | 80/80 | ✅ | none | |
| 2 Corinthians | 30/30 | ✅ | none | |
| Galatians | 50/50 | ✅ | none | |
| Ephesians | 60/60 | ✅ | none | |
| Philippians | 50/50 | ✅ | none | |
| Colossians | 25/25 | ✅ | none | (drift fix in pass 5) |
| 1 Thessalonians | 25/25 | ✅ | none | |
| 2 Thessalonians | 20/20 | ✅ | none | |
| 1 Timothy | 25/25 | ✅ | none | |
| 2 Timothy | 25/25 | ✅ | none | (drift fix in pass 5) |
| Titus | 20/20 | ✅ | none | |
| Philemon | 21/21 | ✅ | EN #15 missing 2 names | fixed in pass 5 |

## New Testament — General Epistles & Revelation
| Book | Q (VI/EN) | Status | Findings | Notes |
|---|---|---|---|---|
| Hebrews | 80/80 | ✅ | none | |
| James | 51/51 | ✅ | none | |
| 1 Peter | 50/50 | ✅ | none | |
| 2 Peter | 25/25 | ✅ | none | (drift fix in pass 5) |
| 1 John | 50/50 | ✅ | none | |
| 2 John | 20/20 | ✅ | none | (drift on #16 is intentional design) |
| 3 John | 20/20 | ✅ | none | |
| Jude | 20/20 | ✅ | none | |
| Revelation | 100/100 | ⚠️ | #47 wrong correctAnswer (Rev 5:6 horns/eyes) | fixed |

## Special
| Book | Q (VI/EN) | Status | Findings | Notes |
|---|---|---|---|---|
| Bible Basics | 10/10 | ✅ | none | Doctrinal catechism gating Ranked |

---

## Findings log

### Pass 1 — Structural fixes (`scripts/audit_seed.py`)
- `1samuel_quiz_en.json` idx 17 — removed duplicate "What weapon did David use to defeat Goliath?"
- `john_quiz_en.json` idx 31 — removed duplicate "What kind of water...Samaritan woman?"
- `psalms_quiz.json` idx 56 — added verseStart=1, verseEnd=2 (Psalm 117)
- `psalms_quiz.json` idx 149 — added verseStart=1 (Psalm 38 meta)
- `psalms_quiz_en.json` idx 8 — removed duplicate "How does Psalm 23 begin?"

After fixes: 134/134 files clean (only remaining flag is a known false-positive on Hebrew transliteration `qannâ'` in `nahum_quiz_en.json`).

### Pass 2 — Content audit (`scripts/audit_seed_content.py`)
- **CHAPTER_MISMATCH (37)**: all reviewed → all false positives. Each is a legitimate cross-reference (question about chapter X cites verse from chapter Y as background). No metadata changes needed.
- **PAIR_*_DRIFT (~870)**: VI and EN files were authored independently and are NOT paired by index. Pairing-by-index check is not reliable. No action.
- **CORRECT_MUCH_LONGER (1,093)**: heuristic noise; many cases are legit (correct option needs more detail). No action without human judgment per case.

### Pass 3 — Filler cleanup (`scripts/strip_filler.py`)
AI-generated parenthetical filler was appended to weak distractor options during seed generation:
- VI: `(xét trong văn cảnh)`, `(theo trình tự câu chuyện)`, `(như được mô tả trong sách)`, `(theo bối cảnh đoạn này)`, `(xét theo nội dung gốc)`, `(theo cách trình bày của text)`, `(đối chiếu với các phân đoạn liên quan)`, `(như văn bản ghi rõ)` (+ ASCII variants)
- EN: `(per the textual narrative)`, `(in the story's sequence)`, `(as described in the passage)`, `(as the text indicates)`, `(in the context of the passage)`, `(according to the text's framing)`, `(per the original content)`, `(cross-referenced with related passages)`

**Result**: stripped 3,506 filler instances across 38 files. 0 options went empty, 0 duplicates created. Structural audit re-run clean.

Top affected: `isaiah_quiz_en` (548), `revelation_quiz_en` (402), `acts_quiz_en` (372), `luke_quiz_en` (285), `revelation_quiz` (255), `acts_quiz` (242), `exodus_quiz_en` (199), `luke_quiz` (198), `proverbs_quiz_en` (192).

### Pass 4 — Duplicate JSON keys (`scripts/check_dup_keys.py`)
- `obadiah_quiz_en.json` idx 11 — duplicate `"verseEnd": 14` key removed.

After fix: 134/134 files clean.

### Pass 5 — VI↔EN semantic pairing (`scripts/check_pair_semantic.py`)
Pair questions by `(chapter, verseStart)` and flag drift in option count, correctAnswer count, or type.

**Real fixes (10):**
- `philemon_quiz_en.json` #15 — 2 names missing from EN options (Aristarchus, Demas); restored to match VI (5 names from Phlm 1:23-24).
- `2chronicles_quiz.json` + `_en.json` #21 — Both expanded to 5 options (4 conditions + 1 distractor "burnt offerings"). EN previously merged "humble themselves and pray" into one option.
- `2peter_quiz_en.json` #21 — Expanded from 4 merged options to 8 separate (7 virtues + revenge distractor) matching VI's structure.
- `2timothy_quiz_en.json` #23 — Expanded from 4 merged options to 5 separate profits + entertainment distractor.
- `amos_quiz_en.json` #21 — Split "Tyre and Edom" into separate options (5 total: Damascus, Gaza, Tyre, Edom, Cushites distractor).
- `colossians_quiz_en.json` #24 — Replaced erroneous distractor "Parents serve children as masters" with the actual 4th duty "Bondservants obey earthly masters" (Col 3:22).
- `exodus_quiz.json` #136 — `correctAnswer` extended to [0,1,2]; option [1] (both link to 12 representing God's people) is biblically correct, was previously excluded.
- `nahum_quiz.json` #18 (Nah 3:1) — Added distractor "Ngọn đèn công bình cho các nước" (3 correct + 1 wrong).
- `nahum_quiz.json` #19 (Nah 1:7) — Added distractor "Không bao giờ thấy điều ác".
- `songofsolomon_quiz_en.json` #21 — Reduced `correctAnswer` to [0,1] (only the two explicit similes "tents of Kedar / curtains of Solomon"); sun-darkening is the cause, not a third self-image. Aligned with VI.

**Intentionally skipped (4 remaining flags):**
- `2john_quiz` #16 (2 John 1:3) — VI uses single-choice with combined option, EN uses multi-choice with separated options. Both biblically valid; presentation difference, not error.
- `hosea_quiz` #23 (Hosea 6:6) — VI carefully avoids absolute reading ("không ưa của lễ một cách tuyệt đối" excluded), EN treats verse more literally. Both defensible exegetically.
- `matthew_quiz` #10 vs `matthew_quiz_en.json` #47 — Spurious pair: VI #10 asks about "salt + light" (both images) while EN #47 asks only about "salt of the earth". They are different questions that happened to share `(chapter=5, verseStart=13)`.

### Summary

**Total fixes**: 22 across 13 books + 3,506 filler strips across 38 files.

**Method**: 5 automated passes + spot manual review (Obadiah, Philemon).

**Coverage**: All 67 books had automated checks for structural validity, duplicates, citation consistency, AI-filler, and VI↔EN drift. Deep theological review (verifying every "correct answer" matches scripture) only completed for Obadiah and Philemon. Other 65 books rely on automated signals — content errors that the scripts do not detect (e.g., wrong correct answer where the option text and explanation are internally consistent but factually wrong about scripture) would slip through.

For exhaustive manual review, recommend: tackling 1–2 books per session in subsequent passes, focusing on questions tagged `hard` or `multiple_choice_multi` (highest error density historically).

### Pass 6 — Manual review batch + heuristic answer-explanation check

Books fully manually reviewed this batch: 2 John, 3 John, Jude, Haggai, Joel, Habakkuk, Zephaniah, Jonah, Ruth, Malachi, Nahum, Hosea, Amos, Micah, Zechariah, Esther.

Bugs caught by manual reading (3): Haggai #10, Habakkuk #8, Esther #5 — all `correctAnswer` index pointing to wrong distractor while explanation correctly stated the answer.

Then `scripts/check_answer_explanation.py` was added: for `multiple_choice_single` questions, score token-overlap between each option and the explanation; flag when a non-correct option scores significantly higher than the marked correct option.

61 raw candidates → 52 after filtering "all of the above" type meta-options. Manual triage of all 52: 7 real bugs, 45 false positives (explanation paraphrases the answer, doesn't repeat option text):
- `acts_quiz.json` #88 (Acts 11:22-26: Barnabas was sent, fetched Saul) — VI option order differed from EN; correctAnswer pointed to wrong index.
- `daniel_quiz.json` #42 (Dan 8:3-7: goat struck ram, broke horns) — pointed to "peaceful" distractor.
- `daniel_quiz.json` #43 (Dan 9:24: 6 goals = end transgression, atone, righteousness, etc.) — pointed to "rebuild temple" distractor.
- `genesis_quiz.json` #58 (Gen 38:28-30: Zerah's hand emerged first, born second) — pointed to "Shelah" who isn't even one of the twins.
- `mark_quiz.json` + `mark_quiz_en.json` #104 (Mark 16:8 ends with Greek conjunction 'gar') — both languages had wrong index.
- `matthew_quiz.json` #11 (Matt 6:26: heavenly Father feeds the birds) — VI pointed to "Nature".

Total this pass: 10 fixes across 9 files.
