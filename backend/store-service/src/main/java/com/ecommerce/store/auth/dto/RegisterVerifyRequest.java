package com.ecommerce.store.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterVerifyRequest {
    private String email;
    private String phone;

    @NotBlank(message = "OTP required")
    private String otp;
}
