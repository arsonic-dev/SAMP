package com.samp.tenant.repository;

import java.util.Optional;
import java.util.UUID;

import com.samp.tenant.domain.Tenant;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    boolean existsByClientId(String clientId);

    Optional<Tenant> findByIdAndActiveTrue(UUID id);
}
