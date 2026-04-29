package com.samp.policy.repository;

import java.util.Optional;
import java.util.UUID;

import com.samp.policy.domain.Role;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    boolean existsByTenant_IdAndNameIgnoreCase(UUID tenantId, String name);

    @EntityGraph(attributePaths = "permissions")
    Optional<Role> findByIdAndTenant_Id(UUID id, UUID tenantId);

    Optional<Role> findByTenant_IdAndNameIgnoreCase(UUID tenantId, String name);
}
