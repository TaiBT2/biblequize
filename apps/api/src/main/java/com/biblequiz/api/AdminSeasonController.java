package com.biblequiz.api;

import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin/seasons")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSeasonController {

    private static final Logger log = LoggerFactory.getLogger(AdminSeasonController.class);
    private final SeasonRepository seasonRepository;

    public AdminSeasonController(SeasonRepository seasonRepository) {
        this.seasonRepository = seasonRepository;
    }

    @GetMapping
    public ResponseEntity<?> listSeasons() {
        List<Season> seasons = seasonRepository.findAll();
        seasons.sort(Comparator.comparing(Season::getStartDate).reversed());
        return ResponseEntity.ok(seasons.stream().map(this::toDTO).toList());
    }

    @PostMapping
    public ResponseEntity<?> createSeason(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String startStr = body.get("startDate");
        String endStr = body.get("endDate");

        if (name == null || startStr == null || endStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "name, startDate, endDate are required"));
        }

        LocalDate start = LocalDate.parse(startStr);
        LocalDate end = LocalDate.parse(endStr);

        if (!end.isAfter(start)) {
            return ResponseEntity.badRequest().body(Map.of("error", "endDate must be after startDate"));
        }

        Season season = new Season(UUID.randomUUID().toString(), name, start, end);
        season.setCreatedAt(LocalDateTime.now());
        seasonRepository.save(season);

        log.info("[ADMIN] Season created: {} ({} to {})", name, start, end);
        return ResponseEntity.ok(toDTO(season));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<?> endSeason(@PathVariable String id) {
        Optional<Season> opt = seasonRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Season season = opt.get();
        season.setIsActive(false);
        season.setEndDate(LocalDate.now());
        seasonRepository.save(season);

        log.info("[ADMIN] Season ended: {}", id);
        return ResponseEntity.ok(toDTO(season));
    }

    private Map<String, Object> toDTO(Season s) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", s.getId());
        dto.put("name", s.getName());
        dto.put("startDate", s.getStartDate().toString());
        dto.put("endDate", s.getEndDate().toString());
        dto.put("isActive", Boolean.TRUE.equals(s.getIsActive()));
        dto.put("createdAt", s.getCreatedAt());
        return dto;
    }
}
