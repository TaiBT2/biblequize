package com.biblequiz.infrastructure.seed;

import com.biblequiz.modules.tournament.entity.Tournament;
import com.biblequiz.modules.tournament.entity.TournamentParticipant;
import com.biblequiz.modules.tournament.repository.TournamentParticipantRepository;
import com.biblequiz.modules.tournament.repository.TournamentRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
@Profile("!prod")
public class TournamentSeeder {

    private static final Logger log = LoggerFactory.getLogger(TournamentSeeder.class);
    @Autowired private TournamentRepository tournamentRepository;
    @Autowired private TournamentParticipantRepository participantRepository;
    @Autowired private UserRepository userRepository;

    public int seed() {
        if (tournamentRepository.count() > 0) {
            log.info("TournamentSeeder: tournaments exist, skipping");
            return 0;
        }

        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().endsWith("@biblequiz.test"))
                .filter(u -> !"ADMIN".equalsIgnoreCase(u.getRole()))
                .toList();
        User admin = userRepository.findByEmail("admin@biblequiz.test").orElse(users.get(0));

        // Tournament 1: Completed
        Tournament t1 = new Tournament(UUID.randomUUID().toString(), "Giải Mùa Xuân 2026", admin, 8);
        t1.setStatus(Tournament.Status.COMPLETED);
        t1.setStartedAt(LocalDateTime.now().minusDays(14));
        t1.setEndedAt(LocalDateTime.now().minusDays(7));
        tournamentRepository.save(t1);
        addParticipants(t1, users.subList(0, Math.min(8, users.size())));

        // Tournament 2: In Progress
        Tournament t2 = new Tournament(UUID.randomUUID().toString(), "Giải Phục Sinh", admin, 4);
        t2.setStatus(Tournament.Status.IN_PROGRESS);
        t2.setCurrentRound(1);
        t2.setStartedAt(LocalDateTime.now().minusDays(2));
        tournamentRepository.save(t2);
        addParticipants(t2, users.subList(2, Math.min(6, users.size())));

        // Tournament 3: Lobby
        Tournament t3 = new Tournament(UUID.randomUUID().toString(), "Giải Tháng 4", admin, 8);
        t3.setStatus(Tournament.Status.LOBBY);
        tournamentRepository.save(t3);

        log.info("TournamentSeeder: created 3 tournaments");
        return 3;
    }

    private void addParticipants(Tournament t, List<User> users) {
        int seed = 1;
        for (User u : users) {
            TournamentParticipant p = new TournamentParticipant();
            p.setId(UUID.randomUUID().toString());
            p.setTournament(t);
            p.setUser(u);
            p.setSeed(seed++);
            p.setJoinedAt(LocalDateTime.now().minusDays(15));
            participantRepository.save(p);
        }
    }

    public void clear() {
        participantRepository.deleteAll();
        tournamentRepository.deleteAll();
        log.info("TournamentSeeder: cleared");
    }
}
