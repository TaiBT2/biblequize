package com.biblequiz.modules.user.dto;

import java.time.LocalDateTime;

/**
 * MPP-2 — Weekly multiplayer stats aggregated for the Phòng Chơi sidebar
 * widget. Period boundaries follow the existing leaderboard convention
 * (Monday 00:00 UTC). winRate is a [0.0, 1.0] fraction; FE converts to %.
 */
public record WeeklyMultiplayerStatsDTO(
    String period,
    LocalDateTime periodStart,
    long wins,
    long totalMatches,
    double winRate,
    long mvpCount,
    /** QP-4: remaining Quick Match (Đấu Nhanh) attempts today (cap 3/day). */
    int quickMatchRemainingToday
) {}
