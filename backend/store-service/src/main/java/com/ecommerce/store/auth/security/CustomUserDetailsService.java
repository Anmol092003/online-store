package com.ecommerce.store.auth.security;

import com.ecommerce.store.user.entity.User;
import com.ecommerce.store.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // Identifier is always the user ID (JWT subject)
    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user;
        try {
            long userId = Long.parseLong(identifier);
            user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + identifier));
        } catch (NumberFormatException e) {
            throw new UsernameNotFoundException("User not found: " + identifier);
        }

        return new org.springframework.security.core.userdetails.User(
            String.valueOf(user.getId()),
            user.getPassword() != null ? user.getPassword() : "",
            user.isEnabled(),
            true, true, true,
            List.of(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}
