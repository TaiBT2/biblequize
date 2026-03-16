package com.biblequiz.api;

import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRankingRepository;
import com.biblequiz.modules.season.repository.SeasonRepository;
import com.biblequiz.modules.season.service.SeasonService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/seasons")
public class SeasonController {

    @Autowired
    private SeasonRepository seasonRepository;

    @Autowired
    private SeasonRankingRepository seasonRankingRepository;

    @Autowired
    private SeasonService seasonService;

    @Autowired
    private UserRepository userRepository;

    private String resolveEmail(Authentication authentication) {
        if (authentication == null) return null;
        try {
            Object principal = authentication.getPrincipal();
            if (principal instanceof OAuth2User oAuth2User) {
                Object emailAttr = oAuth2User.getAttributes().get("email");
                if (emailAttr != null) return emailAttr.toString();
            }
        } catch (Exception ignore) {}
        return authentication.getName();
    }

    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveSeason() {
        Optional<Season> season = seasonService.getActiveSeason();
        if (season.isEmpty()) {
            return ResponseEntity.ok(Map.of("active", false));
        }
        Season s = season.get();
        Map<String, Object> result = new HashMap<>();
        result.put("active", true);
        result.put("id", s.getId());
        result.put("name", s.getName());
        result.put("startDate", s.getStartDate().toString());
        result.put("endDate", s.getEndDate().toString());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{seasonId}/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> seasonLeaderboard(
            @PathVariable String seasonId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        List<Object[]> rows = seasonRankingRepository.findSeasonLeaderboard(seasonId, size, page * size);
        List<Map<String, Object>> list = rows.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("userId", row[1]);
            m.put("name", row[2] != null ? row[2] : "An danh");
            m.put("avatarUrl", row[3]);
            m.put("points", row[4] != null ? ((Number) row[4]).intValue() : 0);
            m.put("questions", row[5] != null ? ((Number) row[5]).intValue() : 0);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{seasonId}/my-rank")
    public ResponseEntity<Map<String, Object>> mySeasonRank(
            @PathVariable String seasonId,
            Authentication authentication) {
        if (authentication == null) return ResponseEntity.ok(null);
        String email = resolveEmail(authentication);
        User user = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        if (user == null) return ResponseEntity.ok(null);

        return seasonRankingRepository.findBySeasonIdAndUserId(seasonId, user.getId())
                .map(sr -> {
                    int rank = (int) seasonRankingRepository.countUsersAheadInSeason(seasonId, sr.getTotalPoints()) + 1;
                    Map<String, Object> result = new HashMap<>();
                    result.put("userId", user.getId());
                    result.put("name", user.getName());
                    result.put("points", sr.getTotalPoints());
                    result.put("questions", sr.getTotalQuestions());
                    result.put("rank", rank);
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.ok(null));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listSeasons() {
        List<Map<String, Object>> list = seasonRepository.findAllByOrderByStartDateDesc().stream().map(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("name", s.getName());
            m.put("startDate", s.getStartDate().toString());
            m.put("endDate", s.getEndDate().toString());
            m.put("isActive", s.getIsActive());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }
}
