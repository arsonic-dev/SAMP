package com.samp.auth.repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import com.samp.auth.domain.RefreshToken;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    void deleteByExpiresAtBefore(OffsetDateTime cutoff);
}
