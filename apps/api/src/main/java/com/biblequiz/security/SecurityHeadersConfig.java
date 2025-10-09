package com.biblequiz.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Configuration
@EnableWebSecurity
public class SecurityHeadersConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.deny())
                .contentTypeOptions(contentTypeOptions -> {})
                .httpStrictTransportSecurity(hstsConfig -> hstsConfig
                    .maxAgeInSeconds(31536000)
                    .includeSubDomains(true)
                    .preload(true)
                )
                .referrerPolicy(referrerPolicy -> referrerPolicy
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                )
                .addHeaderWriter((request, response) -> {
                    // Content Security Policy
                    response.setHeader("Content-Security-Policy", 
                        "default-src 'self'; " +
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; " +
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                        "font-src 'self' https://fonts.gstatic.com; " +
                        "img-src 'self' data: https:; " +
                        "connect-src 'self' https:; " +
                        "frame-ancestors 'none'; " +
                        "base-uri 'self'; " +
                        "form-action 'self'");
                    
                    // Additional security headers
                    response.setHeader("X-Content-Type-Options", "nosniff");
                    response.setHeader("X-Frame-Options", "DENY");
                    response.setHeader("X-XSS-Protection", "1; mode=block");
                    response.setHeader("Permissions-Policy", 
                        "geolocation=(), microphone=(), camera=()");
                    
                    // Custom security headers
                    response.setHeader("X-API-Version", "1.0");
                    response.setHeader("X-Request-ID", java.util.UUID.randomUUID().toString());
                })
            )
            .addFilterAfter(new SecurityHeadersFilter(), org.springframework.security.web.header.HeaderWriterFilter.class);
        
        return http.build();
    }
    
    public static class SecurityHeadersFilter extends OncePerRequestFilter {
        
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                FilterChain filterChain) throws ServletException, IOException {
            
            // Add custom security headers
            response.setHeader("X-Request-Time", String.valueOf(System.currentTimeMillis()));
            response.setHeader("X-Response-Time", String.valueOf(System.currentTimeMillis()));
            
            // Rate limiting headers
            response.setHeader("X-RateLimit-Limit", "1000");
            response.setHeader("X-RateLimit-Remaining", "999");
            response.setHeader("X-RateLimit-Reset", String.valueOf(System.currentTimeMillis() + 3600000));
            
            filterChain.doFilter(request, response);
        }
    }
}
