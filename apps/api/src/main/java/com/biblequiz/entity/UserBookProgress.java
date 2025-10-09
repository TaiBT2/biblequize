package com.biblequiz.entity;

import jakarta.persistence.*;
import com.biblequiz.converter.JsonListConverter;

import java.util.List;

@Entity
@Table(name = "user_book_progress")
public class UserBookProgress {

	@Id
	@Column(length = 36)
	private String id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "book", nullable = false, length = 100)
	private String book;

	@Column(name = "answered_count", nullable = false)
	private Integer answeredCount = 0;

	@Column(name = "correct_count", nullable = false)
	private Integer correctCount = 0;

	@Column(name = "unique_question_ids", columnDefinition = "JSON")
	@Convert(converter = JsonListConverter.class)
	private List<String> uniqueQuestionIds;

	public UserBookProgress() {}

	public UserBookProgress(String id, User user, String book) {
		this.id = id;
		this.user = user;
		this.book = book;
	}

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }

	public User getUser() { return user; }
	public void setUser(User user) { this.user = user; }

	public String getBook() { return book; }
	public void setBook(String book) { this.book = book; }

	public Integer getAnsweredCount() { return answeredCount; }
	public void setAnsweredCount(Integer answeredCount) { this.answeredCount = answeredCount; }

	public Integer getCorrectCount() { return correctCount; }
	public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }

	public List<String> getUniqueQuestionIds() { return uniqueQuestionIds; }
	public void setUniqueQuestionIds(List<String> uniqueQuestionIds) { this.uniqueQuestionIds = uniqueQuestionIds; }
}


