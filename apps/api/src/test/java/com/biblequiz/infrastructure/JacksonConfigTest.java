package com.biblequiz.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class JacksonConfigTest {

    private final ObjectMapper mapper = new JacksonConfig().objectMapper();

    @Test
    void serializesLocalDateTimeAsIsoString_notArray() throws Exception {
        LocalDateTime dt = LocalDateTime.of(2026, 5, 9, 3, 40, 12);

        String json = mapper.writeValueAsString(dt);

        // Must be ISO-8601 string parseable by JS `new Date(...)`,
        // not a numeric array `[2026,5,9,3,40,12]` that produces
        // Invalid Date and the "NaN ngày trước" bug.
        assertThat(json).isEqualTo("\"2026-05-09T03:40:12\"");
    }

    @Test
    void serializesLocalDateTimeWithNanos_asIsoString() throws Exception {
        LocalDateTime dt = LocalDateTime.of(2026, 5, 9, 3, 40, 12, 123_000_000);

        String json = mapper.writeValueAsString(dt);

        assertThat(json).startsWith("\"2026-05-09T03:40:12");
        assertThat(json).doesNotContain("[");
    }
}
