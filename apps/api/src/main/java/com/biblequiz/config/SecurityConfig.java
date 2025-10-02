package com.biblequiz.config;

import com.biblequiz.security.JwtAuthenticationEntryPoint;
import com.biblequiz.security.JwtAuthenticationFilter;
import com.biblequiz.security.OAuth2SuccessHandler;
import com.biblequiz.security.OAuth2FailureHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @Autowired
    private OAuth2FailureHandler oAuth2FailureHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        System.out.println("[SECURITY] Configuring OAuth2SuccessHandler: " + (oAuth2SuccessHandler != null ? "OK" : "NULL"));
        System.out.println("[SECURITY] Configuring OAuth2FailureHandler: " + (oAuth2FailureHandler != null ? "OK" : "NULL"));
        
        return http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/",
                    "/health",
                    "/actuator/**",
                    "/error",
                    "/favicon.ico",
                    "/books",
                    "/questions",
                    "/api/books",
                    "/api/questions",
                    "/api/rooms/**",
                    "/auth/**",
                    "/oauth2/**",
                    "/oauth2/authorization/**",
                    "/login/**",
                    "/login/oauth2/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .successHandler(oAuth2SuccessHandler)
                .failureHandler(oAuth2FailureHandler)
            )
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public CommandLineRunner logOAuth2Registrations(ClientRegistrationRepository repo) {
        return args -> {
            try {
                ClientRegistration google = ((org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository) repo)
                    .findByRegistrationId("google");
                if (google == null) {
                    System.out.println("[OAUTH2] Google registration NOT found");
                } else {
                    System.out.println("[OAUTH2] Google registration OK, clientId=" + google.getClientId());
                    System.out.println("[OAUTH2] RedirectUriTemplate=" + google.getRedirectUri());
                }
            } catch (Exception e) {
                System.out.println("[OAUTH2] Unable to inspect registrations: " + e.getMessage());
            }
        };
    }

    @Bean
    public CommandLineRunner logThymeleafConfig() {
        return args -> {
            System.out.println("[THYMELEAF] Checking Thymeleaf configuration...");
            try {
                // Check if Thymeleaf is available
                Class.forName("org.thymeleaf.spring6.SpringTemplateEngine");
                System.out.println("[THYMELEAF] Thymeleaf classes found");
            } catch (ClassNotFoundException e) {
                System.out.println("[THYMELEAF] Thymeleaf classes NOT found: " + e.getMessage());
            }
        };
    }
}
