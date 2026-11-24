package com.anmol.bazaar.main.common.config;

import com.anmol.bazaar.main.common.idempotency.IdempotencyFilter;
import com.anmol.bazaar.main.common.ratelimit.ServiceRateLimitFilter;
import com.anmol.bazaar.main.common.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ServiceRateLimitFilter rateLimitFilter;
    private final IdempotencyFilter idempotencyFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/catalog/**").permitAll()
                // Fallback HTTP confirmation endpoint alongside primary Kafka consumer
                .requestMatchers(HttpMethod.POST, "/api/orders/confirm-payment").permitAll()
                // Admin-only routes
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                // Catalog write operations (ADMIN and SUB_ADMIN)
                .requestMatchers(HttpMethod.POST, "/api/catalog/**").hasAnyRole("ADMIN", "SUB_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/catalog/**").hasAnyRole("ADMIN", "SUB_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/catalog/**").hasAnyRole("ADMIN", "SUB_ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(idempotencyFilter, JwtAuthFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
