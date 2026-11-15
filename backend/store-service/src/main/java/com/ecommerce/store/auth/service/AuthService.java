package com.ecommerce.store.auth.service;

import com.ecommerce.store.auth.dto.AuthResponse;
import com.ecommerce.store.auth.dto.LoginRequest;
import com.ecommerce.store.auth.dto.RegisterInitiateRequest;
import com.ecommerce.store.auth.dto.RegisterVerifyRequest;
import com.ecommerce.store.auth.entity.OtpToken;
import com.ecommerce.store.auth.entity.PendingRegistration;
import com.ecommerce.store.auth.entity.RefreshToken;
import com.ecommerce.store.auth.event.OtpGeneratedEvent;
import com.ecommerce.store.auth.repository.OtpTokenRepository;
import com.ecommerce.store.auth.repository.PendingRegistrationRepository;
import com.ecommerce.store.auth.repository.RefreshTokenRepository;
import com.ecommerce.store.auth.security.JwtTokenProvider;
import com.ecommerce.store.common.exception.BadRequestException;
import com.ecommerce.store.common.exception.ConflictException;
import com.ecommerce.store.common.exception.ResourceNotFoundException;
import com.ecommerce.store.user.entity.User;
import com.ecommerce.store.user.mapper.UserMapper;
import com.ecommerce.store.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    @Value("${kafka.topics.otp-generated}")
    private String otpGeneratedTopic;

    @Transactional
    public void initiateRegistration(RegisterInitiateRequest request) {
        boolean hasEmail = StringUtils.hasText(request.getEmail());
        boolean hasPhone = StringUtils.hasText(request.getPhone());
        if (!hasEmail && !hasPhone) {
            throw new BadRequestException("Either email or phone number is required");
        }
        if (hasEmail && userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }
        if (hasPhone && userRepository.existsByPhone(request.getPhone())) {
            throw new ConflictException("Phone number already registered");
        }

        if (hasEmail) pendingRegistrationRepository.deleteAllByEmail(request.getEmail());
        if (hasPhone) pendingRegistrationRepository.deleteAllByPhone(request.getPhone());

        String otp = String.format("%06d", new SecureRandom().nextInt(999999));
        PendingRegistration pending = PendingRegistration.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(hasEmail ? request.getEmail() : null)
            .phone(hasPhone ? request.getPhone() : null)
            .password(passwordEncoder.encode(request.getPassword()))
            .otp(passwordEncoder.encode(otp))
            .expiresAt(LocalDateTime.now().plusMinutes(10))
            .build();
        pendingRegistrationRepository.save(pending);

        sendRegistrationOtp(request.getFirstName(), hasEmail ? request.getEmail() : null,
            hasPhone ? request.getPhone() : null, otp);
    }

    @Transactional
    public AuthResponse completeRegistration(RegisterVerifyRequest request) {
        boolean hasEmail = StringUtils.hasText(request.getEmail());
        boolean hasPhone = StringUtils.hasText(request.getPhone());
        if (!hasEmail && !hasPhone) {
            throw new BadRequestException("Either email or phone number is required");
        }

        PendingRegistration pending = (hasEmail
            ? pendingRegistrationRepository.findTopByEmailOrderByIdDesc(request.getEmail())
            : pendingRegistrationRepository.findTopByPhoneOrderByIdDesc(request.getPhone()))
            .orElseThrow(() -> new BadRequestException("No pending registration found"));

        if (pending.isExpired()) throw new BadRequestException("OTP has expired");
        if (pending.isVerified()) throw new BadRequestException("OTP already used");
        if (!passwordEncoder.matches(request.getOtp(), pending.getOtp())) {
            throw new BadRequestException("Invalid OTP");
        }

        pending.setVerified(true);
        pendingRegistrationRepository.save(pending);

        User user = User.builder()
            .firstName(pending.getFirstName())
            .lastName(pending.getLastName())
            .email(pending.getEmail())
            .phone(pending.getPhone())
            .password(pending.getPassword())
            .role(User.Role.ROLE_USER)
            .enabled(true)
            .build();

        User savedUser = userRepository.save(user);
        return buildAuthResponse(savedUser);
    }

    private void sendRegistrationOtp(String firstName, String email, String phone, String otp) {
        try {
            var event = OtpGeneratedEvent.builder()
                .firstName(firstName)
                .email(email)
                .phone(phone)
                .otp(otp)
                .build();
            kafkaTemplate.send(otpGeneratedTopic, email != null ? email : phone, event);
        } catch (Exception e) {
            log.error("Failed to publish OTP event: {}", e.getMessage());
        }
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String emailOrPhone = request.getEmailOrPhone();
        User user = userRepository.findByEmail(emailOrPhone)
            .or(() -> userRepository.findByPhone(emailOrPhone))
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenStr)
            .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (refreshToken.isRevoked() || refreshToken.isExpired()) {
            throw new BadRequestException("Refresh token is expired or revoked");
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return buildAuthResponse(refreshToken.getUser());
    }

    @Transactional
    public void logout(String refreshTokenStr) {
        refreshTokenRepository.findByToken(refreshTokenStr)
            .ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
    }

    @Transactional
    public String generateOtp(String phone) {
        otpTokenRepository.deleteAllByPhone(phone);
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));
        OtpToken otpToken = OtpToken.builder()
            .phone(phone)
            .otp(passwordEncoder.encode(otp))
            .expiresAt(LocalDateTime.now().plusMinutes(10))
            .build();
        otpTokenRepository.save(otpToken);
        sendRegistrationOtp(null, null, phone, otp);
        return otp;
    }

    @Transactional
    public AuthResponse verifyOtp(String phone, String otp) {
        OtpToken otpToken = otpTokenRepository.findTopByPhoneOrderByIdDesc(phone)
            .orElseThrow(() -> new BadRequestException("OTP not found for this phone"));

        if (otpToken.isExpired()) throw new BadRequestException("OTP has expired");
        if (otpToken.isVerified()) throw new BadRequestException("OTP already used");
        if (!passwordEncoder.matches(otp, otpToken.getOtp())) {
            throw new BadRequestException("Invalid OTP");
        }

        otpToken.setVerified(true);
        otpTokenRepository.save(otpToken);

        User user = userRepository.findByPhone(phone).orElseGet(() ->
            userRepository.save(User.builder()
                .phone(phone)
                .firstName("User")
                .role(User.Role.ROLE_USER)
                .enabled(true)
                .build())
        );
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse googleLogin(String googleId, String email, String firstName, String lastName, String picture) {
        User user = userRepository.findByGoogleId(googleId)
            .orElseGet(() -> userRepository.findByEmail(email)
                .map(existing -> {
                    existing.setGoogleId(googleId);
                    if (existing.getProfileImageUrl() == null) existing.setProfileImageUrl(picture);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(User.builder()
                    .googleId(googleId)
                    .email(email)
                    .firstName(firstName)
                    .lastName(lastName)
                    .profileImageUrl(picture)
                    .role(User.Role.ROLE_USER)
                    .enabled(true)
                    .build()))
            );
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshTokenStr = createRefreshToken(user);
        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshTokenStr)
            .expiresIn(900)
            .user(userMapper.toDto(user))
            .build();
    }

    private String createRefreshToken(User user) {
        refreshTokenRepository.revokeAllByUser(user);
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
            .token(token)
            .user(user)
            .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiry / 1000))
            .build();
        refreshTokenRepository.save(refreshToken);
        return token;
    }
}
