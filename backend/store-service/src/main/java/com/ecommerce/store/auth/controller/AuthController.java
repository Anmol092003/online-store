package com.ecommerce.store.auth.controller;

import com.ecommerce.store.auth.dto.AuthResponse;
import com.ecommerce.store.auth.dto.LoginRequest;
import com.ecommerce.store.auth.dto.RegisterInitiateRequest;
import com.ecommerce.store.auth.dto.RegisterVerifyRequest;
import com.ecommerce.store.auth.service.AuthService;
import com.ecommerce.store.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Auth APIs - register, login, OTP, Google OAuth2, token refresh")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/initiate")
    @Operation(summary = "Start registration - sends OTP to email and/or phone")
    public ResponseEntity<ApiResponse<Void>> initiateRegistration(@Valid @RequestBody RegisterInitiateRequest request) {
        authService.initiateRegistration(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully", null));
    }

    @PostMapping("/register/verify")
    @Operation(summary = "Verify OTP and complete registration")
    public ResponseEntity<ApiResponse<AuthResponse>> completeRegistration(@Valid @RequestBody RegisterVerifyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Registration successful", authService.completeRegistration(request)));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(request)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(authService.refreshToken(body.get("refreshToken"))));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate refresh token")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody Map<String, String> body) {
        authService.logout(body.get("refreshToken"));
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @PostMapping("/otp/send")
    @Operation(summary = "Send OTP to phone number")
    public ResponseEntity<ApiResponse<String>> sendOtp(@RequestBody Map<String, String> body) {
        authService.generateOtp(body.get("phone"));
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully", null));
    }

    @PostMapping("/otp/verify")
    @Operation(summary = "Verify OTP and login")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("OTP verified",
            authService.verifyOtp(body.get("phone"), body.get("otp"))));
    }

    @PostMapping("/google")
    @Operation(summary = "Login/Register with Google OAuth2 token")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("Google login successful",
            authService.googleLogin(
                body.get("googleId"),
                body.get("email"),
                body.get("firstName"),
                body.get("lastName"),
                body.get("picture")
            )));
    }
}
