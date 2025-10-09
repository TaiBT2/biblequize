package com.biblequiz.repository;

import com.biblequiz.entity.UserBookProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserBookProgressRepository extends JpaRepository<UserBookProgress, String> {

	@Query("SELECT ubp FROM UserBookProgress ubp WHERE ubp.user.id = :userId AND ubp.book = :book")
	Optional<UserBookProgress> findByUserIdAndBook(@Param("userId") String userId, @Param("book") String book);
}


