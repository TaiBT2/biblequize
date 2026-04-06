package com.biblequiz.api.dto.mobile;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MobileLoginRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
