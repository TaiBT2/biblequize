package com.biblequiz.api;

import com.biblequiz.modules.group.entity.ChurchGroup;
import com.biblequiz.modules.group.repository.ChurchGroupRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin/groups")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGroupController {

    private static final Logger log = LoggerFactory.getLogger(AdminGroupController.class);
    private final ChurchGroupRepository groupRepository;

    public AdminGroupController(ChurchGroupRepository groupRepository) {
        this.groupRepository = groupRepository;
    }

    @GetMapping
    public ResponseEntity<?> listGroups() {
        List<ChurchGroup> groups = groupRepository.findAll();
        return ResponseEntity.ok(groups.stream()
                .filter(g -> !g.isDeleted())
                .map(this::toDTO)
                .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGroup(@PathVariable String id) {
        return groupRepository.findById(id)
                .map(g -> ResponseEntity.ok(toDTO(g)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/lock")
    public ResponseEntity<?> lockGroup(@PathVariable String id, @RequestBody Map<String, String> body, Authentication auth) {
        String reason = body.get("reason");
        if (reason == null || reason.trim().length() < 10) {
            return ResponseEntity.badRequest().body(Map.of("error", "Reason must be at least 10 characters"));
        }

        return groupRepository.findById(id).map(g -> {
            g.setIsLocked(true);
            g.setLockReason(reason.trim());
            g.setLockedAt(LocalDateTime.now());
            groupRepository.save(g);
            log.info("[ADMIN] Group {} locked by {} reason: {}", id, auth.getName(), reason);
            return ResponseEntity.ok(Map.of("id", id, "locked", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/unlock")
    public ResponseEntity<?> unlockGroup(@PathVariable String id, Authentication auth) {
        return groupRepository.findById(id).map(g -> {
            g.setIsLocked(false);
            g.setLockReason(null);
            g.setLockedAt(null);
            groupRepository.save(g);
            log.info("[ADMIN] Group {} unlocked by {}", id, auth.getName());
            return ResponseEntity.ok(Map.of("id", id, "locked", false));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable String id, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        return groupRepository.findById(id).map(g -> {
            g.setDeletedAt(LocalDateTime.now());
            groupRepository.save(g);
            log.info("[ADMIN] Group {} soft-deleted by {}", id, auth.getName());
            return ResponseEntity.ok(Map.of("id", id, "deleted", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toDTO(ChurchGroup g) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", g.getId());
        dto.put("name", g.getName());
        dto.put("code", g.getGroupCode());
        dto.put("memberCount", g.getMemberCount());
        dto.put("maxMembers", g.getMaxMembers());
        dto.put("isPublic", g.getIsPublic());
        dto.put("isLocked", Boolean.TRUE.equals(g.getIsLocked()));
        dto.put("lockReason", g.getLockReason());
        dto.put("lockedAt", g.getLockedAt());
        dto.put("createdAt", g.getCreatedAt());
        dto.put("leaderName", g.getLeader() != null ? g.getLeader().getName() : null);
        return dto;
    }
}
