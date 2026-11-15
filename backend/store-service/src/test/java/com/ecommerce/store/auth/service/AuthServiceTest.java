package com.ecommerce.store.auth.service;

import com.ecommerce.store.auth.dto.AuthResponse;
import com.ecommerce.store.auth.dto.LoginRequest;
import com.ecommerce.store.auth.dto.RegisterInitiateRequest;
import com.ecommerce.store.auth.dto.RegisterVerifyRequest;
import com.ecommerce.store.auth.entity.PendingRegistration;
import com.ecommerce.store.auth.entity.RefreshToken;
import com.ecommerce.store.auth.repository.OtpTokenRepository;
import com.ecommerce.store.auth.repository.PendingRegistrationRepository;
import com.ecommerce.store.auth.repository.RefreshTokenRepository;
import com.ecommerce.store.auth.security.JwtTokenProvider;
import com.ecommerce.store.common.exception.ConflictException;
import com.ecommerce.store.user.entity.User;
import com.ecommerce.store.user.mapper.UserMapper;
import com.ecommerce.store.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock OtpTokenRepository otpTokenRepository;
    @Mock PendingRegistrationRepository pendingRegistrationRepository;
    @Mock JwtTokenProvider jwtTokenProvider;
    @Mock AuthenticationManager authenticationManager;
    @Mock PasswordEncoder passwordEncoder;
    @Mock UserMapper userMapper;
    @Mock KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    AuthService authService;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(authService, "refreshTokenExpiry", 604800000L);
        ReflectionTestUtils.setField(authService, "otpGeneratedTopic", "otp-generated");
    }

    @Test
    void initiateRegistration_shouldThrowConflict_whenEmailExists() {
        RegisterInitiateRequest request = new RegisterInitiateRequest();
        request.setEmail("test@test.com");
        request.setPassword("password123");
        request.setFirstName("Test");

        when(userRepository.existsByEmail("test@test.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.initiateRegistration(request));
        verify(pendingRegistrationRepository, never()).save(any());
    }

    @Test
    void completeRegistration_shouldCreateUser_whenOtpValid() {
        RegisterVerifyRequest request = new RegisterVerifyRequest();
        request.setEmail("anmol@test.com");
        request.setOtp("123456");

        PendingRegistration pending = PendingRegistration.builder()
            .firstName("Anmol").email("anmol@test.com").password("encoded")
            .otp("encoded-otp").expiresAt(LocalDateTime.now().plusMinutes(5)).build();

        User user = User.builder().id(1L).firstName("Anmol").email("anmol@test.com")
            .role(User.Role.ROLE_USER).enabled(true).build();

        when(pendingRegistrationRepository.findTopByEmailOrderByIdDesc("anmol@test.com"))
            .thenReturn(Optional.of(pending));
        when(passwordEncoder.matches("123456", "encoded-otp")).thenReturn(true);
        when(userRepository.save(any())).thenReturn(user);
        when(jwtTokenProvider.generateAccessToken(user)).thenReturn("access-token");
        when(refreshTokenRepository.save(any())).thenReturn(new RefreshToken());

        authService.completeRegistration(request);

        verify(userRepository).save(any(User.class));
    }
}
