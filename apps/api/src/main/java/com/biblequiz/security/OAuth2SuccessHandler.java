package com.biblequiz.security;

import com.biblequiz.entity.User;
import com.biblequiz.entity.AuthIdentity;
import com.biblequiz.repository.UserRepository;
import com.biblequiz.repository.AuthIdentityRepository;
import com.biblequiz.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthIdentityRepository authIdentityRepository;

    @Autowired
    private JwtService jwtService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                      Authentication authentication) throws IOException, ServletException {
        
        try {
            System.out.println("[OAUTH2][SUCCESS] Starting authentication success handler");
            
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
            Map<String, Object> attributes = oauth2User.getAttributes();
            
            // Determine provider from request URI
            String requestURI = request.getRequestURI();
            String provider = "google";
            if (requestURI.contains("facebook")) {
                provider = "facebook";
            }
            
            String providerUserId = getProviderUserId(attributes, provider);
            String email = getEmail(attributes, provider);
            String name = getName(attributes, provider);
            String avatarUrl = getAvatarUrl(attributes, provider);
            
            System.out.println("[OAUTH2][SUCCESS] User info: " + name + " - " + email);
            
            // Check if user exists
            User user = userRepository.findByEmail(email).orElse(null);
            
            if (user == null) {
                // Create new user
                user = new User();
                user.setId(UUID.randomUUID().toString());
                user.setName(name);
                user.setEmail(email);
                user.setAvatarUrl(avatarUrl);
                user.setProvider(provider);
                user.setRole("USER");
                user = userRepository.save(user);
                System.out.println("[OAUTH2][SUCCESS] Created new user: " + user.getId());
            } else {
                System.out.println("[OAUTH2][SUCCESS] Found existing user: " + user.getId());
            }
            
            // Create or update auth identity
            AuthIdentity authIdentity = authIdentityRepository
                .findByProviderAndProviderUserId(provider, providerUserId)
                .orElse(new AuthIdentity());
            
            // Only set ID if it's a new entity
            if (authIdentity.getId() == null) {
                authIdentity.setId(UUID.randomUUID().toString());
            }
            authIdentity.setUser(user);
            authIdentity.setProvider(provider);
            authIdentity.setProviderUserId(providerUserId);
            authIdentityRepository.save(authIdentity);
            System.out.println("[OAUTH2][SUCCESS] Saved auth identity");
            
            // Generate JWT token using username (email)
            String token = jwtService.generateToken(user.getEmail());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());
            System.out.println("[OAUTH2][SUCCESS] Generated JWT tokens");
            
                  // Redirect to frontend callback page with tokens
                  String frontendUrl = System.getenv("FRONTEND_URL");
                  if (frontendUrl == null || frontendUrl.isEmpty()) {
                      frontendUrl = "http://localhost:3000"; // Default for development
                  }
                  System.out.println("[OAUTH2][SUCCESS] Frontend URL: " + frontendUrl);
                  String safeName = java.net.URLEncoder.encode(name == null ? "User" : name, java.nio.charset.StandardCharsets.UTF_8);
                  String safeEmail = java.net.URLEncoder.encode(email == null ? "" : email, java.nio.charset.StandardCharsets.UTF_8);
                  String redirectUrl = String.format("%s/auth/callback?token=%s&refreshToken=%s&name=%s&email=%s",
                                                    frontendUrl, token, refreshToken, safeName, safeEmail);
            
            System.out.println("[OAUTH2][SUCCESS] Redirecting to: " + redirectUrl);
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            
        } catch (Exception e) {
            System.err.println("[OAUTH2][SUCCESS] Error in success handler: " + e.getMessage());
            e.printStackTrace();
            // Redirect to error page
            getRedirectStrategy().sendRedirect(request, response, "/error?error=oauth2_success_handler_error");
        }
    }
    
    private String getProviderUserId(Map<String, Object> attributes, String provider) {
        if ("google".equals(provider)) {
            Object sub = attributes.get("sub");
            return sub != null ? sub.toString() : null; // Google uses 'sub' instead of 'id'
        } else if ("facebook".equals(provider)) {
            Object id = attributes.get("id");
            return id != null ? id.toString() : null;
        }
        return null;
    }
    
    private String getEmail(Map<String, Object> attributes, String provider) {
        if ("google".equals(provider)) {
            Object email = attributes.get("email");
            return email != null ? email.toString() : null;
        } else if ("facebook".equals(provider)) {
            Object email = attributes.get("email");
            return email != null ? email.toString() : null;
        }
        return null;
    }
    
    private String getName(Map<String, Object> attributes, String provider) {
        if ("google".equals(provider)) {
            Object name = attributes.get("name");
            return name != null ? name.toString() : "User";
        } else if ("facebook".equals(provider)) {
            Object name = attributes.get("name");
            return name != null ? name.toString() : "User";
        }
        return "User";
    }
    
    private String getAvatarUrl(Map<String, Object> attributes, String provider) {
        if ("google".equals(provider)) {
            Object picture = attributes.get("picture");
            return picture != null ? picture.toString() : null;
        } else if ("facebook".equals(provider)) {
            Map<String, Object> picture = (Map<String, Object>) attributes.get("picture");
            if (picture != null) {
                Map<String, Object> data = (Map<String, Object>) picture.get("data");
                if (data != null) {
                    return data.get("url").toString();
                }
            }
        }
        return null;
    }
}
