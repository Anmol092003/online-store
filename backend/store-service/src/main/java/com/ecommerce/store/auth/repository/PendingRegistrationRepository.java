package com.ecommerce.store.auth.repository;

import com.ecommerce.store.auth.entity.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Long> {
    Optional<PendingRegistration> findTopByEmailOrderByIdDesc(String email);
    Optional<PendingRegistration> findTopByPhoneOrderByIdDesc(String phone);

    @Modifying
    @Query("DELETE FROM PendingRegistration p WHERE p.email = :email")
    void deleteAllByEmail(@Param("email") String email);

    @Modifying
    @Query("DELETE FROM PendingRegistration p WHERE p.phone = :phone")
    void deleteAllByPhone(@Param("phone") String phone);
}
