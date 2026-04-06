package com.biblequiz.api.dto.mobile;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MobileAuthResponse {
    private String accessToken;
    private String refreshToken;
    private String name;
    private String email;
    private String avatar;
    private String role;
}
