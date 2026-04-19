package com.biblequiz.service.lifeline;

import com.biblequiz.modules.lifeline.service.HintAlgorithmService;
import com.biblequiz.modules.lifeline.service.HintAlgorithmService.HintSelection;
import com.biblequiz.modules.lifeline.service.HintAlgorithmService.Method;
import com.biblequiz.modules.lifeline.service.HintAlgorithmService.NoOptionsToEliminateException;
import com.biblequiz.modules.lifeline.service.LifelineConfigService;
import com.biblequiz.modules.quiz.entity.Question;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Random;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link HintAlgorithmService}.
 *
 * <p>Covers:
 * <ul>
 *   <li>Candidate computation (exclude correct + already-eliminated)</li>
 *   <li>Random fallback when community data is insufficient</li>
 *   <li>Community-informed pick (lowest pick-rate wins)</li>
 *   <li>JSON parser rejecting non-integer answer shapes</li>
 *   <li>Error on no remaining wrong options</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class HintAlgorithmServiceTest {

    @Mock private LifelineConfigService configService;
    @Mock private EntityManager entityManager;
    @Mock private TypedQuery<String> typedQuery;

    private HintAlgorithmService service;

    @BeforeEach
    void setUp() throws Exception {
        // Deterministic random: always pick index 0 from candidate list
        Random deterministic = new Random() {
            @Override public int nextInt(int bound) { return 0; }
        };
        service = new HintAlgorithmService(configService, deterministic);

        // Inject EntityManager via reflection (since @PersistenceContext isn't
        // triggered in plain JUnit/Mockito tests).
        Field em = HintAlgorithmService.class.getDeclaredField("entityManager");
        em.setAccessible(true);
        em.set(service, entityManager);

        lenient().when(configService.getCommunityThreshold()).thenReturn(10);
        lenient().when(configService.getCommunityWindowDays()).thenReturn(90);

        lenient().when(entityManager.createQuery(anyString(), eq(String.class))).thenReturn(typedQuery);
        lenient().when(typedQuery.setParameter(anyString(), any())).thenReturn(typedQuery);
    }

    private Question questionWith4Options(String correctIndex) {
        Question q = new Question();
        q.setId("q-1");
        q.setType(Question.Type.multiple_choice_single);
        q.setOptions(List.of("A", "B", "C", "D"));
        q.setCorrectAnswer(List.of(Integer.parseInt(correctIndex)));
        return q;
    }

    // ── Random fallback ──────────────────────────────────────────────

    @Test
    void usesRandomWhenCommunitySamplesBelowThreshold() {
        when(typedQuery.getResultList()).thenReturn(List.of("1", "2")); // 2 samples < 10

        Question q = questionWith4Options("0"); // A is correct; B/C/D wrong
        HintSelection sel = service.selectOptionToEliminate(q, Set.of());

        assertEquals(Method.RANDOM, sel.getMethod());
        // With 3 candidates [1,2,3] and deterministic nextInt -> 0, picks index 1 (B)
        assertEquals(1, sel.getEliminatedOptionIndex());
    }

    @Test
    void usesRandomWhenNoCommunityData() {
        when(typedQuery.getResultList()).thenReturn(List.of());

        Question q = questionWith4Options("0");
        HintSelection sel = service.selectOptionToEliminate(q, Set.of());

        assertEquals(Method.RANDOM, sel.getMethod());
    }

    // ── Community-informed pick ──────────────────────────────────────

    @Test
    void picksLowestPickRateOptionWhenCommunityDataAvailable() {
        // Correct = A (0). Wrong options: B(1), C(2), D(3).
        // Community stats (15 samples): A picked 10 times, B picked 3 (strong distractor),
        // C picked 1 (weak), D picked 1 (weak).
        List<String> samples = List.of(
                "0","0","0","0","0","0","0","0","0","0",  // 10 A
                "1","1","1",                               // 3 B (tempting distractor)
                "2",                                       // 1 C (weak wrong)
                "3"                                        // 1 D (weak wrong)
        );
        when(typedQuery.getResultList()).thenReturn(samples);

        Question q = questionWith4Options("0");
        HintSelection sel = service.selectOptionToEliminate(q, Set.of());

        assertEquals(Method.COMMUNITY_INFORMED, sel.getMethod());
        // C and D tied at 1 pick each — algorithm picks one of them (both valid).
        // B should NOT be eliminated because it's the tempting distractor (3 picks).
        assertNotEquals(1, sel.getEliminatedOptionIndex(),
                "Tempting distractor B should not be eliminated first");
        assertTrue(sel.getEliminatedOptionIndex() == 2 || sel.getEliminatedOptionIndex() == 3);
    }

    @Test
    void respectsAlreadyEliminatedOptions() {
        List<String> samples = List.of(
                "0","0","0","0","0","0","0","0","0","0",
                "1","1","1","2","3"
        );
        when(typedQuery.getResultList()).thenReturn(samples);

        Question q = questionWith4Options("0");
        // C already eliminated → next hint must pick between B(3 picks) and D(1 pick).
        HintSelection sel = service.selectOptionToEliminate(q, Set.of(2));

        assertEquals(3, sel.getEliminatedOptionIndex(),
                "Among remaining [B,D], D has lower pick rate → should be eliminated");
    }

    // ── Error cases ──────────────────────────────────────────────────

    @Test
    void throwsWhenAllWrongOptionsAlreadyEliminated() {
        Question q = questionWith4Options("0"); // A correct; B,C,D wrong

        assertThrows(NoOptionsToEliminateException.class,
                () -> service.selectOptionToEliminate(q, Set.of(1, 2, 3)));
    }

    @Test
    void throwsWhenOptionsListEmpty() {
        Question q = new Question();
        q.setId("q-empty");
        q.setOptions(List.of());
        q.setCorrectAnswer(List.of());

        assertThrows(NoOptionsToEliminateException.class,
                () -> service.selectOptionToEliminate(q, Set.of()));
    }

    // ── JSON parser ──────────────────────────────────────────────────

    @Test
    void parsesPlainIntegerJson() {
        assertEquals(0, HintAlgorithmService.parsePlainIntegerJson("0"));
        assertEquals(3, HintAlgorithmService.parsePlainIntegerJson("3"));
        assertEquals(0, HintAlgorithmService.parsePlainIntegerJson("  0  "));
    }

    @Test
    void rejectsNonIntegerJsonShapes() {
        assertNull(HintAlgorithmService.parsePlainIntegerJson("[0,1]"));
        assertNull(HintAlgorithmService.parsePlainIntegerJson("\"text\""));
        assertNull(HintAlgorithmService.parsePlainIntegerJson("true"));
        assertNull(HintAlgorithmService.parsePlainIntegerJson("false"));
        assertNull(HintAlgorithmService.parsePlainIntegerJson("{}"));
        assertNull(HintAlgorithmService.parsePlainIntegerJson("-1"));   // negative rejected
        assertNull(HintAlgorithmService.parsePlainIntegerJson(""));
        assertNull(HintAlgorithmService.parsePlainIntegerJson(null));
        assertNull(HintAlgorithmService.parsePlainIntegerJson("abc"));
    }

    @Test
    void ignoresNonIntegerAnswersWhenAggregating() {
        // Mix of valid and invalid answer shapes — only "0","0","2" count (3 samples).
        // With threshold 10, this is still below → falls back to random.
        List<String> samples = List.of("0", "0", "2", "[0,1]", "\"text\"", "true", "null");
        when(typedQuery.getResultList()).thenReturn(samples);

        Question q = questionWith4Options("0");
        HintSelection sel = service.selectOptionToEliminate(q, Set.of());
        assertEquals(Method.RANDOM, sel.getMethod());
    }
}
