package com.ecommerce.store.auth.repository;

import com.ecommerce.store.auth.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findTopByPhoneOrderByIdDesc(String phone);

    @Modifying
    @Query("DELETE FROM OtpToken o WHERE o.phone = :phone")
    void deleteAllByPhone(@Param("phone") String phone);
}
