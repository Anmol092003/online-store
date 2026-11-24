package com.anmol.bazaar.main.auth.service;

import com.anmol.bazaar.main.auth.dto.AuthDtos.*;
import com.anmol.bazaar.main.auth.model.AppUser;
import com.anmol.bazaar.main.auth.model.Role;
import com.anmol.bazaar.main.auth.repository.AppUserRepository;
import com.anmol.bazaar.main.common.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Map<String, Object> registerCustomer(RegisterRequest req) {
        if ((req.getEmail() == null || req.getEmail().isBlank()) &&
            (req.getPhoneNumber() == null || req.getPhoneNumber().isBlank())) {
            throw new IllegalArgumentException("Either Email ID or Phone Number is required.");
        }
        if (req.getEmail() != null && !req.getEmail().isBlank() && userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("Email ID is already registered.");
        }
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank() && userRepository.existsByPhoneNumber(req.getPhoneNumber().trim())) {
            throw new IllegalArgumentException("Phone number is already registered.");
        }

        AppUser user = AppUser.builder()
                .fullName(req.getFullName().trim())
                .email(req.getEmail() != null && !req.getEmail().isBlank() ? req.getEmail().trim().toLowerCase() : null)
                .phoneNumber(req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank() ? req.getPhoneNumber().trim() : null)
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.USER)
                .authProvider("LOCAL")
                .build();

        return buildAuthResponse(userRepository.save(user));
    }

    public Map<String, Object> login(LoginRequest req) {
        if (req.getLoginId() == null || req.getLoginId().isBlank() || req.getPassword() == null) {
            throw new IllegalArgumentException("Login ID (Email or Phone) and password are required.");
        }
        String identifier = req.getLoginId().trim();
        AppUser user = userRepository.findByEmailOrPhoneNumber(identifier.toLowerCase(), identifier)
                .orElseThrow(() -> new IllegalArgumentException("Invalid Email/Phone or Password."));

        if (user.getPassword() == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid Email/Phone or Password.");
        }
        if (!user.isActive()) {
            throw new SecurityException("Account is deactivated.");
        }
        return buildAuthResponse(user);
    }

    public Map<String, Object> googleSignIn(GoogleLoginRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new IllegalArgumentException("Gmail ID is required for Google Sign-In.");
        }
        String email = req.getEmail().trim().toLowerCase();
        AppUser user = userRepository.findByEmail(email).orElseGet(() -> userRepository.save(
                AppUser.builder()
                        .fullName(req.getFullName() != null && !req.getFullName().isBlank() ? req.getFullName() : email.split("@")[0])
                        .email(email)
                        .role(Role.USER)
                        .authProvider("GOOGLE")
                        .build()
        ));

        if (!user.isActive()) {
            throw new SecurityException("Account is deactivated.");
        }
        return buildAuthResponse(user);
    }

    public List<AppUser> getAllUsers() {
        return userRepository.findAll();
    }

    public AppUser createSubAdmin(CreateSubAdminRequest req) {
        if (req.getEmail() != null && !req.getEmail().isBlank() && userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("Email ID already exists.");
        }
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank() && userRepository.existsByPhoneNumber(req.getPhoneNumber().trim())) {
            throw new IllegalArgumentException("Phone number already exists.");
        }

        AppUser subAdmin = AppUser.builder()
                .fullName(req.getFullName().trim())
                .email(req.getEmail() != null && !req.getEmail().isBlank() ? req.getEmail().trim().toLowerCase() : null)
                .phoneNumber(req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank() ? req.getPhoneNumber().trim() : null)
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.SUB_ADMIN)
                .authProvider("LOCAL")
                .build();

        return userRepository.save(subAdmin);
    }

    public void deleteUser(Long id) {
        AppUser target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        if (target.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Primary Admin account cannot be deleted.");
        }
        userRepository.delete(target);
    }

    private Map<String, Object> buildAuthResponse(AppUser user) {
        String subject = user.getEmail() != null ? user.getEmail() : user.getPhoneNumber();
        String token = jwtUtil.generateToken(user.getId(), subject, user.getRole().name());
        return Map.of(
                "token", token,
                "user", Map.of(
                        "id", user.getId(),
                        "fullName", user.getFullName(),
                        "email", user.getEmail() != null ? user.getEmail() : "",
                        "phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : "",
                        "role", user.getRole().name()
                )
        );
    }
}
