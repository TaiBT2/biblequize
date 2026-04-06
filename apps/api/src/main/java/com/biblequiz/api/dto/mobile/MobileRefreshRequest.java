package com.biblequiz.api.dto.mobile;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MobileRefreshRequest {
    @NotBlank
    private String refreshToken;
}
