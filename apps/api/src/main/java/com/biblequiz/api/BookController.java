package com.biblequiz.api;

import com.biblequiz.infrastructure.bible.BibleStructure;
import com.biblequiz.modules.quiz.entity.Book;
import com.biblequiz.modules.quiz.repository.BookRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BookController {

    @Autowired
    private BookRepository bookRepository;

    @GetMapping("/books")
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    /**
     * Canonical chapter/verse structure for a book. Used by Practice screen
     * to validate chapter/verse range inputs against the Bible canon.
     */
    @GetMapping("/books/{name}/structure")
    public ResponseEntity<?> getBookStructure(@PathVariable("name") String name) {
        if (!BibleStructure.isKnown(name)) {
            return ResponseEntity.status(404).body(Map.of("error", "Unknown book: " + name));
        }
        int[] verses = BibleStructure.getVerses(name);
        return ResponseEntity.ok(Map.of(
                "book", name,
                "maxChapter", BibleStructure.getMaxChapter(name),
                "verses", verses
        ));
    }
}
