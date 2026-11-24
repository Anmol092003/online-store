package com.anmol.bazaar.main.auth.dto;

import lombok.Data;

public class AuthDtos {

    @Data
    public static class RegisterRequest {
        private String fullName;
        private String email;
        private String phoneNumber;
        private String password;
    }

    @Data
    public static class LoginRequest {
        private String loginId; // Accepts Email ID or Phone Number
        private String password;
    }

    @Data
    public static class GoogleLoginRequest {
        private String email;
        private String fullName;
        private String googleToken;
    }

    @Data
    public static class CreateSubAdminRequest {
        private String fullName;
        private String email;
        private String phoneNumber;
        private String password;
    }
}
