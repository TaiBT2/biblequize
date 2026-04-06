package com.biblequiz.api.dto.mobile;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MobileGoogleRequest {
    @NotBlank
    private String idToken;
}
