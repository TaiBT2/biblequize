package com.biblequiz.infrastructure.security;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

/**
 * Registers additional security headers as a plain servlet filter.
 * The SecurityFilterChain is defined exclusively in SecurityConfig to avoid
 * Spring creating multiple competing filter chains.
 */
@Configuration
public class SecurityHeadersConfig {

    @Bean
    public FilterRegistrationBean<SecurityHeadersFilter> securityHeadersFilter() {
        FilterRegistrationBean<SecurityHeadersFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new SecurityHeadersFilter());
        registration.addUrlPatterns("/*");
        registration.setOrder(1);
        return registration;
    }

    public static class SecurityHeadersFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                FilterChain filterChain) throws ServletException, IOException {

            long requestTime = System.currentTimeMillis();
            response.setHeader("X-Request-Time", String.valueOf(requestTime));
            response.setHeader("X-Request-ID", UUID.randomUUID().toString());
            response.setHeader("X-API-Version", "1.0");

            filterChain.doFilter(request, response);

            // X-Response-Time measures actual processing duration
            response.setHeader("X-Response-Time", String.valueOf(System.currentTimeMillis() - requestTime));
        }
    }
}
