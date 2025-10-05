package com.biblequiz.common;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        // Centralized CORS is now configured in SecurityConfig via CorsConfigurationSource.
        // Keep MVC config minimal to avoid duplication.
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // No-op: rely on SecurityConfig.corsConfigurationSource
            }
        };
    }
}


