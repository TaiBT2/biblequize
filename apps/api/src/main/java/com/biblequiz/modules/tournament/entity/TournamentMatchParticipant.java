package com.biblequiz.modules.tournament.entity;

import com.biblequiz.modules.user.entity.User;
import jakarta.persistence.*;

@Entity
@Table(name = "tournament_match_participants")
public class TournamentMatchParticipant {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private TournamentMatch match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int lives = 3;

    @Column(nullable = false)
    private int score = 0;

    @Column(name = "correct_answers", nullable = false)
    private int correctAnswers = 0;

    @Column(name = "total_answered", nullable = false)
    private int totalAnswered = 0;

    @Column(name = "total_elapsed_ms", nullable = false)
    private long totalElapsedMs = 0;

    @Column(name = "is_winner")
    private Boolean isWinner;

    public TournamentMatchParticipant() {
    }

    public TournamentMatchParticipant(String id, TournamentMatch match, User user) {
        this.id = id;
        this.match = match;
        this.user = user;
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public TournamentMatch getMatch() {
        return match;
    }

    public void setMatch(TournamentMatch match) {
        this.match = match;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public int getLives() {
        return lives;
    }

    public void setLives(int lives) {
        this.lives = lives;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(int correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public int getTotalAnswered() {
        return totalAnswered;
    }

    public void setTotalAnswered(int totalAnswered) {
        this.totalAnswered = totalAnswered;
    }

    public Boolean getIsWinner() {
        return isWinner;
    }

    public void setIsWinner(Boolean isWinner) {
        this.isWinner = isWinner;
    }

    public long getTotalElapsedMs() {
        return totalElapsedMs;
    }

    public void setTotalElapsedMs(long totalElapsedMs) {
        this.totalElapsedMs = totalElapsedMs;
    }
}
