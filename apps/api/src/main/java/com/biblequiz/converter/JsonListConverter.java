package com.biblequiz.converter;

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
            // Handle both JSON array strings and actual JSON arrays
            if (dbData.startsWith("[") && dbData.endsWith("]")) {
                return objectMapper.readValue(dbData, new TypeReference<List<?>>() {});
            } else {
                // If it's not a JSON array, return null
                return null;
            }
        } catch (JsonProcessingException e) {
            System.err.println("Error converting JSON to list: " + dbData + " - " + e.getMessage());
            return null;
        }
    }
}
