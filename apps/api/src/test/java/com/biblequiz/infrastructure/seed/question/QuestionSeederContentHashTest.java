package com.biblequiz.infrastructure.seed.question;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link QuestionSeeder#computeContentHash} — the Java mirror of
 * the SQL {@code content_hash} generated column (V68). The seeder uses it to
 * skip inserts that would violate {@code uq_questions_content_hash}.
 *
 * <p>The defining property: two questions that differ ONLY in punctuation must
 * hash equal (the bug that aborted prod seeding), while differing logical
 * identity (book/chapter/verse/language/normalized-content) must hash apart.
 */
class QuestionSeederContentHashTest {

    private static SeedQuestion q(String book, Integer chapter, Integer verseStart,
                                  Integer verseEnd, String language, String content) {
        SeedQuestion sq = new SeedQuestion();
        sq.book = book;
        sq.chapter = chapter;
        sq.verseStart = verseStart;
        sq.verseEnd = verseEnd;
        sq.language = language;
        sq.content = content;
        return sq;
    }

    @Test
    void punctuationVariantsHashEqual() {
        String a = QuestionSeeder.computeContentHash(
                q("Luke", 1, 46, 55, "en", "Whose song does Mary's Magnificat echo?"));
        String b = QuestionSeeder.computeContentHash(
                q("Luke", 1, 46, 55, "en", "Whose song does Marys Magnificat echo"));
        assertThat(a).isEqualTo(b);
    }

    @Test
    void whitespaceAndCaseCollapse() {
        String a = QuestionSeeder.computeContentHash(
                q("Ruth", 1, 16, null, "vi", "Ru-tơ  nói   gì với Na-ô-mi?"));
        String b = QuestionSeeder.computeContentHash(
                q("Ruth", 1, 16, null, "vi", "RU-TƠ NÓI GÌ VỚI NA-Ô-MI"));
        assertThat(a).isEqualTo(b);
    }

    @Test
    void differentVerseHashesApart() {
        String a = QuestionSeeder.computeContentHash(q("Luke", 2, 7, null, "en", "Where was Jesus born?"));
        String b = QuestionSeeder.computeContentHash(q("Matthew", 2, 1, null, "en", "Where was Jesus born?"));
        assertThat(a).isNotEqualTo(b);
    }

    @Test
    void languageDefaultsToVi() {
        String explicit = QuestionSeeder.computeContentHash(q("Genesis", 1, 1, null, "vi", "Ai dựng nên trời đất?"));
        String missing = QuestionSeeder.computeContentHash(q("Genesis", 1, 1, null, null, "Ai dựng nên trời đất?"));
        assertThat(explicit).isEqualTo(missing);
    }

    @Test
    void hashIsSha256Hex() {
        String h = QuestionSeeder.computeContentHash(q("Genesis", 1, 1, null, "vi", "Ai?"));
        assertThat(h).hasSize(64).matches("[0-9a-f]{64}");
    }
}
