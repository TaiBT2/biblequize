package com.biblequiz.shared.converter;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JsonStringListConverterTest {

    private final JsonStringListConverter converter = new JsonStringListConverter();

    @Test
    void roundtripsNonEmptyList() {
        List<String> input = List.of("q-1", "q-2", "q-3");
        String json = converter.convertToDatabaseColumn(input);
        assertThat(json).isEqualTo("[\"q-1\",\"q-2\",\"q-3\"]");
        assertThat(converter.convertToEntityAttribute(json)).containsExactly("q-1", "q-2", "q-3");
    }

    @Test
    void serializesEmptyAndNullAsEmptyArray() {
        assertThat(converter.convertToDatabaseColumn(null)).isEqualTo("[]");
        assertThat(converter.convertToDatabaseColumn(new ArrayList<>())).isEqualTo("[]");
    }

    @Test
    void deserializesNullAndBlankToEmptyList() {
        assertThat(converter.convertToEntityAttribute(null)).isEmpty();
        assertThat(converter.convertToEntityAttribute("")).isEmpty();
        assertThat(converter.convertToEntityAttribute("   ")).isEmpty();
    }

    @Test
    void deserializesMalformedJsonToEmptyList() {
        assertThat(converter.convertToEntityAttribute("{not json}")).isEmpty();
        assertThat(converter.convertToEntityAttribute("[\"unterminated")).isEmpty();
    }
}
