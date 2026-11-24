package com.anmol.bazaar.main.auth.repository;

import com.anmol.bazaar.main.auth.model.AppUser;
import com.anmol.bazaar.main.auth.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByPhoneNumber(String phoneNumber);
    Optional<AppUser> findByEmailOrPhoneNumber(String email, String phoneNumber);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
    List<AppUser> findByRole(Role role);
}
