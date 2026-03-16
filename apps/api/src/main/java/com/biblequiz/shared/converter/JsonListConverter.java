package com.biblequiz.shared.converter;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

@Converter
public class JsonListConverter implements AttributeConverter<List<?>, String> {
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public String convertToDatabaseColumn(List<?> attribute) {
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error converting list to JSON", e);
        }
    }
    
    @Override
    public List<?> convertToEntityAttribute(String dbData) {
        try {
            if (dbData == null || dbData.trim().isEmpty()) {
                return null;
            }
            String trimmed = dbData.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                return objectMapper.readValue(trimmed, new TypeReference<List<?>>() {});
            }
            // Fallback: plain number stored without array brackets (e.g. "0" → [0])
            try {
                int index = Integer.parseInt(trimmed);
                return java.util.List.of(index);
            } catch (NumberFormatException nfe) {
                System.err.println("Unrecognized correct_answer format: " + dbData);
                return null;
            }
        } catch (JsonProcessingException e) {
            System.err.println("Error converting JSON to list: " + dbData + " - " + e.getMessage());
            return null;
        }
    }
}
