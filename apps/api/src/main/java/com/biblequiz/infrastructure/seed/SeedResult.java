package com.biblequiz.infrastructure.seed;

import java.util.LinkedHashMap;
import java.util.Map;

public class SeedResult {
    private final Map<String, Integer> counts = new LinkedHashMap<>();
    private long durationMs;

    public void add(String category, int count) {
        counts.put(category, count);
    }

    public Map<String, Integer> getCounts() { return counts; }
    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }

    public String summary() {
        StringBuilder sb = new StringBuilder();
        counts.forEach((k, v) -> { if (sb.length() > 0) sb.append(", "); sb.append(k).append("=").append(v); });
        return sb.toString();
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("seeded", counts);
        map.put("duration", durationMs + "ms");
        return map;
    }
}
