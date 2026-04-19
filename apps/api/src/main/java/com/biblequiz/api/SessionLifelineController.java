package com.biblequiz.api;

import com.biblequiz.api.dto.lifeline.HintResponse;
import com.biblequiz.api.dto.lifeline.LifelineStatusResponse;
import com.biblequiz.api.dto.lifeline.UseHintRequest;
import com.biblequiz.modules.lifeline.service.LifelineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * Endpoints for invoking and inspecting lifelines during a quiz session.
 *
 * <p>Currently ships HINT only (v1). ASK_OPINION is intentionally omitted
 * from this controller until the community-data cold-start issue is solved
 * in v2 (see DECISIONS.md 2026-04-18).
 */
@RestController
@RequestMapping("/api/sessions/{sessionId}/lifeline")
@Tag(name = "Lifelines", description = "Quiz lifeline endpoints (hint, ask-opinion)")
public class SessionLifelineController {

    private final LifelineService lifelineService;

    public SessionLifelineController(LifelineService lifelineService) {
        this.lifelineService = lifelineService;
    }

    @PostMapping("/hint")
    @Operation(summary = "Use a hint",
            description = "Eliminate one wrong answer option for the specified question. "
                    + "Decrements the session's hint quota.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Hint applied; returns eliminated option index"),
            @ApiResponse(responseCode = "400", description = "Unsupported question type (e.g. fill-in-blank)"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Session does not belong to user"),
            @ApiResponse(responseCode = "404", description = "Session or question not found"),
            @ApiResponse(responseCode = "409", description = "Quota exhausted / already answered / session not active")
    })
    public ResponseEntity<?> useHint(
            @Parameter(description = "Session ID") @PathVariable("sessionId") String sessionId,
            @Valid @RequestBody UseHintRequest request,
            Principal principal) {
        String userId = authenticatedUserId(principal);
        if (userId == null) return unauthorized();

        try {
            HintResponse response = lifelineService.useHint(sessionId, userId, request.getQuestionId());
            return ResponseEntity.ok(response);
        } catch (LifelineService.NotFoundException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (LifelineService.ForbiddenException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (LifelineService.ConflictException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (LifelineService.UnsupportedLifelineException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status")
    @Operation(summary = "Get lifeline status",
            description = "Returns remaining hints and eliminated options for the (optional) current question.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status snapshot"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Session does not belong to user"),
            @ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<?> getStatus(
            @Parameter(description = "Session ID") @PathVariable("sessionId") String sessionId,
            @Parameter(description = "Optional — when present, eliminatedOptions is populated for this question")
            @RequestParam(value = "questionId", required = false) String questionId,
            Principal principal) {
        String userId = authenticatedUserId(principal);
        if (userId == null) return unauthorized();

        try {
            LifelineStatusResponse response = lifelineService.getStatus(sessionId, userId, questionId);
            return ResponseEntity.ok(response);
        } catch (LifelineService.NotFoundException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (LifelineService.ForbiddenException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    private String authenticatedUserId(Principal principal) {
        if (principal == null) return null;
        String name = principal.getName();
        return (name == null || name.isEmpty()) ? null : name;
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
    }
}
