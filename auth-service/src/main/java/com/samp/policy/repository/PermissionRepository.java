package com.samp.policy.repository;

import java.util.Optional;
import java.util.UUID;

import com.samp.policy.domain.Permission;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    Optional<Permission> findByResourceIgnoreCaseAndActionIgnoreCase(String resource, String action);
}
