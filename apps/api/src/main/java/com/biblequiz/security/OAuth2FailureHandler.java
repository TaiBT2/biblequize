package com.biblequiz.security;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {
        String message = exception.getMessage() == null ? "oauth2_failure" : exception.getMessage();
        System.out.println("[OAUTH2][FAIL] " + message);
        System.out.println("[OAUTH2][FAIL] Request URI: " + request.getRequestURI());
        System.out.println("[OAUTH2][FAIL] Query String: " + request.getQueryString());
        exception.printStackTrace();

        String redirect = "/login?error=" + URLEncoder.encode(message, StandardCharsets.UTF_8);
        getRedirectStrategy().sendRedirect(request, response, redirect);
    }
}


