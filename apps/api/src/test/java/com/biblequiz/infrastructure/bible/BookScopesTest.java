package com.biblequiz.infrastructure.bible;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** MBV-1: book-scope expansion (groups → books, single book, fail-open). */
class BookScopesTest {

    @Test
    void all_blank_unknown_expandToEmpty() {
        assertTrue(BookScopes.expand("ALL").isEmpty());
        assertTrue(BookScopes.expand("").isEmpty());
        assertTrue(BookScopes.expand(null).isEmpty());
        assertTrue(BookScopes.expand("NotARealScope").isEmpty(), "unknown value must fail-open to no filter");
    }

    @Test
    void specificBook_expandsToSingleton() {
        assertEquals(List.of("Genesis"), BookScopes.expand("Genesis"));
        assertEquals(List.of("Revelation"), BookScopes.expand("Revelation"));
    }

    @Test
    void testaments_haveCorrectCounts() {
        assertEquals(39, BookScopes.expand("OLD_TESTAMENT").size());
        assertEquals(27, BookScopes.expand("NEW_TESTAMENT").size());
    }

    @Test
    void groups_coverExpectedBooksAndCounts() {
        List<String> pent = BookScopes.expand("PENTATEUCH");
        assertEquals(5, pent.size());
        assertEquals("Genesis", pent.get(0));
        assertEquals("Deuteronomy", pent.get(4));

        assertEquals(12, BookScopes.expand("HISTORY").size());       // Joshua..Esther
        assertTrue(BookScopes.expand("HISTORY").contains("Joshua"));
        assertTrue(BookScopes.expand("HISTORY").contains("Esther"));

        assertEquals(5, BookScopes.expand("WISDOM").size());         // Job..Song of Songs
        assertTrue(BookScopes.expand("WISDOM").contains("Psalms"));

        assertEquals(17, BookScopes.expand("PROPHETS").size());      // Isaiah..Malachi
        assertTrue(BookScopes.expand("PROPHETS").contains("Isaiah"));
        assertTrue(BookScopes.expand("PROPHETS").contains("Malachi"));

        List<String> gospels = BookScopes.expand("GOSPELS");
        assertEquals(List.of("Matthew", "Mark", "Luke", "John"), gospels);

        List<String> epistles = BookScopes.expand("EPISTLES");      // Acts..Revelation
        assertEquals(23, epistles.size());
        assertEquals("Acts", epistles.get(0));
        assertEquals("Revelation", epistles.get(epistles.size() - 1));
    }

    @Test
    void otGroups_partitionOldTestament() {
        // Pentateuch + History + Wisdom + Prophets must exactly reconstruct the 39 OT books in order.
        List<String> combined = new java.util.ArrayList<>();
        combined.addAll(BookScopes.expand("PENTATEUCH"));
        combined.addAll(BookScopes.expand("HISTORY"));
        combined.addAll(BookScopes.expand("WISDOM"));
        combined.addAll(BookScopes.expand("PROPHETS"));
        assertEquals(BookScopes.expand("OLD_TESTAMENT"), combined);
    }

    @Test
    void ntGroups_partitionNewTestament() {
        List<String> combined = new java.util.ArrayList<>();
        combined.addAll(BookScopes.expand("GOSPELS"));
        combined.addAll(BookScopes.expand("EPISTLES"));
        assertEquals(BookScopes.expand("NEW_TESTAMENT"), combined);
    }

    @Test
    void isGroup_and_firstBook() {
        assertTrue(BookScopes.isGroup("GOSPELS"));
        assertFalse(BookScopes.isGroup("Genesis"));
        assertFalse(BookScopes.isGroup("ALL"));
        assertEquals("Matthew", BookScopes.firstBook("GOSPELS"));
        assertEquals("Genesis", BookScopes.firstBook("Genesis"));
        assertNull(BookScopes.firstBook("ALL"));
    }
}
