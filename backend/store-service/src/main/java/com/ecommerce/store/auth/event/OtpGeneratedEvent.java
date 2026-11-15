package com.ecommerce.store.auth.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OtpGeneratedEvent {
    private String eventType = "OTP_GENERATED";
    private String firstName;
    private String email;
    private String phone;
    private String otp;
}
