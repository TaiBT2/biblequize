package com.biblequiz.api;

import com.biblequiz.modules.quiz.entity.Book;
import com.biblequiz.modules.quiz.repository.BookRepository;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookController.class)
class BookControllerTest extends BaseControllerTest {

    @MockBean
    private BookRepository bookRepository;

    @Test
    void getAllBooks_shouldReturnListOfBooks() throws Exception {
        Book genesis = new Book();
        genesis.setId("1");
        genesis.setName("Genesis");

        Book exodus = new Book();
        exodus.setId("2");
        exodus.setName("Exodus");

        when(bookRepository.findAll()).thenReturn(List.of(genesis, exodus));

        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Genesis"))
                .andExpect(jsonPath("$[1].name").value("Exodus"));
    }

    @Test
    void getAllBooks_whenEmpty_shouldReturnEmptyList() throws Exception {
        when(bookRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getAllBooks_isPublicEndpoint_shouldNotRequireAuth() throws Exception {
        when(bookRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk());
    }
}
