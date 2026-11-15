package com.ecommerce.store.common.initialization;

import com.ecommerce.store.user.entity.User;
import com.ecommerce.store.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create or update default admin user
        userRepository.findByPhone("8860076555").ifPresentOrElse(
            admin -> {
                // Update password in case it was set with wrong hash
                admin.setPassword(passwordEncoder.encode("admin"));
                userRepository.save(admin);
                log.info("✓ Default admin user password updated - phone: 8860076555, password: admin");
            },
            () -> {
                User adminUser = User.builder()
                    .firstName("Admin")
                    .lastName("User")
                    .email("admin@ecommerce.com")
                    .phone("8860076555")
                    .password(passwordEncoder.encode("admin"))  // Password: admin
                    .role(User.Role.ROLE_ADMIN)
                    .enabled(true)
                    .build();
                userRepository.save(adminUser);
                log.info("✓ Default admin user created - phone: 8860076555, password: admin");
            }
        );
    }
}
