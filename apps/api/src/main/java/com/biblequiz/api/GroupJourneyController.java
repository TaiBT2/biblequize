package com.biblequiz.api;

import com.biblequiz.modules.group.repository.GroupMemberRepository;
import com.biblequiz.modules.group.service.GroupJourneyService;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * BL-25 — Hành Trình Nhóm REST endpoints. Writes are LEADER/MOD-gated inside
 * {@link GroupJourneyService} (IllegalArgumentException → 403); reads require
 * group membership (non-member → 400, like {@code getGroupStreak}).
 */
@RestController
@RequestMapping("/api/groups/{groupId}/journeys")
public class GroupJourneyController {

    @Autowired private GroupJourneyService service;
    @Autowired private GroupMemberRepository memberRepository;
    @Autowired private UserRepository userRepository;

    /** Create a journey (DRAFT). LEADER/MOD only. */
    @PostMapping
    public ResponseEntity<?> create(@PathVariable String groupId,
                                    @RequestBody Map<String, Object> body,
                                    Principal principal) {
        try {
            User user = getUser(principal);
            Map<String, Object> journey = service.createJourney(groupId, user.getId(),
                    (String) body.get("title"), (String) body.get("description"));
            return ResponseEntity.status(201).body(Map.of("success", true, "journey", journey));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** List journeys for the group. Member-visible. */
    @GetMapping
    public ResponseEntity<?> list(@PathVariable String groupId, Principal principal) {
        try {
            requireMember(groupId, getUser(principal).getId());
            return ResponseEntity.ok(Map.of("success", true, "journeys", service.listJourneys(groupId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Journey detail with live progress (aggregated from attempts). Member-visible. */
    @GetMapping("/{journeyId}")
    public ResponseEntity<?> getDetail(@PathVariable String groupId, @PathVariable String journeyId,
                                       Principal principal) {
        try {
            User user = getUser(principal);
            requireMember(groupId, user.getId());
            Map<String, Object> journey = service.getJourneyWithProgress(journeyId, user.getId());
            return ResponseEntity.ok(Map.of("success", true, "journey", journey));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Update journey title/description. LEADER/MOD only. */
    @PatchMapping("/{journeyId}")
    public ResponseEntity<?> update(@PathVariable String groupId, @PathVariable String journeyId,
                                    @RequestBody Map<String, Object> body, Principal principal) {
        return write(principal, user -> service.updateJourney(journeyId, user.getId(),
                (String) body.get("title"), (String) body.get("description")), "journey");
    }

    /** Add a week (chặng). LEADER/MOD only. */
    @PostMapping("/{journeyId}/weeks")
    public ResponseEntity<?> addWeek(@PathVariable String groupId, @PathVariable String journeyId,
                                     @RequestBody Map<String, Object> body, Principal principal) {
        return write(principal, user -> service.addWeek(journeyId, user.getId(),
                (String) body.get("title"), (String) body.get("quizSetId")), "week");
    }

    /** Remove a not-yet-opened week. LEADER/MOD only. */
    @DeleteMapping("/{journeyId}/weeks/{weekId}")
    public ResponseEntity<?> removeWeek(@PathVariable String groupId, @PathVariable String journeyId,
                                        @PathVariable String weekId, Principal principal) {
        try {
            User user = getUser(principal);
            service.removeWeek(weekId, user.getId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Start the journey (DRAFT → ACTIVE). LEADER/MOD only. */
    @PostMapping("/{journeyId}/start")
    public ResponseEntity<?> start(@PathVariable String groupId, @PathVariable String journeyId,
                                   Principal principal) {
        return write(principal, user -> service.startJourney(journeyId, user.getId()), "journey");
    }

    /** Open the next LOCKED week (creates its ScheduledQuiz). LEADER/MOD only. Body: {deadline}. */
    @PostMapping("/{journeyId}/open-next")
    public ResponseEntity<?> openNext(@PathVariable String groupId, @PathVariable String journeyId,
                                      @RequestBody Map<String, Object> body, Principal principal) {
        try {
            User user = getUser(principal);
            String deadlineStr = (String) body.get("deadline");
            if (deadlineStr == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Thieu deadline"));
            }
            Map<String, Object> week = service.openNextWeek(journeyId, user.getId(),
                    LocalDateTime.parse(deadlineStr));
            return ResponseEntity.ok(Map.of("success", true, "week", week));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    @FunctionalInterface
    private interface WriteAction { Map<String, Object> apply(User user); }

    private ResponseEntity<?> write(Principal principal, WriteAction action, String key) {
        try {
            User user = getUser(principal);
            return ResponseEntity.ok(Map.of("success", true, key, action.apply(user)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    private void requireMember(String groupId, String userId) {
        memberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));
    }

    private User getUser(Principal principal) {
        if (principal == null) throw new RuntimeException("Chua dang nhap");
        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof OAuth2User oauth2User) {
            String email = oauth2User.getAttribute("email");
            if (email != null) {
                return userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Nguoi dung khong ton tai"));
            }
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Nguoi dung khong ton tai"));
    }
}
