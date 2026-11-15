package com.ecommerce.store.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Email or phone number required")
    private String emailOrPhone;  // Can be email or phone number

    @NotBlank(message = "Password required")
    private String password;
}
