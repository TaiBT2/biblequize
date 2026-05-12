package com.biblequiz.modules.adminai.quota;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AIQuotaServiceTest {

    private StringRedisTemplate redis;
    private ValueOperations<String, String> ops;
    private AIQuotaService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redis = mock(StringRedisTemplate.class);
        ops = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(ops);
        service = new AIQuotaService(redis, 200);
    }

    @Test
    void tryAcquire_belowLimit_returnsTrueAndSetsTtl() {
        when(ops.increment(anyString(), eq(5L))).thenReturn(5L);
        assertTrue(service.tryAcquire(5));
        ArgumentCaptor<Duration> ttl = ArgumentCaptor.forClass(Duration.class);
        verify(redis).expire(anyString(), ttl.capture());
        assertEquals(25, ttl.getValue().toHours());
    }

    @Test
    void tryAcquire_exceedsLimit_returnsFalseAndRollsBack() {
        when(ops.increment(anyString(), eq(10L))).thenReturn(205L);
        assertFalse(service.tryAcquire(10));
        verify(ops).increment(anyString(), eq(-10L));
    }

    @Test
    void tryAcquire_atLimit_returnsTrue() {
        when(ops.increment(anyString(), eq(50L))).thenReturn(200L);
        assertTrue(service.tryAcquire(50));
        verify(ops, never()).increment(anyString(), eq(-50L));
    }

    @Test
    void tryAcquire_zeroOrNegative_returnsTrueWithoutHittingRedis() {
        assertTrue(service.tryAcquire(0));
        assertTrue(service.tryAcquire(-3));
        verifyNoInteractions(ops);
    }

    @Test
    void tryAcquire_redisDown_failsOpen() {
        when(ops.increment(anyString(), anyLong())).thenThrow(new RuntimeException("redis down"));
        assertTrue(service.tryAcquire(5));
    }

    @Test
    void snapshot_noKeyYet_returnsZeroUsed() {
        when(ops.get(anyString())).thenReturn(null);
        AIQuotaService.Usage usage = service.snapshot();
        assertEquals(0, usage.used());
        assertEquals(200, usage.limit());
        assertEquals(200, usage.remaining());
    }

    @Test
    void snapshot_withUsage_correctRemaining() {
        when(ops.get(anyString())).thenReturn("45");
        AIQuotaService.Usage usage = service.snapshot();
        assertEquals(45, usage.used());
        assertEquals(155, usage.remaining());
    }

    @Test
    void snapshot_redisDown_returnsZeros() {
        when(ops.get(anyString())).thenThrow(new RuntimeException("boom"));
        AIQuotaService.Usage usage = service.snapshot();
        assertEquals(0, usage.used());
        assertEquals(200, usage.remaining());
    }
}
