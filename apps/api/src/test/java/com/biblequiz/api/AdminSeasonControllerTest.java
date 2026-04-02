package com.biblequiz.api;

import com.biblequiz.modules.season.entity.Season;
import com.biblequiz.modules.season.repository.SeasonRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminSeasonControllerTest {

    @Mock private SeasonRepository seasonRepository;
    @InjectMocks private AdminSeasonController controller;

    @Test
    void listSeasons_returnsList() {
        Season s = new Season("s1", "Test Season", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31));
        when(seasonRepository.findAll()).thenReturn(new java.util.ArrayList<>(List.of(s)));
        var res = controller.listSeasons();
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void createSeason_success() {
        when(seasonRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var res = controller.createSeason(Map.of("name", "New Season", "startDate", "2026-04-01", "endDate", "2026-06-30"));
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void createSeason_missingFields_error() {
        var res = controller.createSeason(Map.of("name", "No Dates"));
        assertEquals(400, res.getStatusCode().value());
    }

    @Test
    void createSeason_invalidDates_error() {
        var res = controller.createSeason(Map.of("name", "Bad", "startDate", "2026-06-01", "endDate", "2026-01-01"));
        assertEquals(400, res.getStatusCode().value());
    }

    @Test
    void endSeason_success() {
        Season s = new Season("s1", "Active", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31));
        s.setIsActive(true);
        when(seasonRepository.findById("s1")).thenReturn(Optional.of(s));
        when(seasonRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var res = controller.endSeason("s1");
        assertEquals(200, res.getStatusCode().value());
        assertFalse(s.getIsActive());
    }

    @Test
    void endSeason_notFound() {
        when(seasonRepository.findById("x")).thenReturn(Optional.empty());
        var res = controller.endSeason("x");
        assertEquals(404, res.getStatusCode().value());
    }
}
