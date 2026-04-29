package com.samp.auth.repository;

import java.util.Optional;
import java.util.UUID;

import com.samp.auth.domain.UserAccount;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {

    Optional<UserAccount> findByEmailAndTenant_Id(String email, UUID tenantId);

    boolean existsByEmailAndTenant_Id(String email, UUID tenantId);
}
