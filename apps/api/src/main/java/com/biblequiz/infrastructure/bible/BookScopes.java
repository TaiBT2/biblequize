package com.biblequiz.infrastructure.bible;

import java.util.List;
import java.util.Locale;

/**
 * Expands a multiplayer "book scope" value into the concrete set of canonical
 * book names it covers. A scope is either:
 * <ul>
 *   <li>a group sentinel ({@code ALL}, {@code OLD_TESTAMENT}, {@code PENTATEUCH}, …),</li>
 *   <li>a single canonical book name ({@code "Genesis"}), or</li>
 *   <li>blank / unknown.</li>
 * </ul>
 *
 * <p>{@link #expand(String)} returns an <b>empty list</b> for "no book filter"
 * (i.e. {@code ALL}, blank, or an unrecognized value — fail-open to the whole
 * pool), a single-element list for a specific book, or the group's books for a
 * group sentinel. Book ranges are derived from {@link BibleStructure}'s
 * canonical order so they stay in sync with the 66-book canon.
 */
public final class BookScopes {

    private BookScopes() {}

    // Half-open [from, to) indices into BibleStructure.getCanonicalBooks() (OT→NT).
    private static final int OT_START = 0;
    private static final int PENTATEUCH_END = 5;   // Genesis..Deuteronomy
    private static final int HISTORY_END = 17;     // Joshua..Esther
    private static final int WISDOM_END = 22;      // Job..Song of Songs
    private static final int NT_START = BibleStructure.NT_START_INDEX; // 39, Isaiah..Malachi ends here
    private static final int GOSPELS_END = 43;     // Matthew..John
    private static final int NT_END = 66;          // Acts..Revelation

    /** @return the books a scope covers; empty = no filter (whole pool). */
    public static List<String> expand(String scope) {
        if (scope == null || scope.isBlank()) return List.of();
        List<String> all = BibleStructure.getCanonicalBooks();
        return switch (scope.toUpperCase(Locale.ROOT)) {
            case "ALL"           -> List.of();
            case "OLD_TESTAMENT" -> all.subList(OT_START, NT_START);
            case "NEW_TESTAMENT" -> all.subList(NT_START, NT_END);
            case "PENTATEUCH"    -> all.subList(OT_START, PENTATEUCH_END);
            case "HISTORY"       -> all.subList(PENTATEUCH_END, HISTORY_END);
            case "WISDOM"        -> all.subList(HISTORY_END, WISDOM_END);
            case "PROPHETS"      -> all.subList(WISDOM_END, NT_START);
            case "GOSPELS"       -> all.subList(NT_START, GOSPELS_END);
            case "EPISTLES"      -> all.subList(GOSPELS_END, NT_END);
            // A specific (known) book name → filter to just that book.
            // Unknown value → empty (fail-open to the whole pool).
            default -> BibleStructure.isKnown(scope) ? List.of(scope) : List.of();
        };
    }

    /** @return true if the scope names a multi-book group (not ALL / single book / blank). */
    public static boolean isGroup(String scope) {
        return expand(scope).size() > 1;
    }

    /**
     * Resolve a scope to a single representative book for paths that can only
     * target one book (e.g. AI generation). Returns null for "no specific book".
     */
    public static String firstBook(String scope) {
        List<String> books = expand(scope);
        return books.isEmpty() ? null : books.get(0);
    }
}
