package com.biblequiz.service;

import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;

@Service
public class BookProgressionService {
    
    // Canonical order of Bible books
    private static final List<String> BIBLE_BOOKS_ORDER = Arrays.asList(
        "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
        "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
        "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
        "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
        "Ecclesiastes", "Song of Songs", "Isaiah", "Jeremiah", "Lamentations",
        "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
        "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
        "Zephaniah", "Haggai", " Zechariah", "Malachi",
        "Matthew", "Mark", "Luke", "John", "Acts",
        "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
        "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
        "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
        "James", "1 Peter", "2 Peter", "1 John", "2 John",
        "3 John", "Jude", "Revelation"
    );
    
    /**
     * Get the next book in the progression
     * @param currentBook Current book name
     * @return Next book name, or null if at the end of Bible
     */
    public String getNextBook(String currentBook) {
        if (currentBook == null) {
            return "Genesis"; // First book
        }
        
        int currentIndex = BIBLE_BOOKS_ORDER.indexOf(currentBook);
        if (currentIndex == -1 || currentIndex >= BIBLE_BOOKS_ORDER.size() - 1) {
            return null; // At the end of Bible or invalid book
        }
        
        return BIBLE_BOOKS_ORDER.get(currentIndex + 1);
    }
    
    /**
     * Get the previous book in the progression  
     * @param currentBook Current book name
     * @return Previous book name, or null if at the beginning
     */
    public String getPreviousBook(String currentBook) {
        if (currentBook == null) {
            return null;
        }
        
        int currentIndex = BIBLE_BOOKS_ORDER.indexOf(currentBook);
        if (currentIndex == -1 || currentIndex == 0) {
            return null; // At the beginning or invalid book
        }
        
        return BIBLE_BOOKS_ORDER.get(currentIndex - 1);
    }
    
    /**
     * Check if user has completed all books in the Bible
     * @param currentBook Current book name
     * @return true if at Revelation (last book), false otherwise
     */
    public boolean isCompletedAllBooks(String currentBook) {
        return "Revelation".equals(currentBook);
    }
    
    /**
     * Get progress information
     * @param currentBook Current book name
     * @return Map with progress details
     */
    public BookProgress getBookProgress(String currentBook) {
        int currentIndex = BIBLE_BOOKS_ORDER.indexOf(currentBook);
        if (currentIndex == -1) {
            currentIndex = 0; // Default to Genesis if invalid
        }
        
        return new BookProgress(
            currentIndex + 1,
            BIBLE_BOOKS_ORDER.size(),
            currentBook,
            getNextBook(currentBook),
            isCompletedAllBooks(currentBook),
            (double) (currentIndex + 1) / BIBLE_BOOKS_ORDER.size() * 100
        );
    }
    
    /**
     * Check if user should advance to next book based on performance
     * Logic: Advance after completing ~50 questions correctly
     * @param currentBook Current book
     * @param questionsCompleted Number of questions completed for current book
     * @param correctAnswers Number of correct answers
     * @return true if should advance to next book
     */
    public boolean shouldAdvanceToNextBook(String currentBook, int questionsCompleted, int correctAnswers) {
        // Advance after completing 50 questions with >60% accuracy
        return questionsCompleted >= 50 && 
               correctAnswers >= (int)(questionsCompleted * 0.6) &&
               !isCompletedAllBooks(currentBook);
    }
    
    /**
     * Data class for book progress information
     */
    public static class BookProgress {
        public final int currentIndex;
        public final int totalBooks;
        public final String currentBook;
        public final String nextBook;
        public final boolean isCompleted;
        public final double progressPercentage;
        
        public BookProgress(int currentIndex, int totalBooks, String currentBook, 
                           String nextBook, boolean isCompleted, double progressPercentage) {
            this.currentIndex = currentIndex;
            this.totalBooks = totalBooks;
            this.currentBook = currentBook;
            this.nextBook = nextBook;
            this.isCompleted = isCompleted;
            this.progressPercentage = progressPercentage;
        }
    }
}
