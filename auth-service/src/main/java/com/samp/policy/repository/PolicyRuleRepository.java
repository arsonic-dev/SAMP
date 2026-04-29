package com.samp.policy.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import com.samp.policy.domain.PolicyRule;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PolicyRuleRepository extends JpaRepository<PolicyRule, UUID> {

    List<PolicyRule> findByTenant_IdAndRoleNameIn(UUID tenantId, Collection<String> roleNames);
}
