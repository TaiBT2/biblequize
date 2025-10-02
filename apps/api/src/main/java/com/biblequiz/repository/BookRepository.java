package com.biblequiz.repository;

import com.biblequiz.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, String> {
    
    Optional<Book> findByName(String name);
    
    List<Book> findByTestamentOrderByOrderIndex(Book.Testament testament);
    
    @Query("SELECT b FROM Book b ORDER BY b.orderIndex")
    List<Book> findAllOrderByOrderIndex();
    
    @Query("SELECT b FROM Book b WHERE b.orderIndex = :orderIndex")
    Optional<Book> findByOrderIndex(@Param("orderIndex") Integer orderIndex);
}
