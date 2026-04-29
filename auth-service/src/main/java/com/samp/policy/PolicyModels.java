package com.samp.policy;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class PolicyModels {

    private PolicyModels() {
    }

    public record CreateRoleRequest(
        @NotBlank @Size(max = 100) String name
    ) {
    }

    public record RoleResponse(
        UUID id,
        UUID tenantId,
        String name
    ) {
    }

    public record CreatePermissionRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 150) String resource,
        @NotBlank @Size(max = 100) String action
    ) {
    }

    public record PermissionResponse(
        UUID id,
        String name,
        String resource,
        String action
    ) {
    }

    public record AssignmentResponse(
        String status,
        UUID roleId,
        UUID permissionId,
        UUID userId
    ) {
    }

    public record CreatePolicyRequest(
        @NotBlank @Size(max = 100) String roleName,
        @NotNull PolicyEffect effect,
        @Valid PolicyConditions conditions
    ) {
    }

    public record PolicyConditions(
        Integer maxRiskScore,
        List<@NotBlank String> allowedResourceSensitivities,
        @Pattern(regexp = "^([01]?\\d|2[0-3])$") String allowedFromHour,
        @Pattern(regexp = "^([01]?\\d|2[0-3])$") String allowedToHour
    ) {
    }

    public record PolicyRuleResponse(
        UUID id,
        UUID tenantId,
        String roleName,
        PolicyEffect effect,
        PolicyConditions conditions,
        OffsetDateTime createdAt
    ) {
    }

    public record PolicyEvaluationContext(
        String ipAddress,
        String deviceId,
        String deviceFingerprint,
        OffsetDateTime requestTime,
        String resourceSensitivity
    ) {
    }

    public record PolicyEvaluationRequest(
        @NotNull UUID userId,
        @NotBlank @Size(max = 150) String resource,
        @NotBlank @Size(max = 100) String action,
        @Valid PolicyEvaluationContext context
    ) {
    }

    public record PolicyEvaluationResponse(
        String decision,
        String reason,
        Double riskScore,
        String riskLevel
    ) {
    }
}
