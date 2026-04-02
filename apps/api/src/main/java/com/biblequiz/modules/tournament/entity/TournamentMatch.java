package com.biblequiz.modules.tournament.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_matches")
public class TournamentMatch {

    public enum Status {
        PENDING, IN_PROGRESS, COMPLETED
    }

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Column(name = "round_number", nullable = false)
    private int roundNumber;

    @Column(name = "match_index", nullable = false)
    private int matchIndex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "winner_id", length = 36)
    private String winnerId;

    @Column(name = "is_bye", nullable = false)
    private boolean isBye = false;

    @Column(name = "is_sudden_death", nullable = false)
    private boolean isSuddenDeath = false;

    @Column(name = "sudden_death_round", nullable = false)
    private int suddenDeathRound = 0;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public TournamentMatch() {
    }

    public TournamentMatch(String id, Tournament tournament, int roundNumber, int matchIndex) {
        this.id = id;
        this.tournament = tournament;
        this.roundNumber = roundNumber;
        this.matchIndex = matchIndex;
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Tournament getTournament() {
        return tournament;
    }

    public void setTournament(Tournament tournament) {
        this.tournament = tournament;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public void setRoundNumber(int roundNumber) {
        this.roundNumber = roundNumber;
    }

    public int getMatchIndex() {
        return matchIndex;
    }

    public void setMatchIndex(int matchIndex) {
        this.matchIndex = matchIndex;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getWinnerId() {
        return winnerId;
    }

    public void setWinnerId(String winnerId) {
        this.winnerId = winnerId;
    }

    public boolean isBye() {
        return isBye;
    }

    public void setBye(boolean bye) {
        isBye = bye;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isSuddenDeath() {
        return isSuddenDeath;
    }

    public void setSuddenDeath(boolean suddenDeath) {
        isSuddenDeath = suddenDeath;
    }

    public int getSuddenDeathRound() {
        return suddenDeathRound;
    }

    public void setSuddenDeathRound(int suddenDeathRound) {
        this.suddenDeathRound = suddenDeathRound;
    }
}
